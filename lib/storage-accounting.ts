import { stat } from "fs/promises";
import { prisma } from "@/lib/db";
import { ensureUserStorage } from "@/lib/services/billing";
import { resolveUploadFilePath } from "@/lib/upload-paths";

export async function bytesForUploadUrl(url: string): Promise<number> {
  const filePath = resolveUploadFilePath(url);
  if (!filePath) return 0;
  try {
    const info = await stat(filePath);
    return info.size;
  } catch {
    return 0;
  }
}

export function sumImageSizeBytes(rows: { sizeBytes: number }[]): number {
  return rows.reduce((total, row) => total + Math.max(0, row.sizeBytes), 0);
}

export async function releaseStorageBytes(userId: string, bytes: number) {
  if (bytes <= 0) return;
  await ensureUserStorage(userId);
  const row = await prisma.userStorage.findUnique({ where: { userId } });
  const next = Math.max(0, (row?.usedBytes ?? 0) - bytes);
  await prisma.userStorage.update({
    where: { userId },
    data: { usedBytes: next },
  });
}

export async function releaseStorageForUrls(userId: string, urls: string[]) {
  if (urls.length === 0) return;
  let total = 0;
  for (const url of urls) {
    total += await bytesForUploadUrl(url);
  }
  await releaseStorageBytes(userId, total);
}

export async function releaseStorageForImageRows(
  userId: string,
  rows: { url: string; sizeBytes: number }[],
) {
  const fromDb = sumImageSizeBytes(rows);
  if (fromDb > 0) {
    await releaseStorageBytes(userId, fromDb);
    return;
  }
  await releaseStorageForUrls(
    userId,
    rows.map((r) => r.url),
  );
}
