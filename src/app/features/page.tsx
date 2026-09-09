import { Metadata } from "next";
import { FeaturesContent } from "./FeaturesContent";

export const metadata: Metadata = {
  title: "Features - Bug Reporting & Screen Recorder",
  description: "Explore BugSnap features: Screen Recorder, DevTools log capture, instant sharing, and AI bug summaries.",
};

export default function FeaturesPage() {
  return <FeaturesContent />;
}
