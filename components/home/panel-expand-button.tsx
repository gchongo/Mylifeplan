import Link from "next/link";
import { cn } from "@/lib/utils";

export function PanelExpandButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
        "text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900",
      )}
      title={`放大查看${label}`}
      aria-label={`放大查看${label}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M15 3h6v6" />
        <path d="M9 21H3v-6" />
        <path d="M21 3l-7 7" />
        <path d="M3 21l7-7" />
      </svg>
    </Link>
  );
}
