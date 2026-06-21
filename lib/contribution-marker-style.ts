import type { ContributionMarkerPreferences } from "@/lib/user-preferences";

const SIZE_PX: Record<ContributionMarkerPreferences["size"], number> = {
  xs: 8,
  sm: 10,
  md: 12,
};

export function getContributionMarkerStyle(prefs: ContributionMarkerPreferences) {
  const px = SIZE_PX[prefs.size];
  const shapeClass =
    prefs.shape === "square"
      ? "rounded-sm"
      : prefs.shape === "diamond"
        ? "rotate-45 rounded-[1px]"
        : "rounded-full";

  return {
    px,
    shapeClass,
    color: prefs.color,
  };
}
