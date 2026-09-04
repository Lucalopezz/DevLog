import { api } from "@/api/http";
import type { LoginFormData, User } from "../types/auth";

export async function login(input: LoginFormData): Promise<User> {
  const { data } = await api.post<User>("/auth/login", input);
  return data;
}
