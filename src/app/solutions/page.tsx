import { pageMeta } from "@/lib/pageMeta";
import { SolutionsContent } from "./SolutionsContent";

export const metadata = pageMeta({
  title: "Solutions for QA, Developers & Product Teams",
  description: "Explore how BugSnap accelerates bug reporting for QA engineers, software developers, product managers, and support teams with automated DevTools context and Google Drive storage.",
  canonical: "/solutions",
});

export default function SolutionsPage() {
  return <SolutionsContent />;
}
