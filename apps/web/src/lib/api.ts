import type {
  AuthSessionPayload,
  CreatorTaskFeedItem,
  LoginResponse,
  MerchantTaskListItem
} from "@meow/contracts";
import type { WebRole } from "./session.js";

const parseJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new Error(`request failed: ${response.status}`);
  }

  return (await response.json()) as T;
};

export const login = async (input: {
  identifier: string;
  secret: string;
  client: "web";
}): Promise<LoginResponse> =>
  parseJson<LoginResponse>(
    await fetch("/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    })
  );

export const getSession = async (): Promise<AuthSessionPayload | null> => {
  const response = await fetch("/auth/session");

  if (response.status === 401) {
    return null;
  }

  return parseJson<AuthSessionPayload>(response);
};

export const switchRole = async (role: WebRole): Promise<AuthSessionPayload> =>
  parseJson<AuthSessionPayload>(
    await fetch("/auth/switch-role", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role })
    })
  );

export const listCreatorTasks = async (): Promise<CreatorTaskFeedItem[]> =>
  parseJson<CreatorTaskFeedItem[]>(await fetch("/creator/tasks"));

export const listMerchantTasks = async (): Promise<MerchantTaskListItem[]> =>
  parseJson<MerchantTaskListItem[]>(await fetch("/merchant/tasks"));
