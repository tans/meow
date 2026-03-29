import type {
  AppRole,
  AuthSessionPayload,
  LoginRequest,
  SwitchRoleRequest
} from "@meow/contracts";
import { db } from "../lib/db.js";
import { AppError } from "../lib/errors.js";

export interface LoginResult {
  user: {
    id: string;
    displayName: string;
    roles: AppRole[];
  };
  session: {
    id: string;
    userId: string;
    activeRole: AppRole;
  };
}

const resolveInitialRole = (roles: AppRole[]): AppRole => {
  if (roles.includes("creator")) {
    return "creator";
  }

  const fallback = roles[0];
  if (!fallback) {
    throw new AppError(401, "invalid credentials");
  }

  return fallback;
};

const isDemoAuthEnabled = (): boolean =>
  process.env.MEOW_DEMO_AUTH === "true" || process.env.MEOW_AUTH_MODE === "demo";

export const loginWithDemoCredentials = (input: LoginRequest): LoginResult => {
  if (!isDemoAuthEnabled()) {
    throw new AppError(403, "demo auth disabled");
  }

  if (input.secret !== "demo-pass") {
    throw new AppError(401, "invalid credentials");
  }

  const user = db.findUserByIdentifier(input.identifier);
  if (!user) {
    throw new AppError(401, "invalid credentials");
  }

  const session = db.createSession({
    userId: user.id,
    activeRole: resolveInitialRole(user.roles),
    client: input.client
  });

  return {
    user: {
      id: user.id,
      displayName: user.displayName,
      roles: user.roles
    },
    session: {
      id: session.id,
      userId: session.userId,
      activeRole: session.activeRole
    }
  };
};

export const switchRoleForSession = (
  sessionId: string,
  input: SwitchRoleRequest
): AuthSessionPayload => {
  const session = db.findSession(sessionId);
  if (!session) {
    throw new AppError(401, "invalid session");
  }

  const user = db.getUser(session.userId);
  if (!user) {
    throw new AppError(401, "invalid session");
  }

  if (!user.roles.includes(input.role)) {
    throw new AppError(403, "role access denied");
  }

  const next = db.switchSessionRole(session.id, input.role);

  return {
    sessionId: next.id,
    userId: next.userId,
    activeRole: next.activeRole,
    roles: user.roles
  };
};
