import { cn } from "../lib/utils";

export function tierFor(score: number): "strong" | "solid" | "stretch" {
  if (score >= 85) return "strong";
  if (score >= 70) return "solid";
  return "stretch";
}

const TIER_LABEL = {
  strong: "Strong fit",
  solid: "Good fit",
  stretch: "Partial fit",
} as const;

const TIER_STYLES = {
  strong: "bg-brand-100 text-brand-800 border-brand-300",
  solid: "bg-amber-50 text-amber-800 border-amber-200",
  stretch: "bg-gray-100 text-gray-700 border-gray-300",
} as const;

export function FitScore({ score }: { score: number }) {
  const tier = tierFor(score);
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
        TIER_STYLES[tier],
      )}
      title={`Fit score: ${score}/100`}
    >
      <span>{TIER_LABEL[tier]}</span>
      <span className="opacity-60">·</span>
      <span className="tabular-nums">{score}</span>
    </div>
  );
}
