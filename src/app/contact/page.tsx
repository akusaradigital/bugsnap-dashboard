import { Metadata } from "next";
import { StaticShell } from "@/components/StaticShell";

export const metadata: Metadata = {
  title: "Contact Us - BugSnap",
  description: "Get in touch with the BugSnap team for support, inquiries, or feedback.",
};

export default function ContactPage() {
  return (
    <StaticShell
      title="Contact Us"
      subtitle="Have questions, feedback, or need help with BugSnap? Reach out to our team."
      ctaLabel="← Back to Home"
      ctaHref="/"
    >
      <main className="mx-auto max-w-4xl px-6 py-12 flex-1 w-full">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="border border-border rounded-xl p-5 bg-subtle/30 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Email Support</h3>
              <p className="text-sm font-semibold">
                <a href="mailto:support@akusaradigital.com" className="hover:underline text-indigo-600">
                  support@akusaradigital.com
                </a>
              </p>
              <p className="text-xs text-muted leading-relaxed">
                For technical issues, account help, security reports, or general inquiries. We aim to reply within 24 hours.
              </p>
            </div>

            <div className="border border-border rounded-xl p-5 bg-subtle/30 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Company &amp; Publisher</h3>
              <p className="text-sm font-semibold">Akusara Digital</p>
              <p className="text-xs text-muted leading-relaxed">
                Developer and operator of BugSnap - From Click to Fix.<br />
                Website: <a href="https://akusaradigital.com" target="_blank" rel="noopener noreferrer" className="underline text-indigo-600">akusaradigital.com</a>
              </p>
            </div>

            <div className="border border-border rounded-xl p-5 bg-subtle/30 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Enterprise &amp; Sales</h3>
              <p className="text-sm font-semibold">Custom Deployment</p>
              <p className="text-xs text-muted leading-relaxed">
                Need SLA guarantees, SSO, or custom integrations for your team? Contact our sales team to discuss enterprise options.
              </p>
            </div>
          </div>

          {/* Useful Quick Links */}
          <div className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground">Start capturing with BugSnap</h3>
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              Install Extension Free
            </a>
            <a
              href="/pricing"
              className="block text-center border border-border bg-white hover:bg-subtle text-foreground text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              See Pricing
            </a>
          </div>

          <div className="border border-border rounded-xl p-6 bg-white space-y-4">
            <h3 className="text-base font-bold text-foreground">Useful Resources</h3>
            <ul className="space-y-3 text-xs">
              <li className="flex flex-col gap-0.5">
                <a href="/privacy" className="font-medium text-indigo-600 hover:underline">Privacy Policy</a>
                <span className="text-muted">How we handle your data, Google Drive integration, and Chrome permissions.</span>
              </li>
              <li className="flex flex-col gap-0.5 border-t border-border pt-3">
                <a href="/terms" className="font-medium text-indigo-600 hover:underline">Terms of Service</a>
                <span className="text-muted">The agreement between you and BugSnap regarding acceptable use and service limits.</span>
              </li>
              <li className="flex flex-col gap-0.5 border-t border-border pt-3">
                <a href="/features" className="font-medium text-indigo-600 hover:underline">Documentation &amp; Extension Setup ↗</a>
                <span className="text-muted">Guides on how to install, configure Google Drive OAuth, and use the annotation editor.</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </StaticShell>
  );
}