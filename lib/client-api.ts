"use client";

const LOGIN_PATH = "/login";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function redirectToLogin() {
  if (typeof window === "undefined") return;
  const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
  window.location.assign(`${LOGIN_PATH}?next=${next}`);
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, {
    credentials: "include",
    ...init,
    headers: init?.headers,
  });

  if (res.status === 401 && typeof window !== "undefined") {
    redirectToLogin();
  }

  return res;
}

export async function apiJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await apiFetch(input, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data === "object" && data && "error" in data && typeof data.error === "string"
        ? data.error
        : "请求失败";
    throw new ApiError(message, res.status);
  }
  return data as T;
}
