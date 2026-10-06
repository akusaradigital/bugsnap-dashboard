import { pageMeta } from "@/lib/pageMeta";
import { BlogListContent } from "./BlogListContent";

export const metadata = pageMeta({
  title: "Blog - Bug Reporting Tips & Developer Productivity",
  description: "Practical tips on bug reporting, screen recording, DevTools, and developer productivity. Learn how to ship faster with fewer bugs.",
  canonical: "/blog",
});

export default function BlogPage() {
  return <BlogListContent />;
}
