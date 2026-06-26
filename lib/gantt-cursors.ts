const CURSOR_SIZE = 32;
const HOTSPOT = 12;
const STROKE = "#111827";
const FILL = "#ffffff";

const OPEN_HAND_PATH =
  "M8 11V7.5a1.5 1.5 0 1 1 3 0V11h1V6.5a1.5 1.5 0 1 1 3 0V11h1V8a1.5 1.5 0 0 1 3 0v6.5a5.5 5.5 0 0 1-5.5 5.5H10A4.5 4.5 0 0 1 5.5 15V12a1.5 1.5 0 0 1 3 0v1";

const CLOSED_HAND_PATH =
  "M7 11.5V9a1.5 1.5 0 1 1 3 0v2.5h1V7.5a1.5 1.5 0 1 1 3 0V11.5h1V9.5a1.5 1.5 0 0 1 3 0v5a4.5 4.5 0 0 1-4.5 4.5H9.5A3.5 3.5 0 0 1 6 16v-2a1.5 1.5 0 0 1 1.5-1.5H7v-2z";

function handSvg(path: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CURSOR_SIZE}" height="${CURSOR_SIZE}" viewBox="0 0 24 24" fill="none"><path d="${path}" stroke="${STROKE}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" fill="${FILL}"/></svg>`;
}

function cursorValue(svg: string, fallback: "grab" | "grabbing"): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${HOTSPOT} ${HOTSPOT}, ${fallback}`;
}

export const ganttGrabCursor = cursorValue(handSvg(OPEN_HAND_PATH), "grab");
export const ganttGrabbingCursor = cursorValue(handSvg(CLOSED_HAND_PATH), "grabbing");
