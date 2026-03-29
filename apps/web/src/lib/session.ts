export type UserRole = "creator" | "merchant";

export interface WebSession {
  userId: string;
  role: UserRole;
}
