"use client";

const testimonials = [
  {
    name: "Arya Kusuma",
    role: "QA Lead · Fintech Startup, Jakarta",
    avatar: { bg: "bg-emerald-500", letter: "A" },
    quote:
      "Sebelum BugSnap, developer kita selalu butuh 5-10 pesan bolak-balik cuma buat reproduksi satu bug. Sekarang, 1 link dan semuanya ada — screen recording, Console errors, Network trace, device info. DevTools auto-capture adalah game changer.",
    tag: "DevTools Auto-capture",
  },
  {
    name: "Marcus Chen",
    role: "Frontend Engineer · SaaS Platform",
    avatar: { bg: "bg-blue-500", letter: "M" },
    quote:
      "The cURL copy from Network tab alone saves me 20 minutes per bug report. I get the exact failed request with headers and payload, ready to paste into Postman.",
    tag: "Network HAR",
  },
  {
    name: "Priya Sharma",
    role: "Product Manager · E-commerce",
    avatar: { bg: "bg-violet-500", letter: "P" },
    quote:
      "One-click export to Linear with the full context attached. No more asking QA to re-describe the bug in the ticket. The AI summary even suggests the priority level.",
    tag: "Linear Integration",
  },
  {
    name: "Budi Santoso",
    role: "CTO · Healthcare SaaS, Surabaya",
    avatar: { bg: "bg-rose-500", letter: "B" },
    quote:
      "Data pasien kami sensitif banget. Fakta bahwa rekaman langsung ke Google Drive tim kami — bukan ke server BugSnap — adalah alasan utama kami pilih ini. Tim security kami approve dalam 1 hari.",
    tag: "Zero-Data Architecture",
  },
  {
    name: "Elena Rodriguez",
    role: "QA Engineer · B2B Platform",
    avatar: { bg: "bg-orange-500", letter: "E" },
    quote:
      "Password-protected share links and expiration dates mean I can safely send bug reports to external contractors without worrying about sensitive staging data leaking.",
    tag: "Secure Sharing",
  },
  {
    name: "James Park",
    role: "Backend Dev · Startup",
    avatar: { bg: "bg-teal-500", letter: "J" },
    quote:
      "Got a bug report from QA with the exact stack trace, failed API endpoint, and a cURL command. Fixed the issue in 15 minutes. Didn't need to ask a single follow-up question.",
    tag: "Zero Follow-up Questions",
  },
];

export function TestimonialWall() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {testimonials.map((t) => (
        <div
          key={t.name}
          className="rounded-2xl border border-site-border bg-site-surface p-5 h-full flex flex-col"
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${t.avatar.bg}`}
            >
              {t.avatar.letter}
            </div>
            <div>
              <div className="text-sm font-semibold text-site-text leading-tight">
                {t.name}
              </div>
              <div className="text-xs text-site-text-2 leading-tight">
                {t.role}
              </div>
            </div>
          </div>

          <div className="flex gap-0.5 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg
                key={i}
                className="w-4 h-4 text-amber-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>

          <p className="text-sm text-site-text leading-relaxed italic flex-1">
            &ldquo;{t.quote}&rdquo;
          </p>

          <span className="mt-3 inline-block px-2.5 py-1 rounded-full bg-accent/10 text-accent text-[11px] font-semibold">
            {t.tag}
          </span>
        </div>
      ))}
    </div>
  );
}
