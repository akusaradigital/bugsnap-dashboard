export interface BlogPost {
  slug: string;
  title: string;
  titleId: string;
  description: string;
  descriptionId: string;
  date: string;
  author: string;
  readTime: string;
  tags: string[];
  coverImage: string;
  ogImage: string;
  content: string;
  contentId: string;
}

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

export const blogPosts: BlogPost[] = [
  // ─── Article: Zero Storage Liability: Why BYO Google Drive Wins for Enterprise QA ───
  {
    slug: "zero-storage-liability-why-byo-google-drive-wins",
    title: "Zero Storage Liability: Why BYO Google Drive Wins for Enterprise QA",
    titleId: "Zero Storage Liability: Mengapa Google Drive Pribadi Lebih Aman untuk QA Perusahaan",
    description: "SaaS storage locks your bug recordings into third-party silos. Discover how the Bring-Your-Own-Storage model guarantees data privacy and eliminates vendor lock-in.",
    descriptionId: "Penyimpanan SaaS mengunci rekaman bug ke server pihak ketiga. Pelajari bagaimana model Bring-Your-Own-Storage menjamin privasi data dan mengeliminasi biaya penyimpanan berlebih.",
    date: "2026-10-26",
    author: "BugSnap Team",
    readTime: "4 min read",
    tags: ["security", "google-drive", "enterprise", "privacy"],
    coverImage: "/blog/zero-storage-liability-why-byo-google-drive-wins.webp",
    ogImage: "/blog/zero-storage-liability-why-byo-google-drive-wins.webp",
    content: `
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
    `.trim(),
    contentId: `
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
    `.trim(),
  },

  // ─── Article: From Bug Recording to Automated Playwright Test: Closing the QA-Dev Loop ───
  {
    slug: "from-bug-recording-to-automated-playwright-test",
    title: "From Bug Recording to Automated Playwright Test: Closing the QA-Dev Loop",
    titleId: "Dari Rekaman Bug ke Tes Otomatis Playwright: Mempercepat Siklus QA-Dev",
    description: "Stop manually writing test reproductions from scratch. Learn how capturing structured user action telemetry transforms bug videos into automated Playwright scripts.",
    descriptionId: "Hentikan penulisan skrip uji reproduksi manual dari nol. Pelajari cara mengubah rekaman aksi pengguna menjadi skrip otomatis Playwright yang siap pakai.",
    date: "2026-10-19",
    author: "BugSnap Team",
    readTime: "6 min read",
    tags: ["playwright", "test-automation", "qa", "developer-productivity"],
    coverImage: "/blog/from-bug-recording-to-automated-playwright-test.webp",
    ogImage: "/blog/from-bug-recording-to-automated-playwright-test.webp",
    content: `
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
    `.trim(),
    contentId: `
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
    `.trim(),
  },

  // ─── Article: Detecting SPA Memory Leaks & DOM Bloat in Single Page Applications ───
  {
    slug: "detecting-spa-memory-leaks-and-dom-bloat",
    title: "Detecting SPA Memory Leaks & DOM Bloat in Single Page Applications",
    titleId: "Mendeteksi Kebocoran Memori & Pembengkakan DOM pada Aplikasi SPA",
    description: "Unmounted components and detached DOM nodes silently degrade web performance. Learn how to track JS heap growth and element bloat during QA testing.",
    descriptionId: "Komponen yang di-unmount dan node DOM yang tertinggal dapat menurunkan performa web. Pelajari cara melacak kenaikan heap JS dan pembengkakan elemen saat pengujian QA.",
    date: "2026-10-13",
    author: "BugSnap Team",
    readTime: "5 min read",
    tags: ["web-performance", "spa", "memory-leaks", "devtools"],
    coverImage: "/blog/detecting-spa-memory-leaks-and-dom-bloat.webp",
    ogImage: "/blog/detecting-spa-memory-leaks-and-dom-bloat.webp",
    content: `
<p>Modern frontend frameworks like React, Vue, and Next.js make dynamic user interfaces effortless, but they also introduce an insidious class of bugs: <strong>Single Page Application (SPA) memory leaks and DOM bloat</strong>.</p>

<p>Unlike traditional multi-page websites where every navigation wipes the JavaScript heap clean, an SPA retains its runtime context indefinitely. If a developer forgets to clear an interval, detach a global event listener, or clean up an RxJS subscription, retained DOM nodes accumulate in memory, causing the browser tab to slow down, stutter, and eventually crash.</p>

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
    `.trim(),
    contentId: `
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
    `.trim(),
  },

  // ─── Article 1 ───────────────────────────────────────────────────────────────
  {
    slug: "how-to-report-bugs-effectively",
    title: "How to Write Bug Reports That Developers Actually Want to Read",
    titleId: "Cara Menulis Bug Report yang Benar-Benar Dibaca Developer",
    description:
      "A good bug report cuts debugging time in half. Learn what information to include, what to skip, and how to structure reports that get fixed fast.",
    descriptionId:
      "Bug report yang baik memangkas waktu debugging hingga setengahnya. Pelajari informasi apa yang perlu disertakan dan cara menyusun laporan yang cepat diperbaiki.",
    date: "2026-10-01",
    author: "BugSnap Team",
    readTime: "5 min read",
    tags: ["bug-reporting", "qa", "developer-tips"],
    coverImage: "/blog/how-to-report-bugs-effectively.webp",
    ogImage: "/blog/how-to-report-bugs-effectively.webp",
    content: `
<p>A bad bug report wastes everyone's time. The developer spends an hour trying to reproduce something they can't see, asks five follow-up questions, and the reporter has already forgotten the exact steps they took. A good bug report, by contrast, gets triaged, prioritized, and fixed, often without a single back-and-forth message.</p>

<p>Here's what separates the two.</p>

<h2>1. Start With a Clear, Specific Title</h2>
<p>Compare these two titles:</p>
<ul>
  <li><strong>Bad:</strong> "Login is broken"</li>
  <li><strong>Good:</strong> "Login button unresponsive on /checkout after entering wrong password once"</li>
</ul>
<p>The specific title tells the developer which component, condition, and page are involved before they even open the report.</p>

<h2>2. Include Steps to Reproduce</h2>
<p>This is the most important section. Number them clearly:</p>
<ol>
  <li>Navigate to <code>/checkout</code></li>
  <li>Click "Sign in" and enter a wrong password</li>
  <li>Correct the password and click "Sign in" again</li>
  <li>The button becomes unresponsive (no loading state, no error)</li>
</ol>
<p>If you cannot write reproducible steps, the bug is nearly impossible to fix reliably. Before filing, try reproducing it yourself once more.</p>

<h2>3. State Expected vs. Actual Behavior</h2>
<p><strong>Expected:</strong> After entering the correct password, the user should be redirected to the dashboard.</p>
<p><strong>Actual:</strong> The Sign In button does nothing. No network request is visible in the Network tab.</p>
<p>This framing forces clarity and instantly shows the developer what success looks like.</p>

<h2>4. Attach a Screenshot or Screen Recording</h2>
<p>Text can describe a layout bug, but a screenshot proves it. A video proves a timing or flow issue in a way no text can. Annotate the screenshot with an arrow or highlight ("the button is here, and nothing happens") so reviewers don't have to hunt for it.</p>

<h2>5. Include Console Errors and Network Logs</h2>
<p>A <code>401 Unauthorized</code> on <code>/api/session</code> tells a developer exactly where the problem is. An unhandled JavaScript exception with a stack trace points to the exact file and line. Without these, the developer has to reproduce your steps, open DevTools, and manually find the errors themselves, adding 30 to 60 minutes to every bug.</p>

<h2>6. Capture Environment Details</h2>
<p>Browser version, OS, screen resolution, and user account type all matter. A bug on Safari 17 + macOS that can't be reproduced on Chrome on Windows is a very different debugging task than a universal regression.</p>

<h2>One Tool That Does All of This Automatically</h2>
<p>If you find yourself skipping half of these steps because they are tedious, tooling can help. <a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> is a free Chrome extension that captures your screen, automatically attaches console errors, network logs, and system info to every report in a single click. Your team gets a shareable link with everything a developer needs, without you having to open DevTools once.</p>
    `.trim(),
    contentId: `
<p>Bug report yang buruk membuang waktu semua orang. Developer menghabiskan satu jam mencoba mereproduksi sesuatu yang tidak bisa mereka lihat, mengajukan lima pertanyaan lanjutan, dan pelapor sudah lupa langkah-langkah persis yang mereka ambil. Bug report yang baik, sebaliknya, langsung ditindaklanjuti dan diperbaiki, sering kali tanpa satu pun pesan bolak-balik.</p>

<p>Inilah yang membedakan keduanya.</p>

<h2>1. Mulai dengan Judul yang Jelas dan Spesifik</h2>
<p>Bandingkan dua judul ini:</p>
<ul>
  <li><strong>Buruk:</strong> "Login rusak"</li>
  <li><strong>Baik:</strong> "Tombol login tidak merespons di /checkout setelah memasukkan password salah sekali"</li>
</ul>
<p>Judul yang spesifik memberi tahu developer komponen mana, kondisi apa, dan halaman mana, bahkan sebelum mereka membuka laporan.</p>

<h2>2. Sertakan Langkah-Langkah Reproduksi</h2>
<p>Ini adalah bagian terpenting. Tulis dengan nomor yang jelas:</p>
<ol>
  <li>Buka halaman <code>/checkout</code></li>
  <li>Klik "Sign in" dan masukkan password yang salah</li>
  <li>Perbaiki password dan klik "Sign in" lagi</li>
  <li>Tombol menjadi tidak merespons (tidak ada loading state, tidak ada error)</li>
</ol>
<p>Jika kamu tidak bisa menuliskan langkah reproduksi, bug hampir mustahil diperbaiki secara andal. Sebelum mengajukan laporan, coba reproduksi sendiri sekali lagi.</p>

<h2>3. Tulis Expected vs. Actual Behavior</h2>
<p><strong>Expected:</strong> Setelah memasukkan password yang benar, pengguna seharusnya diarahkan ke dashboard.</p>
<p><strong>Actual:</strong> Tombol Sign In tidak melakukan apa pun. Tidak ada network request yang terlihat di tab Network.</p>

<h2>4. Lampirkan Screenshot atau Screen Recording</h2>
<p>Teks bisa mendeskripsikan bug layout, tapi screenshot membuktikannya. Video membuktikan masalah timing atau alur dengan cara yang tidak bisa dilakukan teks. Beri anotasi pada screenshot dengan panah atau highlight agar reviewer tidak perlu mencarinya.</p>

<h2>5. Sertakan Console Error dan Network Log</h2>
<p><code>401 Unauthorized</code> pada <code>/api/session</code> langsung memberi tahu developer di mana masalahnya. Error JavaScript yang tidak tertangani dengan stack trace menunjukkan file dan baris yang tepat. Tanpa ini, developer harus mereproduksi langkahmu, membuka DevTools, dan mencari error secara manual, menambah 30 hingga 60 menit untuk setiap bug.</p>

<h2>6. Catat Detail Environment</h2>
<p>Versi browser, OS, resolusi layar, dan tipe akun pengguna semuanya penting. Bug di Safari 17 + macOS yang tidak bisa direproduksi di Chrome Windows adalah tugas debugging yang sangat berbeda dari regresi universal.</p>

<h2>Satu Alat yang Melakukan Semua Ini Secara Otomatis</h2>
<p>Jika kamu sering melewatkan langkah-langkah ini karena memakan waktu, masalahnya ada pada alat kerja. <a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> adalah ekstensi Chrome gratis yang merekam layar dan otomatis melampirkan console error, network log, serta info sistem ke setiap laporan dalam satu klik. Timmu mendapatkan link berbagi dengan semua data yang dibutuhkan developer tanpa perlu membuka DevTools sekali pun.</p>
    `.trim(),
  },

  // ─── Article 2 ───────────────────────────────────────────────────────────────
  {
    slug: "chrome-devtools-for-non-developers",
    title: "Chrome DevTools for QA Testers and PMs: What You Actually Need to Know",
    titleId: "Chrome DevTools untuk QA Tester dan PM: Yang Benar-Benar Perlu Kamu Tahu",
    description:
      "You don't need to be a developer to read browser errors. This guide covers the Console and Network tabs in plain language, along with how to share what you find.",
    descriptionId:
      "Kamu tidak perlu menjadi developer untuk membaca error browser. Panduan ini membahas tab Console dan Network dalam bahasa yang mudah dipahami.",
    date: "2026-09-15",
    author: "BugSnap Team",
    readTime: "6 min read",
    tags: ["devtools", "qa-testing", "chrome"],
    coverImage: "/blog/chrome-devtools-for-non-developers.webp",
    ogImage: "/opengraph-image.png",
    content: `
<p>Chrome DevTools can feel overwhelming if you have never used it before. With numerous panels and technical logs, it is easy to get lost. For bug reporting, however, you only need two tabs: <strong>Console</strong> and <strong>Network</strong>.</p>

<p>Here's the non-developer guide.</p>

<h2>Opening DevTools</h2>
<p>Press <code>F12</code> on Windows/Linux or <code>Cmd + Option + I</code> on Mac. A panel opens at the bottom or side of your browser. Click the <strong>Console</strong> tab to start.</p>

<h2>The Console Tab</h2>
<p>The Console shows messages from the webpage's JavaScript. Most are harmless info logs you can ignore. The ones that matter are red: they indicate errors.</p>

<p>A typical error looks like this:</p>
<p><code>Uncaught TypeError: Cannot read properties of null (reading 'submit')</code></p>

<p>You don't need to understand what this means; you only need to copy it. That stack trace tells developers exactly which file and line of code failed. Include it in your bug report and it saves them 30 minutes of guessing.</p>

<p><strong>Tip:</strong> Right-click inside the Console and choose "Save as" to export all logged errors to a file.</p>

<h2>The Network Tab</h2>
<p>The Network tab records every request the page sends to a server. When a feature fails silently (button does nothing, data doesn't save), the Network tab usually reveals why.</p>

<p>What to look for:</p>
<ul>
  <li><strong>Red rows:</strong> Failed requests. A <code>400</code> means bad data was sent. A <code>401</code> means authentication failed. A <code>500</code> means the server crashed.</li>
  <li><strong>Request URL:</strong> The endpoint that was called (e.g. <code>/api/checkout</code>)</li>
  <li><strong>Response body:</strong> Click the request, then "Response" tab to see what the server returned (often contains a helpful error message)</li>
</ul>

<p>Click the red row, screenshot the headers and response, and paste both into your bug report.</p>

<h2>What to Include in Your Report</h2>
<ol>
  <li>A screenshot of the Console tab with any red errors visible</li>
  <li>A screenshot of the Network tab filtered to show failed requests (click the red dot icon to filter)</li>
  <li>The page URL where the bug occurred</li>
  <li>Your browser version (type <code>chrome://version</code> in the address bar)</li>
</ol>

<h2>A Faster Way to Capture All of This</h2>
<p>Opening DevTools, switching tabs, screenshotting, and copying errors is a process that takes 5 to 10 minutes per bug. <a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> captures your screen recording and silently attaches console errors, network logs, and environment specs automatically. Your bug report arrives with everything above already included, and you never have to open DevTools at all.</p>
    `.trim(),
    contentId: `
<p>Chrome DevTools bisa terasa membingungkan jika baru pertama kali digunakan karena banyaknya panel dan log teknis. Namun untuk pelaporan bug, kamu hanya membutuhkan dua tab: <strong>Console</strong> dan <strong>Network</strong>.</p>

<p>Ini panduan untuk non-developer.</p>

<h2>Membuka DevTools</h2>
<p>Tekan <code>F12</code> di Windows/Linux atau <code>Cmd + Option + I</code> di Mac. Panel akan terbuka di bagian bawah atau samping browser. Klik tab <strong>Console</strong> untuk memulai.</p>

<h2>Tab Console</h2>
<p>Console menampilkan pesan dari JavaScript halaman web. Kebanyakan adalah info log yang tidak berbahaya. Yang paling penting adalah yang berwarna merah: baris tersebut menandakan error.</p>

<p>Error khas terlihat seperti ini:</p>
<p><code>Uncaught TypeError: Cannot read properties of null (reading 'submit')</code></p>

<p>Kamu tidak perlu memahami artinya; cukup salin pesan tersebut. Stack trace itu memberi tahu developer persis file dan baris kode mana yang gagal. Sertakan dalam bug reportmu dan itu menghemat 30 menit dugaan mereka.</p>

<p><strong>Tips:</strong> Klik kanan di dalam Console dan pilih "Save as" untuk mengekspor semua error yang tercatat ke file.</p>

<h2>Tab Network</h2>
<p>Tab Network merekam setiap permintaan yang dikirim halaman ke server. Ketika fitur gagal secara diam-diam (tombol tidak merespons, data tidak tersimpan), tab Network biasanya mengungkap alasannya.</p>

<p>Apa yang harus dicari:</p>
<ul>
  <li><strong>Baris merah:</strong> Permintaan yang gagal. Kode <code>400</code> berarti data yang dikirim salah. Kode <code>401</code> berarti autentikasi gagal. Kode <code>500</code> berarti server crash.</li>
  <li><strong>URL permintaan:</strong> Endpoint mana yang dipanggil (misalnya <code>/api/checkout</code>)</li>
  <li><strong>Response body:</strong> Klik permintaan, lalu tab "Response" untuk melihat apa yang dikembalikan server</li>
</ul>

<h2>Cara Lebih Cepat untuk Menangkap Semua Ini</h2>
<p>Membuka DevTools, berpindah tab, screenshot, dan menyalin error adalah proses yang memakan 5 hingga 10 menit per bug. <a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> merekam layarmu dan secara otomatis melampirkan console error, network log, dan spesifikasi environment, sehingga bug reportmu tiba dengan semua informasi di atas sudah disertakan, dan kamu tidak perlu membuka DevTools sama sekali.</p>
    `.trim(),
  },

  // ─── Article 3 ───────────────────────────────────────────────────────────────
  {
    slug: "screen-recording-for-bug-reports",
    title: "Why a 30-Second Screen Recording Beats a 5-Paragraph Bug Description",
    titleId: "Mengapa Screen Recording 30 Detik Lebih Baik dari Deskripsi Bug 5 Paragraf",
    description:
      "Text descriptions lose context. Screen recordings show exactly what broke, how you got there, and what you expected. Here's when and how to use them effectively.",
    descriptionId:
      "Deskripsi teks kehilangan konteks. Screen recording menunjukkan persis apa yang rusak, bagaimana kamu sampai di sana, dan apa yang diharapkan.",
    date: "2026-08-28",
    author: "BugSnap Team",
    readTime: "4 min read",
    tags: ["screen-recording", "bug-reporting", "productivity"],
    coverImage: "/blog/screen-recording-for-bug-reports.webp",
    ogImage: "/opengraph-image.png",
    content: `
<p>Consider a common scenario: a QA tester files a report stating that a form does not submit when clicking the button. The developer tests it locally, finds no issue, and asks for more details. After multiple rounds of clarifying messages, the issue remains unresolved until days later, when someone discovers it only triggers if the user previously visited the billing tab in that session.</p>

<p>A 30-second screen recording would have shown all of this instantly.</p>

<h2>What Text Descriptions Miss</h2>
<p>When you describe a bug in text, you are making decisions about what to include. You write what you consciously noticed, but bugs often live in the details you did not think were relevant:</p>
<ul>
  <li>Which tab you were on before navigating to the broken page</li>
  <li>The exact speed at which you clicked (double-click vs. slow click)</li>
  <li>A dropdown that was already pre-selected with a specific value</li>
  <li>A modal that briefly flashed before disappearing</li>
</ul>
<p>A recording captures all of this passively. You don't have to know it matters.</p>

<h2>When Recordings Are Essential</h2>
<ul>
  <li><strong>Timing bugs:</strong> Race conditions, loading flickers, and premature redirects that exist only for a fraction of a second</li>
  <li><strong>Multi-step flows:</strong> Checkout funnels, multi-page forms, wizard flows with state carried across steps</li>
  <li><strong>Animation and transition bugs:</strong> "The dropdown jumps" is nearly impossible to describe precisely</li>
  <li><strong>Intermittent bugs:</strong> Record a session, and even if the bug doesn't appear, the context of what led up to it is preserved</li>
</ul>

<h2>How to Make a Good Bug Recording</h2>
<ol>
  <li><strong>Start before the bug:</strong> Begin recording from a clean state instead of starting mid-flow</li>
  <li><strong>Narrate as you go:</strong> State aloud what you expect to happen. "I am clicking Save now, and the form should submit," so if it fails, the mismatch is audible</li>
  <li><strong>Don't stop at the bug:</strong> Keep recording for a few seconds after the failure so the full failure state is visible</li>
  <li><strong>Keep it short:</strong> 30 to 90 seconds covers most bugs. Longer recordings have diminishing returns</li>
</ol>

<h2>Pair the Recording With Logs</h2>
<p>A recording shows what the user saw. Console errors and network logs show what happened underneath. Together, they give a developer both the symptom and the cause, dramatically reducing the debugging cycle.</p>

<h2>One-Click Capture</h2>
<p>If setting up a recording workflow feels like too much friction, <a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> makes it a single keyboard shortcut. Press <code>Ctrl+Shift+F</code>, record your screen with audio narration, and stop. The extension automatically attaches console logs and network errors to the recording, eliminating manual copy-paste and DevTools work.</p>
    `.trim(),
    contentId: `
<p>Situasi ini sering terjadi: seorang QA tester melaporkan bahwa formulir tidak dapat dikirim ketika tombol diklik. Developer mencobanya secara lokal, merasa semuanya normal, lalu meminta penjelasan tambahan. Setelah beberapa kali bertukar pesan, masalah masih belum terpecahkan hingga beberapa hari kemudian ditemukan bahwa bug hanya muncul jika pengguna membuka tab billing terlebih dahulu dalam sesi yang sama.</p>

<p>Screen recording 30 detik sudah menunjukkan semua ini secara instan.</p>

<h2>Apa yang Terlewat dalam Deskripsi Teks</h2>
<p>Ketika kamu mendeskripsikan bug dalam teks, kamu membuat keputusan tentang apa yang harus disertakan. Kamu menulis apa yang kamu sadari, tetapi bug sering kali berada pada detail yang tampak sepele:</p>
<ul>
  <li>Tab mana yang kamu kunjungi sebelum beralih ke halaman yang rusak</li>
  <li>Kecepatan klik yang tepat (double-click vs. klik lambat)</li>
  <li>Dropdown yang sudah terpilih dengan nilai tertentu</li>
  <li>Modal yang sempat muncul sebelum menghilang</li>
</ul>
<p>Rekaman menangkap semua ini secara pasif. Kamu tidak perlu tahu itu penting.</p>

<h2>Kapan Recording Sangat Penting</h2>
<ul>
  <li><strong>Bug timing:</strong> Race condition, loading flicker, dan redirect prematur yang hanya muncul selama sepersekian detik</li>
  <li><strong>Alur multi-langkah:</strong> Checkout funnel, form multi-halaman, wizard dengan state yang dibawa antar langkah</li>
  <li><strong>Bug animasi dan transisi:</strong> "Dropdown-nya loncat" hampir mustahil dideskripsikan dengan tepat</li>
  <li><strong>Bug intermiten:</strong> Rekam sesi, dan meskipun bug tidak muncul, konteks yang mendahuluinya tersimpan</li>
</ul>

<h2>Cara Membuat Recording Bug yang Baik</h2>
<ol>
  <li><strong>Mulai sebelum bug:</strong> Mulai merekam dari kondisi awal yang bersih, bukan di tengah alur</li>
  <li><strong>Narasi saat berjalan:</strong> Ucapkan keras apa yang kamu harapkan terjadi</li>
  <li><strong>Jangan berhenti di bug:</strong> Tetap rekam beberapa detik setelah kegagalan</li>
  <li><strong>Tetap singkat:</strong> 30 hingga 90 detik mencakup sebagian besar bug</li>
</ol>

<h2>Tangkap Satu Klik</h2>
<p>Jika menyiapkan alur rekaman terasa terlalu rumit, <a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> menjadikannya satu pintasan keyboard. Tekan <code>Ctrl+Shift+F</code>, rekam layarmu dengan narasi audio, dan stop. Ekstensi secara otomatis melampirkan console log dan network error ke rekaman tanpa perlu copy-paste manual.</p>
    `.trim(),
  },

  // ─── Article 4 ───────────────────────────────────────────────────────────────
  {
    slug: "google-drive-file-ownership-for-teams",
    title: "Who Actually Owns Your Team's Files? Why It Matters More Than You Think",
    titleId: "Siapa yang Benar-Benar Memiliki File Tim Kamu? Mengapa Ini Lebih Penting dari yang Kamu Kira",
    description:
      "Most collaboration tools own your files on your behalf. Here's what that means for data portability, access control, and what happens when you stop paying.",
    descriptionId:
      "Sebagian besar alat kolaborasi menyimpan file kamu atas nama mereka. Inilah artinya untuk portabilitas data, kontrol akses, dan apa yang terjadi ketika kamu berhenti berlangganan.",
    date: "2026-08-10",
    author: "BugSnap Team",
    readTime: "5 min read",
    tags: ["google-drive", "data-ownership", "team-tools"],
    coverImage: "/blog/google-drive-file-ownership-for-teams.webp",
    ogImage: "/opengraph-image.png",
    content: `
<p>When your team records a screen, uploads a video, or attaches a file in a collaboration tool, where does that file actually live? For most tools, the files live on their servers, under their terms, accessible only through their product.</p>

<p>That's a significant operational dependency that's easy to overlook until it matters.</p>

<h2>The Vendor Lock-In Problem</h2>
<p>File storage is how SaaS products create switching costs. Your recordings, attachments, and shared links are stored in proprietary formats or behind APIs that work only with that platform. When you want to leave:</p>
<ul>
  <li>Export options are often incomplete or require a paid plan to access</li>
  <li>Download limits and rate restrictions slow bulk exports</li>
  <li>Shared links break when your subscription lapses</li>
  <li>Teammates who didn't pay for the tool can't access the files at all</li>
</ul>
<p>This is not an accident; it is their business model: retention through data gravity.</p>

<h2>What Real File Ownership Looks Like</h2>
<p>True ownership means the files are in a location you control, in a format you can read without the vendor's software, and accessible to anyone you share them with regardless of whether they use the tool.</p>
<p>Google Drive is a good proxy for this. Files stored in your Drive are:</p>
<ul>
  <li>Accessible forever, even if the tool that created them disappears</li>
  <li>Shareable with anyone via a link (no account required for viewers)</li>
  <li>Searchable and organizable in a file system you already use</li>
  <li>Downloadable in standard formats at any time</li>
</ul>

<h2>Practical Implications for Engineering Teams</h2>
<p>Offboarding a team member is a good stress test. If an engineer leaves your company, can you still access the bug recordings and DevTools logs from their sessions? With most tools, the answer depends on account settings you may have forgotten to configure. With Drive-based storage, access follows standard Drive permissions you already understand.</p>

<h2>The Compliance Angle</h2>
<p>For teams in regulated industries, knowing exactly where data lives isn't optional. Your security team needs to be able to point to a location and say "that's where our diagnostic recordings are stored, and that's who has access." "It's in the vendor's cloud" is not a sufficient answer for an audit.</p>

<h2>How BugSnap Handles This</h2>
<p>BugSnap was designed around this principle from the start. Every screen recording and screenshot is saved directly to your own Google Drive, never to our servers. The <a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap Chrome extension</a> uploads captures straight to the Drive account you authorize, and generates shareable links from Drive directly. We never hold a copy. If you uninstall the extension tomorrow, every file you've ever captured is still in your Drive, accessible and shareable, exactly as it was.</p>
    `.trim(),
    contentId: `
<p>Ketika timmu merekam layar, mengunggah video, atau melampirkan file dalam alat kolaborasi, di mana file itu sebenarnya berada? Untuk sebagian besar alat, file tersebut tersimpan di server mereka, di bawah ketentuan mereka, dan hanya dapat diakses melalui produk mereka.</p>

<p>Itu adalah ketergantungan operasional yang signifikan yang mudah diabaikan sampai menjadi masalah.</p>

<h2>Masalah Vendor Lock-In</h2>
<p>Penyimpanan file adalah cara produk SaaS menciptakan biaya perpindahan. Rekaman, lampiran, dan tautan berbagi kamu disimpan dalam format proprietary yang hanya berfungsi dengan platform itu. Ketika kamu ingin pindah:</p>
<ul>
  <li>Opsi ekspor seringkali tidak lengkap atau memerlukan paket berbayar</li>
  <li>Batas unduhan dan pembatasan kecepatan memperlambat ekspor massal</li>
  <li>Tautan berbagi rusak ketika langgananmu berakhir</li>
  <li>Rekan tim yang tidak membayar alat tidak dapat mengakses file sama sekali</li>
</ul>
<p>Ini bukan ketidaksengajaan; ini adalah model bisnis mereka: retensi pengguna melalui keterikatan data.</p>

<h2>Seperti Apa Kepemilikan File yang Sebenarnya</h2>
<p>Kepemilikan sejati berarti file berada di lokasi yang kamu kendalikan, dalam format yang dapat kamu baca tanpa perangkat lunak vendor, dan dapat diakses oleh siapa pun yang kamu bagikan terlepas dari apakah mereka menggunakan alat tersebut.</p>
<p>Google Drive adalah proxy yang baik untuk ini. File yang disimpan di Drive kamu:</p>
<ul>
  <li>Dapat diakses selamanya, bahkan jika alat yang membuatnya menghilang</li>
  <li>Dapat dibagikan kepada siapa saja melalui tautan (tanpa perlu akun bagi penerima)</li>
  <li>Dapat dicari dan diorganisir dalam sistem file yang sudah kamu gunakan</li>
</ul>

<h2>Cara BugSnap Menangani Ini</h2>
<p>BugSnap dirancang berdasarkan prinsip ini sejak awal. Setiap screen recording dan screenshot disimpan langsung ke Google Drive kamu sendiri, bukan ke server kami. <a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">Ekstensi Chrome BugSnap</a> mengunggah tangkapan langsung ke akun Drive yang kamu otorisasi. Kami tidak pernah menyimpan salinan. Jika kamu menguninstall ekstensi besok, setiap file yang pernah kamu tangkap masih ada di Drive kamu.</p>
    `.trim(),
  },

  // ─── Article 5 ───────────────────────────────────────────────────────────────
  {
    slug: "reduce-back-and-forth-in-bug-fixing",
    title: "How to Eliminate the 'Can You Reproduce It?' Cycle in Bug Fixing",
    titleId: "Cara Menghilangkan Siklus 'Bisa Direproduksi Nggak?' dalam Perbaikan Bug",
    description:
      "The most expensive words in software development. Here's what causes the back-and-forth cycle and how to break it with better context sharing.",
    descriptionId:
      "Kata-kata paling mahal dalam pengembangan software. Inilah yang menyebabkan siklus bolak-balik dan cara memutusnya dengan berbagi konteks yang lebih baik.",
    date: "2026-07-25",
    author: "BugSnap Team",
    readTime: "5 min read",
    tags: ["productivity", "debugging", "team-collaboration"],
    coverImage: "/blog/reduce-back-and-forth-in-bug-fixing.webp",
    ogImage: "/opengraph-image.png",
    content: `
<p>Hearing "Can you reproduce it?" usually means a bug report lacks crucial context. While the reporter witnessed the issue firsthand, the developer cannot see what led to it, turning a quick fix into an extended Slack thread.</p>

<p>The cycle is expensive. Here's why it happens and how to break it.</p>

<h2>Why the Back-and-Forth Happens</h2>
<p>The "can you reproduce it?" cycle has a predictable root cause: the bug report contains what the reporter observed, but not enough of the surrounding context for a developer to construct the same conditions.</p>

<p>The most common missing pieces:</p>
<ul>
  <li><strong>Session state:</strong> What was the user doing before they hit the bug? Were they logged in, on a specific plan, mid-flow from another page?</li>
  <li><strong>Data state:</strong> What did the relevant records look like? An empty account behaves differently from one with 3 years of data</li>
  <li><strong>Network conditions:</strong> A flaky API response that only affects users on slow connections</li>
  <li><strong>Environment specifics:</strong> Browser, OS version, screen resolution, timezone</li>
  <li><strong>Console errors:</strong> The silent JavaScript exception that made the button handler fail to register</li>
</ul>

<h2>What a Reproduction-Ready Bug Report Looks Like</h2>
<p>A developer should be able to read your report and immediately begin debugging instead of chasing missing details. The benchmark is straightforward: following the steps on a matching account reproduces the exact same failure.</p>

<p>That requires:</p>
<ol>
  <li>Numbered reproduction steps starting from a consistent state</li>
  <li>The exact URL where the bug occurred</li>
  <li>Account/data state (e.g. "a workspace with one member and no captures")</li>
  <li>Browser + OS + version</li>
  <li>Console errors (full stack trace rather than only the error message)</li>
  <li>Network tab: any failed requests, their status codes and response bodies</li>
  <li>A screen recording showing the entire interaction</li>
</ol>

<h2>Timestamped Comments Cut Review Time</h2>
<p>When a developer watches a recording and wants to ask what happened at a specific second, they need to reference that moment precisely. Timestamped comments on a video, such as notes left at a specific frame, collapse review cycles from multi-day threads into a single focused conversation.</p>

<h2>The Asymmetry of Bug Reporting</h2>
<p>The reporter spends 2 minutes capturing; the developer saves 2 hours debugging. When the reporter provides a complete bug report upfront, the total team cost of fixing a bug drops dramatically. The back-and-forth is fundamentally an efficiency problem: better tooling gives reporters the leverage to share full context instantly.</p>

<h2>Put It All in One Link</h2>
<p><a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> was built specifically to solve this. One keyboard shortcut captures your screen recording with audio narration, and automatically packages console errors, network request logs, and system environment info alongside it. The result is a shareable link containing everything a developer needs: visible user actions in the video, network and console logs below, and complete environment specs. Developers receive the full diagnostic context upfront, eliminating clarifying questions and back-and-forth threads.</p>
    `.trim(),
    contentId: `
<p>Pertanyaan "Bisa direproduksi nggak?" biasanya menandakan bahwa bug report kekurangan konteks penting. Pelapor melihat langsung masalahnya, tetapi developer tidak dapat mengetahui pemicunya, sehingga perbaikan cepat berubah menjadi diskusi panjang di Slack.</p>

<p>Siklus ini mahal. Inilah mengapa itu terjadi dan cara memutusnya.</p>

<h2>Mengapa Bolak-Balik Terjadi</h2>
<p>Siklus "bisa direproduksi nggak?" memiliki akar penyebab yang dapat diprediksi: bug report berisi apa yang diamati pelapor, tetapi tidak cukup konteks sekitarnya bagi developer untuk membangun kondisi yang sama.</p>

<p>Bagian yang paling sering hilang:</p>
<ul>
  <li><strong>State sesi:</strong> Apa yang dilakukan pengguna sebelum menabrak bug?</li>
  <li><strong>State data:</strong> Seperti apa tampilan rekaman yang relevan?</li>
  <li><strong>Kondisi jaringan:</strong> Respons API yang tidak stabil yang hanya memengaruhi pengguna dengan koneksi lambat</li>
  <li><strong>Spesifikasi environment:</strong> Browser, versi OS, resolusi layar, timezone</li>
  <li><strong>Console error:</strong> Exception JavaScript diam yang membuat penangan tombol gagal terdaftar</li>
</ul>

<h2>Seperti Apa Bug Report yang Siap Direproduksi</h2>
<p>Developer harus bisa membaca laporan kamu dan langsung mulai melakukan debugging tanpa perlu meminta informasi tambahan. Standarnya jelas: mengikuti langkah-langkah pada akun dengan kondisi serupa akan memicu kegagalan yang sama persis.</p>

<ol>
  <li>Langkah reproduksi bernomor dimulai dari state yang konsisten</li>
  <li>URL tepat di mana bug terjadi</li>
  <li>State akun/data</li>
  <li>Browser + OS + versi</li>
  <li>Console error (stack trace lengkap)</li>
  <li>Tab Network: permintaan yang gagal, kode status dan response body</li>
  <li>Screen recording yang menunjukkan seluruh interaksi</li>
</ol>

<h2>Satu Link untuk Semuanya</h2>
<p><a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> dibangun khusus untuk menyelesaikan ini. Satu pintasan keyboard merekam layarmu dengan narasi audio, dan secara otomatis mengemas console error, log network request, dan info environment sistem bersamanya. Hasilnya adalah link berbagi yang memuat seluruh kebutuhan developer: alur tindakan terlihat pada video, log jaringan dan console terlampir di bawah, serta spesifikasi sistem lengkap. Developer mendapatkan konteks teknis yang lengkap sejak awal tanpa perlu pertanyaan susulan atau proses klarifikasi berulang.</p>
    `.trim(),
  },
];

export function getSortedBlogPosts(): BlogPost[] {
  return [...blogPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getAllCategories(): string[] {
  const set = new Set<string>();
  blogPosts.forEach((post) => {
    post.tags.forEach((tag) => set.add(tag));
  });
  return Array.from(set);
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return blogPosts.map((p) => p.slug);
}
