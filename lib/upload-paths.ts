import path from "path";

export const UPLOAD_CATEGORIES = ["contributions", "memos", "avatars"] as const;
export type UploadCategory = (typeof UPLOAD_CATEGORIES)[number];

const UPLOAD_PATH_RE =
  /^\/(?:api\/)?uploads\/(contributions|memos|avatars)\/([^/]+)\/([^/]+)$/;

export function buildUploadUrl(
  category: UploadCategory,
  userId: string,
  filename: string,
): string {
  return `/api/uploads/${category}/${userId}/${filename}`;
}

/** Map legacy `/uploads/...` URLs to the API route that reads from disk at request time. */
export function toUploadApiUrl(url: string): string {
  if (!url.startsWith("/uploads/") && !url.startsWith("/api/uploads/")) {
    return url;
  }
  if (url.startsWith("/api/uploads/")) return url;
  return `/api${url}`;
}

export function parseUploadUrl(url: string): {
  category: UploadCategory;
  userId: string;
  filename: string;
} | null {
  const match = url.match(UPLOAD_PATH_RE);
  if (!match) return null;
  const [, category, userId, filename] = match;
  if (!category || !userId || !filename || filename.includes("..")) return null;
  if (!UPLOAD_CATEGORIES.includes(category as UploadCategory)) return null;
  return { category: category as UploadCategory, userId, filename };
}

export function resolveUploadFilePath(url: string): string | null {
  const parsed = parseUploadUrl(url);
  if (!parsed) return null;
  return path.join(
    process.cwd(),
    "public",
    "uploads",
    parsed.category,
    parsed.userId,
    parsed.filename,
  );
}

export function contentTypeForUploadFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

export function isUploadUrlForUser(url: string, userId: string): boolean {
  const parsed = parseUploadUrl(url);
  return parsed?.userId === userId;
}
