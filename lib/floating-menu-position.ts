/** Compute fixed-position coords for a dropdown anchored to a trigger rect. */
export function computeFloatingMenuPosition(
  rect: DOMRect,
  menuHeight: number,
  menuWidth: number,
  opts?: { gap?: number; viewportPadding?: number },
): { top: number; left: number } {
  const gap = opts?.gap ?? 4;
  const viewportPadding = opts?.viewportPadding ?? 8;
  const spaceBelow = window.innerHeight - rect.bottom - gap - viewportPadding;
  const spaceAbove = rect.top - gap - viewportPadding;
  const openUpward = menuHeight > spaceBelow && spaceAbove >= spaceBelow;
  const top = openUpward
    ? Math.max(viewportPadding, rect.top - menuHeight - gap)
    : rect.bottom + gap;
  const left = Math.max(viewportPadding, rect.right - menuWidth);
  return { top, left };
}
