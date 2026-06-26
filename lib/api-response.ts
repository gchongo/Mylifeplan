import { NextResponse } from "next/server";

/** 禁止 CDN / 浏览器 / Next 缓存 API 与动态页 JSON */
export const PRIVATE_NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: PRIVATE_NO_STORE });
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status, headers: PRIVATE_NO_STORE });
}
