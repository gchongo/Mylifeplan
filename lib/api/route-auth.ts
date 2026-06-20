import { jsonError } from "@/lib/api-response";

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof Error && error.message === "UNAUTHORIZED";
}

export function isForbiddenError(error: unknown): boolean {
  return error instanceof Error && error.message === "FORBIDDEN";
}

export function handleProtectedRouteError(error: unknown, logTag: string) {
  if (isUnauthorizedError(error)) {
    return jsonError("未登录", 401);
  }
  if (isForbiddenError(error)) {
    return jsonError("无权限", 403);
  }
  if (error instanceof Error && error.message === "NOT_FOUND") {
    return jsonError("不存在", 404);
  }
  console.error(`[${logTag}]`, error);
  return jsonError("服务器错误", 500);
}
