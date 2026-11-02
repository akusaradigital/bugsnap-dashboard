import { pageMeta } from "@/lib/pageMeta";
import { ContactContent } from "./ContactContent";

export const metadata = pageMeta({
  title: "Contact Us - BugSnap",
  description:
    "Have questions, feedback, or need help with BugSnap? Reach out to our team.",
  canonical: "/contact",
});

export default function ContactPage() {
  return <ContactContent />;
}
