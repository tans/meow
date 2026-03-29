import type { AppRole, AuthSessionPayload, LoginResponse } from "@meow/contracts";

export type WebRole = Extract<AppRole, "creator" | "merchant">;

export interface WebUser {
  id: string;
  displayName: string;
}

export interface WebSession {
  user: WebUser;
  activeRole: WebRole;
  roles: WebRole[];
}

const isWebRole = (role: AppRole): role is WebRole =>
  role === "creator" || role === "merchant";

export const normalizeWebSession = (
  payload: AuthSessionPayload | LoginResponse,
  fallbackUser?: WebUser
): WebSession => {
  const roles = payload.roles.filter(isWebRole);
  const activeRole = isWebRole(payload.activeRole) ? payload.activeRole : roles[0];

  if (!activeRole) {
    throw new Error("web session requires creator or merchant role");
  }

  const user =
    "user" in payload
      ? payload.user
      : fallbackUser ?? {
          id: payload.userId,
          displayName: payload.userId
        };

  return {
    user: {
      id: user.id,
      displayName: user.displayName
    },
    activeRole,
    roles
  };
};
