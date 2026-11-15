import { api } from "./api";
import { useAuthStore, type AuthReply } from "../auth/state";
export const authRequest = { _skipAuthRefresh: true, _quiet: true };
export async function signIn(
  email: string,
  password: string,
  remember_me: boolean,
) {
  const reply = (
    await api.post<AuthReply>(
      "/auth/login",
      { email, password, remember_me },
      authRequest,
    )
  ).data;
  useAuthStore.getState().accept(reply);
  return reply.user;
}
export async function signOut(everywhere = false) {
  await api.post(everywhere ? "/auth/logout-all" : "/auth/logout");
  useAuthStore.getState().clear();
}
