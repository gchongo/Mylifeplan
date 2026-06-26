"use client";

import { useEffect, useState } from "react";
import { toUploadApiUrl } from "@/lib/upload-paths";
import { cn } from "@/lib/utils";

export function UploadImage({
  src,
  alt = "",
  className,
  retryLimit = 4,
  ...props
}: Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
  retryLimit?: number;
}) {
  const apiSrc = toUploadApiUrl(src);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setAttempt(0);
  }, [apiSrc]);

  const displaySrc =
    attempt > 0 ? `${apiSrc}${apiSrc.includes("?") ? "&" : "?"}retry=${attempt}` : apiSrc;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      src={displaySrc}
      alt={alt}
      className={cn(className)}
      onError={() => {
        if (attempt < retryLimit) {
          window.setTimeout(() => setAttempt((value) => value + 1), 400 * (attempt + 1));
        }
      }}
    />
  );
}
