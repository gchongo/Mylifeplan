import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { requireSession } from "@/lib/auth/get-session";
import { handleProtectedRouteError } from "@/lib/api/route-auth";
import { EntitlementError } from "@/lib/entitlements";
import { saveUserImageUpload } from "@/lib/upload-storage";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return jsonError("请选择图片文件", 400);
    }

    const result = await saveUserImageUpload({
      userId: session.userId,
      file,
      category: "contributions",
    });
    return jsonOk(result, 201);
  } catch (error) {
    if (error instanceof EntitlementError) {
      return jsonError(error.message, 403);
    }
    if (error instanceof Error && error.message.includes("仅支持")) {
      return jsonError(error.message, 400);
    }
    return handleProtectedRouteError(error, "api/contributions/upload POST");
  }
}
