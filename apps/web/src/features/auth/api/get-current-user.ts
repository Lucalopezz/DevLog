import { api } from "@/api/http";
import type { User } from "../types";

export const currentUserQueryKey = ["currentUser", "auth"] as const;

export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get<User>("/users/me");
  return data;
}
