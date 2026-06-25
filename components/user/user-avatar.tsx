"use client";

import Image from "next/image";
import { profileInitial } from "@/components/user/user-profile-provider";
import { cn } from "@/lib/utils";

export function UserAvatar({
  name,
  email,
  avatar,
  size = "md",
  className,
}: {
  name?: string | null;
  email: string;
  avatar?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initial = profileInitial({ name: name ?? null, email });
  const sizeClass =
    size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-20 w-20 text-2xl" : "h-9 w-9 text-sm";

  if (avatar) {
    return (
      <span
        className={cn(
          "relative inline-flex shrink-0 overflow-hidden rounded-full bg-gray-100 ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700",
          sizeClass,
          className,
        )}
      >
        <Image src={avatar} alt="" fill className="object-cover" sizes="80px" unoptimized />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 ring-1 ring-brand-200 dark:bg-brand-950 dark:text-brand-300 dark:ring-brand-900",
        sizeClass,
        className,
      )}
      aria-hidden
    >
      {initial}
    </span>
  );
}
