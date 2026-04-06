import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { spawnSync } from "node:child_process";
import { Socket } from "node:net";
import process from "node:process";

const entryPort = Number(process.env.ENTRY_PORT ?? "26401");
const apiPort = Number(process.env.API_PORT ?? "26411");
const squarePort = Number(process.env.WEB_PORT ?? "26412");
const adminPort = Number(process.env.ADMIN_PORT ?? "26413");
const buyerPort = Number(process.env.BUYER_PORT ?? "20404");

const processes = [];

function ensureWorkspaceDepsBuilt() {
  const buildArgs = [
    "turbo",
    "run",
    "build",
    "--filter=@meow/contracts",
    "--filter=@meow/database",
    "--filter=@meow/domain-core",
    "--filter=@meow/domain-finance",
    "--filter=@meow/domain-risk",
    "--filter=@meow/domain-task",
    "--filter=@meow/domain-user"
  ];

  const result = spawnSync("pnpm", buildArgs, {
    stdio: "inherit",
    env: process.env
  });

  if (result.status !== 0) {
    console.error(`[entry] dependency build failed with code ${result.status ?? "unknown"}`);
    process.exit(result.status ?? 1);
  }
}

function spawnService(name, args, env = {}) {
  const child = spawn("pnpm", args, {
    stdio: "inherit",
    env: {
      ...process.env,
      ...env
    }
  });

  child.on("exit", (code, signal) => {
    if (code === 0 || signal === "SIGTERM") {
      return;
    }
    console.error(`[entry] ${name} exited unexpectedly with code ${code} signal ${signal ?? "none"}`);
    process.exitCode = code ?? 1;
  });

  processes.push(child);
}

ensureWorkspaceDepsBuilt();

spawnService("api", ["--filter", "@meow/api", "dev"], { PORT: String(apiPort) });
spawnService("square", ["--filter", "@meow/square", "dev", "--host", "127.0.0.1", "--port", String(squarePort), "--strictPort"]);
spawnService("admin", ["--filter", "@meow/admin", "dev", "--host", "127.0.0.1", "--port", String(adminPort), "--strictPort"]);
spawnService("buyer", ["--filter", "@meow/buyer", "dev", "--host", "127.0.0.1", "--port", String(buyerPort), "--strictPort"]);

function route(pathname) {
  if (pathname === "/") {
    return {
      targetPort: squarePort,
      targetPath: "/"
    };
  }

  if (pathname.startsWith("/api")) {
    const suffix = pathname.slice(4) || "/";
    return {
      targetPort: apiPort,
      targetPath: suffix
    };
  }

  if (pathname.startsWith("/web") || pathname.startsWith("/square")) {
    const suffix = pathname.slice(pathname.startsWith("/web") ? 4 : 6) || "/";
    return {
      targetPort: squarePort,
      targetPath: suffix
    };
  }

  if (pathname.startsWith("/admin")) {
    return {
      targetPort: adminPort,
      targetPath: pathname
    };
  }

  if (pathname.startsWith("/buyer")) {
    return {
      targetPort: buyerPort,
      targetPath: pathname
    };
  }

  return {
    targetPort: squarePort,
    targetPath: pathname
  };
}

function proxyHttp(req, res, targetPort, targetPath) {
  const requestOptions = {
    hostname: "127.0.0.1",
    port: targetPort,
    method: req.method,
    path: `${targetPath}${new URL(req.url ?? "/", "http://localhost").search}`,
    headers: req.headers
  };

  const proxyReq = fetch(`http://127.0.0.1:${targetPort}${requestOptions.path}`, {
    method: req.method,
    headers: req.headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : req,
    duplex: "half"
  });

  proxyReq
    .then(async (proxyRes) => {
      res.writeHead(proxyRes.status, Object.fromEntries(proxyRes.headers.entries()));
      if (proxyRes.body) {
        for await (const chunk of proxyRes.body) {
          res.write(chunk);
        }
      }
      res.end();
    })
    .catch((error) => {
      res.statusCode = 502;
      res.end(`[entry] upstream ${targetPort} unavailable: ${String(error)}`);
    });
}

function proxyUpgrade(req, socket, head, targetPort, targetPath) {
  const upstream = new Socket();

  upstream.connect(targetPort, "127.0.0.1", () => {
    const rawHeaders = Object.entries(req.headers)
      .flatMap(([key, value]) => {
        if (Array.isArray(value)) {
          return value.map((item) => `${key}: ${item}`);
        }
        if (value === undefined) {
          return [];
        }
        return `${key}: ${value}`;
      })
      .join("\r\n");

    const requestLine = `${req.method} ${targetPath}${new URL(req.url ?? "/", "http://localhost").search} HTTP/${req.httpVersion}`;
    upstream.write(`${requestLine}\r\n${rawHeaders}\r\n\r\n`);

    if (head.length > 0) {
      upstream.write(head);
    }

    socket.pipe(upstream).pipe(socket);
  });

  upstream.on("error", () => {
    socket.end();
  });
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const { targetPort, targetPath } = route(url.pathname);
  proxyHttp(req, res, targetPort, targetPath);
});

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const { targetPort, targetPath } = route(url.pathname);
  proxyUpgrade(req, socket, head, targetPort, targetPath);
});

server.listen(entryPort, () => {
  console.log(`[entry] listening on http://127.0.0.1:${entryPort}`);
  console.log(`[entry] routes: / -> ${squarePort}, /square -> ${squarePort}, /api -> ${apiPort}, /admin -> ${adminPort}, /buyer -> ${buyerPort}`);
});

function shutdown() {
  server.close();
  for (const child of processes) {
    child.kill("SIGTERM");
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
