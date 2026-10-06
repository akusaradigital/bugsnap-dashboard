import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBlogPost, getAllSlugs } from "@/content/blog";
import { BlogPostContent } from "./BlogPostContent";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const post = getBlogPost(params.slug);
  if (!post) return {};
  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://bugsnap.akusaraproject.my.id";

  return {
    title: `${post.title} - BugSnap Blog`,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${siteUrl}/blog/${post.slug}`,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      images: [
        {
          url: post.ogImage || `${siteUrl}/opengraph-image.png`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [post.ogImage || `${siteUrl}/opengraph-image.png`],
    },
  };
}

export default function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = getBlogPost(params.slug);
  if (!post) notFound();
  return <BlogPostContent slug={params.slug} />;
}
