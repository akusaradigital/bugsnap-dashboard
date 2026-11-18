import type { Metadata } from "next";

// Login is a utility page, not content. Keep it out of the index (also removed from sitemap).
export const metadata: Metadata = {
  title: "Login",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
