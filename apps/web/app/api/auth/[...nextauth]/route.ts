/**
 * Auth.js ルートハンドラ。GET/POST の両方を /api/auth/* に委譲する。
 */
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
