import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
import { requireSession } from "@/lib/auth/get-session";
import { getCalendarItems } from "@/lib/services/view-data";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = request.nextUrl;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const items = await getCalendarItems(session.userId, from, to);
    return jsonOk({ items });
  } catch {
    return jsonError("未登录", 401);
  }
}
