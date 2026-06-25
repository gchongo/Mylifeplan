export const MEMO_UPDATED_EVENT = "meridian:memo-updated";

export let memoDataVersion = 0;

export function dispatchMemoUpdated() {
  memoDataVersion += 1;
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(MEMO_UPDATED_EVENT, { detail: { version: memoDataVersion } }),
    );
  }
}
