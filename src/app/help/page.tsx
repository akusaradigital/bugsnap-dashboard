import { Metadata } from "next";
import { HelpContent } from "./HelpContent";

export const metadata: Metadata = {
  title: "Help Center & FAQ",
  description: "Get help with BugSnap setup, Google Drive permissions, reporting bugs, and team management.",
};

export default function HelpPage() {
  return <HelpContent />;
}
