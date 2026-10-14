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
        "slug": "replacing-loom-and-jam-zero-server-storage",
        "title": "Why Engineering Teams Are Moving Beyond Loom and Jam.dev to BYO Storage",
        "titleId": "Mengapa Tim Engineering Beralih dari Loom dan Jam.dev ke Model BYO Storage",
        "description": "Enterprise security teams reject third-party video storage. Compare the trade-offs between multi-tenant cloud storage and direct Google Drive ownership.",
        "descriptionId": "Tim keamanan perusahaan menghindari penyimpanan video di server pihak ketiga. Pelajari perbandingan antara storage multi-tenant dan kepemilikan Google Drive mandiri.",
        "category": "Security & Architecture",
        "readTime": "5 min read",
        "tags": ["enterprise", "security", "google-drive", "developer-tools"],
        "content": """
<p>Over the past three years, visual bug reporting tools like Loom and Jam.dev surged in popularity. Recording a quick video or capturing a browser tab is infinitely faster than writing manual reproduction steps.</p>

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
<p>Dalam beberapa tahun terakhir, alat pelaporan bug visual seperti Loom dan Jam.dev sangat populer karena memudahkan tester merekam masalah tanpa menulis langkah reproduksi panjang.</p>

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
        "readTime": "5 min read",
        "tags": ["cors", "network", "api", "qa-guide"],
        "content": """
<p>Every QA engineer has seen the dreaded red console banner: <em>"Access to fetch at '...' from origin '...' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource."</em></p>

<p>When this happens, junior testers often report: <em>"The backend API is down."</em> Developers respond: <em>"It works in Postman!"</em> Both are technically correct, but the team wastes an hour arguing because standard screenshots fail to capture HTTP preflight exchange telemetry.</p>

<h2>Understanding the HTTP OPTIONS Preflight</h2>
<p>Before a browser sends a non-simple request (such as a <code>POST</code> with <code>Content-Type: application/json</code> or custom Authorization headers), it fires an automatic <strong>OPTIONS preflight request</strong>. If the server does not explicitly return the allowed origins and methods on that preliminary flight, the browser forcibly aborts the real request before it ever leaves the client.</p>

<h2>How to Capture Complete Preflight Telemetry</h2>
<ol>
  <li><strong>Check Request Headers:</strong> Ensure the client origin matches the server's allowed domain whitelist.</li>
  <li><strong>Inspect Preflight Status:</strong> Did the server return <code>204 No Content</code> or fail with <code>403 Forbidden</code>?</li>
  <li><strong>Use Automated DevTools Recording:</strong> Rather than forcing developers to recreate identical origins, <a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> records complete request and response headers, allowing developers to see missing CORS headers instantly.</li>
</ol>
""".strip(),
        "contentId": """
<p>Pesan error CORS di console browser sering memicu perdebatan antara QA dan developer. Tester mengira backend down, sedangkan developer merasa API normal karena bisa dipanggil lewat Postman.</p>

<h2>Mengapa Terjadi Error Preflight?</h2>
<p>Sebelum mengirim request yang membawa header otorisasi, browser secara otomatis mengirim request <code>OPTIONS</code>. Jika server tidak mengembalikan header izin yang sesuai, browser langsung membatalkan request utama.</p>

<p>Dengan alat telemetri seperti <a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a>, header request dan status respons preflight otomatis tercatat lengkap di tiket bug sehingga akar masalah bisa diidentifikasi dalam hitungan detik.</p>
""".strip()
    },
    {
        "slug": "interaction-to-next-paint-inp-debugging-for-qa",
        "title": "Debugging Interaction to Next Paint (INP): How QA Catches UI Freezes",
        "titleId": "Mendiagnosis Interaction to Next Paint (INP): Cara QA Mendeteksi UI Freeze",
        "description": "Google replaced FID with Interaction to Next Paint as a Core Web Vital. Discover how QA teams profile long tasks and main thread bottlenecks.",
        "descriptionId": "Google telah mengganti metrik FID dengan INP. Pelajari bagaimana tim QA melacak task berat dan pembekuan thread utama sebelum berdampak ke pengguna.",
        "category": "Performance & QA",
        "readTime": "6 min read",
        "tags": ["web-vitals", "inp", "performance", "frontend"],
        "content": """
<p>In March 2024, Google officially made <strong>Interaction to Next Paint (INP)</strong> a Core Web Vital, replacing the legacy First Input Delay (FID) metric. Unlike FID, which only measured the initial delay of the very first click on page load, INP observes <em>every single interaction</em> throughout the user's entire session and reports the worst 98th-percentile latency.</p>

<h2>What Causes High INP Latency?</h2>
<ul>
  <li><strong>Long JavaScript Tasks:</strong> Execution blocks exceeding 50ms that monopolize the single-threaded V8 engine.</li>
  <li><strong>Heavy React Re-renders:</strong> Triggering recursive component subtree reconciliation on simple keyboard inputs.</li>
  <li><strong>Synchronous Layout Thrashing:</strong> Reading layout properties (e.g., <code>offsetHeight</code>) immediately after mutating the DOM style tree.</li>
</ul>

<h2>The 200 Millisecond Threshold</h2>
<p>Google categorizes INP performance into three tiers:</p>
<ul>
  <li><strong>Good:</strong> Below 200 ms.</li>
  <li><strong>Needs Improvement:</strong> Between 200 ms and 500 ms.</li>
  <li><strong>Poor:</strong> Above 500 ms (visual freeze apparent to users).</li>
</ul>

<h2>How BugSnap Helps QA Track INP</h2>
<p><a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> records real-time Web Vitals and long task execution times directly during manual testing sessions. When an input stutters, the exact millisecond duration and blocking script stack are automatically attached to the capture.</p>
""".strip(),
        "contentId": """
<p>Google resmi menjadikan <strong>Interaction to Next Paint (INP)</strong> sebagai metrik utama Core Web Vitals. Berbeda dari FID yang hanya mengukur klik pertama, INP mengukur kelancaran seluruh interaksi selama pengguna berada di halaman.</p>

<h2>Penyebab Utama Tingginya Latensi INP</h2>
<p>Tugas JavaScript berat yang berjalan di atas 50ms, re-render React yang berlebihan, dan reflow DOM berantai adalah penyebab utama antarmuka membeku saat diklik.</p>

<p>Melalui rekaman performa otomatis di <a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a>, waktu respons UI dan indikator Web Vitals langsung tercatat sehingga performa lambat bisa terdeteksi sejak tahap pengujian internal.</p>
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
