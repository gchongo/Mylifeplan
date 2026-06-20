"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { redirectToLogin } from "@/lib/client-api";

export function SessionGuard({ userEmail }: { userEmail?: string | null }) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      try {
        const res = await fetch("/api/auth/session", { credentials: "include" });
        if (cancelled) return;
        if (!res.ok) {
          redirectToLogin();
          return;
        }
        const data = await res.json();
        if (!data.user && userEmail) {
          redirectToLogin();
        }
      } catch {
        if (!cancelled && userEmail) {
          router.refresh();
        }
      }
    }

    verify();
    const timer = window.setInterval(verify, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [router, userEmail]);

  return null;
}
