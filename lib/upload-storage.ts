import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { assertCanUpload } from "@/lib/entitlements";
import { addUserStorageBytes } from "@/lib/services/billing";
import { EntitlementError } from "@/lib/entitlements";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

export async function saveUserImageUpload(params: {
  userId: string;
  file: File;
  category: "contributions" | "memos";
}): Promise<{ url: string; sizeBytes: number }> {
  const { userId, file, category } = params;

  if (!ALLOWED.has(file.type)) {
    throw new Error("仅支持 JPG、PNG、GIF、WebP");
  }

  try {
    await assertCanUpload(userId, file.size);
  } catch (e) {
    if (e instanceof EntitlementError) {
      throw e;
    }
    throw e;
  }

  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", category, userId);
  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);
  await addUserStorageBytes(userId, file.size);

  return {
    url: `/uploads/${category}/${userId}/${filename}`,
    sizeBytes: file.size,
  };
}
