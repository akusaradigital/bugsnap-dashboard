import { ReactNode } from "react";
import { StaticShell } from "@/components/StaticShell";
import { Reveal } from "@/components/site/motion";
import { pageMeta } from "@/lib/pageMeta";

export const metadata = pageMeta({
  title: "Terms of Service - BugSnap",
  description: "Terms and conditions for using the BugSnap Chrome Extension and Dashboard.",
  canonical: "/terms",
});

interface LegalSection {
  title: string;
  content: ReactNode;
}

const sections: LegalSection[] = [
  {
    title: "1. Acceptance of Terms",
    content: (
      <p className="text-site-text-2">
        By installing the BugSnap Chrome Extension or using the BugSnap web dashboard (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, please do not install or use the Service.
      </p>
    ),
  },
  {
    title: "2. Description of the Service",
    content: (
      <p className="text-site-text-2">
        BugSnap is a screen capture and bug-reporting tool. It allows you to take screenshots and record your screen, annotate them, upload media to your own Google Drive, and share capture links with others. A web dashboard lets you manage, review, and discuss captures with your team.
      </p>
    ),
  },
  {
    title: "3. Your Accounts",
    content: (
      <p className="text-site-text-2">
        You must sign in with your Google account to use the dashboard. You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account.
      </p>
    ),
  },
  {
    title: "4. Acceptable Use",
    content: (
      <>
        <p className="text-site-text-2 mb-2">You agree not to use the Service to:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs text-site-text-2">
          <li>Capture or share content that violates the law or the rights of others (e.g., copyrighted material, passwords, confidential data you are not authorized to expose).</li>
          <li>Capture passwords, payment card numbers, or other sensitive personal information.</li>
          <li>Upload malicious code, or interfere with the operation of the Service.</li>
          <li>Attempt to access, damage, or disrupt the BugSnap servers, databases, or the accounts of other users.</li>
          <li>Resell or license copies of the captures or metadata for purposes unrelated to the intended bug-reporting workflow.</li>
        </ul>
      </>
    ),
  },
  {
    title: "5. Your Content & Ownership",
    content: (
      <>
        <p className="text-site-text-2">
          All screenshots, recordings, annotations, descriptions, and comments you create remain your property. You retain full ownership of your content.
        </p>
        <p className="text-site-text-2">
          You grant BugSnap a limited, non-exclusive, revocable license to store and display your metadata and comments solely to provide the Service. Media files reside in your own Google Drive and remain under your control; BugSnap does not claim ownership of them.
        </p>
      </>
    ),
  },
  {
    title: "6. Third-Party Services",
    content: (
      <p className="text-site-text-2">
        The Service relies on third-party services: Google Drive, Google OAuth, and our cloud infrastructure providers. Your use of those services is subject to their respective terms and privacy policies. BugSnap is not responsible for the availability or behavior of those third-party services.
      </p>
    ),
  },
  {
    title: "7. Disclaimer of Warranties",
    content: (
      <p className="text-site-text-2">
        The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or secure.
      </p>
    ),
  },
  {
    title: "8. Limitation of Liability",
    content: (
      <p className="text-site-text-2">
        To the maximum extent permitted by law, BugSnap - From Click to Fix and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or goodwill, arising from your use of or inability to use the Service.
      </p>
    ),
  },
  {
    title: "9. Termination",
    content: (
      <p className="text-site-text-2">
        We may suspend or terminate your access to the Service at any time for a reason, including violation of these Terms or to protect the security and reliability of the platform. You may stop using the Service and uninstall the extension at any time.
      </p>
    ),
  },
  {
    title: "10. Changes to the Terms",
    content: (
      <p className="text-site-text-2">
        We may update these Terms from time to time. We will update the &quot;Last updated&quot; version at the top of this page. Continued use of the Service after the changes are posted constitutes acceptance of the revised Terms.
      </p>
    ),
  },
  {
    title: "11. Governing Law",
    content: (
      <p className="text-site-text-2">
        These Terms are governed by the laws of the Republic of Indonesia. Any disputes shall be subject to the exclusive jurisdiction of the courts of Indonesia.
      </p>
    ),
  },
  {
    title: "12. Contact",
    content: (
      <p className="text-site-text-2">
        For questions about these Terms, contact us at <a href="mailto:support@akusaradigital.com" className="text-accent underline">support@akusaradigital.com</a>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <StaticShell
      title="Terms of Service"
      subtitle="Terms and conditions for using the BugSnap Chrome Extension and Dashboard."
      lastUpdated="August 8, 2026"
    >
      <div className="max-w-4xl space-y-8 font-site text-xs sm:text-sm text-site-text leading-relaxed">
        {sections.map((section, i) => (
          <Reveal key={i} delay={i * 0.05}>
            <section className="space-y-3">
              <h2 className="text-base font-bold text-site-text">{section.title}</h2>
              {section.content}
            </section>
          </Reveal>
        ))}
      </div>
    </StaticShell>
  );
}
