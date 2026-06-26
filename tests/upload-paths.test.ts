import { describe, expect, it } from "vitest";
import {
  buildUploadUrl,
  isUploadUrlForUser,
  parseUploadUrl,
  toUploadApiUrl,
} from "@/lib/upload-paths";

describe("upload-paths", () => {
  it("builds API upload URLs", () => {
    expect(buildUploadUrl("contributions", "user-1", "abc.jpg")).toBe(
      "/api/uploads/contributions/user-1/abc.jpg",
    );
  });

  it("maps legacy upload URLs to the API route", () => {
    expect(toUploadApiUrl("/uploads/memos/u1/x.png")).toBe("/api/uploads/memos/u1/x.png");
    expect(toUploadApiUrl("/api/uploads/memos/u1/x.png")).toBe("/api/uploads/memos/u1/x.png");
    expect(toUploadApiUrl("https://example.com/a.png")).toBe("https://example.com/a.png");
  });

  it("parses upload URLs", () => {
    expect(parseUploadUrl("/uploads/contributions/u1/a.webp")).toEqual({
      category: "contributions",
      userId: "u1",
      filename: "a.webp",
    });
    expect(parseUploadUrl("/api/uploads/avatars/u1/a.webp")).toEqual({
      category: "avatars",
      userId: "u1",
      filename: "a.webp",
    });
    expect(parseUploadUrl("/uploads/contributions/u1/../secret")).toBeNull();
  });

  it("checks upload ownership", () => {
    expect(isUploadUrlForUser("/uploads/avatars/u1/a.webp", "u1")).toBe(true);
    expect(isUploadUrlForUser("/api/uploads/avatars/u1/a.webp", "u1")).toBe(true);
    expect(isUploadUrlForUser("/uploads/avatars/u2/a.webp", "u1")).toBe(false);
  });
});
