import { NextResponse } from "next/server";

const PRIVATE_NO_STORE = {
  "Cache-Control": "no-store, private",
};

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: PRIVATE_NO_STORE });
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status, headers: PRIVATE_NO_STORE });
}
