import { pageMeta } from "@/lib/pageMeta";
import { ContactContent } from "./ContactContent";

export const metadata = pageMeta({
  title: "Contact & Support",
  description: "Get in touch with the BugSnap team for technical support, enterprise inquiries, or feedback.",
  canonical: "/contact",
});

export default function ContactPage() {
  return <ContactContent />;
}
