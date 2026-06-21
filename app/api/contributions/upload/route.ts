import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { requireSession } from "@/lib/auth/get-session";
import { handleProtectedRouteError } from "@/lib/api/route-auth";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return jsonError("请选择图片文件", 400);
    }
    if (!ALLOWED.has(file.type)) {
      return jsonError("仅支持 JPG、PNG、GIF、WebP", 400);
    }
    if (file.size > MAX_BYTES) {
      return jsonError("图片不能超过 5MB", 400);
    }

    const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    const filename = `${randomUUID()}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads", "contributions", session.userId);
    await mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, filename), buffer);

    const url = `/uploads/contributions/${session.userId}/${filename}`;
    return jsonOk({ url }, 201);
  } catch (error) {
    return handleProtectedRouteError(error, "api/contributions/upload POST");
  }
}
