/** 主内容区贴边铺满（无 main 内边距），用于首页与全屏面板页 */
export function isAppShellFullBleed(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/gantt" ||
    pathname === "/calendar" ||
    pathname === "/feed" ||
    pathname === "/summary"
  );
}
