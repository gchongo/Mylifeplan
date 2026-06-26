import { readFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { requireSession } from "@/lib/auth/get-session";
import { handleProtectedRouteError } from "@/lib/api/route-auth";
import {
  UPLOAD_CATEGORIES,
  contentTypeForUploadFilename,
  type UploadCategory,
} from "@/lib/upload-paths";
import path from "path";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const session = await requireSession(request);
    const segments = (await context.params).path;
    if (segments.length !== 3) {
      return jsonError("文件不存在", 404);
    }

    const [category, userId, filename] = segments;
    if (
      !UPLOAD_CATEGORIES.includes(category as UploadCategory) ||
      !userId ||
      !filename ||
      filename.includes("..")
    ) {
      return jsonError("文件不存在", 404);
    }

    if (session.userId !== userId) {
      return jsonError("无权访问", 403);
    }

    const filePath = path.join(
      process.cwd(),
      "public",
      "uploads",
      category,
      userId,
      filename,
    );

    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentTypeForUploadFilename(filename),
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    const errno = error as NodeJS.ErrnoException;
    if (errno.code === "ENOENT") {
      return jsonError("文件不存在", 404);
    }
    return handleProtectedRouteError(error, "api/uploads GET");
  }
}
