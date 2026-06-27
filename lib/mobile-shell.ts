/** 移动端壳层：竖屏/方形，或窄屏宽度 */
export const MOBILE_SHELL_MEDIA = "(max-aspect-ratio: 1/1), (max-width: 767px)";

export const MOBILE_TAB_PATHS = ["/feed", "/gantt", "/calendar", "/plans", "/memos"] as const;

export type MobileTabPath = (typeof MOBILE_TAB_PATHS)[number];

export function isMobileTabPath(pathname: string): pathname is MobileTabPath {
  return (MOBILE_TAB_PATHS as readonly string[]).includes(pathname);
}

export function shouldShowMobileTabBar(pathname: string, isMobileShell: boolean): boolean {
  if (!isMobileShell) return false;
  if (pathname === "/settings" || pathname.startsWith("/settings/")) return true;
  if (pathname === "/summary") return true;
  return isMobileTabPath(pathname);
}
