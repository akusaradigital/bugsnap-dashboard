#!/usr/bin/env python3
"""
expand_articles.py - Expands the top 4 articles in blog.ts into comprehensive,
long-form, high-value technical engineering guides (~1,200 to 1,800+ words each)
in both English and Indonesian.
"""

import os
import re

BASE_DIR = r"D:\Akusara\EXTENTION CHROME\bugsnap-dashboard"
BLOG_TS_PATH = os.path.join(BASE_DIR, "src", "content", "blog.ts")

# ─────────────────────────────────────────────────────────────────────────────
# ARTICLE 1: Flaky Frontend Bugs & Causality Timeline
# ─────────────────────────────────────────────────────────────────────────────
ART1_CONTENT_EN = """
<p>"It worked when I tested it locally, but now it fails in staging." Every developer and QA engineer has experienced the maddening frustration of flaky, intermittent front-end bugs. You reproduce the flow five times, and on the sixth attempt, a modal freezes, a button fails to trigger an API call, or a form quietly resets without explanation.</p>

<p>Intermittent bugs are among the most expensive defects in software engineering. According to industry studies, developers spend up to 25% of their working hours reproducing and investigating bug reports that turn out to be labeled as "Cannot Reproduce" or "Works as Designed." The root issue is not that the bug is magical — it is that traditional bug reporting relies on static artifacts that fail to capture <strong>time-synchronized causality</strong>.</p>

<h2>The Fundamental Flaw of Static Bug Reports</h2>
<p>When a tester files a bug report using traditional methods, they typically provide two things: a static screenshot and a short written description. Even when a screen recording is attached, video alone is an incomplete visual medium. A video proves that a button was clicked and that nothing happened, but it cannot explain <em>why</em> the application state refused to transition.</p>

<p>In modern web applications, the visual symptom on screen is almost never the origin of the bug. Instead, it is the downstream consequence of an asynchronous sequence of events that began seconds — or even minutes — earlier in the browser tab lifecycle. If you only look at the exact moment of failure, you are looking at the crime scene after the culprit has already fled.</p>

<h2>The 4 Archetypes of Flaky Front-End Failures</h2>
<p>To eliminate intermittent bugs systematically, engineering teams must recognize the four primary architectural failure modes in client-side applications:</p>

<h3>1. Asynchronous Race Conditions</h3>
<p>When two asynchronous operations execute concurrently without deterministic state locking, the order of their completion dictates the final application state. If a user quickly toggles between filter tabs while an API request is in-flight, a slower previous response may resolve after the newer request, overwriting current data with stale records.</p>

<h3>2. Silent Background Micro-Failures</h3>
<p>Not every failed network request triggers an overt error toast. Often, background pre-flight checks, analytics pings, or secondary validation endpoints fail silently with <code>HTTP 429 Too Many Requests</code> or <code>HTTP 502 Bad Gateway</code>. When these background promises reject without proper catch blocks, state management stores (such as Zustand, Redux, or Vuex) remain locked in <code>isLoading: true</code> or <code>isPending: true</code> forever.</p>

<h3>3. Main-Thread Event Loop Starvation</h3>
<p>JavaScript runs on a single main thread. When heavy DOM reflows, unoptimized chart rendering, or large JSON deserialization block the event loop for longer than 50 milliseconds, user clicks are dropped or queued in unpredictable sequences. If a user clicks during a long task, the browser may fail to trigger event handlers before the DOM element is replaced.</p>

<h3>4. Client-Side Hydration Divergence</h3>
<p>In SSR and SSG frameworks like Next.js, Nuxt, or Remix, the server-rendered HTML must match the client-side virtual DOM during hydration. If a timing mismatch occurs due to cookies, timezones, or local storage flags, event listeners fail to attach to interactive elements, leaving buttons visually intact but functionally dead.</p>

<h2>Anatomy of an Asynchronous Failure: The Phantom Frozen Checkout</h2>
<p>Consider a real-world production bug: a high-traffic e-commerce checkout button intermittently becomes unclickable. Developers spent three weeks trying to reproduce it because following the test script in isolation always succeeded. Here is the true event sequence revealed when all telemetry streams were aligned on a single relative timeline:</p>

<ol>
  <li><strong>T-6.4s:</strong> The customer types a promotional discount code into the input field.</li>
  <li><strong>T-5.2s:</strong> A debounced auto-validation request fires to <code>/api/v1/coupons/validate</code>.</li>
  <li><strong>T-4.8s:</strong> Before the coupon request resolves, the user impatiently clicks "Standard Shipping (Next Day)".</li>
  <li><strong>T-3.9s:</strong> The shipping selection dispatches a tax recalculation query to <code>/api/v1/cart/taxes</code>.</li>
  <li><strong>T-3.2s:</strong> The third-party tax calculation microservice encounters a rate limit and responds with <code>429 Too Many Requests</code>.</li>
  <li><strong>T-2.1s:</strong> The application state store catches the coupon success but leaves <code>cart.isAwaitingTaxCalculations = true</code> because the tax error handler lacked a reset dispatch.</li>
  <li><strong>T-0.0s:</strong> The customer clicks "Place Order". The button's disabled condition evaluates <code>disabled={cart.isAwaitingTaxCalculations}</code>. The button is completely inert, with zero console errors or network calls triggered at the moment of the click.</li>
</ol>

<p>Without relative timestamps linking the <code>429 Rate Limit</code> at T-3.2s to the user click at T-0.0s, developers blamed the checkout button's onClick handler. With time-synchronized causality, the bug was identified and resolved in under ten minutes.</p>

<h2>Defensive Code Pattern: Mitigating Asynchronous Race Conditions</h2>
<p>To prevent these asynchronous deadlocks in React and TypeScript applications, always utilize <code>AbortController</code> to cancel in-flight requests and enforce deterministic state machines:</p>

<pre><code>import { useState, useEffect } from 'react';

type CartState = 'idle' | 'validating' | 'ready' | 'error';

export function useCartCheckout(cartId: string, shippingMethod: string) {
  const [status, setStatus] = useState&lt;CartState&gt;('idle');
  const [errorMessage, setErrorMessage] = useState&lt;string | null&gt;(null);

  useEffect(() =&gt; {
    const controller = new AbortController();
    let isCancelled = false;

    async function recalculateCart() {
      setStatus('validating');
      setErrorMessage(null);

      try {
        const response = await fetch('/api/cart/' + cartId + '/recalculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shippingMethod }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Calculation failed with status ' + response.status);
        }

        const data = await response.json();
        if (!isCancelled) {
          setStatus('ready');
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return; // Gracefully handle superseding clicks
        if (!isCancelled) {
          setStatus('error');
          setErrorMessage(err.message || 'Failed to update taxes');
        }
      }
    }

    recalculateCart();

    return () =&gt; {
      isCancelled = true;
      controller.abort(); // Cancel previous requests if user changes options quickly
    };
  }, [cartId, shippingMethod]);

  return { status, errorMessage, isSubmittingAllowed: status === 'ready' };
}</code></pre>

<h2>How BugSnap Establishes Causality Automatically</h2>
<p><a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> was designed from the ground up to solve the causality problem. Instead of capturing isolated pieces of information, BugSnap binds four critical telemetry streams into a single synchronized interactive canvas:</p>

<ul>
  <li><strong>Visual Frame-by-Frame Video:</strong> High-definition WebM recording of user interactions and visual layout changes.</li>
  <li><strong>Deterministic User Actions:</strong> Microsecond-accurate recording of every click, keystroke, select option, and form submission.</li>
  <li><strong>Comprehensive Network Traffic:</strong> Every fetch, XHR, and WebSocket event, complete with request and response headers, status codes, payload bodies, and duration timings.</li>
  <li><strong>Console Logs & Runtime Telemetry:</strong> Uncaught errors, warnings, stack traces, and Web Vitals metrics synchronized with the exact playback second.</li>
</ul>

<p>When an engineer opens a BugSnap recording, scrubbing the video scrub bar simultaneously scrubs the network waterfall and console timeline. A developer can pause at the exact frame an error occurred and instantly see which background request failed 2.5 seconds earlier.</p>

<h2>Checklist for QA Engineers: Filing Reproducible Bug Reports</h2>
<p>To ensure your bug reports get fixed in the current sprint without endless back-and-forth communication, follow this 5-point verification checklist:</p>

<ol>
  <li><strong>Pinpoint the Preceding Action:</strong> Note the 2-3 actions taken immediately before the bug manifested, not just the final click.</li>
  <li><strong>Include Network Status Codes:</strong> Always record whether background requests returned 200, 304, 401, 429, or 500 status codes.</li>
  <li><strong>Capture Console Warnings:</strong> Non-fatal warnings often contain deprecation notices or unhandled promise rejection warnings that precede fatal crashes.</li>
  <li><strong>Inspect State Reset Logic:</strong> Verify whether navigating away and returning to the page recovers the application state or retains the error condition.</li>
  <li><strong>Use One-Click Telemetry Tools:</strong> Avoid manually copying curl commands and console logs. Use automated tools like BugSnap to generate comprehensive diagnostic reports in a single click.</li>
</ol>
""".strip()

ART1_CONTENT_ID = """
<p>"Tadi pas dicoba di lokal lancar, giliran di staging malah error." Hampir setiap developer dan QA engineer pasti pernah dibuat frustrasi oleh bug yang muncul sesekali (flaky / intermittent). Anda mencoba alurnya lima kali dan semuanya normal, tapi begitu masuk percobaan keenam, tombol tiba-tiba tidak merespons, modal macet, atau form ter-reset tanpa pesan apa pun.</p>

<p>Bug intermiten adalah salah satu jenis cacat software paling mahal dalam rekayasa perangkat lunak modern. Riset industri menunjukkan bahwa developer menghabiskan hingga 25% dari total jam kerja mereka hanya untuk mereproduksi laporan bug yang berujung pada status "Cannot Reproduce" (Tidak Dapat Direproduksi). Masalah mendasarnya bukan karena bug tersebut gaib — melainkan karena metode pelaporan tradisional mengandalkan bukti statis yang kehilangan <strong>hubungan kausalitas waktu (time-synchronized causality)</strong>.</p>

<h2>Kelemahan Mendasar Laporan Bug Statis</h2>
<p>Ketika seorang penguji melaporkan bug dengan cara lama, mereka umumnya hanya melampirkan screenshot statis dan penjelasan tertulis singkat. Bahkan jika ada rekaman video, video semata adalah media visual yang belum lengkap. Video membuktikan bahwa sebuah tombol telah diklik dan tidak ada respons visual, tetapi tidak dapat menjelaskan <em>mengapa</em> state internal aplikasi menolak berpindah.</p>

<p>Pada arsitektur aplikasi web modern, tampilan error di layar hampir tidak pernah menjadi akar masalah sebenarnya. Tampilan tersebut hanyalah akibat hilir dari rangkaian event asinkron yang terjadi beberapa detik — bahkan beberapa menit — sebelumnya di lifecycle tab browser. Jika developer hanya memeriksa saat momen crash terjadi, mereka ibarat memeriksa tempat kejadian perkara setelah pelakunya sudah lama kabur.</p>

<h2>4 Pola Utama Penyebab Bug Flaky Front-End</h2>
<p>Untuk menuntaskan bug intermiten secara sistematis, tim engineer perlu memahami 4 pola kegagalan asinkron pada sisi client:</p>

<h3>1. Kondisi Race Condition Asinkron</h3>
<p>Ketika dua operasi asinkron berjalan bersamaan tanpa mekanisme state locking yang deterministik, urutan penyelesaian response menentukan state akhir aplikasi. Jika pengguna berpindah-pindah tab filter dengan cepat saat request API masih berjalan, response request lama yang lambat bisa tiba belakangan dan menimpa data terbaru dengan data usang.</p>

<h3>2. Kegagalan Background Network yang Senyap</h3>
<p>Tidak semua kegagalan jaringan memunculkan notifikasi merah di layar. Sering kali, validasi background atau request analitik gagal secara senyap dengan status <code>HTTP 429 Too Many Requests</code> atau <code>HTTP 502 Bad Gateway</code>. Jika promise background ini di-reject tanpa blok catch yang memadai, state management (seperti Zustand, Redux, atau Vuex) akan terkunci pada status <code>isLoading: true</code> selamanya.</p>

<h3>3. Pemblokiran Event Loop pada Main Thread</h3>
<p>JavaScript berjalan pada single thread. Ketika kalkulasi berat atau render grafik menahan thread utama lebih dari 50 milidetik (long task), input klik pengguna bisa terlewat atau dieksekusi dengan urutan yang salah. Jika pengguna mengeklik tombol saat browser sedang membeku, event listener bisa gagal dipicu sebelum elemen DOM digantikan.</p>

<h3>4. Ketidaksesuaian Hidrasi (Hydration Mismatch)</h3>
<p>Pada framework SSR/SSG seperti Next.js, Nuxt, atau Remix, HTML yang digenerate oleh server harus persis cocok dengan Virtual DOM client saat proses hidrasi. Jika terjadi selisih timing akibat pembacaan cookies atau local storage, event listener tidak terpasang sempurna pada elemen interaktif, sehingga tombol tampak aktif tetapi sama sekali tidak berfungsi saat diklik.</p>

<h2>Bedah Kasus Nyata: Tombol Checkout yang Tiba-Tiba Macet</h2>
<p>Mari kita pelajari kasus bug nyata di aplikasi e-commerce: tombol "Bayar Sekarang" sesekali tidak bisa diklik. Tim developer sempat menghabiskan waktu berminggu-minggu karena mencoba reproduksi secara terisolasi selalu berhasil. Inilah urutan kejadian sebenarnya saat seluruh log disinkronkan dalam satu sumbu waktu:</p>

<ol>
  <li><strong>T-6.4s:</strong> Pembeli mengetikkan kode promo voucher di form diskon.</li>
  <li><strong>T-5.2s:</strong> Request validasi debounced otomatis terkirim ke <code>/api/v1/coupons/validate</code>.</li>
  <li><strong>T-4.8s:</strong> Sebelum respons voucher selesai, pembeli langsung memilih opsi "Pengiriman Kilat (Next Day)".</li>
  <li><strong>T-3.9s:</strong> Pemilihan kurir memicu request hitung ulang ongkir dan pajak ke <code>/api/v1/cart/taxes</code>.</li>
  <li><strong>T-3.2s:</strong> Layanan pihak ketiga kalkulasi ongkir terkena rate limit dan merespons dengan <code>429 Too Many Requests</code>.</li>
  <li><strong>T-2.1s:</strong> State store aplikasi menerima sukses voucher, namun membiarkan status <code>cart.isAwaitingTaxCalculations = true</code> karena handler error ongkir lupa mereset flag loading.</li>
  <li><strong>T-0.0s:</strong> Pembeli mengeklik tombol "Bayar Sekarang". Kondisi tombol membaca <code>disabled={cart.isAwaitingTaxCalculations}</code>. Tombol mati total tanpa memicu error console atau network request apa pun pada detik tersebut.</li>
</ol>

<p>Jika tester hanya melampirkan screenshot tombol mati, developer mengira handler onClick tombol yang rusak. Dengan kronologi kausalitas yang tersinkronisasi, kaitan antara error <code>429 Rate Limit</code> pada T-3.2s dan klik pembeli di T-0.0s langsung terungkap dalam hitungan menit.</p>

<h2>Pola Kode Defensif: Mengatasi Race Condition di React/TypeScript</h2>
<p>Untuk mencegah terjadinya kebuntuan asinkron pada aplikasi React dan TypeScript, biasakan menggunakan <code>AbortController</code> guna membatalkan request lama yang tersusul dan menerapkan state machine yang deterministik:</p>

<pre><code>import { useState, useEffect } from 'react';

type CartState = 'idle' | 'validating' | 'ready' | 'error';

export function useCartCheckout(cartId: string, shippingMethod: string) {
  const [status, setStatus] = useState&lt;CartState&gt;('idle');
  const [errorMessage, setErrorMessage] = useState&lt;string | null&gt;(null);

  useEffect(() =&gt; {
    const controller = new AbortController();
    let isCancelled = false;

    async function recalculateCart() {
      setStatus('validating');
      setErrorMessage(null);

      try {
        const response = await fetch('/api/cart/' + cartId + '/recalculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shippingMethod }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Kalkulasi gagal dengan status ' + response.status);
        }

        const data = await response.json();
        if (!isCancelled) {
          setStatus('ready');
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return; // Abaikan request yang dibatalkan
        if (!isCancelled) {
          setStatus('error');
          setErrorMessage(err.message || 'Gagal memperbarui ongkir');
        }
      }
    }

    recalculateCart();

    return () =&gt; {
      isCancelled = true;
      controller.abort(); // Batalkan request sebelumnya jika opsi diganti cepat
    };
  }, [cartId, shippingMethod]);

  return { status, errorMessage, isSubmittingAllowed: status === 'ready' };
}</code></pre>

<h2>Bagaimana BugSnap Membangun Kausalitas Secara Otomatis</h2>
<p><a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> dirancang khusus untuk memecahkan teka-teki kausalitas ini. Alih-alih mencatat data secara terpisah, BugSnap memadukan empat aliran telemetri langsung ke dalam satu canvas interaktif yang sinkron:</p>

<ul>
  <li><strong>Rekaman Video Visual:</strong> Video WebM beresolusi tinggi yang merekam pergerakan kursor dan perubahan visual antarmuka.</li>
  <li><strong>Jejak Interaksi Pengguna (User Breadcrumbs):</strong> Pencatatan presisi setiap klik, pengetikan, perubahan dropdown, dan navigasi halaman.</li>
  <li><strong>Telemetri Jaringan Komprehensif:</strong> Setiap request fetch, XHR, dan WebSocket lengkap dengan header request/respons, status kode, payload body, dan durasi latensi.</li>
  <li><strong>Log Console & Metrik Web Vitals:</strong> Error JavaScript, warning sistem, stack trace sourcemap, dan metrik INP/LCP yang tersinkronisasi persis dengan detik pemutaran video.</li>
</ul>

<p>Ketika developer membuka link rekaman BugSnap, menggeser scrubber video akan otomatis menggeser timeline jaringan dan konsol secara real-time. Developer dapat menjeda video tepat saat UI membeku dan langsung melihat request background mana yang gagal 2 detik sebelumnya.</p>

<h2>Panduan Praktis QA: Membuat Laporan Bug yang Siap Dieksekusi</h2>
<p>Agar laporan bug Anda langsung diperbaiki di sprint yang sama tanpa proses tanya-jawab yang berbelit, terapkan 5 langkah praktis ini:</p>

<ol>
  <li><strong>Sertakan Aksi Pendahulu:</strong> Catat 2-3 aksi yang dilakukan sesaat sebelum tombol bermasalah ditekan, bukan cuma aksi terakhir.</li>
  <li><strong>Periksa Status Kode Jaringan:</strong> Pastikan apakah ada request background yang mengembalikan status 401, 429, atau 500 sebelum error terjadi.</li>
  <li><strong>Amati Peringatan Console:</strong> Warning di console sering kali memuat petunjuk rejection promise yang mengawali crash aplikasi.</li>
  <li><strong>Uji Pemulihan State:</strong> Cek apakah berpindah halaman dan kembali lagi dapat memulihkan aplikasi atau justru membuat bug menetap.</li>
  <li><strong>Gunakan Alat Telemetri 1-Klik:</strong> Hindari mencatat curl command dan log console secara manual. Gunakan ekstensi seperti BugSnap untuk menghasilkan laporan diagnostik lengkap dalam satu kali klik.</li>
</ol>
""".strip()


# ─────────────────────────────────────────────────────────────────────────────
# ARTICLE 2: Zero Storage Liability: Why BYO Google Drive Wins for Enterprise QA
# ─────────────────────────────────────────────────────────────────────────────
ART2_CONTENT_EN = """
<p>When technology companies adopt visual bug reporting and screen recording tools, product and QA teams celebrate the immense time savings. But in modern enterprise environments, the moment security officers and compliance directors review the software architecture, they invariably ask one critical question: <em>"Where are the screen recordings and customer screenshots physically stored?"</em></p>

<p>In almost every traditional SaaS bug reporting platform, the answer is alarming: every video capture, staging dashboard walkthrough, and production bug recording is uploaded to a shared, multi-tenant AWS S3 bucket managed by the vendor. For organizations operating under stringent regulatory frameworks, this centralized storage model represents an unacceptable compliance hazard, security vulnerability, and data liability.</p>

<h2>The Hidden Security Liabilities of Multi-Tenant Video Storage</h2>
<p>Unlike simple error logs, screen recordings are rich visual recordings of actual software execution. During routine QA and user testing, recordings routinely capture sensitive data without testers even realizing it:</p>

<ul>
  <li><strong>Personally Identifiable Information (PII):</strong> Customer names, email addresses, phone numbers, home addresses, and identity documents displayed in internal back-office tooling.</li>
  <li><strong>Financial and Payment Credentials:</strong> Credit card masks, bank account IBANs, and transaction histories captured during billing checkout testing.</li>
  <li><strong>Unmasked Authentication Tokens:</strong> Bearer tokens, temporary session cookies, and internal staging credentials exposed in query parameters or request debug headers.</li>
  <li><strong>Proprietary Intellectual Property:</strong> Pre-release product UI designs, confidential business logic, and unannounced software features.</li>
</ul>

<p>When these recordings reside in a third-party startup's cloud storage, your company's security posture is entirely dependent on that vendor's access controls, employee vetting, and infrastructure isolation. If that vendor suffers a credential breach, your organization's confidential data is exposed to the world.</p>

<h2>The Global Regulatory Mandate: GDPR, HIPAA, and Statutory Compliance</h2>
<p>The regulatory stakes have never been higher. Modern privacy frameworks impose strict penalties on unauthorized cross-border transfers and unvetted third-party storage:</p>

<ul>
  <li><strong>GDPR (Europe):</strong> Requires explicit data processing agreements (DPAs), strict data minimization, and the guaranteed "Right to be Forgotten" (Article 17). If a user requests deletion, searching through hundreds of vendor video archives is practically impossible.</li>
  <li><strong>HIPAA (United States):</strong> Mandates Business Associate Agreements (BAAs) and comprehensive audit trails for any system storing Protected Health Information (PHI). Most bug capture tools explicitly refuse to sign BAAs.</li>
  <li><strong>Law No. 27/2022 on Personal Data Protection (UU PDP - Indonesia):</strong> Mandates that data controllers maintain absolute governance over personal data processing and face severe administrative and criminal sanctions for unauthorized data leaks or secondary disclosures.</li>
</ul>

<h2>The BugSnap Architecture: Bring-Your-Own-Storage (BYOS)</h2>
<p><a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> pioneered a fundamentally safer paradigm: <strong>Bring Your Own Storage (BYOS)</strong>. Instead of functioning as a centralized repository for user video files, BugSnap operates with a strict <em>Zero Server Storage</em> architecture.</p>

<p>Here is how the direct-to-Drive streaming architecture works under the hood:</p>

<ol>
  <li><strong>Scoped Client-Side Authentication:</strong> When a tester signs in to BugSnap, the browser requests Google OAuth 2.0 authorization with the minimal <code>https://www.googleapis.com/auth/drive.file</code> scope. This strict permission grants BugSnap access <em>only</em> to the files it creates — never to existing company spreadsheets, documents, or team drives.</li>
  <li><strong>Direct Browser-to-Cloud Uploads:</strong> When recording completes, the Chrome extension encodes the video stream into high-efficiency WebM format directly in memory. The media is uploaded straight from the browser to the user's designated Google Drive storage folder via Google's official resumable upload API.</li>
  <li><strong>Zero Byte Server Transit:</strong> Raw video chunks never travel through, touch, or get buffered on BugSnap's backend servers. BugSnap stores only lightweight relational metadata (capture title, timestamp, and the Google Drive file identifier) in a secure Supabase database.</li>
  <li><strong>Authenticated Streaming Playback:</strong> When an engineer opens the bug report link, the BugSnap viewer requests an ephemeral signed streaming URL directly from Google Drive. Access is governed exclusively by your organization's Google Workspace permission policies.</li>
</ol>

<h2>Total Cost of Ownership (TCO) Breakdown: Traditional SaaS vs. BYOS</h2>
<p>Beyond privacy and regulatory compliance, the financial advantages of Bring-Your-Own-Storage are staggering. Traditional visual bug reporting SaaS platforms monetize cloud storage aggressively:</p>

<table style="width:100%; border-collapse: collapse; margin: 1.5rem 0; font-size: 0.875rem;">
  <thead>
    <tr style="border-bottom: 2px solid #334155; text-align: left;">
      <th style="padding: 0.75rem;">Comparison Criteria</th>
      <th style="padding: 0.75rem;">Traditional SaaS Capture</th>
      <th style="padding: 0.75rem;">BugSnap (BYO Google Drive)</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid #1e293b;">
      <td style="padding: 0.75rem; font-weight: bold;">Storage Markup</td>
      <td style="padding: 0.75rem;">$0.15 to $0.30 per GB / month</td>
      <td style="padding: 0.75rem; color: #89BD49; font-weight: bold;">$0.00 (Utilizes existing Google Drive)</td>
    </tr>
    <tr style="border-bottom: 1px solid #1e293b;">
      <td style="padding: 0.75rem; font-weight: bold;">Data Sovereignty</td>
      <td style="padding: 0.75rem;">Vendor holds data in multi-tenant S3</td>
      <td style="padding: 0.75rem; color: #89BD49; font-weight: bold;">100% Owned by Your Company</td>
    </tr>
    <tr style="border-bottom: 1px solid #1e293b;">
      <td style="padding: 0.75rem; font-weight: bold;">Offboarding Risk</td>
      <td style="padding: 0.75rem;">High (Exporting terabytes of video is difficult)</td>
      <td style="padding: 0.75rem; color: #89BD49; font-weight: bold;">Zero (Files stay safely inside your Google Drive)</td>
    </tr>
    <tr style="border-bottom: 1px solid #1e293b;">
      <td style="padding: 0.75rem; font-weight: bold;">Compliance Audit</td>
      <td style="padding: 0.75rem;">Requires third-party vendor audit verification</td>
      <td style="padding: 0.75rem; color: #89BD49; font-weight: bold;">Inherits Google Workspace SOC 2 / ISO compliance</td>
    </tr>
  </tbody>
</table>

<p>Most engineering teams already pay for Google Workspace Business or Enterprise licenses with pooled cloud storage. Paying a secondary SaaS vendor a 10x price premium for proprietary video storage is an unnecessary duplicate expense.</p>

<h2>Enterprise Governance, Audit Logging, and Instant Offboarding</h2>
<p>Because BugSnap stores media directly in your corporate Google Drive, your IT and Security teams immediately benefit from native Google Workspace enterprise governance tools:</p>

<ul>
  <li><strong>Google Vault eDiscovery:</strong> Historical bug videos are automatically subject to legal holds, retention rules, and compliance discovery searches alongside corporate emails and docs.</li>
  <li><strong>Automated DLP (Data Loss Prevention):</strong> Enterprise Google Drive DLP rules automatically scan uploaded captures for exposed credit card numbers, social security IDs, or secret keys and enforce automated masking.</li>
  <li><strong>Instant 1-Click Offboarding:</strong> When a QA contractor's agreement ends or an employee leaves the company, revoking their Google Workspace account instantly removes their access to all historical bug media. No manual scrubbing of external SaaS accounts required.</li>
</ul>

<h2>Conclusion</h2>
<p>Modern software engineering requires rapid bug reporting, but speed must never come at the expense of customer trust and data compliance. By decoupling the diagnostic interface from media storage, BugSnap gives development teams the lightning-fast debugging tools they love while ensuring compliance officers sleep soundly at night.</p>
""".strip()

ART2_CONTENT_ID = """
<p>Ketika perusahaan software mengadopsi alat perekam layar dan pelaporan bug visual, tim produk dan QA tentu menyambut gembira efisiensi waktu yang didapat. Namun pada skala enterprise, saat tim legal dan compliance security meninjau arsitektur sistem, pertanyaan pertama yang selalu muncul adalah: <em>"Di mana rekaman layar dan tangkapan data aplikasi disimpan secara fisik?"</em></p>

<p>Pada hampir semua platform SaaS pelaporan bug konvensional, jawabannya cukup mengkhawatirkan: seluruh rekaman video, pengujian dashboard staging, dan bug internal diunggah ke bucket AWS S3 multi-tenant milik vendor pihak ketiga. Bagi perusahaan yang beroperasi di bawah regulasi ketat, model penyimpanan terpusat semacam ini menghadirkan risiko kebocoran data, ketidakpatuhan hukum, dan liabilitas yang sangat tinggi.</p>

<h2>Bahaya Tersembunyi Penyimpanan Video SaaS Multi-Tenant</h2>
<p>Berbeda dari file log teks biasa, rekaman layar adalah rekaman visual yang sangat kaya informasi. Selama proses pengujian QA, video dan screenshot sering kali tanpa sengaja merekam informasi sensitif perusahaan:</p>

<ul>
  <li><strong>Data Pribadi Konsumen (PII):</strong> Nama lengkap pelanggan, alamat email, nomor telepon, dan identitas KTP/paspor yang terpampang pada dashboard back-office internal.</li>
  <li><strong>Kredensial Transaksi Keuangan:</strong> Masking kartu kredit, nomor rekening bank, dan riwayat mutasi pembayaran saat menguji alur checkout billing.</li>
  <li><strong>Token Autentikasi yang Bocor:</strong> Bearer token, session cookie sementara, dan API key staging internal yang terlihat di parameter URL atau header debug.</li>
  <li><strong>Kekayaan Intelektual Rahasia:</strong> Desain UI produk yang belum dirilis, logika bisnis proprietary, dan fitur rahasia perusahaan.</li>
</ul>

<p>Ketika seluruh media ini tersimpan di server cloud milik startup pihak ketiga, keamanan data perusahaan Anda sepenuhnya bergantung pada integritas vendor tersebut. Jika vendor tersebut mengalami peretasan, data rahasia perusahaan Anda otomatis ikut terekspos ke publik.</p>

<h2>Tuntutan Regulasi Kepatuhan Hukum: UU PDP, GDPR, dan Perlindungan Konsumen</h2>
<p>Konsekuensi hukum atas kebocoran data kini semakin tegas di berbagai yurisdiksi internasional maupun domestik:</p>

<ul>
  <li><strong>UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP):</strong> Mengatur bahwa pengendali data wajib menjamin kerahasiaan data pribadi dan bertanggung jawab penuh secara perdata maupun pidana jika terjadi kegagalan pelindungan data akibat penyimpanan di pihak ketiga tanpa tata kelola yang sah.</li>
  <li><strong>GDPR (Eropa):</strong> Mewajibkan Data Processing Agreement (DPA) yang ketat dan menjamin hak penghapusan data ("Right to be Forgotten" Pasal 17). Sangat sulit melacak dan menghapus video yang tercecer di server vendor pihak ketiga.</li>
  <li><strong>Standar Industri Perbankan & Kesehatan (PCI-DSS / HIPAA):</strong> Melarang keras pengunggahan rekaman data transaksi dan medis ke sistem cloud publik yang tidak bersertifikasi resmi.</li>
</ul>

<h2>Arsitektur BugSnap: Bring-Your-Own-Storage (BYOS)</h2>
<p><a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> memelopori pendekatan baru yang jauh lebih aman: <strong>Bring Your Own Storage (BYOS)</strong>. Alih-alih menjadi gudang penyimpan video pengguna, BugSnap beroperasi dengan prinsip mutlak <em>Zero Server Storage</em>.</p>

<p>Berikut cara kerja arsitektur streaming langsung ke Google Drive di balik layar:</p>

<ol>
  <li><strong>Otentikasi Izin Minimal:</strong> Saat tester login ke BugSnap, ekstensi meminta izin Google OAuth 2.0 dengan scope paling aman, yaitu <code>https://www.googleapis.com/auth/drive.file</code>. Izin ini hanya membolehkan BugSnap mengakses file yang dibuatnya sendiri — sama sekali tidak bisa membaca dokumen, spreadsheet, atau folder lain di Google Drive perusahaan Anda.</li>
  <li><strong>Unggah Langsung Browser-ke-Drive:</strong> Setelah perekaman selesai, ekstensi Chrome mengompresi video menjadi WebM langsung di memori browser. File tersebut langsung diunggah dari browser ke folder Google Drive milik pengguna melalui API resmi Google.</li>
  <li><strong>Nol Byte Melintasi Server:</strong> Data video mentah tidak pernah singgah, diproses, atau disimpan di server backend BugSnap. Backend BugSnap hanya mencatat metadata relasional ringan (judul capture, waktu, dan ID file Google Drive) di database Supabase yang terenkripsi.</li>
  <li><strong>Pemutaran Terotentikasi:</strong> Ketika developer membuka link laporan bug, pemutar video BugSnap meminta URL streaming sementara langsung dari Google Drive. Izin akses video sepenuhnya diatur oleh kebijakan hak akses Google Workspace perusahaan Anda.</li>
</ol>

<h2>Perbandingan Total Biaya (TCO): SaaS Tradisional vs. BYO Google Drive</h2>
<p>Selain faktor keamanan dan kepatuhan hukum, penghematan biaya model Bring-Your-Own-Storage sangat signifikan bagi keuangan perusahaan:</p>

<table style="width:100%; border-collapse: collapse; margin: 1.5rem 0; font-size: 0.875rem;">
  <thead>
    <tr style="border-bottom: 2px solid #334155; text-align: left;">
      <th style="padding: 0.75rem;">Kriteria Komparasi</th>
      <th style="padding: 0.75rem;">Alat SaaS Tradisional</th>
      <th style="padding: 0.75rem;">BugSnap (Google Drive Pribadi)</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid #1e293b;">
      <td style="padding: 0.75rem; font-weight: bold;">Biaya Penyimpanan</td>
      <td style="padding: 0.75rem;">Biaya tambahan $0.15 - $0.30 per GB/bulan</td>
      <td style="padding: 0.75rem; color: #89BD49; font-weight: bold;">Rp 0 (Memakai kuota Google Drive tim)</td>
    </tr>
    <tr style="border-bottom: 1px solid #1e293b;">
      <td style="padding: 0.75rem; font-weight: bold;">Kedaulatan Data</td>
      <td style="padding: 0.75rem;">Tersimpan di S3 milik vendor</td>
      <td style="padding: 0.75rem; color: #89BD49; font-weight: bold;">100% Milik Perusahaan Sendiri</td>
    </tr>
    <tr style="border-bottom: 1px solid #1e293b;">
      <td style="padding: 0.75rem; font-weight: bold;">Risiko Lock-in Vendor</td>
      <td style="padding: 0.75rem;">Tinggi (Sulit mengekspor puluhan GB video)</td>
      <td style="padding: 0.75rem; color: #89BD49; font-weight: bold;">Nol (File sudah ada di Drive kantor)</td>
    </tr>
    <tr style="border-bottom: 1px solid #1e293b;">
      <td style="padding: 0.75rem; font-weight: bold;">Kepatuhan Audit</td>
      <td style="padding: 0.75rem;">Harus mengaudit keamanan vendor ketiga</td>
      <td style="padding: 0.75rem; color: #89BD49; font-weight: bold;">Mewarisi standar ISO/SOC 2 Google Workspace</td>
    </tr>
  </tbody>
</table>

<p>Sebagian besar organisasi engineering sudah berlangganan Google Workspace dengan kuota penyimpanan besar. Membayar biaya langganan storage tambahan kepada vendor SaaS pihak ketiga adalah pemborosan anggaran IT yang tidak perlu.</p>

<h2>Tata Kelola Enterprise, Audit Trail, dan Kemudahan Offboarding</h2>
<p>Karena seluruh rekaman tersimpan langsung di Google Drive perusahaan, tim IT dan Sekuriti Anda dapat langsung memanfaatkan fitur enterprise Google Workspace:</p>

<ul>
  <li><strong>Google Vault eDiscovery:</strong> Arsip video bug otomatis tunduk pada aturan retensi hukum dan kepatuhan audit perusahaan, sejajar dengan dokumen internal lainnya.</li>
  <li><strong>DLP (Data Loss Prevention) Terpusat:</strong> Sistem proteksi Google Drive dapat secara otomatis memindai dan menyamarkan data sensitif seperti nomor rekening atau data pribadi di dalam file yang diunggah.</li>
  <li><strong>Pencabutan Akses 1 Klik:</strong> Ketika masa kontrak tester lepas selesai atau ada karyawan yang resign, mencabut akun Google Workspace mereka secara otomatis mencabut seluruh akses mereka ke rekaman bug historis tanpa perlu menyisir akun SaaS luar.</li>
</ul>

<h2>Kesimpulan</h2>
<p>Pengembangan software modern menuntut kecepatan pelaporan bug, namun kecepatan tidak boleh mengorbankan privasi dan kepatuhan hukum konsumen. Dengan memisahkan antarmuka diagnostik dari penyimpanan fisik file media, BugSnap memberikan kecepatan kerja maksimal bagi tim penguji sekaligus menjamin ketenangan pikiran bagi tim legal dan keamanan data.</p>
""".strip()


# ─────────────────────────────────────────────────────────────────────────────
# ARTICLE 3: From Bug Recording to Automated Playwright Test
# ─────────────────────────────────────────────────────────────────────────────
ART3_CONTENT_EN = """
<p>In high-velocity software engineering teams, one of the most persistent bottlenecks is the friction between manual QA bug reporting and automated regression test creation. A QA engineer discovers an intermittent layout break during checkout, records a screen recording, and files a detailed ticket. Then, the baton passes to an automation engineer or software developer, who must spend an hour or more painstakingly reverse-engineering the exact sequence of clicks, inputs, and DOM locators to craft a reproduction script in Playwright or Cypress.</p>

<p>This manual translation process is where valuable engineering velocity evaporates. Worse yet, because writing automated tests for every one-off bug is tedious, many teams simply fix the immediate bug and move on — leaving their continuous integration (CI) pipeline completely unguarded against future regressions of the exact same defect.</p>

<h2>Why Video Recordings Alone Cannot Automate QA</h2>
<p>Screen recordings are phenomenal for human communication. A ten-second video immediately shows a developer that a modal failed to open. But an automated testing framework like Playwright is not a human watching a screen: it requires <strong>deterministic locators, semantic accessibility roles, precise network timing mocks, and unambiguous assertion states</strong>.</p>

<p>When an engineer tries to turn a video into a Playwright test, they face several hurdles:</p>
<ul>
  <li><strong>Selector Guesswork:</strong> Was the clicked element <code>button#checkout-btn</code>, <code>button[data-testid="primary-action"]</code>, or an unstyled child <code>svg</code> icon inside a wrapper?</li>
  <li><strong>Timing & Asynchrony:</strong> Did the button require a prior network response to settle, or was it disabled by an in-flight debounce handler?</li>
  <li><strong>Environmental State:</strong> What localStorage tokens, cookies, or feature flags were active in the browser tab when the bug manifested?</li>
</ul>

<h2>Action Telemetry: The Bridge from Pixels to Code</h2>
<p>The solution lies in capturing structured <strong>user action telemetry</strong> alongside the visual recording. Instead of treating user interactions as mere video frames, modern capture tooling intercepts the browser's DOM event stream to record every interaction as a structured data object containing the target element, its computed accessible role, inner text, and contextual ancestors.</p>

<p>When this event stream is combined with captured network requests and console errors, transforming a manual QA bug report into a deterministic test script becomes an automated code generation task.</p>

<h2>Synthesizing Resilient Playwright Locators</h2>
<p>Brittle automated tests fail because developers hardcode fragile CSS selectors like <code>div &gt; div:nth-child(3) &gt; button.btn-blue</code>. When the UI changes slightly, the test suite shatters. Resilient Playwright tests prioritize semantic, accessibility-first locators recommended by the Playwright core team:</p>

<ol>
  <li><strong>Role-Based Locators:</strong> <code>page.getByRole('button', { name: 'Submit Order' })</code></li>
  <li><strong>Label and Text Locators:</strong> <code>page.getByLabel('Shipping Address')</code></li>
  <li><strong>Explicit Test IDs:</strong> <code>page.getByTestId('promo-code-input')</code></li>
  <li><strong>Filtered Context Locators:</strong> <code>page.locator('.modal-dialog').getByRole('button', { name: 'Confirm' })</code></li>
</ol>

<h2>Production-Ready Playwright Reproduction Script</h2>
<p>Here is an example of a production-ready Playwright reproduction script generated directly from a recorded bug session, complete with network interception, simulated user actions, and error state verification:</p>

<pre><code>import { test, expect } from '@playwright/test';

test.describe('Checkout Flow Regression Suite', () =&gt; {
  test('should reproduce coupon calculation failure on rate-limited network', async ({ page }) =&gt; {
    // 1. Setup network mock to simulate the background 429 encountered in the bug report
    await page.route('**/api/v1/coupons/validate', async (route) =&gt; {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Too Many Requests', retryAfter: 30 }),
      });
    });

    // 2. Navigate to checkout page
    await page.goto('https://staging.example.com/checkout');

    // 3. Replay exact recorded user actions using accessible locators
    const couponInput = page.getByPlaceholder('Enter discount code');
    await couponInput.fill('SAVE50');

    const applyButton = page.getByRole('button', { name: 'Apply Code' });
    await applyButton.click();

    // 4. Assert error toast visibility and state handling
    const errorToast = page.getByRole('alert');
    await expect(errorToast).toBeVisible({ timeout: 5000 });
    await expect(errorToast).toContainText('Too Many Requests');

    // 5. Verify the main checkout button does not remain permanently disabled
    const checkoutButton = page.getByRole('button', { name: 'Place Order' });
    await expect(checkoutButton).toBeEnabled();
  });
});</code></pre>

<h2>Bridging into AI Coding Agents via Model Context Protocol (MCP)</h2>
<p>With the rapid adoption of AI coding assistants like Claude Code, Cursor, and autonomous agent loops, structured bug telemetry is more valuable than ever. When bug reports are exposed via standard interfaces like the <strong>Model Context Protocol (MCP)</strong>, developers can simply prompt their AI agent:</p>

<blockquote>
  <em>"Read the latest BugSnap capture #892 via MCP, inspect the failed network headers and Playwright reproduction script, find the buggy React state transition in CheckoutForm.tsx, and write a PR that fixes the issue and makes the test pass."</em>
</blockquote>

<p>Because the AI agent receives verified Playwright test code and network telemetry rather than ambiguous prose, it can run the test locally, verify that it fails, apply the code fix, and confirm the test passes before submitting a pull request.</p>

<h2>Building a Continuous Regression Shield</h2>
<p>By automating the transition from visual bug capture to Playwright code, engineering teams unlock three transformative capabilities:</p>

<ul>
  <li><strong>Instant Bug Triage:</strong> Developers can execute the generated test script in their terminal with <code>npx playwright test</code> in seconds, eliminating 100% of manual reproduction setup.</li>
  <li><strong>Automated PR Verification:</strong> Pull requests addressing the bug must include the newly generated test script, guaranteeing that the defect can never silently regress in future releases.</li>
  <li><strong>Shared Ownership Between QA and Dev:</strong> QA engineers contribute directly to automated testing velocity without having to write boilerplate test suites from scratch.</li>
</ul>

<h2>Conclusion</h2>
<p>Visual bug reporting without code automation solves only half of the QA challenge. By capturing action telemetry and synthesizing resilient Playwright test scripts, teams close the loop between bug discovery, developer diagnosis, and permanent regression protection.</p>
""".strip()

ART3_CONTENT_ID = """
<p>Dalam alur kerja tim engineering modern yang bergerak cepat, salah satu titik hambatan terbesar adalah jurang pemisah antara pengujian manual QA dan pembuatan skrip tes regresi otomatis. Tim QA menemukan bug tampilan yang macet saat checkout, merekam video masalah tersebut, lalu membuat tiket pelaporan. Setelah itu, tugas beralih ke automation engineer atau developer yang harus menghabiskan waktu berjam-jam mencoba merekonstruksi urutan klik, nama form, dan selektor DOM dari nol agar bisa dituangkan ke dalam skrip Playwright atau Cypress.</p>

<p>Proses translasi manual ini menguras jam kerja produktif yang sangat besar. Lebih buruknya lagi, karena menulis tes otomatis untuk setiap satu bug membutuhkan waktu lama, banyak tim akhirnya memilih langsung memperbaiki kode tanpa membuat tes regresi — membiarkan pipeline Continuous Integration (CI) rentan mengalami kebocoran bug yang sama di masa mendatang.</p>

<h2>Mengapa Rekaman Video Saja Belum Cukup untuk Otomasi</h2>
<p>Rekaman video sangat efektif untuk komunikasi antar-manusia. Video berdurasi 10 detik langsung membuktikan kepada developer bahwa sebuah tombol gagal membuka modal. Namun framework otomatisasi pengujian seperti Playwright bukanlah manusia yang menonton layar: Playwright membutuhkan <strong>selektor deterministik, role aksesibilitas semantik, mock timing jaringan yang presisi, dan kriteria asersi yang jelas</strong>.</p>

<p>Saat seorang engineer mencoba mengubah rekaman video menjadi skrip Playwright, mereka menghadapi berbagai teka-teki teknis:</p>
<ul>
  <li><strong>Menebak Selektor DOM:</strong> Apakah elemen yang diklik adalah <code>button#checkout-btn</code>, <code>button[data-testid="primary-action"]</code>, ataukah elemen <code>svg</code> kecil di dalam container pembungkus?</li>
  <li><strong>Ketergantungan Timing & Asinkron:</strong> Apakah tombol tersebut membutuhkan respons API tertentu sebelum aktif, ataukah tertunda oleh fungsi debounce internal?</li>
  <li><strong>State Lingkungan:</strong> Kredensial, cookies, atau flag fitur apa yang sedang aktif di tab browser tester saat bug terjadi?</li>
</ul>

<h2>Telemetri Aksi: Jembatan dari Piksel Menuju Baris Kode</h2>
<p>Solusi mutakhir untuk menjembatani jurang ini adalah perekaman <strong>telemetri aksi pengguna (action telemetry)</strong> secara terstruktur bersamaan dengan rekaman video. Alih-alih hanya menganggap interaksi sebagai pergerakan kursor di layar, sistem perekam modern mencegat event stream DOM browser untuk mencatat setiap interaksi sebagai objek data terstruktur yang memuat elemen target, role aksesibilitas, teks label, dan konteks hierarki elemen.</p>

<p>Ketika data aksi pengguna ini dipadukan dengan rekaman request jaringan dan error konsol, pengubahan rekaman bug manual menjadi skrip tes otomatis Playwright dapat dilakukan secara instan.</p>

<h2>Menghasilkan Selektor Playwright yang Tangguh (Resilient Locators)</h2>
<p>Skrip tes otomatis yang rapuh biasanya terjadi karena developer menggunakan selektor CSS yang kaku seperti <code>div &gt; div:nth-child(3) &gt; button.btn-blue</code>. Begitu struktur styling berubah sedikit saja, seluruh test suite langsung gagal. Praktik terbaik Playwright merekomendasikan penggunaan selektor berbasis semantik dan aksesibilitas:</p>

<ol>
  <li><strong>Selektor Berbasis Role:</strong> <code>page.getByRole('button', { name: 'Bayar Sekarang' })</code></li>
  <li><strong>Selektor Label Form:</strong> <code>page.getByLabel('Alamat Pengiriman')</code></li>
  <li><strong>Test ID Eksplisit:</strong> <code>page.getByTestId('promo-code-input')</code></li>
  <li><strong>Selektor Konteks Terfokus:</strong> <code>page.locator('.modal-dialog').getByRole('button', { name: 'Konfirmasi' })</code></li>
</ol>

<h2>Contoh Nyata Skrip Pengujian Playwright Siap Pakai</h2>
<p>Berikut adalah contoh skrip Playwright yang dihasilkan dari sesi rekaman bug, lengkap dengan simulasi mock jaringan, pengulangan langkah pengguna, dan asersi status error:</p>

<pre><code>import { test, expect } from '@playwright/test';

test.describe('Suite Regresi Alur Checkout', () =&gt; {
  test('harus memvalidasi penanganan error saat voucher terkena rate limit', async ({ page }) =&gt; {
    // 1. Pasang mock jaringan untuk mereplikasi respons 429 yang terjadi pada rekaman bug
    await page.route('**/api/v1/coupons/validate', async (route) =&gt; {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Too Many Requests', retryAfter: 30 }),
      });
    });

    // 2. Buka halaman checkout staging
    await page.goto('https://staging.example.com/checkout');

    // 3. Jalankan kembali aksi pengguna persis seperti yang terekam
    const couponInput = page.getByPlaceholder('Masukkan kode promo');
    await couponInput.fill('HEMAT50');

    const applyButton = page.getByRole('button', { name: 'Pakai Promo' });
    await applyButton.click();

    // 4. Pastikan notifikasi error muncul dengan tepat di layar
    const errorToast = page.getByRole('alert');
    await expect(errorToast).toBeVisible({ timeout: 5000 });
    await expect(errorToast).toContainText('Too Many Requests');

    // 5. Pastikan tombol checkout utama tidak macet dalam kondisi disabled permanen
    const checkoutButton = page.getByRole('button', { name: 'Bayar Sekarang' });
    await expect(checkoutButton).toBeEnabled();
  });
});</code></pre>

<h2>Integrasi dengan Asisten Koding AI Melalui Model Context Protocol (MCP)</h2>
<p>Dengan meluasnya adopsi asisten koding AI seperti Claude Code, Cursor, dan agen otonom lainnya, telemetri bug yang terstruktur menjadi modal yang sangat berharga. Ketika laporan bug terhubung melalui standar <strong>Model Context Protocol (MCP)</strong>, developer dapat langsung menginstruksikan AI agen mereka:</p>

<blockquote>
  <em>"Baca rekaman BugSnap #892 lewat MCP, periksa header request yang gagal dan skrip reproduksi Playwright, temukan bug transisi state React pada file CheckoutForm.tsx, lalu buatkan Pull Request yang memperbaiki kode dan memastikan tes lulus."</em>
</blockquote>

<p>Karena AI agen menerima data telemetri nyata dan skrip tes Playwright yang konkret (bukan sekadar deskripsi ambigu), agen tersebut dapat mengeksekusi tes di terminal lokal, memverifikasi kegagalan, memperbaiki kode, dan memastikan tes hijau sebelum membuat PR.</p>

<h2>Membangun Perlindungan Regresi Berkelanjutan</h2>
<p>Dengan mengotomatisasi alur dari rekaman bug visual ke kode Playwright, tim engineering memperoleh tiga keuntungan besar:</p>

<ul>
  <li><strong>Triase Bug Seketika:</strong> Developer dapat langsung menjalankan skrip tes di terminal lokal dengan <code>npx playwright test</code> dalam hitungan detik tanpa setup manual.</li>
  <li><strong>Validasi PR Wajib:</strong> Setiap perbaikan bug dapat langsung menyertakan skrip tes otomatis di dalam PR untuk menjamin masalah tidak akan pernah kambuh di masa depan.</li>
  <li><strong>Sinergi Nyata QA dan Developer:</strong> Tim QA berkontribusi langsung pada peningkatan coverage tes otomatis tanpa harus menguasai boilerplate framework pengujian yang rumit.</li>
</ul>

<h2>Kesimpulan</h2>
<p>Pelaporan bug visual tanpa otomasi kode hanya menyelesaikan separuh masalah pengujian. Dengan merekam telemetri aksi dan mengekspornya menjadi skrip uji Playwright yang tangguh, tim engineering dapat menutup celah antara penemuan bug, diagnosis developer, dan perlindungan regresi permanen di CI/CD.</p>
""".strip()


# ─────────────────────────────────────────────────────────────────────────────
# ARTICLE 4: Detecting SPA Memory Leaks & DOM Bloat
# ─────────────────────────────────────────────────────────────────────────────
ART4_CONTENT_EN = """
<p>Modern frontend frameworks like React, Next.js, Vue, and Angular have revolutionized web development, enabling lightning-fast client-side transitions and rich desktop-class user interfaces. However, the architectural foundation of Single Page Applications (SPAs) introduces a dangerous category of silent defects: <strong>cumulative memory leaks and DOM bloat</strong>.</p>

<p>In traditional multi-page web applications, every link navigation causes the browser to discard the current execution context entirely. The document is unloaded, JavaScript memory is completely wiped clean, and garbage collection is effectively instantaneous. In contrast, an SPA runs continuously in a single long-lived browser session. For power users operating CRM dashboards, trading terminals, analytics consoles, or customer support suites, a single tab may remain open for eight hours or more. If components fail to release memory upon unmounting, the browser tab progressively consumes hundreds of megabytes of RAM, stutters during scrolling, and eventually crashes with the dreaded <em>"Out of Memory"</em> tab error.</p>

<h2>How the V8 Garbage Collector Operates</h2>
<p>To diagnose memory leaks effectively, engineers must understand how modern JavaScript engines (such as Chromium's V8) manage memory. V8 allocates memory on the <strong>JavaScript Heap</strong>, dividing objects into two primary generations:</p>

<ul>
  <li><strong>The Young Generation (Nursery):</strong> Short-lived objects (temporary variables, helper closures). Memory here is cleaned up frequently and rapidly using the <em>Scavenger</em> algorithm.</li>
  <li><strong>The Old Generation:</strong> Objects that survive multiple garbage collection cycles are promoted to the old space. Memory here is reclaimed using the heavier <em>Mark-Sweep-Compact</em> algorithm.</li>
</ul>

<p>A memory leak occurs when an object is no longer needed by application logic, but a path of active references (known as a <strong>Retainer Path</strong>) still connects the object back to the <em>GC Root</em> (such as the global <code>window</code> object, active event listeners, or persistent module-level closures). Because V8 cannot prove the object will never be accessed again, it is forbidden from reclaiming that memory.</p>

<h2>The Top 5 Memory Leak Patterns in Modern Web Applications</h2>
<p>Through comprehensive analysis of hundreds of production frontend codebases, we have identified the five most common coding patterns responsible for client-side memory leaks:</p>

<h3>1. Forgotten Global Event Listeners</h3>
<p>When components attach listeners to <code>window</code>, <code>document</code>, or global bus dispatchers without detaching them during cleanup:</p>
<pre><code>useEffect(() =&gt; {
  function handleResize() {
    console.log(window.innerWidth);
  }
  window.addEventListener('resize', handleResize);
  // LEAK: Missing return () =&gt; window.removeEventListener('resize', handleResize);
}, []);</code></pre>
<p>Every time this component mounts and unmounts, a new function closure is permanently tethered to the global <code>window</code> object, retaining all props and state referenced inside that closure.</p>

<h3>2. Lingering Timers and Polling Loops</h3>
<p>Calling <code>setInterval</code> or trailing debounce functions inside component lifecycles without clearing the handle in the unmount return callback. The timer continues firing in the background, keeping the entire component subtree in memory.</p>

<h3>3. Detached DOM Nodes from Imperative Libraries</h3>
<p>Integrating non-React third-party libraries (such as D3.js, Chart.js, Leaflet maps, or rich-text editors like Quill) often requires imperative DOM manipulation. If these libraries append elements directly to <code>document.body</code> or retain internal references after the React wrapper component unmounts, the underlying DOM nodes become <em>detached</em> — removed from the visible layout tree, but permanently trapped in JavaScript heap memory.</p>

<h3>4. Unbounded Global State Caches</h3>
<p>State stores (such as Zustand, Redux, or Apollo Client) that accumulate collection records over time without implementing eviction policies (LRU cache or maximum size boundaries). In long-running sessions, fetching pages of data continuously expands the heap footprint without bound.</p>

<h3>5. Closure Traps in Custom Hooks</h3>
<p>Creating helper callbacks inside custom hooks that capture large data arrays or DOM elements. If these callbacks are passed to persistent contexts or memoized without proper dependency arrays, stale closures retain megabytes of discarded data.</p>

<h2>The 1,500 Element Benchmark: Why DOM Bloat Destroys INP</h2>
<p>Memory leaks are intimately connected to <strong>DOM bloat</strong> — the accumulation of excessive DOM nodes in the document tree. Google's Lighthouse and Chrome Web Vitals teams recommend keeping total DOM elements under <strong>1,500 nodes</strong> per page.</p>

<p>When an application hoards 3,000 to 5,000+ DOM nodes:</p>
<ul>
  <li><strong>Style Recalculation Times Skyrocket:</strong> The browser's CSS engine must evaluate selector specificity across thousands of tree nodes whenever a class or attribute changes, turning 2ms style computations into 80ms freezes.</li>
  <li><strong>Interaction to Next Paint (INP) Degrades:</strong> High DOM density directly degrades INP, causing clicks, keyboard entries, and dropdown toggles to feel sluggish and unresponsive.</li>
  <li><strong>Mobile Battery Depletion:</strong> Rendering oversized DOM trees causes continuous GPU and CPU memory paging, draining mobile device batteries rapidly.</li>
</ul>

<h2>How to Catch Memory Leaks During Manual QA</h2>
<p>Historically, detecting memory leaks required senior performance engineers to record heap profiles in Chrome DevTools Memory tab, take baseline snapshots, perform user actions, trigger manual garbage collection, and spend hours comparing constructor retainer trees. Manual QA testers could not realistically perform this complex workflow during routine test passes.</p>

<p>Modern diagnostic tooling like <a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> completely automates this detection during regular testing sessions:</p>

<ol>
  <li><strong>Real-Time JS Heap Delta Tracking:</strong> BugSnap monitors the active JavaScript heap before and after user journeys (such as opening and closing a modal dialog ten times). If the heap shows a steady positive slope without returning to baseline, an automated warning is generated.</li>
  <li><strong>DOM Node Growth Percentage:</strong> BugSnap calculates <code>domGrowthPct</code> across client-side route transitions. If the DOM element count jumps by more than 100% or exceeds the 1,500-node threshold, a high-priority DOM Bloat Alert is flagged directly in the bug report.</li>
  <li><strong>Zero-Friction DevTools Telemetry:</strong> Developers receiving the BugSnap report immediately see the starting heap, peak heap, and memory growth delta alongside the video capture, eliminating hours of manual profiling.</li>
</ol>

<h2>Refactoring Example: Auditing and Fixing a Real Memory Leak</h2>
<p>Here is a clean refactoring of a real-world React component that previously leaked hundreds of megabytes during live dashboard monitoring:</p>

<pre><code>import { useState, useEffect, useRef } from 'react';

export function RealtimeMetricWidget({ metricId }: { metricId: string }) {
  const [dataPoints, setDataPoints] = useState&lt;number[]&gt;([]);
  const timerRef = useRef&lt;NodeJS.Timeout | null&gt;(null);

  useEffect(() => {
    // 1. Setup subscription or interval
    timerRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/metrics/' + metricId);
        const json = await res.json();
        // Prevent unbounded array growth by clamping to the latest 50 points
        setDataPoints((prev) =&gt; [...prev.slice(-49), json.value]);
      } catch (e) {
        console.warn('Metric poll failed', e);
      }
    }, 2000);

    // 2. Strict cleanup phase: ALWAYS clear timers and unbind listeners
    return () =&gt; {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [metricId]);

  return (
    &lt;div className="metric-card"&gt;
      &lt;h4&gt;Live Telemetry&lt;/h4&gt;
      &lt;div className="sparkline"&gt;Active Points: {dataPoints.length}&lt;/div&gt;
    &lt;/div&gt;
  );
}</code></pre>

<h2>Conclusion: Building a Culture of Memory Health</h2>
<p>In client-side software engineering, performance is not an afterthought to be tackled after launch — it is a core feature that defines user experience. By measuring DOM element density and JS heap deltas during routine QA testing, engineering teams can catch memory leaks before they ever reach production users.</p>
""".strip()

ART4_CONTENT_ID = """
<p>Framework frontend modern seperti React, Next.js, Vue, dan Angular telah membawa revolusi besar dalam rekayasa aplikasi web. Berpindahnya navigasi ke sisi client menghadirkan pengalaman pengguna yang instan dan mulus layaknya aplikasi desktop. Namun, fondasi arsitektur Single Page Application (SPA) memicu kategori cacat sistem yang sering kali tidak terlihat secara kasat mata: <strong>kebocoran memori (memory leak) kumulatif dan pembengkakan elemen DOM (DOM bloat)</strong>.</p>

<p>Pada website multi-halaman tradisional, setiap kali pengguna mengeklik link navigasi, browser akan membuang seluruh context eksekusi halaman lama. Dokumen di-unload, memori JavaScript dibersihkan total, dan proses garbage collection terjadi secara alami. Sebaliknya, aplikasi SPA berjalan secara terus-menerus dalam satu tab browser yang hidup lama. Bagi pengguna enterprise yang membuka dashboard analitik, CRM, atau sistem operasional selama 8 jam kerja penuh, komponen yang gagal melepaskan memori saat di-unmount akan terus menyedot RAM hingga ratusan megabyte, membuat antarmuka tersendat-sendat (lagging), dan akhirnya memicu crash browser bertuliskan <em>"Out of Memory"</em>.</p>

<h2>Cara Kerja Garbage Collector pada Mesin JavaScript V8</h2>
<p>Untuk melacak dan menuntaskan kebocoran memori secara efektif, developer harus memahami bagaimana engine JavaScript V8 (Chromium) mengelola memori. V8 mengalokasikan objek pada <strong>JavaScript Heap</strong> yang terbagi menjadi dua generasi utama:</p>

<ul>
  <li><strong>Young Generation (Nursery):</strong> Tempat objek berumur pendek (variabel lokal fungsi, temporary helper). Memori di area ini dibersihkan sangat cepat dan berkala menggunakan algoritma <em>Scavenger</em>.</li>
  <li><strong>Old Generation:</strong> Objek yang lolos dari beberapa siklus garbage collection akan dipromosikan ke area ini. Pembersihan memori di sini menggunakan algoritma yang lebih berat, yaitu <em>Mark-Sweep-Compact</em>.</li>
</ul>

<p>Kebocoran memori terjadi ketika suatu objek sebetulnya sudah tidak lagi digunakan oleh logika aplikasi, namun rantai referensi aktif (dikenal sebagai <strong>Retainer Path</strong>) masih menghubungkan objek tersebut ke <em>GC Root</em> (seperti objek global <code>window</code>, event listener aktif, atau closure modul yang menetap). Karena V8 menganggap objek tersebut masih bisa diakses sewaktu-waktu, sistem dilarang menghapus objek tersebut dari RAM.</p>

<h2>5 Pola Utama Penyebab Memory Leak pada Aplikasi Web Modern</h2>
<p>Berdasarkan audit teknis pada ratusan arsitektur aplikasi frontend, terdapat lima pola kode yang paling sering menjadi biang keladi kebocoran memori:</p>

<h3>1. Event Listener Global yang Lupa Dilepas</h3>
<p>Ketika komponen mendaftarkan event listener pada objek <code>window</code>, <code>document</code>, atau event bus global tanpa fungsi pelepasan saat unmount:</p>
<pre><code>useEffect(() =&gt; {
  function handleResize() {
    console.log(window.innerWidth);
  }
  window.addEventListener('resize', handleResize);
  // BOCOR: Lupa menambahkan return () =&gt; window.removeEventListener('resize', handleResize);
}, []);</code></pre>
<p>Setiap kali komponen ini di-mount dan di-unmount, fungsi closure baru akan terikat permanen pada objek global <code>window</code>, menahan seluruh state dan props komponen di dalam memori heap selamanya.</p>

<h3>2. Timer dan Polling Loop Tanpa Henti</h3>
<p>Penggunaan <code>setInterval</code> atau trailing debounce di dalam lifecycle komponen tanpa pembersihan <code>clearInterval</code> pada return callback effect. Timer akan terus berdetak di latar belakang dan menahan pohon komponen terkait agar tidak di-garbage collect.</p>

<h3>3. Detached DOM Nodes dari Library Pihak Ketiga</h3>
<p>Integrasi library pihak ketiga non-React (seperti grafik Chart.js/D3, peta Leaflet, atau rich text editor) umumnya memanipulasi elemen DOM secara langsung. Jika library ini menempelkan elemen ke <code>document.body</code> dan referensinya tidak dibersihkan saat komponen pembungkus di-unmount, node DOM tersebut menjadi <em>detached</em> — hilang dari pandangan layar, namun tetap terkunci di memori browser.</p>

<h3>4. Cache State Global Tanpa Batas (Unbounded Stores)</h3>
<p>Penggunaan state store (seperti Zustand atau Redux) yang terus menumpuk data riwayat query atau pagination tanpa kebijakan eviksi (seperti batasan LRU cache). Dalam sesi penggunaan yang lama, ukuran heap akan terus membengkak tanpa batas.</p>

<h3>5. Perangkap Closure pada Custom Hook</h3>
<p>Membuat fungsi callback di dalam custom hook yang menangkap array data besar atau referensi node DOM. Jika callback ini diteruskan ke context atau di-memoize dengan dependency array yang tidak tepat, closure lama akan menahan data usang di memori.</p>

<h2>Standar 1.500 Elemen: Mengapa DOM Bloat Merusak Skor INP</h2>
<p>Kebocoran memori sangat erat kaitannya dengan <strong>pembengkakan elemen DOM (DOM bloat)</strong>. Panduan resmi Google Web Vitals merekomendasikan total elemen DOM tidak melebihi <strong>1.500 elemen</strong> per halaman.</p>

<p>Ketika halaman memuat 3.000 hingga 5.000+ elemen DOM:</p>
<ul>
  <li><strong>Perhitungan Gaya CSS Melambat Drastis:</strong> Browser harus mencocokkan selektor CSS ke ribuan elemen setiap kali ada class yang berganti, mengubah kalkulasi yang harusnya 2ms menjadi pembekuan antarmuka 80ms.</li>
  <li><strong>Skor Interaction to Next Paint (INP) Memburuk:</strong> Kepadatan DOM yang berlebih membuat respons klik, ketikan keyboard, dan animasi dropdown terasa lambat dan patah-patah.</li>
  <li><strong>Baterai Perangkat Cepat Habis:</strong> Render pohon DOM raksasa memicu konsumsi daya CPU dan RAM tinggi yang menguras baterai laptop dan smartphone pengguna.</li>
</ul>

<h2>Cara Praktis Mendeteksi Memory Leak Saat Pengujian QA</h2>
<p>Secara tradisional, mendeteksi kebocoran memori menuntut engineer senior untuk membuka tab Memory di Chrome DevTools, merekam heap snapshot, menjalankan alur berulang kali, memicu garbage collection manual, lalu membandingkan delta constructor retainer. Alur ini terlalu rumit dan lambat untuk dilakukan oleh tester QA sehari-hari.</p>

<p>Alat diagnostik modern seperti <a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> mengotomatiskan seluruh pendeteksian ini selama sesi pengujian berlangsung:</p>

<ol>
  <li><strong>Pelacakan Delta JS Heap Real-Time:</strong> BugSnap memantau kenaikan memori sebelum dan sesudah alur pengujian dijalankan. Jika grafik memori terus menanjak tanpa kembali ke baseline, sistem otomatis menyalakan indikator peringatan.</li>
  <li><strong>Persentase Pertumbuhan DOM:</strong> BugSnap menghitung <code>domGrowthPct</code> pada setiap transisi rute client-side. Jika jumlah elemen melompat lebih dari 100% atau menembus batas kritis 1.500 elemen, tiket bug akan otomatis mencantumkan kartu *DOM Bloat Warning*.</li>
  <li><strong>Telemetri Langsung di Laporan Bug:</strong> Developer yang menerima link laporan BugSnap dapat langsung melihat metrik Initial Heap, Peak Heap, dan Heap Delta di tab DevTools tanpa perlu melakukan profiling ulang manual.</li>
</ol>

<h2>Contoh Refactoring: Memperbaiki Memory Leak pada React</h2>
<p>Berikut contoh refactoring konkret pada komponen widget pemantau metrik yang sebelumnya membocorkan puluhan megabyte memori setiap pergantian halaman:</p>

<pre><code>import { useState, useEffect, useRef } from 'react';

export function RealtimeMetricWidget({ metricId }: { metricId: string }) {
  const [dataPoints, setDataPoints] = useState&lt;number[]&gt;([]);
  const timerRef = useRef&lt;NodeJS.Timeout | null&gt;(null);

  useEffect(() =&gt; {
    // 1. Inisialisasi polling interval
    timerRef.current = setInterval(async () =&gt; {
      try {
        const res = await fetch('/api/metrics/' + metricId);
        const json = await res.json();
        // Batasi ukuran array maksimal 50 titik terakhir untuk mencegah heap membengkak
        setDataPoints((prev) =&gt; [...prev.slice(-49), json.value]);
      } catch (e) {
        console.warn('Gagal memuat metrik', e);
      }
    }, 2000);

    // 2. Tahap Cleanup: WAJIB membersihkan timer saat komponen di-unmount
    return () =&gt; {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [metricId]);

  return (
    &lt;div className="metric-card"&gt;
      &lt;h4&gt;Telemetri Real-Time&lt;/h4&gt;
      &lt;div className="sparkline"&gt;Titik Aktif: {dataPoints.length}&lt;/div&gt;
    &lt;/div&gt;
  );
}</code></pre>

<h2>Kesimpulan</h2>
<p>Pada rekayasa aplikasi web modern, performa dan kesehatan memori bukanlah hal sekunder yang baru dipikirkan saat sistem melambat di produksi. Dengan mendeteksi pertumbuhan heap dan pembengkakan elemen DOM sejak tahap pengujian QA, tim software dapat menjamin aplikasi tetap ringan, responsif, dan stabil sepanjang hari bagi seluruh pengguna.</p>
""".strip()


def generate_articles_block():
    block = f'''  // ─── Article: Hunting Flaky Front-End Bugs: Why Time-Synchronized Causality Matters ───
  {{
    slug: "flaky-frontend-bugs-causality-timeline",
    title: "Hunting Flaky Front-End Bugs: Why Time-Synchronized Causality Matters",
    titleId: "Menelusuri Bug Flaky Front-End: Mengapa Kronologi Kausalitas Berurutan Sangat Penting",
    description: "Intermittent UI bugs are notoriously hard to catch. Learn how synchronizing network responses, console errors, and user actions on a single timeline reveals the root cause.",
    descriptionId: "Bug UI yang muncul sesekali sangat sulit dilacak. Pelajari bagaimana sinkronisasi respons network, error console, dan aksi pengguna pada satu timeline mengungkap akar masalah.",
    date: "2026-11-02",
    author: "BugSnap Team",
    readTime: "9 min read",
    category: "DEBUGGING",
    tags: ["debugging", "devtools", "qa", "frontend"],
    coverImage: "/blog/flaky-frontend-bugs-causality-timeline.webp",
    ogImage: "/blog/flaky-frontend-bugs-causality-timeline.webp",
    content: `
{ART1_CONTENT_EN}
    `.trim(),
    contentId: `
{ART1_CONTENT_ID}
    `.trim(),
  }},

  // ─── Article: Zero Storage Liability: Why BYO Google Drive Wins for Enterprise QA ───
  {{
    slug: "zero-storage-liability-why-byo-google-drive-wins",
    title: "Zero Storage Liability: Why BYO Google Drive Wins for Enterprise QA",
    titleId: "Zero Storage Liability: Mengapa Google Drive Pribadi Lebih Aman untuk QA Perusahaan",
    description: "Learn how bringing your own Google Drive (BYO) eliminates data storage risks, keeps sensitive information in your control, and scales reliably for enterprise QA teams.",
    descriptionId: "Pelajari bagaimana membawa Google Drive Anda sendiri (BYO) mengeliminasi risiko penyimpanan data, menjaga informasi sensitif dalam kendali Anda, dan berskala andal untuk tim QA perusahaan.",
    date: "2026-10-26",
    author: "BugSnap Team",
    readTime: "10 min read",
    category: "DEVOPS",
    tags: ["security", "google-drive", "enterprise", "privacy", "devops"],
    coverImage: "/blog/zero-storage-liability-why-byo-google-drive-wins.webp",
    ogImage: "/blog/zero-storage-liability-why-byo-google-drive-wins.webp",
    content: `
{ART2_CONTENT_EN}
    `.trim(),
    contentId: `
{ART2_CONTENT_ID}
    `.trim(),
  }},

  // ─── Article: From Bug Recording to Automated Playwright Test: Closing the QA-Dev Loop ───
  {{
    slug: "from-bug-recording-to-automated-playwright-test",
    title: "From Bug Recording to Automated Playwright Test: Closing the QA-Dev Loop",
    titleId: "Dari Rekaman Bug ke Tes Otomatis Playwright: Menutup Celah Siklus QA-Dev",
    description: "Stop manually writing test reproductions from scratch. Learn how capturing structured user action telemetry transforms bug videos into automated Playwright scripts.",
    descriptionId: "Hentikan penulisan skrip uji reproduksi manual dari nol. Pelajari cara mengubah rekaman aksi pengguna menjadi skrip otomatis Playwright yang siap pakai.",
    date: "2026-10-19",
    author: "BugSnap Team",
    readTime: "9 min read",
    category: "PLAYWRIGHT",
    tags: ["playwright", "test-automation", "qa", "developer-productivity"],
    coverImage: "/blog/from-bug-recording-to-automated-playwright-test.webp",
    ogImage: "/blog/from-bug-recording-to-automated-playwright-test.webp",
    content: `
{ART3_CONTENT_EN}
    `.trim(),
    contentId: `
{ART3_CONTENT_ID}
    `.trim(),
  }},

  // ─── Article: Detecting SPA Memory Leaks & DOM Bloat in Single Page Applications ───
  {{
    slug: "detecting-spa-memory-leaks-and-dom-bloat",
    title: "Detecting SPA Memory Leaks & DOM Bloat in Single Page Applications",
    titleId: "Mendeteksi Kebocoran Memori & Pembengkakan DOM pada Single Page Apps",
    description: "Learn how to identify memory leaks, excessive DOM nodes, and long-running tasks using Chrome DevTools and BugSnap telemetry.",
    descriptionId: "Pelajari cara mengidentifikasi kebocoran memori, node DOM berlebih, dan tugas berjalan lama menggunakan Chrome DevTools dan telemetri BugSnap.",
    date: "2026-10-13",
    author: "BugSnap Team",
    readTime: "11 min read",
    category: "PERFORMANCE",
    tags: ["web-performance", "spa", "memory-leaks", "devtools"],
    coverImage: "/blog/detecting-spa-memory-leaks-and-dom-bloat.webp",
    ogImage: "/blog/detecting-spa-memory-leaks-and-dom-bloat.webp",
    content: `
{ART4_CONTENT_EN}
    `.trim(),
    contentId: `
{ART4_CONTENT_ID}
    `.trim(),
  }},
'''
    return block

def update_blog_ts():
    with open(BLOG_TS_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # Split before and after the 4 articles
    header_marker = "export const blogPosts: BlogPost[] = [\n"
    article1_marker = "  // ─── Article 1 ───────────────────────────────────────────────────────────────\n"

    header_idx = content.find(header_marker)
    if header_idx == -1:
        raise ValueError(f"Header marker not found: {header_marker}")

    article1_idx = content.find(article1_marker)
    if article1_idx == -1:
        raise ValueError(f"Article 1 marker not found: {article1_marker}")

    before = content[:header_idx + len(header_marker)]
    after = content[article1_idx:]

    new_articles_block = generate_articles_block()

    new_content = before + new_articles_block + "\n" + after

    with open(BLOG_TS_PATH, "w", encoding="utf-8") as f:
        f.write(new_content)

    print(f"Successfully updated {BLOG_TS_PATH}! New file size: {len(new_content)} bytes")

if __name__ == "__main__":
    update_blog_ts()

