import type { AppRole, LoginRequest, SwitchRoleRequest } from "@meow/contracts";
import type { Context } from "hono";
import { Hono } from "hono";
import { AppError } from "../lib/errors.js";
import { requireSession } from "../lib/session.js";
import { loginWithDemoCredentials, switchRoleForSession } from "../services/auth.js";

export const authRoutes = new Hono();

const readAuthJson = async (c: Context): Promise<Record<string, unknown>> => {
  try {
    const json = await c.req.json();

    if (!json || typeof json !== "object" || Array.isArray(json)) {
      throw new AppError(400, "invalid auth input");
    }

    return json as Record<string, unknown>;
  } catch {
    throw new AppError(400, "invalid auth input");
  }
};

const roleValues: AppRole[] = ["creator", "merchant", "operator"];
const clientValues: LoginRequest["client"][] = ["web", "miniapp", "admin"];

const parseLoginInput = (input: Record<string, unknown>): LoginRequest => {
  const identifier = input.identifier;
  const secret = input.secret;
  const client = input.client;

  if (
    typeof identifier !== "string" ||
    identifier.trim() === "" ||
    typeof secret !== "string" ||
    secret.trim() === "" ||
    typeof client !== "string" ||
    !clientValues.includes(client as LoginRequest["client"])
  ) {
    throw new AppError(400, "invalid login input");
  }

  return {
    identifier,
    secret,
    client: client as LoginRequest["client"]
  };
};

const parseSwitchRoleInput = (
  input: Record<string, unknown>
): SwitchRoleRequest => {
  const role = input.role;

  if (typeof role !== "string" || !roleValues.includes(role as AppRole)) {
    throw new AppError(400, "invalid role input");
  }

  return { role: role as AppRole };
};

authRoutes.post("/login", async (c) => {
  const body = parseLoginInput(await readAuthJson(c));
  const { user, session } = loginWithDemoCredentials(body);
  c.header(
    "Set-Cookie",
    `meow_session=${session.id}; Path=/; HttpOnly; SameSite=Lax`
  );

  return c.json({
    sessionId: session.id,
    userId: session.userId,
    activeRole: session.activeRole,
    roles: user.roles,
    user: {
      id: user.id,
      displayName: user.displayName
    }
  });
});

authRoutes.get("/session", (c) => c.json(requireSession(c)));

authRoutes.post("/switch-role", async (c) => {
  const session = requireSession(c);
  const body = parseSwitchRoleInput(await readAuthJson(c));

  return c.json(switchRoleForSession(session, body));
});
