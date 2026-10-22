import { ReactNode } from "react";
import { StaticShell } from "@/components/StaticShell";
import { Reveal } from "@/components/site/motion";
import { pageMeta } from "@/lib/pageMeta";

export const metadata = pageMeta({
  title: "Terms of Service & Consumer Protection - BugSnap",
  description:
    "Terms of service, consumer protection guarantees, refund policy, and dispute resolution for BugSnap Chrome Extension and Dashboard.",
  canonical: "/terms",
});

interface LegalSection {
  id?: string;
  title: string;
  content: ReactNode;
}

const sections: LegalSection[] = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: (
      <p className="text-site-text-2">
        By installing the BugSnap Chrome Extension, subscribing to a plan, or using the BugSnap web dashboard (&quot;the Service&quot;), you enter into a legally binding agreement and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not install or use the Service.
      </p>
    ),
  },
  {
    id: "description",
    title: "2. Operator Identity & Description of Service",
    content: (
      <div className="space-y-2 text-site-text-2">
        <p>
          BugSnap is a developer-first bug reporting and diagnostics tool operated by <strong>Akusara Digital</strong> (&quot;we&quot;, &quot;us&quot;, or &quot;the Operator&quot;), an independent software engineering organization.
        </p>
        <p>
          The Service enables users to capture high-definition screen recordings and screenshots, annotate captures, capture passive browser runtime telemetry (console errors, HTTP waterfalls, system specs, and SPA memory bloat metrics), export automated Playwright regression tests, and share interactive bug reports. All video recordings and image media stream directly to your own authorized Google Drive account under the principle of <strong>Zero Server Storage</strong>.
        </p>
      </div>
    ),
  },
  {
    id: "accounts",
    title: "3. User Accounts & Security",
    content: (
      <p className="text-site-text-2">
        You access the dashboard by authenticating through your Google Account via OAuth 2.0. You are responsible for safeguarding your credentials and for all activities that occur under your authenticated session. You agree to notify us immediately at <a href="mailto:support@akusaradigital.com" className="text-accent underline">support@akusaradigital.com</a> if you suspect any unauthorized access or security breach.
      </p>
    ),
  },
  {
    id: "acceptable-use",
    title: "4. Acceptable Use Policy",
    content: (
      <>
        <p className="text-site-text-2 mb-2">You agree to use BugSnap solely for lawful and legitimate software testing and reporting purposes. You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs text-site-text-2">
          <li>Capture or share content that infringes upon third-party intellectual property, privacy, or trade secrets.</li>
          <li>Intentionally record confidential customer payment credentials, unmasked CVVs, or sensitive personal data that violates applicable data protection regulations.</li>
          <li>Distribute malware, trojans, or attempt to disrupt the integrity and availability of the BugSnap platform.</li>
          <li>Attempt unauthorized access, reverse-engineering, or scraping of other users&apos; workspaces or metadata.</li>
          <li>Resell, sublicense, or rent access to BugSnap without prior written consent from Akusara Digital.</li>
        </ul>
        <div className="mt-3 p-3 rounded-lg bg-site-surface-2 border border-site-border-subtle text-xs text-site-text-2 space-y-1">
          <strong className="text-site-text font-semibold">User Recording Consent &amp; Indemnity Warranty:</strong>
          <p>
            You represent, warrant, and covenant that before recording any screen content, system audio, or microphone communications, you have secured all necessary permissions and lawful consents from all participants and affected parties, pursuant to applicable privacy regulations, communication wiretapping laws, and global two-party consent standards. You agree to defend, indemnify, and hold harmless Akusara Digital and its officers from any third-party claims, legal actions, or regulatory liabilities arising from your unauthorized screen or audio recording activities.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "data-sovereignty",
    title: "5. Content Ownership & Zero Server Storage",
    content: (
      <>
        <p className="text-site-text-2 mb-2">
          <strong>You retain 100% exclusive ownership</strong> of all screenshots, video recordings, annotations, code snippets, and comments created through BugSnap.
        </p>
        <p className="text-site-text-2 mb-2">
          <strong>Zero Server Storage Guarantee:</strong> Video recordings and image files are uploaded directly from your browser to your personal or enterprise Google Drive account via the scoped <code className="bg-site-surface-2 px-1 py-0.5 rounded border border-site-border">drive.file</code> permission. BugSnap does not store, host, or duplicate your media files on proprietary servers.
        </p>
        <p className="text-site-text-2">
          You grant BugSnap a non-exclusive, revocable, limited license solely to store, index, and transmit metadata (such as timestamps, capture titles, diagnostic error summaries, and comments) necessary to render your shared capture reports.
        </p>
      </>
    ),
  },
  {
    id: "billing",
    title: "6. Subscriptions, Pricing Transparency & Payments",
    content: (
      <div className="space-y-2 text-site-text-2">
        <p>
          <strong>Transparent Pricing:</strong> BugSnap offers a Free tier with core capture capabilities without requiring a credit card. Paid plans (Pro and Team tiers) are clearly displayed on our Pricing page with all recurring monthly or annual costs stated upfront. No hidden activation, setup, or termination fees apply.
        </p>
        <p>
          <strong>Merchant of Record:</strong> For online payment processing, BugSnap partners with <strong>Paddle.com</strong> (&quot;Paddle&quot;) as our authorized Merchant of Record. Paddle handles payment processing, currency conversions, localized invoicing, and applicable VAT/GST/Sales Tax compliance globally. By subscribing, you agree to Paddle&apos;s checkout terms.
        </p>
        <p>
          <strong>Price Changes:</strong> Any future adjustments to recurring subscription fees will be communicated to existing subscribers with at least 30 days of advance notice via email, allowing you ample time to cancel before changes take effect.
        </p>
      </div>
    ),
  },
  {
    id: "refund",
    title: "7. Cancellation & 14-Day Refund Policy",
    content: (
      <div className="space-y-3 text-site-text-2 border border-site-border rounded-xl p-5 bg-site-surface shadow-xs">
        <div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-site-accent mb-1">
            A. 1-Click Self-Serve Cancellation
          </h3>
          <p className="text-xs">
            You may cancel your paid subscription at any time with zero hassle directly through your Dashboard (<span className="font-mono text-site-text">Settings &gt; Billing &gt; Manage Subscription</span>) or via the Paddle Customer Portal. Upon cancellation, your account retains full access to paid features until the conclusion of the current prepaid billing period.
          </p>
        </div>
        <div className="border-t border-site-border-subtle pt-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-site-accent mb-1">
            B. 14-Day Money-Back Guarantee
          </h3>
          <p className="text-xs">
            In accordance with global consumer protection standards and fair trading practices, if you are unsatisfied with BugSnap Pro for any reason within <strong>14 days of your initial purchase</strong>, you are entitled to a full 100% refund.
          </p>
        </div>
        <div className="border-t border-site-border-subtle pt-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-site-accent mb-1">
            C. How to Claim a Refund
          </h3>
          <p className="text-xs">
            Simply send an email to <a href="mailto:support@akusaradigital.com" className="text-accent underline font-semibold">support@akusaradigital.com</a> with your order number or account email. Refund requests are processed within 2 to 3 business days without punitive deductions.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "consumer-protection",
    title: "8. Global Consumer Protection & Fair Trading Rights",
    content: (
      <div className="space-y-3 text-site-text-2">
        <p>
          Akusara Digital operates BugSnap in accordance with recognized international consumer protection standards and digital commerce best practices, ensuring:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs text-site-text-2">
          <li><strong>Transparency &amp; Truthful Information:</strong> Clear disclosure of software features, operational scopes, tier quotas, and billing terms before subscription.</li>
          <li><strong>Fair Digital Contracts:</strong> Transparent service terms with zero hidden fees, unilateral lock-ins, or punitive termination clauses.</li>
          <li><strong>Accessible Redress &amp; Support:</strong> Responsive customer support channels to resolve inquiries, billing issues, or technical defects promptly.</li>
        </ul>
        <p className="text-xs">
          <strong>Fair Contract Guarantee:</strong> Nothing in these Terms shall be construed as excluding, restricting, or modifying any statutory consumer rights, mandatory warranties, or legal remedies that cannot be lawfully waived under applicable consumer protection legislation in your jurisdiction.
        </p>
      </div>
    ),
  },
  {
    id: "data-protection",
    title: "9. Data Protection & Global Privacy Standards (GDPR & International Frameworks)",
    content: (
      <div className="space-y-2 text-site-text-2">
        <p>
          We protect your personal data in accordance with international privacy principles, including the European Union General Data Protection Regulation (GDPR) and global data protection standards:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs">
          <li><strong>Right to Access &amp; Portability:</strong> You may inspect and export your capture data at any time.</li>
          <li><strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Deleting a capture or deleting your account permanently purges all associated metadata and logs from our database.</li>
          <li><strong>Client-Side Sanitization:</strong> Authentication headers (Bearer tokens, cookies) and sensitive inputs are automatically scrubbed in browser memory before metadata transmission.</li>
        </ul>
        <p className="text-xs">
          For full details, please review our comprehensive <a href="/privacy" className="text-accent underline font-semibold">Privacy Policy</a>.
        </p>
      </div>
    ),
  },
  {
    id: "third-party",
    title: "10. Third-Party Integrations & Google API Compliance",
    content: (
      <p className="text-site-text-2">
        BugSnap integrates with Google Drive APIs using the limited <code className="bg-site-surface-2 px-1 py-0.5 rounded border border-site-border">drive.file</code> scope. Our use and transfer of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes" target="_blank" rel="noopener noreferrer" className="text-accent underline">Google API Services User Data Policy</a>, including the Limited Use requirements. Your use of third-party platforms (e.g., Google, Jira, Slack, Linear) remains subject to their independent terms and privacy notices.
      </p>
    ),
  },
  {
    id: "warranties",
    title: "11. Service Quality & Disclaimer of Warranties",
    content: (
      <p className="text-site-text-2">
        We strive for 99.9% uptime and high software reliability. However, except as explicitly provided under applicable statutory consumer protection laws, the Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We do not warrant that your use will be entirely uninterrupted, bug-free, or compatible with every browser configuration or network firewall.
      </p>
    ),
  },
  {
    id: "liability",
    title: "12. Limitation of Liability",
    content: (
      <p className="text-site-text-2">
        To the extent permitted by applicable law, Akusara Digital and its officers, directors, and employees shall not be liable for indirect, punitive, or consequential damages resulting from unauthorized access to your Google account or third-party platform downtime. In jurisdictions where limitations of liability are restricted by consumer protection statutes, our liability is limited to the greatest extent permitted by law or the amount you paid to BugSnap in the preceding 12 months.
      </p>
    ),
  },
  {
    id: "termination",
    title: "13. Termination",
    content: (
      <p className="text-site-text-2">
        You may terminate your account at any time by uninstalling the extension and requesting account deletion via the dashboard settings. We reserve the right to suspend or terminate accounts that engage in fraudulent activity, security attacks, or material breaches of these Terms, with prior written notice where practicable.
      </p>
    ),
  },
  {
    id: "complaints",
    title: "14. Customer Support & Dispute Resolution",
    content: (
      <div className="space-y-3 text-site-text-2 border border-site-border rounded-xl p-5 bg-site-surface shadow-xs">
        <div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-site-accent mb-1">
            Dedicated Customer Support Channel
          </h3>
          <p className="text-xs">
            We provide prompt and direct assistance to resolve user inquiries, billing issues, feedback, and technical concerns.
          </p>
          <ul className="list-disc pl-5 mt-1.5 space-y-1 text-xs">
            <li><strong>Support &amp; Inquiries:</strong> <a href="mailto:support@akusaradigital.com" className="text-accent underline font-semibold">support@akusaradigital.com</a></li>
            <li><strong>Response SLA:</strong> Within 2 business days (typically faster).</li>
            <li><strong>Operating Entity:</strong> Akusara Digital</li>
          </ul>
        </div>
        <div className="border-t border-site-border-subtle pt-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-site-accent mb-1">
            Informal Resolution &amp; Good-Faith Communication
          </h3>
          <p className="text-xs leading-relaxed">
            Prior to initiating any formal legal claim or proceeding, you agree to contact our support team at <a href="mailto:support@akusaradigital.com" className="text-accent underline">support@akusaradigital.com</a> to attempt an informal, good-faith resolution of the dispute. We are committed to working collaboratively with our users to reach fair and prompt resolutions.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "governing-law",
    title: "15. Governing Law & Dispute Resolution",
    content: (
      <p className="text-site-text-2">
        These Terms shall be governed by and construed in accordance with applicable general commercial principles, without regard to conflict of law provisions. Any dispute, claim, or controversy arising out of or relating to these Terms or your use of the Service shall first be addressed through good-faith amicable negotiation; if unresolved, disputes shall be submitted to a competent court of jurisdiction.
      </p>
    ),
  },
  {
    id: "contact",
    title: "16. Contact & Legal Notices",
    content: (
      <div className="text-site-text-2 space-y-1">
        <p>For questions, legal notices, or consumer inquiries, contact us at:</p>
        <p className="font-medium text-site-text pt-1">
          <strong>Akusara Digital</strong>
        </p>
        <p>
          Email: <a href="mailto:support@akusaradigital.com" className="text-accent underline">support@akusaradigital.com</a> · Website: <a href="https://akusaradigital.com" target="_blank" rel="noopener noreferrer" className="text-accent underline">akusaradigital.com</a>
        </p>
      </div>
    ),
  },
];

export default function TermsPage() {
  return (
    <StaticShell
      title="Terms of Service & Consumer Protection"
      subtitle="Transparent conditions, statutory consumer protection rights, and refund policies for the BugSnap platform."
      lastUpdated="October 21, 2026"
    >
      <div className="max-w-4xl space-y-8 font-site text-xs sm:text-sm text-site-text leading-relaxed">
        {sections.map((section, i) => (
          <Reveal key={section.id || i} delay={i * 0.03}>
            <section id={section.id} className="space-y-3 scroll-mt-24">
              <h2 className="text-base font-bold text-site-text">{section.title}</h2>
              {section.content}
            </section>
          </Reveal>
        ))}
      </div>
    </StaticShell>
  );
}
