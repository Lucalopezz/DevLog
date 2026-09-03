import { api } from "@/api/http";

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}
