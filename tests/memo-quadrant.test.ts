import { describe, expect, it } from "vitest";
import {
  DEFAULT_STICKY_HEIGHT,
  DEFAULT_STICKY_WIDTH,
  detectMemoQuadrant,
  defaultPositionForQuadrant,
  detectMemoQuadrant,
  quadrantFeedLabel,
  resolveStickyNotePlacement,
  MEMO_QUADRANT_BOARD_HEIGHT,
  MEMO_QUADRANT_BOARD_WIDTH,
} from "@/lib/memo-quadrant";

const boardW = MEMO_QUADRANT_BOARD_WIDTH;
const boardH = MEMO_QUADRANT_BOARD_HEIGHT;
const w = DEFAULT_STICKY_WIDTH;
const h = DEFAULT_STICKY_HEIGHT;

describe("detectMemoQuadrant", () => {
  it("places Q1 in top-right (urgent + important)", () => {
    const x = boardW * 0.75 - w / 2;
    const y = boardH * 0.25 - h / 2;
    expect(detectMemoQuadrant(x, y, w, h, boardW, boardH)).toBe("urgent_important");
  });

  it("places Q2 in top-left (not urgent + important)", () => {
    const x = boardW * 0.25 - w / 2;
    const y = boardH * 0.25 - h / 2;
    expect(detectMemoQuadrant(x, y, w, h, boardW, boardH)).toBe("not_urgent_important");
  });

  it("places Q3 in bottom-left", () => {
    const x = boardW * 0.25 - w / 2;
    const y = boardH * 0.75 - h / 2;
    expect(detectMemoQuadrant(x, y, w, h, boardW, boardH)).toBe("not_urgent_not_important");
  });

  it("places Q4 in bottom-right", () => {
    const x = boardW * 0.75 - w / 2;
    const y = boardH * 0.75 - h / 2;
    expect(detectMemoQuadrant(x, y, w, h, boardW, boardH)).toBe("urgent_not_important");
  });
});

describe("defaultPositionForQuadrant", () => {
  it("returns positions inside matching quadrants", () => {
    for (const id of [
      "urgent_important",
      "not_urgent_important",
      "urgent_not_important",
      "not_urgent_not_important",
    ] as const) {
      const pos = defaultPositionForQuadrant(id, boardW, boardH, 0);
      expect(detectMemoQuadrant(pos.x, pos.y, w, h, boardW, boardH)).toBe(id);
    }
  });

  it("respects custom axis ratios", () => {
    const axis = { axisXRatio: 0.7, axisYRatio: 0.35 };
    const pos = defaultPositionForQuadrant("not_urgent_important", boardW, boardH, 0, axis);
    expect(detectMemoQuadrant(pos.x, pos.y, w, h, boardW, boardH, axis)).toBe(
      "not_urgent_important",
    );
  });
});

describe("resolveStickyNotePlacement", () => {
  it("places feed-created Q4 memo into bottom-right on actual board size", () => {
    const boardW = 1200;
    const boardH = 900;
    const placement = resolveStickyNotePlacement({
      quadrant: "urgent_not_important",
      posX: 508,
      posY: 388,
      boardWidth: boardW,
      boardHeight: boardH,
      indexInQuadrant: 0,
    });
    expect(placement.quadrant).toBe("urgent_not_important");
    expect(
      detectMemoQuadrant(
        placement.x,
        placement.y,
        w,
        h,
        boardW,
        boardH,
      ),
    ).toBe("urgent_not_important");
  });

  it("keeps position when already inside declared quadrant", () => {
    const pos = defaultPositionForQuadrant("not_urgent_important", boardW, boardH, 0);
    const placement = resolveStickyNotePlacement({
      quadrant: "not_urgent_important",
      posX: pos.x,
      posY: pos.y,
      boardWidth: boardW,
      boardHeight: boardH,
      indexInQuadrant: 0,
    });
    expect(placement.x).toBe(pos.x);
    expect(placement.y).toBe(pos.y);
  });
});

describe("quadrantFeedLabel", () => {
  it("combines short label and full name", () => {
    expect(quadrantFeedLabel("urgent_important")).toBe("Q1 重要且紧急");
    expect(quadrantFeedLabel("not_urgent_important")).toBe("Q2 重要不紧急");
  });
});
