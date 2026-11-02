import { pageMeta } from "@/lib/pageMeta";
import { VisualCompareContent } from "./VisualCompareContent";

export const metadata = pageMeta({
  title: "Visual Compare - Pixel-Perfect Screenshot Comparison | BugSnap",
  description:
    "Compare screenshot captures side-by-side or with an interactive split slider to verify bug fixes, visual regression, and UI changes instantly.",
  canonical: "/visual-compare",
});

export default function VisualComparePage() {
  return <VisualCompareContent />;
}
