import { useMutation } from "@tanstack/react-query";
import { api } from "./api";
import { User, useStore } from "./store";

type Session = { token: string; user: User & { phone: string | null } };

export type LoginInput = { email: string; password: string };
export type RegisterInput = LoginInput & { name: string };

const startSession = ({ token, user }: Session) => useStore.getState().setAuth(token, { ...user, phone: user.phone ?? "" });

export const useLogin = () =>
  useMutation({
    mutationFn: async (input: LoginInput) => (await api.post<Session>("/auth/login", input)).data,
    onSuccess: startSession,
  });

export const useRegister = () =>
  useMutation({
    mutationFn: async (input: RegisterInput) => (await api.post<Session>("/auth/register", input)).data,
    onSuccess: startSession,
  });
