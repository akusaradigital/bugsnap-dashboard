"""
publish_blog_post.py - Autonomous publishing pipeline for BugSnap blog posts.
Generates a new blog article in src/content/blog.ts and creates a matching
1200x800 WebP cover image in public/blog/{slug}.webp.
"""

import os
import sys
import json
import re
from datetime import datetime
from generate_blog_cover import create_blog_cover

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BLOG_TS_PATH = os.path.join(BASE_DIR, "src", "content", "blog.ts")
PUBLIC_BLOG_DIR = os.path.join(BASE_DIR, "public", "blog")

EDITORIAL_TOPICS = [
    {
        "slug": "detecting-spa-memory-leaks-and-dom-bloat",
        "title": "Detecting SPA Memory Leaks & DOM Bloat in Single Page Applications",
        "titleId": "Mendeteksi Kebocoran Memori & Pembengkakan DOM pada Aplikasi SPA",
        "description": "Unmounted components and detached DOM nodes silently degrade web performance. Learn how to track JS heap growth and element bloat during QA testing.",
        "descriptionId": "Komponen yang di-unmount dan node DOM yang tertinggal dapat menurunkan performa web. Pelajari cara melacak kenaikan heap JS dan pembengkakan elemen saat pengujian QA.",
        "category": "Performance & QA",
        "readTime": "5 min read",
        "tags": ["web-performance", "spa", "memory-leaks", "devtools"],
        "content": """
<p>Modern frontend frameworks like React, Vue, and Next.js make dynamic user interfaces effortless, but they also introduce an insidious class of bugs: <strong>Single Page Application (SPA) memory leaks and DOM bloat</strong>.</p>

<p>Unlike traditional multi-page websites where every navigation wipes the JavaScript heap clean, an SPA retains its runtime context indefinitely. If a developer forgets to clear an interval, detach a global event listener, or clean up an RxJS subscription, retained DOM nodes accumulate in memory — causing the browser tab to slow down, stutter, and eventually crash.</p>

<h2>What Causes SPA DOM Bloat?</h2>
<p>DOM bloat occurs when components unmount visually, but references to their DOM elements remain in closures or global registries. Common culprits include:</p>
<ul>
  <li><strong>Global Event Listeners:</strong> <code>window.addEventListener('resize', handler)</code> without a matching <code>removeEventListener</code> in a cleanup effect.</li>
  <li><strong>Dangling Timers:</strong> <code>setInterval</code> or trailing debounces that hold references to component props.</li>
  <li><strong>Detached DOM Nodes:</strong> Third-party charting or editor libraries appending elements directly to <code>document.body</code> without lifecycle synchronization.</li>
</ul>

<h2>The 1,500 Element Benchmark</h2>
<p>Google's Lighthouse and Chrome Web Vitals teams recommend keeping total DOM nodes under <strong>1,500 elements</strong> per page. Pages with 3,000+ nodes increase reflow computation time quadratically, degrading Interaction to Next Paint (INP) and causing mobile device battery drain.</p>

<h2>How to Catch Memory Leaks Before Release</h2>
<ol>
  <li><strong>Monitor JS Heap Delta:</strong> Measure memory before and after repeated user journeys (e.g. Opening and closing a modal 10 times). If the heap consistently climbs without returning to baseline, an object leak is present.</li>
  <li><strong>Track DOM Element Count:</strong> Check <code>document.getElementsByTagName('*').length</code> across client-side route transitions.</li>
  <li><strong>Use Automated QA Diagnostics:</strong> Rather than forcing testers to keep DevTools Memory Profiler open, modern tools like <a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> automatically track DOM growth percentage, peak heap usage, and flag critical SPA health anomalies directly in bug reports.</li>
</ol>

<h2>Conclusion</h2>
<p>Catching memory leaks in production requires waiting for user complaints about sluggish tabs. Catching them in QA requires under 60 seconds with the right telemetry. Monitor your DOM growth, enforce cleanup lifecycles, and keep your SPAs lightweight.</p>
""".strip(),
        "contentId": """
<p>Framework modern seperti React, Vue, dan Next.js membuat pembuatan antarmuka dinamis menjadi mudah, namun juga memicu kelas bug yang sulit dilacak: <strong>kebocoran memori SPA dan pembengkakan elemen DOM</strong>.</p>

<p>Berbeda dari web multi-halaman konvensional di mana setiap pergantian halaman membersihkan JavaScript heap secara otomatis, aplikasi SPA mempertahankan konteks runtime-nya tanpa batas waktu. Jika developer lupa membersihkan interval, listener event global, atau subscription, elemen DOM yang tertinggal akan terus menumpuk di memori hingga membuat browser lambat dan crash.</p>

<h2>Penyebab Utama Pembengkakan DOM pada SPA</h2>
<p>Pembengkakan DOM terjadi ketika komponen tampak hilang dari layar, namun referensi elemennya masih tersimpan di memory heap. Penyebab paling sering meliputi:</p>
<ul>
  <li><strong>Event Listener Global:</strong> <code>window.addEventListener('resize', handler)</code> yang tidak dibersihkan dengan <code>removeEventListener</code> pada lifecycle cleanup.</li>
  <li><strong>Timer Tanpa Henti:</strong> <code>setInterval</code> atau trailing debounce yang masih memegang referensi ke state komponen.</li>
  <li><strong>Detached DOM Nodes:</strong> Library pihak ketiga (grafik atau rich-text editor) yang menempelkan elemen langsung ke <code>document.body</code> tanpa sinkronisasi lifecycle.</li>
</ul>

<h2>Batas Standar 1.500 Elemen DOM</h2>
<p>Rekomendasi resmi Google Lighthouse adalah menjaga total elemen DOM di bawah <strong>1.500 elemen</strong> per halaman. Halaman dengan lebih dari 3.000 elemen akan mengalami perlambatan perhitungan reflow yang tajam dan memperburuk skor Interaction to Next Paint (INP).</p>

<h2>Cara Praktis Menangkap Memory Leak Saat QA Testing</h2>
<ol>
  <li><strong>Pantau Pertumbuhan Heap JS:</strong> Catat penggunaan memori sebelum dan sesudah melakukan alur yang sama berulang kali (misal: buka-tutup modal 10 kali berturut-turut).</li>
  <li><strong>Pantau Jumlah Elemen DOM:</strong> Periksa pertumbuhan <code>document.getElementsByTagName('*').length</code> saat navigasi rute client-side.</li>
  <li><strong>Gunakan Telemetri Otomatis:</strong> Ekstensi seperti <a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> otomatis merekam lonjakan elemen DOM dan pertumbuhan heap memori, sehingga peringatan kebocoran memori langsung terlampir di laporan bug tanpa perlu membuka tab Profiler.</li>
</ol>
""".strip()
    },
    {
        "slug": "from-bug-recording-to-automated-playwright-test",
        "title": "From Bug Recording to Automated Playwright Test: Closing the QA-Dev Loop",
        "titleId": "Dari Rekaman Bug ke Tes Otomatis Playwright: Mempercepat Siklus QA-Dev",
        "description": "Stop manually writing test reproductions from scratch. Learn how capturing structured user action telemetry transforms bug videos into automated Playwright scripts.",
        "descriptionId": "Hentikan penulisan skrip uji reproduksi manual dari nol. Pelajari cara mengubah rekaman aksi pengguna menjadi skrip otomatis Playwright yang siap pakai.",
        "category": "Automation & QA",
        "readTime": "6 min read",
        "tags": ["playwright", "test-automation", "qa", "developer-productivity"],
        "content": """
<p>One of the most tedious tasks in software development is turning a bug report into a reliable automated regression test. A QA engineer records a video showing an unexpected checkout failure, files a ticket, and then an automation engineer or developer spends an hour reconstructing the exact DOM selectors and sequence in Playwright or Cypress.</p>

<p>This manual translation is where valuable engineering hours disappear. Here is how modern QA workflows bridge the gap between visual bug captures and automated regression suites.</p>

<h2>The Missing Link: Action Telemetry</h2>
<p>A video recording provides visual proof, but Playwright requires deterministic locators: CSS selectors, roles, input values, and network mock points. By capturing structured user breadcrumbs alongside the recording, every click, navigation, and input becomes immediately actionable.</p>

<h2>Synthesizing Playwright Locators from User Events</h2>
<p>When an action event records both the DOM target and its interactive context, generating a test script becomes an automated transformation:</p>
<pre><code>// Automatically generated reproduction snippet
import { test, expect } from '@playwright/test';

test('reproduce checkout button failure', async ({ page }) => {
  await page.goto('https://app.example.com/checkout');
  await page.getByRole('button', { name: 'Apply Coupon' }).click();
  await page.locator('#promo-code-input').fill('DISCOUNT50');
  await page.getByRole('button', { name: 'Submit' }).click();

  // Expect network failure or alert state
  await expect(page.locator('.toast-error')).toBeVisible();
});</code></pre>

<h2>Benefits for Agile QA Teams</h2>
<ol>
  <li><strong>Instant Regression Guard:</strong> Once a developer merges the fix, the generated script immediately becomes part of the permanent CI test suite.</li>
  <li><strong>Zero Selector Guesswork:</strong> Automation engineers don't have to inspect staging DOM trees to guess whether <code>#submit-btn</code> or <code>.btn-checkout</code> was clicked.</li>
  <li><strong>Complete Causality:</strong> Coupling network responses with action steps ensures network mocks represent real-world server failures.</li>
</ol>
""".strip(),
        "contentId": """
<p>Salah satu pekerjaan yang paling memakan waktu adalah mengubah laporan bug menjadi tes regresi otomatis. Tim QA merekam video saat checkout gagal, membuat tiket, lalu engineer automation harus menghabiskan waktu berjam-jam merekonstruksi urutan selektor DOM di Playwright atau Cypress.</p>

<p>Di sinilah jam kerja produktif sering terbuang. Berikut cara menyambungkan bukti rekaman visual langsung menjadi skrip regresi otomatis.</p>

<h2>Kunci Penghubung: Telemetri Aksi Pengguna</h2>
<p>Rekaman video memberikan bukti visual, namun Playwright membutuhkan data pasti: selektor CSS, role aksesibilitas, nilai input, dan titik mock network. Dengan merekam jejak aksi pengguna secara terstruktur bersama video, setiap klik dan navigasi langsung dapat diekspor menjadi kode.</p>

<h2>Keuntungan untuk Tim QA & Developer</h2>
<ol>
  <li><strong>Perlindungan Regresi Instan:</strong> Setelah bug diperbaiki, skrip yang digenerate langsung masuk ke pipeline CI/CD untuk mencegah bug terulang kembali.</li>
  <li><strong>Bebas Tebak Selektor:</strong> Engineer tidak perlu lagi mereka-reka ID atau class elemen mana yang diklik tester.</li>
  <li><strong>Sinkronisasi Bukti & Kode:</strong> Laporan bug yang menyertakan skrip Playwright mempercepat waktu investigasi hingga 3 kali lebih cepat.</li>
</ol>
""".strip()
    },
    {
        "slug": "zero-storage-liability-why-byo-google-drive-wins",
        "title": "Zero Storage Liability: Why BYO Google Drive Wins for Enterprise QA",
        "titleId": "Zero Storage Liability: Mengapa Google Drive Pribadi Lebih Aman untuk QA Perusahaan",
        "description": "SaaS storage locks your bug recordings into third-party silos. Discover how the Bring-Your-Own-Storage model guarantees data privacy and eliminates vendor lock-in.",
        "descriptionId": "Penyimpanan SaaS mengunci rekaman bug ke server pihak ketiga. Pelajari bagaimana model Bring-Your-Own-Storage menjamin privasi data dan mengeliminasi biaya penyimpanan berlebih.",
        "category": "Security & Architecture",
        "readTime": "4 min read",
        "tags": ["security", "google-drive", "enterprise", "privacy"],
        "content": """
<p>When engineering teams adopt bug reporting tools, the first question security and compliance officers ask is: <em>"Where are the screen recordings and customer screenshots stored?"</em></p>

<p>Most SaaS bug reporting platforms upload every video and screenshot to their own multi-tenant AWS S3 buckets. For enterprises handling protected health information (HIPAA), financial records (SOC 2), or sensitive customer PII, this represents an unacceptable compliance risk and storage liability.</p>

<h2>The BYO (Bring-Your-Own) Storage Model</h2>
<p><a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> pioneered a zero-storage liability architecture. Instead of routing gigabytes of video through central proprietary servers, media streams directly from the tester's browser into their own company Google Drive via OAuth 2.0.</p>

<h2>Key Advantages for Security & Operations</h2>
<ul>
  <li><strong>100% Data Sovereignty:</strong> Video files never touch BugSnap's backend. Your organization owns the Google Drive root folder, retention policies, and access permissions.</li>
  <li><strong>Zero Storage Markups:</strong> Companies already pay for Google Workspace storage. Paying a secondary SaaS vendor a 10x markup for cloud storage is an unnecessary expense.</li>
  <li><strong>Instant Enterprise Revocation:</strong> If an employee leaves the company or a client project concludes, revoking access in Google Workspace immediately secures all historical bug captures.</li>
</ul>
""".strip(),
        "contentId": """
<p>Saat tim mengadopsi alat pelaporan bug, pertanyaan pertama dari tim kepatuhan keamanan adalah: <em>"Di mana rekaman layar dan tangkapan data pelanggan disimpan?"</em></p>

<p>Sebagian besar platform SaaS mengunggah seluruh media ke server cloud milik mereka sendiri. Bagi perusahaan yang mengelola data sensitif pelanggan atau kepatuhan perbankan, hal ini menimbulkan risiko keamanan data pihak ketiga.</p>

<h2>Model Bring-Your-Own Storage BugSnap</h2>
<p><a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> menerapkan arsitektur zero-storage liability. Alih-alih menyimpan video di server kami, file rekaman dikirim langsung dari browser ke akun Google Drive milik tim Anda sendiri via OAuth 2.0.</p>

<h2>Keunggulan Utama untuk Perusahaan</h2>
<ul>
  <li><strong>Kedaulatan Data 100%:</strong> File video tidak pernah transit di server pihak ketiga. Perusahaan Anda memegang kendali penuh atas izin akses dan retensi Google Drive.</li>
  <li><strong>Tanpa Biaya Tambahan:</strong> Mengoptimalkan kuota Google Workspace yang sudah dimiliki tim tanpa perlu membayar langganan storage tambahan.</li>
  <li><strong>Pencabutan Akses Cepat:</strong> Saat masa proyek selesai, pencabutan izin cukup dilakukan melalui Google Workspace secara terpusat.</li>
</ul>
""".strip()
    },
    {
        "slug": "flaky-frontend-bugs-causality-timeline",
        "title": "Hunting Flaky Front-End Bugs: Why Time-Synchronized Causality Matters",
        "titleId": "Menelusuri Bug Flaky Front-End: Mengapa Kronologi Kausalitas Berurutan Sangat Penting",
        "description": "Intermittent UI bugs are notoriously hard to catch. Learn how synchronizing network responses, console errors, and user actions on a single timeline reveals the root cause.",
        "descriptionId": "Bug UI yang muncul sesekali sangat sulit dilacak. Pelajari bagaimana sinkronisasi respons network, error console, dan aksi pengguna pada satu timeline mengungkap akar masalah.",
        "category": "Debugging & DevTools",
        "readTime": "5 min read",
        "tags": ["debugging", "devtools", "qa", "frontend"],
        "content": """
<p>"It worked when I tested it, but now it fails." Every developer and QA tester has experienced the frustration of flaky, intermittent front-end bugs.</p>

<p>The core problem with intermittent bugs is that a single isolated artifact — a static screenshot or a lone error stack trace — lacks <strong>causality</strong>. An error displayed on screen is almost never the origin of the bug; it is the final symptom of an asynchronous chain of events that started several seconds earlier.</p>

<h2>The Anatomy of an Asynchronous Failure</h2>
<p>Consider an e-commerce checkout button that occasionally freezes:</p>
<ol>
  <li><strong>T-5.2s:</strong> User clicks "Standard Shipping" (User Action).</li>
  <li><strong>T-3.8s:</strong> Background pre-flight API request returns <code>429 Too Many Requests</code> (Silent Network Failure).</li>
  <li><strong>T-1.2s:</strong> State management store leaves <code>isCalculatingTax: true</code> without resolving.</li>
  <li><strong>T-0.0s:</strong> User clicks "Place Order" — button disabled, no visual error feedback.</li>
</ol>
<p>If the tester only submits a screenshot showing a disabled button, the developer assumes the button state is broken. But with a time-synchronized timeline, the <code>429 Rate Limit</code> at T-3.8s immediately reveals the true root cause.</p>

<h2>How BugSnap Establishes Causality</h2>
<p><a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> records user steps, console logs, and network activity with microsecond-accurate relative timestamps. In the viewer, hovering or scrubbing through the recording highlights the exact API call or interaction that preceded the crash.</p>
""".strip(),
        "contentId": """
<p>"Tadi dicoba bisa, sekarang kok gagal lagi?" Hampir semua developer dan QA pernah dibuat pusing oleh bug flaky yang muncul sesekali.</p>

<p>Penyebab utama sulitnya memperbaiki bug intermittent adalah hilangnya <strong>hubungan kausalitas</strong> jika hanya mengandalkan screenshot statis. Tampilan error di layar biasanya hanyalah gejala akhir dari rangkaian event asinkron yang terjadi beberapa detik sebelumnya.</p>

<h2>Mengapa Kausalitas Timeline Sangat Penting</h2>
<p>Ketika tombol checkout sesekali tidak merespons, penyebab aslinya sering kali adalah request background beberapa detik sebelumnya yang terkena rate limit atau timeout, sehingga state aplikasi terkunci dalam kondisi loading.</p>

<p>Dengan menyatukan rekaman video, log network, dan interaksi pengguna dalam satu sumbu waktu yang sinkron, developer dapat melihat persis request mana yang mengawali kegagalan sistem sebelum tombol ditekan.</p>
""".strip()
    },
    {
        "slug": "zero-server-storage-bring-your-own-drive",
        "title": "Why Engineering Teams Are Moving to BYO Storage for Bug Reporting",
        "titleId": "Mengapa Tim Engineering Beralih ke Model BYO Storage untuk Pelaporan Bug",
        "description": "Enterprise security teams reject third-party video storage. Compare the trade-offs between multi-tenant cloud storage and direct Google Drive ownership.",
        "descriptionId": "Tim keamanan perusahaan menghindari penyimpanan video di server pihak ketiga. Pelajari perbandingan antara storage multi-tenant dan kepemilikan Google Drive mandiri.",
        "category": "Security & Architecture",
        "readTime": "5 min read",
        "tags": ["enterprise", "security", "google-drive", "developer-tools"],
        "content": """
<p>Over the past three years, visual bug reporting tools gained widespread adoption. Recording a quick video or capturing a browser tab is infinitely faster than writing manual reproduction steps.</p>

<p>However, as software companies scale toward <strong>SOC 2 Type II, ISO 27001, and HIPAA compliance</strong>, an uncomfortable realization emerges: <em>Every customer screen recording, staging dashboard capture, and internal QA video is permanently stored on a third-party startup's cloud servers.</em></p>

<h2>The Hidden Liabilities of SaaS Video Storage</h2>
<ul>
  <li><strong>Data Sprawl:</strong> Sensitive customer account numbers, API credentials, and internal feature leaks sit indefinitely in vendor S3 buckets.</li>
  <li><strong>Markup Economics:</strong> Paying per-seat plus storage retention overages for videos your team already pays Google Workspace to host.</li>
  <li><strong>Vendor Lock-in:</strong> If your team migrates or cancels a subscription, extracting gigabytes of archived video recordings is nearly impossible.</li>
</ul>

<h2>The BugSnap Alternative: Zero Server Storage</h2>
<p><a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> introduced a radically different model: <strong>Bring Your Own Storage (BYOS)</strong>. Media streams directly from the tester's Chrome browser into their own company Google Drive using scoped OAuth 2.0.</p>
<p>BugSnap's servers never receive, process, or store raw video chunks. Your organization maintains 100% data sovereignty, full audit logging in Google Workspace Admin Console, and instant access revocation.</p>
""".strip(),
        "contentId": """
<p>Dalam beberapa tahun terakhir, alat pelaporan bug visual semakin populer karena memudahkan tester merekam masalah tanpa menulis langkah reproduksi panjang.</p>

<p>Namun, saat perusahaan berkembang memenuhi standar kepatuhan <strong>SOC 2, ISO 27001, atau HIPAA</strong>, tim sekuriti mulai khawatir: seluruh rekaman layar staging dan data sensitif tersimpan di server cloud milik pihak ketiga.</p>

<h2>Model Baru: Zero Server Storage BugSnap</h2>
<p><a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> memelopori arsitektur Bring-Your-Own-Storage (BYOS). Rekaman video dikirim langsung dari Chrome ke akun Google Drive milik perusahaan Anda via OAuth 2.0 tanpa pernah singgah di server BugSnap.</p>
""".strip()
    },
    {
        "slug": "debugging-cross-origin-cors-and-preflight-failures",
        "title": "Triage CORS & Preflight Failures in Under 30 Seconds: A QA Guide",
        "titleId": "Melacak Kegagalan CORS & Request Preflight dalam 30 Detik: Panduan QA",
        "description": "CORS errors are among the most misunderstood bugs in web apps. Learn how to inspect preflight OPTIONS requests, missing headers, and origin drift.",
        "descriptionId": "Error CORS sering kali disalahpahami oleh tim penguji. Pelajari cara memeriksa request preflight OPTIONS, header yang hilang, dan ketidaksesuaian origin.",
        "category": "Debugging & DevTools",
        "readTime": "8 min read",
        "tags": ["cors", "network", "api", "qa-guide", "debugging"],
        "content": """
<p>Every QA engineer and web developer has encountered the dreaded red browser console banner: <em>"Access to fetch at 'https://api.example.com/data' from origin 'https://app.example.com' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource."</em></p>

<p>When this happens during a testing sprint, it almost universally triggers unproductive friction between teams. A junior tester reports: <em>"The backend API is completely down."</em> A backend developer tests the endpoint in Postman or cURL, sees a <code>200 OK</code> response, and snaps back: <em>"The API works perfectly, it must be a front-end bug."</em></p>

<p>Both are technically correct in their narrow context, but an hour of engineering velocity is wasted because standard screenshots fail to capture the invisible HTTP preflight exchange that occurred before the real request ever fired.</p>

<h2>Same-Origin Policy (SOP) vs. CORS: The Core Mental Model</h2>
<p>Browsers enforce the <strong>Same-Origin Policy (SOP)</strong> to protect users from malicious scripts on one website reading private data from another authenticated website. An origin is defined by the exact combination of <strong>Scheme (Protocol) + Hostname + Port</strong>. If any of these three elements differ between the frontend and the backend API, the request is cross-origin.</p>

<p>Cross-Origin Resource Sharing (CORS) is the explicit opt-in mechanism by which a server instructs the client browser: <em>"I trust requests originating from this specific domain, and you are permitted to share the response with client-side JavaScript."</em></p>

<h2>Simple Requests vs. Preflight OPTIONS Exchanges</h2>
<p>Not every cross-origin request triggers a preflight. The browser classifies requests into two distinct categories:</p>

<ul>
  <li><strong>Simple Requests:</strong> Requests using standard methods (<code>GET</code>, <code>HEAD</code>, or simple <code>POST</code>) with basic standard headers (such as <code>text/plain</code> or <code>multipart/form-data</code>). These requests are dispatched immediately without prior negotiation.</li>
  <li><strong>Preflighted Requests:</strong> Any request that uses modern API patterns, such as sending <code>Content-Type: application/json</code>, custom authentication headers (e.g. <code>Authorization: Bearer ...</code>), or mutating HTTP verbs like <code>PUT</code>, <code>DELETE</code>, or <code>PATCH</code>.</li>
</ul>

<p>Before dispatching a preflighted request, the browser automatically sends an invisible <strong>HTTP OPTIONS preflight request</strong> to probe server permissions. If the server does not return the exact expected CORS headers with a successful HTTP <code>200</code> or <code>204 No Content</code> status code, the browser deliberately terminates the connection and refuses to expose the response.</p>

<h2>The 4 Most Common CORS Failure Archetypes</h2>

<h3>1. Missing or Misconfigured Access-Control-Allow-Origin</h3>
<p>The most common failure occurs when the server returns a static origin or fails to reflect the exact origin header sent by the client. Remember: if your API requires credentials (cookies or authorization headers), setting <code>Access-Control-Allow-Origin: *</code> is explicitly forbidden by browser specifications.</p>

<h3>2. Missing Custom Headers in Access-Control-Allow-Headers</h3>
<p>If your frontend client sends custom telemetry headers (e.g., <code>X-Request-Id</code>, <code>X-Client-Version</code>, or <code>Authorization</code>), the server's preflight response must explicitly whitelist them in the <code>Access-Control-Allow-Headers</code> header.</p>

<h3>3. HTTP 301/302 Redirects on Preflight Requests</h3>
<p>If your backend infrastructure enforces HTTPS redirects or trailing slash normalization (e.g., redirecting <code>/api/users</code> to <code>/api/users/</code>), many reverse proxies strip CORS headers during the 301/302 redirect. Modern browsers treat redirects on OPTIONS requests as fatal CORS failures.</p>

<h3>4. Reverse Proxy or Gateway Dropping HTTP 204 Responses</h3>
<p>In Kubernetes, Nginx, or AWS API Gateway environments, unconfigured route catchers often return <code>403 Forbidden</code> or <code>405 Method Not Allowed</code> when an <code>OPTIONS</code> request arrives, preventing the client from ever proceeding to the actual payload call.</p>

<h2>Production-Ready Server Configuration Example (Node.js / Express)</h2>
<p>Here is an enterprise-grade CORS configuration in Express that properly handles preflights, dynamic origin whitelisting, and credentialed requests:</p>

<pre><code>import cors from 'cors';
import express from 'express';

const app = express();

const ALLOWED_ORIGINS = [
  'https://app.example.com',
  'https://staging.example.com',
];

app.use(cors({
  origin: (origin, callback) =&gt; {
    // Allow non-browser requests (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy whitelist'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  maxAge: 86400, // Cache preflight response for 24 hours
}));

// Explicitly handle preflight options wildcard
app.options('*', cors());</code></pre>

<h2>How BugSnap Triages CORS Failures in 30 Seconds</h2>
<p>Instead of forcing developers to guess whether the issue was a proxy redirect, an unwhitelisted header, or a missing origin, <a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> records the complete two-way HTTP handshake:</p>

<ol>
  <li><strong>Side-by-Side OPTIONS Telemetry:</strong> In the BugSnap Network tab, both the preliminary <code>OPTIONS</code> call and the subsequent fetch attempt are displayed in chronologically grouped pairs.</li>
  <li><strong>Full Header Inspection:</strong> Developers can inspect the exact client request headers and server response headers with a single click, immediately spotting omitted CORS attributes.</li>
  <li><strong>1-Click cURL Replay:</strong> BugSnap generates an exact reproduction command with origin and authorization headers included, allowing backend developers to test the exact browser condition in terminal.</li>
</ol>
""".strip(),
        "contentId": """
<p>Setiap QA engineer dan web developer pasti pernah melihat pesan merah legendaris di konsol browser: <em>"Access to fetch at 'https://api.example.com/data' from origin 'https://app.example.com' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource."</em></p>

<p>Ketika masalah ini muncul di tengah sprint pengujian, biasanya terjadi perdebatan klasik antar-tim. Tester junior melapor: <em>"API backend down total."</em> Developer backend mencoba endpoint tersebut di Postman atau terminal cURL, melihat status <code>200 OK</code>, lalu membalas: <em>"API lancar jaya kok di Postman, ini pasti bug front-end."</em></p>

<p>Keduanya benar dalam sudut pandang masing-masing, namun jam kerja tim terbuang sia-sia karena screenshot biasa tidak mampu memperlihatkan pertukaran request HTTP preflight yang terjadi sebelum request utama dieksekusi.</p>

<h2>Same-Origin Policy (SOP) vs. CORS: Fondasi Keamanan Browser</h2>
<p>Browser menerapkan <strong>Same-Origin Policy (SOP)</strong> untuk melindungi pengguna dari skrip jahat di satu website yang mencoba mencuri data dari website lain yang sedang login. Sebuah origin didefinisikan oleh kombinasi persis antara <strong>Protokol + Domain + Port</strong>. Jika salah satu dari ketiga elemen ini berbeda antara web frontend dan server backend, request tersebut masuk kategori cross-origin.</p>

<p>Cross-Origin Resource Sharing (CORS) adalah mekanisme izin resmi di mana server memberi tahu browser client: <em>"Saya mempercayai request dari domain ini, dan Anda diizinkan membagikan respons data ini ke JavaScript sisi client."</em></p>

<h2>Request Sederhana (Simple) vs. Request Preflight (OPTIONS)</h2>
<p>Tidak semua request cross-origin memicu preflight. Browser membedakan request ke dalam dua kategori:</p>

<ul>
  <li><strong>Simple Request:</strong> Request dengan metode standar (<code>GET</code>, <code>HEAD</code>, atau <code>POST</code> biasa) dengan header dasar seperti <code>text/plain</code>. Request ini langsung dikirim tanpa negosiasi awal.</li>
  <li><strong>Preflighted Request:</strong> Request modern yang mengirim header <code>Content-Type: application/json</code>, token otorisasi (<code>Authorization: Bearer ...</code>), atau metode seperti <code>PUT</code>, <code>DELETE</code>, atau <code>PATCH</code>.</li>
</ul>

<p>Sebelum mengirim request preflighted, browser secara otomatis mengirim <strong>request HTTP OPTIONS preflight</strong> untuk mengecek izin server. Jika server tidak mengembalikan header CORS yang cocok dengan status HTTP <code>200</code> atau <code>204 No Content</code>, browser akan langsung membatalkan koneksi demi keamanan.</p>

<h2>4 Penyebab Utama Kegagalan CORS</h2>

<h3>1. Header Access-Control-Allow-Origin Tidak Cocok</h3>
<p>Server mengembalikan origin yang kaku atau lupa mencantumkan domain frontend staging. Ingat: jika request membawa cookie atau header kredensial, penggunaan tanda bintang <code>Access-Control-Allow-Origin: *</code> dilarang keras oleh standar keamanan browser.</p>

<h3>2. Header Custom Belum Masuk Whitelist</h3>
<p>Jika frontend mengirim header khusus (seperti <code>X-Request-Id</code> atau <code>Authorization</code>), server wajib mencantumkannya secara eksplisit pada header <code>Access-Control-Allow-Headers</code>.</p>

<h3>3. Redirect HTTP 301/302 pada Request Preflight</h3>
<p>Jika server backend mengarahkan URL HTTP ke HTTPS atau memaksakan trailing slash (misal dari <code>/api/users</code> ke <code>/api/users/</code>), banyak proxy yang membuang header CORS saat redirect. Browser modern menganggap redirect pada OPTIONS sebagai kegagalan CORS fatal.</p>

<h3>4. Reverse Proxy Memblokir Method OPTIONS</h3>
<p>Pada konfigurasi Nginx atau API Gateway tertentu, route catcher yang salah konfigurasi sering merespons <code>403 Forbidden</code> atau <code>405 Method Not Allowed</code> saat menerima request <code>OPTIONS</code>.</p>

<h2>Contoh Konfigurasi Server yang Tepat (Express / Node.js)</h2>
<p>Berikut contoh konfigurasi CORS tingkat produksi yang aman dan mendukung kredensial serta caching preflight:</p>

<pre><code>import cors from 'cors';
import express from 'express';

const app = express();

const ALLOWED_ORIGINS = [
  'https://app.example.com',
  'https://staging.example.com',
];

app.use(cors({
  origin: (origin, callback) =&gt; {
    // Izinkan pemanggilan non-browser (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Diblokir oleh whitelist CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  maxAge: 86400, // Simpan cache preflight selama 24 jam
}));

app.options('*', cors());</code></pre>

<h2>Melacak Error CORS dalam 30 Detik Bersama BugSnap</h2>
<p>Daripada membuang waktu berdebat apakah masalahnya ada di Nginx, proxy redirect, atau header yang tertinggal, <a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> merekam seluruh jejak komunikasi dua arah:</p>

<ol>
  <li><strong>Telemetri Request OPTIONS Berdampingan:</strong> Pada tab Network BugSnap, request <code>OPTIONS</code> preflight dan request data utama ditampilkan berdampingan secara kronologis.</li>
  <li><strong>Inspeksi Header Lengkap:</strong> Developer dapat melihat header request client dan header respons server dalam satu klik untuk langsung menemukan atribut CORS yang hilang.</li>
  <li><strong>Ekspor cURL 1-Klik:</strong> BugSnap menyediakan perintah cURL lengkap dengan header origin, memudahkan backend developer menguji kondisi browser langsung dari terminal mereka.</li>
</ol>
""".strip()
    },
    {
        "slug": "interaction-to-next-paint-inp-debugging-for-qa",
        "title": "Debugging Interaction to Next Paint (INP): How QA Catches UI Freezes",
        "titleId": "Mendiagnosis Interaction to Next Paint (INP): Cara QA Mendeteksi UI Freeze",
        "description": "Google replaced FID with Interaction to Next Paint as a Core Web Vital. Discover how QA teams profile long tasks and main thread bottlenecks.",
        "descriptionId": "Google telah mengganti metrik FID dengan INP. Pelajari bagaimana tim QA melacak task berat dan pembekuan thread utama sebelum berdampak ke pengguna.",
        "category": "Performance & QA",
        "readTime": "9 min read",
        "tags": ["web-vitals", "inp", "performance", "frontend", "qa-guide"],
        "content": """
<p>In March 2024, Google officially transitioned <strong>Interaction to Next Paint (INP)</strong> into a core ranking factor within the Core Web Vitals standard, permanently retiring the legacy First Input Delay (FID) metric.</p>

<p>For engineering teams, this represents a monumental paradigm shift. While FID only measured the initial delay of the very first click when a page loaded, INP monitors <em>every single user interaction</em> — clicks, taps, keypresses, and modal transitions — throughout the entire lifespan of the browser tab. It measures the total latency from user input to the exact moment the browser paints updated visual pixels on screen.</p>

<h2>The 3 Phases of Every User Interaction</h2>
<p>When an INP latency spike occurs, the bottleneck lives within one of three sequential phases:</p>

<ol>
  <li><strong>Input Delay:</strong> The time between when the physical click occurs and when the browser's main thread is finally free to start executing event callbacks. High input delay is usually caused by unrelated long tasks monopolizing the CPU.</li>
  <li><strong>Processing Time:</strong> The duration required to execute the JavaScript event handler code (such as React state updates, sorting an array of 5,000 items, or calculating cart totals).</li>
  <li><strong>Presentation Delay:</strong> The time required for the browser engine to perform style recalculation, layout reflow, composite layers, and paint the new frame onto the physical display.</li>
</ol>

<h2>The Official Google INP Thresholds</h2>
<p>Google evaluates site responsiveness against strict percentile thresholds (evaluating the 75th percentile of all interactions):</p>

<ul>
  <li><strong>Good (&lt;= 200 ms):</strong> The interface feels instantaneous and fluid to users.</li>
  <li><strong>Needs Improvement (200 ms - 500 ms):</strong> Noticeable sluggishness and micro-stuttering occurs during interactions.</li>
  <li><strong>Poor (&gt; 500 ms):</strong> Severe visual freezes where users repeatedly click buttons because the screen appears dead.</li>
</ul>

<h2>The 3 Biggest Culprits Behind Poor INP</h2>

<h3>1. Long Tasks (&gt; 50ms) on the Main Thread</h3>
<p>Because JavaScript is single-threaded, any execution block exceeding 50ms blocks the event loop. If a user clicks a dropdown while a background analytics script or a large JSON parser is busy, the user click sits frozen in the event queue.</p>

<h3>2. Synchronous Layout Thrashing</h3>
<p>Alternating between writing to the DOM and immediately reading computed layout properties (e.g., <code>element.classList.add('active'); const height = element.offsetHeight;</code>) forces the browser to recompute layout synchronously in the middle of a JavaScript execution frame.</p>

<h3>3. Massive Component Re-Render Cascades in React</h3>
<p>In unoptimized React applications, typing a single letter into a search input field can trigger full-tree re-rendering of hundreds of child components if state is lifted too high without memoization or transition scheduling.</p>

<h2>Defensive Code Pattern: Chunking Tasks with Modern Web APIs</h2>
<p>To keep the main thread responsive during heavy operations, modern frontend developers use <code>scheduler.yield()</code> or React 18's <code>startTransition</code>:</p>

<pre><code>import { useState, useTransition } from 'react';

export function SearchFilterList({ items }: { items: string[] }) {
  const [query, setQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);
  const [isPending, startTransition] = useTransition();

  function handleInputChange(e: React.ChangeEvent&lt;HTMLInputElement&gt;) {
    const nextQuery = e.target.value;
    
    // 1. Update high-priority input state immediately for instant typing feedback
    setQuery(nextQuery);

    // 2. Defer heavy filtering calculation so main thread can yield to paint
    startTransition(() =&gt; {
      const results = items.filter(item =&gt; 
        item.toLowerCase().includes(nextQuery.toLowerCase())
      );
      setFilteredItems(results);
    });
  }

  return (
    &lt;div&gt;
      &lt;input value={query} onChange={handleInputChange} placeholder="Search..." /&gt;
      {isPending &amp;&amp; &lt;span&gt;Filtering list...&lt;/span&gt;}
      &lt;ul&gt;
        {filteredItems.map(item =&gt; &lt;li key={item}&gt;{item}&lt;/li&gt;)}
      &lt;/ul&gt;
    &lt;/div&gt;
  );
}</code></pre>

<h2>How BugSnap Helps QA Catch INP Freezes Before Release</h2>
<p>Rather than requiring developers to comb through gigabytes of Chrome DevTools Performance traces, <a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> provides real-time Web Vitals instrumentation directly in exploratory QA captures:</p>

<ul>
  <li><strong>Instant INP Spike Flagging:</strong> Any interaction exceeding the 200ms benchmark is highlighted with an actionable badge in the bug recording timeline.</li>
  <li><strong>Long Task Call-Site Correlation:</strong> BugSnap correlates the freeze with the exact JavaScript function and stack trace that monopolized the main thread.</li>
  <li><strong>Action-Synchronized Video:</strong> Developers can watch the video playback and see the exact millisecond input delay graph side-by-side with the tester's click.</li>
</ul>
""".strip(),
        "contentId": """
<p>Pada Maret 2024, Google secara resmi menetapkan <strong>Interaction to Next Paint (INP)</strong> sebagai metrik utama dalam standar Core Web Vitals dan memensiunkan metrik lama First Input Delay (FID).</p>

<p>Bagi tim rekayasa web, ini adalah perubahan standar yang sangat besar. Jika metrik FID lama hanya mengukur kelancaran klik pertama saat halaman baru dimuat, metrik INP memantau <em>setiap interaksi pengguna</em> — klik tombol, pengetikan keyboard, dan pembukaan modal — selama tab browser dibuka. INP mengukur total latensi dari saat input dilakukan hingga frame visual baru berhasil digambar (paint) di layar.</p>

<h2>3 Tahapan dalam Setiap Interaksi Pengguna</h2>
<p>Ketika skor INP melonjak tinggi, pembekuan antarmuka terjadi di salah satu dari tiga fase berurutan:</p>

<ol>
  <li><strong>Input Delay:</strong> Waktu tunggu dari klik fisik hingga main thread browser siap mengeksekusi event handler. Keterlambatan ini biasanya disebabkan oleh tugas berat lain yang sedang memonopoli CPU.</li>
  <li><strong>Processing Time:</strong> Waktu yang dihabiskan untuk menjalankan baris kode JavaScript (seperti kalkulasi state React atau pengurutan ribuan data).</li>
  <li><strong>Presentation Delay:</strong> Waktu yang dibutuhkan mesin browser untuk menghitung ulang gaya (style recalculation), tata letak (layout reflow), dan menggambar piksel baru di monitor.</li>
</ol>

<h2>Batas Standar Resmi Metrik INP dari Google</h2>
<p>Google menilai performa responsivitas web berdasarkan persentil ke-75 dari seluruh interaksi pengguna:</p>

<ul>
  <li><strong>Baik (&lt;= 200 ms):</strong> Antarmuka terasa instan, halus, dan responsif.</li>
  <li><strong>Perlu Perbaikan (200 ms - 500 ms):</strong> Terjadi jeda mikro yang mulai dirasakan pengguna.</li>
  <li><strong>Buruk (&gt; 500 ms):</strong> Antarmuka membeku parah, sering kali memicu pengguna mengeklik tombol berkali-kali karena dikira rusak.</li>
</ul>

<h2>3 Penyebab Terbesar Anjloknya Skor INP</h2>

<h3>1. Long Tasks (&gt; 50ms) pada Main Thread</h3>
<p>Karena JavaScript berjalan pada single-thread, fungsi apa pun yang berjalan lebih dari 50ms akan mengunci event loop. Jika pengguna mengeklik dropdown saat parsing JSON besar sedang berjalan, klik tersebut akan membeku di antrean event.</p>

<h3>2. Layout Thrashing Sinkron</h3>
<p>Kebiasaan membaca properti geometri DOM tepat setelah mengubah class styling (misal: <code>element.classList.add('open'); const w = element.offsetWidth;</code>) memaksa browser melakukan kalkulasi reflow secara paksa di tengah eksekusi kode.</p>

<h3>3. Re-render React Berantai (Cascading Re-renders)</h3>
<p>Pada aplikasi React yang belum dioptimalkan, mengetik satu huruf di form pencarian bisa memicu re-render ratusan komponen anak secara rekursif jika state diangkat terlalu tinggi tanpa memoization.</p>

<h2>Pola Kode Modern: Memecah Task dengan useTransition</h2>
<p>Gunakan fitur <code>startTransition</code> pada React 18 untuk memprioritaskan kelancaran ketikan pengguna di atas kalkulasi daftar data yang berat:</p>

<pre><code>import { useState, useTransition } from 'react';

export function SearchFilterList({ items }: { items: string[] }) {
  const [query, setQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);
  const [isPending, startTransition] = useTransition();

  function handleInputChange(e: React.ChangeEvent&lt;HTMLInputElement&gt;) {
    const nextQuery = e.target.value;
    
    // 1. Update state input prioritas tinggi agar ketikan terasa instan
    setQuery(nextQuery);

    // 2. Tunda kalkulasi filter berat agar thread utama bisa melakukan render frame
    startTransition(() =&gt; {
      const results = items.filter(item =&gt; 
        item.toLowerCase().includes(nextQuery.toLowerCase())
      );
      setFilteredItems(results);
    });
  }

  return (
    &lt;div&gt;
      &lt;input value={query} onChange={handleInputChange} placeholder="Cari data..." /&gt;
      {isPending &amp;&amp; &lt;span&gt;Menyaring data...&lt;/span&gt;}
      &lt;ul&gt;
        {filteredItems.map(item =&gt; &lt;li key={item}&gt;{item}&lt;/li&gt;)}
      &lt;/ul&gt;
    &lt;/div&gt;
  );
}</code></pre>

<h2>Mendeteksi Masalah INP Lebih Awal Bersama BugSnap</h2>
<p>Alih-alih menuntut developer membedah file tracing raksasa di tab Performance Chrome DevTools, <a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> secara otomatis memonitor metrik Web Vitals selama sesi pengujian:</p>

<ul>
  <li><strong>Badge Peringatan INP Otomatis:</strong> Setiap interaksi yang melampaui batas 200ms langsung ditandai dengan badge peringatan pada timeline laporan bug.</li>
  <li><strong>Korelasi Stack Trace Long Task:</strong> BugSnap mengaitkan momen freeze dengan baris kode JavaScript dan fungsi yang memonopoli main thread.</li>
  <li><strong>Video yang Tersinkronisasi:</strong> Developer dapat memutar ulang video dan melihat grafik input delay tepat di detik interaksi dilakukan oleh tester.</li>
</ul>
""".strip()
    }
]

def get_existing_slugs(blog_content: str) -> set:
    return set(re.findall(r'slug:\s*["\']([^"\']+)["\']', blog_content))

def publish_next_post():
    with open(BLOG_TS_PATH, "r", encoding="utf-8") as f:
        blog_content = f.read()

    existing_slugs = get_existing_slugs(blog_content)
    print(f"Existing slugs in blog.ts: {len(existing_slugs)}")

    # Pick first topic that hasn't been published yet
    candidate = None
    for topic in EDITORIAL_TOPICS:
        if topic["slug"] not in existing_slugs:
            candidate = topic
            break

    if not candidate:
        print("All predefined editorial topics have already been published! Creating dynamic topic...")
        # Fallback dynamic generator
        day_str = datetime.now().strftime("%Y-%m-%d")
        ts = int(datetime.now().timestamp())
        candidate = {
            "slug": f"mastering-devtools-telemetry-qa-{ts}",
            "title": f"Mastering DevTools Telemetry for Non-Developers (Edition {day_str})",
            "titleId": f"Menguasai Telemetri DevTools untuk Tim Non-Developer (Edisi {day_str})",
            "description": "Bridge the gap between QA bug reporting and developer debugging with automated DevTools telemetry capture.",
            "descriptionId": "Jembatani komunikasi antara tim QA dan developer melalui penangkapan telemetri DevTools otomatis.",
            "category": "QA & DevTools",
            "readTime": "5 min read",
            "tags": ["devtools", "qa", "developer-tips"],
            "content": "<p>Understanding network failures, console stack traces, and environment telemetry helps teams triage bugs 5x faster.</p>",
            "contentId": "<p>Memahami kegagalan network, stack trace console, dan telemetri sistem membantu tim menyelesaikan bug 5 kali lebih cepat.</p>"
        }

    slug = candidate["slug"]
    title = candidate["title"]
    category = candidate["category"]
    read_time = candidate["readTime"]
    today_date = datetime.now().strftime("%Y-%m-%d")

    # 1. Generate cover image matching article slug exactly
    image_filename = f"{slug}.webp"
    image_output_path = os.path.join(PUBLIC_BLOG_DIR, image_filename)
    print(f"Generating cover image: {image_output_path} ...")
    create_blog_cover(
        title=title,
        category=category,
        output_path=image_output_path,
        slug=slug,
        read_time=read_time
    )

    # 2. Format new BlogPost entry
    entry_ts = f"""  // ─── Article: {title} ───
  {{
    slug: "{slug}",
    title: "{candidate['title']}",
    titleId: "{candidate['titleId']}",
    description: "{candidate['description']}",
    descriptionId: "{candidate['descriptionId']}",
    date: "{today_date}",
    author: "BugSnap Team",
    readTime: "{read_time}",
    tags: {json.dumps(candidate['tags'])},
    coverImage: "/blog/{image_filename}",
    ogImage: "/blog/{image_filename}",
    content: `
{candidate['content']}
    `.trim(),
    contentId: `
{candidate['contentId']}
    `.trim(),
  }},
"""

    # Insert into blogPosts array in blog.ts (before the closing '];')
    marker = "export const blogPosts: BlogPost[] = ["
    if marker in blog_content:
        # Prepend to the top of the list so it appears as the newest post
        new_content = blog_content.replace(marker, marker + "\n" + entry_ts, 1)
        with open(BLOG_TS_PATH, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Successfully published '{slug}' into {BLOG_TS_PATH}!")
    else:
        raise RuntimeError("Could not find blogPosts array marker in blog.ts")

    result = {
        "status": "published",
        "slug": slug,
        "title": title,
        "titleId": candidate["titleId"],
        "coverImage": f"/blog/{image_filename}",
        "url": f"http://localhost:3000/blog/{slug}",
        "blogListUrl": "http://localhost:3000/blog"
    }
    print(json.dumps(result, indent=2))
    return result

if __name__ == "__main__":
    publish_next_post()
