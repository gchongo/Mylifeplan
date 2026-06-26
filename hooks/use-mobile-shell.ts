"use client";

import { useEffect, useState } from "react";
import { MOBILE_SHELL_MEDIA } from "@/lib/mobile-shell";

export function useMobileShell(): boolean {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_SHELL_MEDIA);
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return mobile;
}
