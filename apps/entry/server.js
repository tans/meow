import { fileURLToPath } from "node:url";
import { join, normalize, extname } from "node:path";

const defaultRootDir = fileURLToPath(new URL("../../", import.meta.url));

const SPA_MOUNTS = [
  { prefix: "/square", app: "square" },
  { prefix: "/admin", app: "admin" },
  { prefix: "/buyer", app: "buyer" },
];

const createStaticResponse = async (filePath) => {
  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    return null;
  }
  return new Response(file);
};

const resolveMount = (pathname) => {
  for (const mount of SPA_MOUNTS) {
    if (pathname === mount.prefix || pathname.startsWith(`${mount.prefix}/`)) {
      return mount;
    }
  }
  return { prefix: "", app: "www" };
};

const safeJoin = (rootDir, ...segments) => {
  const absoluteRoot = normalize(rootDir);
  const candidate = normalize(join(absoluteRoot, ...segments));
  if (!candidate.startsWith(absoluteRoot)) {
    return null;
  }
  return candidate;
};

export const createEntryApp = ({
  rootDir = defaultRootDir,
  apiOrigin = `http://127.0.0.1:${process.env.API_PORT ?? "26411"}`,
  fetchApi,
} = {}) => {
  const proxyApi = fetchApi
    ? async (request) => fetchApi(request)
    : async (request) =>
        fetch(new Request(new URL(request.url).pathname + new URL(request.url).search, request), {
          method: request.method,
          headers: request.headers,
          body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
          duplex: "half",
        });

  const handleApi = async (request) => {
    const url = new URL(request.url);
    const targetUrl = new URL(url.pathname.replace(/^\/api/, "") || "/", apiOrigin);
    targetUrl.search = url.search;

    if (fetchApi) {
      return proxyApi(new Request(targetUrl, request));
    }

    return fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
      duplex: "half",
    });
  };

  const handleStatic = async (request) => {
    const url = new URL(request.url);
    const mount = resolveMount(url.pathname);

    if (mount.prefix && url.pathname === mount.prefix) {
      return Response.redirect(`${mount.prefix}/`, 302);
    }

    const relativePath = mount.prefix ? url.pathname.slice(mount.prefix.length) || "/" : url.pathname;
    const staticPath = relativePath.startsWith("/") ? relativePath.slice(1) : relativePath;
    const appRoot = safeJoin(rootDir, "apps", mount.app);
    if (!appRoot) {
      return new Response("invalid root", { status: 500 });
    }

    const requestedFile = safeJoin(appRoot, staticPath || "index.html");
    if (requestedFile && extname(staticPath)) {
      const asset = await createStaticResponse(requestedFile);
      if (asset) {
        return asset;
      }
    }

    const spaFile = safeJoin(appRoot, "index.html");
    const document = spaFile ? await createStaticResponse(spaFile) : null;
    if (document) {
      return document;
    }

    return new Response("Not Found", { status: 404 });
  };

  const handle = async (request) => {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api")) {
      return handleApi(request);
    }
    return handleStatic(request);
  };

  return {
    handle,
    fetch: handle,
  };
};

const app = createEntryApp();
const port = Number(process.env.ENTRY_PORT ?? "26401");

if (typeof Bun !== "undefined" && import.meta.main) {
  Bun.serve({
    port,
    fetch: app.fetch,
  });

  console.log(`[entry] listening on http://127.0.0.1:${port}`);
}
