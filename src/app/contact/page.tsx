import { Metadata } from "next";
import { ContactContent } from "./ContactContent";

export const metadata: Metadata = {
  title: "Contact & Support",
  description: "Get in touch with the BugSnap team for technical support, enterprise inquiries, or feedback.",
};

export default function ContactPage() {
  return <ContactContent />;
}
