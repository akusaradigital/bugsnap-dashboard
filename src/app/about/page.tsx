import { pageMeta } from "@/lib/pageMeta";
import { AboutContent } from "./AboutContent";

export const metadata = pageMeta({
  title: "About BugSnap - Built for Teams Who Build Software",
  description: "Learn about BugSnap's mission to make bug reporting effortless, private, and developer-first with direct Google Drive storage.",
  canonical: "/about",
});

export default function AboutPage() {
  return <AboutContent />;
}
