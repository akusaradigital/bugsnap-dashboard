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
<p>A bad bug report wastes everyone's time. The developer spends an hour trying to reproduce something they can't see, asks five follow-up questions, and the reporter has already forgotten the exact steps they took. A good bug report, by contrast, gets triaged, prioritized, and fixed — often without a single back-and-forth message.</p>

<p>Here's what separates the two.</p>

<h2>1. Start With a Clear, Specific Title</h2>
<p>Compare these two titles:</p>
<ul>
  <li><strong>Bad:</strong> "Login is broken"</li>
  <li><strong>Good:</strong> "Login button unresponsive on /checkout after entering wrong password once"</li>
</ul>
<p>The specific title tells the developer which component, which condition, and which page — before they even open the report.</p>

<h2>2. Include Steps to Reproduce</h2>
<p>This is the most important section. Number them clearly:</p>
<ol>
  <li>Navigate to <code>/checkout</code></li>
  <li>Click "Sign in" and enter a wrong password</li>
  <li>Correct the password and click "Sign in" again</li>
  <li>The button becomes unresponsive — no loading state, no error</li>
</ol>
<p>If you cannot write reproducible steps, the bug is nearly impossible to fix reliably. Before filing, try reproducing it yourself once more.</p>

<h2>3. State Expected vs. Actual Behavior</h2>
<p><strong>Expected:</strong> After entering the correct password, the user should be redirected to the dashboard.</p>
<p><strong>Actual:</strong> The Sign In button does nothing. No network request is visible in the Network tab.</p>
<p>This framing forces clarity and instantly shows the developer what success looks like.</p>

<h2>4. Attach a Screenshot or Screen Recording</h2>
<p>Text can describe a layout bug, but a screenshot proves it. A video proves a timing or flow issue in a way no text can. Annotate the screenshot with an arrow or highlight — "the button is here, and nothing happens" — so reviewers don't have to hunt for it.</p>

<h2>5. Include Console Errors and Network Logs</h2>
<p>A <code>401 Unauthorized</code> on <code>/api/session</code> tells a developer exactly where the problem is. An unhandled JavaScript exception with a stack trace points to the exact file and line. Without these, the developer has to reproduce your steps, open DevTools, and manually find the errors themselves — adding 30–60 minutes to every bug.</p>

<h2>6. Capture Environment Details</h2>
<p>Browser version, OS, screen resolution, and user account type all matter. A bug on Safari 17 + macOS that can't be reproduced on Chrome on Windows is a very different debugging task than a universal regression.</p>

<h2>One Tool That Does All of This Automatically</h2>
<p>If you find yourself skipping half of these steps because they're tedious, that's a tooling problem. <a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> is a free Chrome extension that captures your screen, automatically attaches console errors, network logs, and system info to every report — in a single click. Your team gets a shareable link with everything a developer needs, without you having to open DevTools once.</p>
    `.trim(),
    contentId: `
<p>Bug report yang buruk membuang waktu semua orang. Developer menghabiskan satu jam mencoba mereproduksi sesuatu yang tidak bisa mereka lihat, mengajukan lima pertanyaan lanjutan, dan pelapor sudah lupa langkah-langkah persis yang mereka ambil. Bug report yang baik, sebaliknya, langsung ditindaklanjuti dan diperbaiki — seringkali tanpa satu pun pesan bolak-balik.</p>

<p>Inilah yang membedakan keduanya.</p>

<h2>1. Mulai dengan Judul yang Jelas dan Spesifik</h2>
<p>Bandingkan dua judul ini:</p>
<ul>
  <li><strong>Buruk:</strong> "Login rusak"</li>
  <li><strong>Baik:</strong> "Tombol login tidak merespons di /checkout setelah memasukkan password salah sekali"</li>
</ul>
<p>Judul yang spesifik memberi tahu developer komponen mana, kondisi apa, dan halaman mana — sebelum mereka membuka laporan.</p>

<h2>2. Sertakan Langkah-Langkah Reproduksi</h2>
<p>Ini adalah bagian terpenting. Tulis dengan nomor yang jelas:</p>
<ol>
  <li>Buka halaman <code>/checkout</code></li>
  <li>Klik "Sign in" dan masukkan password yang salah</li>
  <li>Perbaiki password dan klik "Sign in" lagi</li>
  <li>Tombol menjadi tidak merespons — tidak ada loading state, tidak ada error</li>
</ol>
<p>Jika kamu tidak bisa menuliskan langkah reproduksi, bug hampir mustahil diperbaiki secara andal. Sebelum mengajukan laporan, coba reproduksi sendiri sekali lagi.</p>

<h2>3. Tulis Expected vs. Actual Behavior</h2>
<p><strong>Expected:</strong> Setelah memasukkan password yang benar, pengguna seharusnya diarahkan ke dashboard.</p>
<p><strong>Actual:</strong> Tombol Sign In tidak melakukan apa pun. Tidak ada network request yang terlihat di tab Network.</p>

<h2>4. Lampirkan Screenshot atau Screen Recording</h2>
<p>Teks bisa mendeskripsikan bug layout, tapi screenshot membuktikannya. Video membuktikan masalah timing atau alur dengan cara yang tidak bisa dilakukan teks. Beri anotasi pada screenshot dengan panah atau highlight agar reviewer tidak perlu mencarinya.</p>

<h2>5. Sertakan Console Error dan Network Log</h2>
<p><code>401 Unauthorized</code> pada <code>/api/session</code> langsung memberi tahu developer di mana masalahnya. Error JavaScript yang tidak tertangani dengan stack trace menunjukkan file dan baris yang tepat. Tanpa ini, developer harus mereproduksi langkahmu, membuka DevTools, dan mencari error secara manual — menambahkan 30–60 menit untuk setiap bug.</p>

<h2>6. Catat Detail Environment</h2>
<p>Versi browser, OS, resolusi layar, dan tipe akun pengguna semuanya penting. Bug di Safari 17 + macOS yang tidak bisa direproduksi di Chrome Windows adalah tugas debugging yang sangat berbeda dari regresi universal.</p>

<h2>Satu Alat yang Melakukan Semua Ini Secara Otomatis</h2>
<p>Jika kamu sering melewati setengah langkah ini karena membosankan, itu adalah masalah tooling. <a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> adalah ekstensi Chrome gratis yang merekam layarmu, secara otomatis melampirkan console error, network log, dan info sistem ke setiap laporan — dalam satu klik. Timmu mendapatkan link berbagi dengan semua yang dibutuhkan developer, tanpa kamu harus membuka DevTools sekali pun.</p>
    `.trim(),
  },

  // ─── Article 2 ───────────────────────────────────────────────────────────────
  {
    slug: "chrome-devtools-for-non-developers",
    title: "Chrome DevTools for QA Testers and PMs: What You Actually Need to Know",
    titleId: "Chrome DevTools untuk QA Tester dan PM: Yang Benar-Benar Perlu Kamu Tahu",
    description:
      "You don't need to be a developer to read browser errors. This guide covers the Console and Network tabs in plain language — and how to share what you find.",
    descriptionId:
      "Kamu tidak perlu menjadi developer untuk membaca error browser. Panduan ini membahas tab Console dan Network dalam bahasa yang mudah dipahami.",
    date: "2026-09-15",
    author: "BugSnap Team",
    readTime: "6 min read",
    tags: ["devtools", "qa-testing", "chrome"],
    coverImage: "/blog/chrome-devtools-for-non-developers.webp",
    ogImage: "/opengraph-image.png",
    content: `
<p>Chrome DevTools feels intimidating if you've never used it before. Six panels, cryptic numbers, walls of red text. But for bug reporting, you only need two tabs: <strong>Console</strong> and <strong>Network</strong>. Everything else is a bonus.</p>

<p>Here's the non-developer guide.</p>

<h2>Opening DevTools</h2>
<p>Press <code>F12</code> on Windows/Linux or <code>Cmd + Option + I</code> on Mac. A panel opens at the bottom or side of your browser. Click the <strong>Console</strong> tab to start.</p>

<h2>The Console Tab</h2>
<p>The Console shows messages from the webpage's JavaScript. Most are harmless info logs you can ignore. The ones that matter are red — they're errors.</p>

<p>A typical error looks like this:</p>
<p><code>Uncaught TypeError: Cannot read properties of null (reading 'submit')</code></p>

<p>You don't need to understand what this means — you just need to copy it. That stack trace tells developers exactly which file and line of code failed. Include it in your bug report and it saves them 30 minutes of guessing.</p>

<p><strong>Tip:</strong> Right-click inside the Console and choose "Save as" to export all logged errors to a file.</p>

<h2>The Network Tab</h2>
<p>The Network tab records every request the page sends to a server. When a feature fails silently (button does nothing, data doesn't save), the Network tab usually reveals why.</p>

<p>What to look for:</p>
<ul>
  <li><strong>Red rows</strong> — failed requests. A <code>400</code> means bad data was sent. A <code>401</code> means authentication failed. A <code>500</code> means the server crashed.</li>
  <li><strong>Request URL</strong> — which endpoint was called (e.g. <code>/api/checkout</code>)</li>
  <li><strong>Response body</strong> — click the request, then "Response" tab to see what the server returned (often contains a helpful error message)</li>
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
<p>Opening DevTools, switching tabs, screenshotting, and copying errors is a process that takes 5–10 minutes per bug. <a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> captures your screen recording and silently attaches console errors, network logs, and environment specs automatically — so your bug report arrives with everything above already included, and you never have to open DevTools at all.</p>
    `.trim(),
    contentId: `
<p>Chrome DevTools terasa menakutkan jika kamu belum pernah menggunakannya. Enam panel, angka-angka misterius, tumpukan teks merah. Tapi untuk pelaporan bug, kamu hanya butuh dua tab: <strong>Console</strong> dan <strong>Network</strong>. Sisanya adalah bonus.</p>

<p>Ini panduan untuk non-developer.</p>

<h2>Membuka DevTools</h2>
<p>Tekan <code>F12</code> di Windows/Linux atau <code>Cmd + Option + I</code> di Mac. Panel akan terbuka di bagian bawah atau samping browser. Klik tab <strong>Console</strong> untuk memulai.</p>

<h2>Tab Console</h2>
<p>Console menampilkan pesan dari JavaScript halaman web. Kebanyakan adalah info log yang tidak berbahaya. Yang penting adalah yang berwarna merah — itu adalah error.</p>

<p>Error khas terlihat seperti ini:</p>
<p><code>Uncaught TypeError: Cannot read properties of null (reading 'submit')</code></p>

<p>Kamu tidak perlu memahami artinya — cukup salin. Stack trace itu memberi tahu developer persis file dan baris kode mana yang gagal. Sertakan dalam bug reportmu dan itu menghemat 30 menit dugaan mereka.</p>

<p><strong>Tips:</strong> Klik kanan di dalam Console dan pilih "Save as" untuk mengekspor semua error yang tercatat ke file.</p>

<h2>Tab Network</h2>
<p>Tab Network merekam setiap permintaan yang dikirim halaman ke server. Ketika fitur gagal secara diam-diam (tombol tidak merespons, data tidak tersimpan), tab Network biasanya mengungkap alasannya.</p>

<p>Apa yang harus dicari:</p>
<ul>
  <li><strong>Baris merah</strong> — permintaan yang gagal. Kode <code>400</code> berarti data yang dikirim salah. Kode <code>401</code> berarti autentikasi gagal. Kode <code>500</code> berarti server crash.</li>
  <li><strong>URL permintaan</strong> — endpoint mana yang dipanggil (misalnya <code>/api/checkout</code>)</li>
  <li><strong>Response body</strong> — klik permintaan, lalu tab "Response" untuk melihat apa yang dikembalikan server</li>
</ul>

<h2>Cara Lebih Cepat untuk Menangkap Semua Ini</h2>
<p>Membuka DevTools, berpindah tab, screenshot, dan menyalin error adalah proses yang memakan 5–10 menit per bug. <a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> merekam layarmu dan secara otomatis melampirkan console error, network log, dan spesifikasi environment — sehingga bug reportmu tiba dengan semua informasi di atas sudah disertakan, dan kamu tidak perlu membuka DevTools sama sekali.</p>
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
<p>Picture this: a QA tester files a bug report saying "the form doesn't submit when I click the button." The developer tries it on their machine, it works fine. They ask for more details. The tester writes two more paragraphs. Still can't reproduce. Four days later, someone discovers it only fails when the user has previously visited the billing tab in the same session.</p>

<p>A 30-second screen recording would have shown all of this instantly.</p>

<h2>What Text Descriptions Miss</h2>
<p>When you describe a bug in text, you're making decisions about what to include. You write what you consciously noticed — but bugs often live in the details you didn't think were relevant:</p>
<ul>
  <li>Which tab you were on before navigating to the broken page</li>
  <li>The exact speed at which you clicked (double-click vs. slow click)</li>
  <li>A dropdown that was already pre-selected with a specific value</li>
  <li>A modal that briefly flashed before disappearing</li>
</ul>
<p>A recording captures all of this passively. You don't have to know it matters.</p>

<h2>When Recordings Are Essential</h2>
<ul>
  <li><strong>Timing bugs:</strong> Race conditions, loading flickers, premature redirects — things that exist only for a fraction of a second</li>
  <li><strong>Multi-step flows:</strong> Checkout funnels, multi-page forms, wizard flows with state carried across steps</li>
  <li><strong>Animation and transition bugs:</strong> "The dropdown jumps" is nearly impossible to describe precisely</li>
  <li><strong>Intermittent bugs:</strong> Record a session, and even if the bug doesn't appear, the context of what led up to it is preserved</li>
</ul>

<h2>How to Make a Good Bug Recording</h2>
<ol>
  <li><strong>Start before the bug:</strong> Begin recording from a clean state — don't start mid-flow</li>
  <li><strong>Narrate as you go:</strong> Say out loud what you expect to happen. "I'm clicking Save now, and the form should submit" — so if it doesn't, the mismatch is audible</li>
  <li><strong>Don't stop at the bug:</strong> Keep recording for a few seconds after the failure so the full failure state is visible</li>
  <li><strong>Keep it short:</strong> 30–90 seconds covers most bugs. Longer recordings have diminishing returns</li>
</ol>

<h2>Pair the Recording With Logs</h2>
<p>A recording shows what the user saw. Console errors and network logs show what happened underneath. Together, they give a developer both the symptom and the cause — dramatically reducing the debugging cycle.</p>

<h2>One-Click Capture</h2>
<p>If setting up a recording workflow feels like too much friction, <a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> makes it a single keyboard shortcut. Press <code>Ctrl+Shift+F</code>, record your screen with audio narration, and stop. The extension automatically attaches console logs and network errors to the recording — no manual copy-paste, no DevTools gymnastics.</p>
    `.trim(),
    contentId: `
<p>Bayangkan ini: seorang QA tester mengajukan bug report yang mengatakan "form tidak submit ketika saya klik tombol." Developer mencobanya di mesin mereka, berjalan dengan baik. Mereka meminta detail lebih lanjut. Tester menulis dua paragraf lagi. Masih tidak bisa direproduksi. Empat hari kemudian, seseorang menemukan bahwa itu hanya gagal ketika pengguna sebelumnya telah mengunjungi tab billing dalam sesi yang sama.</p>

<p>Screen recording 30 detik sudah menunjukkan semua ini secara instan.</p>

<h2>Apa yang Terlewat dalam Deskripsi Teks</h2>
<p>Ketika kamu mendeskripsikan bug dalam teks, kamu membuat keputusan tentang apa yang harus disertakan. Kamu menulis apa yang kamu sadari — tetapi bug sering hidup di detail yang tidak kamu anggap relevan:</p>
<ul>
  <li>Tab mana yang kamu kunjungi sebelum beralih ke halaman yang rusak</li>
  <li>Kecepatan klik yang tepat (double-click vs. klik lambat)</li>
  <li>Dropdown yang sudah terpilih dengan nilai tertentu</li>
  <li>Modal yang sempat muncul sebelum menghilang</li>
</ul>
<p>Rekaman menangkap semua ini secara pasif. Kamu tidak perlu tahu itu penting.</p>

<h2>Kapan Recording Sangat Penting</h2>
<ul>
  <li><strong>Bug timing:</strong> Race condition, loading flicker, redirect prematur — hal-hal yang hanya ada selama sepersekian detik</li>
  <li><strong>Alur multi-langkah:</strong> Checkout funnel, form multi-halaman, wizard dengan state yang dibawa antar langkah</li>
  <li><strong>Bug animasi dan transisi:</strong> "Dropdown-nya loncat" hampir mustahil dideskripsikan dengan tepat</li>
  <li><strong>Bug intermiten:</strong> Rekam sesi, dan meskipun bug tidak muncul, konteks yang mendahuluinya tersimpan</li>
</ul>

<h2>Cara Membuat Recording Bug yang Baik</h2>
<ol>
  <li><strong>Mulai sebelum bug:</strong> Mulai merekam dari keadaan bersih — jangan mulai di tengah alur</li>
  <li><strong>Narasi saat berjalan:</strong> Ucapkan keras apa yang kamu harapkan terjadi</li>
  <li><strong>Jangan berhenti di bug:</strong> Tetap rekam beberapa detik setelah kegagalan</li>
  <li><strong>Tetap singkat:</strong> 30–90 detik mencakup sebagian besar bug</li>
</ol>

<h2>Tangkap Satu Klik</h2>
<p>Jika menyiapkan alur rekaman terasa terlalu rumit, <a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> menjadikannya satu pintasan keyboard. Tekan <code>Ctrl+Shift+F</code>, rekam layarmu dengan narasi audio, dan stop. Ekstensi secara otomatis melampirkan console log dan network error ke rekaman — tanpa copy-paste manual.</p>
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
<p>When your team records a screen, uploads a video, or attaches a file in a collaboration tool, where does that file actually live? For most tools, the honest answer is: on their servers, under their terms, accessible only through their product.</p>

<p>That's a significant operational dependency that's easy to overlook until it matters.</p>

<h2>The Vendor Lock-In Problem</h2>
<p>File storage is how SaaS products create switching costs. Your recordings, attachments, and shared links are stored in proprietary formats or behind APIs that work only with that platform. When you want to leave:</p>
<ul>
  <li>Export options are often incomplete or require a paid plan to access</li>
  <li>Download limits and rate restrictions slow bulk exports</li>
  <li>Shared links break when your subscription lapses</li>
  <li>Teammates who didn't pay for the tool can't access the files at all</li>
</ul>
<p>This isn't a bug — it's a business model. Retention through data gravity.</p>

<h2>What Real File Ownership Looks Like</h2>
<p>True ownership means the files are in a location you control, in a format you can read without the vendor's software, and accessible to anyone you share them with regardless of whether they use the tool.</p>
<p>Google Drive is a good proxy for this. Files stored in your Drive are:</p>
<ul>
  <li>Accessible forever, even if the tool that created them disappears</li>
  <li>Shareable with anyone via a link — no account required for viewers</li>
  <li>Searchable and organizable in a file system you already use</li>
  <li>Downloadable in standard formats at any time</li>
</ul>

<h2>Practical Implications for Engineering Teams</h2>
<p>Offboarding a team member is a good stress test. If an engineer leaves your company, can you still access the bug recordings and DevTools logs from their sessions? With most tools, the answer depends on account settings you may have forgotten to configure. With Drive-based storage, access follows standard Drive permissions you already understand.</p>

<h2>The Compliance Angle</h2>
<p>For teams in regulated industries, knowing exactly where data lives isn't optional. Your security team needs to be able to point to a location and say "that's where our diagnostic recordings are stored, and that's who has access." "It's in the vendor's cloud" is not a sufficient answer for an audit.</p>

<h2>How BugSnap Handles This</h2>
<p>BugSnap was designed around this principle from the start. Every screen recording and screenshot is saved directly to your own Google Drive — not to our servers. The <a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap Chrome extension</a> uploads captures straight to the Drive account you authorize, and generates shareable links from Drive directly. We never hold a copy. If you uninstall the extension tomorrow, every file you've ever captured is still in your Drive, accessible and shareable, exactly as it was.</p>
    `.trim(),
    contentId: `
<p>Ketika timmu merekam layar, mengunggah video, atau melampirkan file dalam alat kolaborasi, di mana file itu sebenarnya berada? Untuk sebagian besar alat, jawaban jujurnya adalah: di server mereka, di bawah ketentuan mereka, hanya dapat diakses melalui produk mereka.</p>

<p>Itu adalah ketergantungan operasional yang signifikan yang mudah diabaikan sampai menjadi masalah.</p>

<h2>Masalah Vendor Lock-In</h2>
<p>Penyimpanan file adalah cara produk SaaS menciptakan biaya perpindahan. Rekaman, lampiran, dan tautan berbagi kamu disimpan dalam format proprietary yang hanya berfungsi dengan platform itu. Ketika kamu ingin pindah:</p>
<ul>
  <li>Opsi ekspor seringkali tidak lengkap atau memerlukan paket berbayar</li>
  <li>Batas unduhan dan pembatasan kecepatan memperlambat ekspor massal</li>
  <li>Tautan berbagi rusak ketika langgananmu berakhir</li>
  <li>Rekan tim yang tidak membayar alat tidak dapat mengakses file sama sekali</li>
</ul>

<h2>Seperti Apa Kepemilikan File yang Sebenarnya</h2>
<p>Kepemilikan sejati berarti file berada di lokasi yang kamu kendalikan, dalam format yang dapat kamu baca tanpa perangkat lunak vendor, dan dapat diakses oleh siapa pun yang kamu bagikan terlepas dari apakah mereka menggunakan alat tersebut.</p>
<p>Google Drive adalah proxy yang baik untuk ini. File yang disimpan di Drive kamu:</p>
<ul>
  <li>Dapat diakses selamanya, bahkan jika alat yang membuatnya menghilang</li>
  <li>Dapat dibagikan kepada siapa saja melalui tautan — tidak perlu akun untuk penampil</li>
  <li>Dapat dicari dan diorganisir dalam sistem file yang sudah kamu gunakan</li>
</ul>

<h2>Cara BugSnap Menangani Ini</h2>
<p>BugSnap dirancang berdasarkan prinsip ini sejak awal. Setiap screen recording dan screenshot disimpan langsung ke Google Drive kamu sendiri — bukan ke server kami. <a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">Ekstensi Chrome BugSnap</a> mengunggah tangkapan langsung ke akun Drive yang kamu otorisasi. Kami tidak pernah menyimpan salinan. Jika kamu menguninstall ekstensi besok, setiap file yang pernah kamu tangkap masih ada di Drive kamu.</p>
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
<p>"Can you reproduce it?" Four words that signal a bug report has failed. The reporter knows what happened. The developer doesn't. And both of them are about to spend the next 30 minutes in Slack threading what should have been a 5-minute conversation.</p>

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
<p>A developer should be able to read your report and immediately begin debugging — not gather more information. The bar is: "If I follow these steps on an account that matches the described state, I will see the same failure."</p>

<p>That requires:</p>
<ol>
  <li>Numbered reproduction steps starting from a consistent state</li>
  <li>The exact URL where the bug occurred</li>
  <li>Account/data state (e.g. "a workspace with one member and no captures")</li>
  <li>Browser + OS + version</li>
  <li>Console errors (full stack trace, not just the error message)</li>
  <li>Network tab: any failed requests, their status codes and response bodies</li>
  <li>A screen recording showing the entire interaction</li>
</ol>

<h2>Timestamped Comments Cut Review Time</h2>
<p>When a developer watches a recording and wants to ask "what happened at 0:23?", they need to be able to reference that moment precisely. Timestamped comments on a video — like a developer leaving a note at a specific frame — collapse review cycles from multi-day email threads into a single focused conversation.</p>

<h2>The Asymmetry of Bug Reporting</h2>
<p>The reporter spends 2 minutes capturing; the developer saves 2 hours debugging. When the reporter provides a complete bug report upfront, the total team cost of fixing a bug drops dramatically. The back-and-forth isn't just a communication problem — it's a leverage problem that good tooling can solve.</p>

<h2>Put It All in One Link</h2>
<p><a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> was built specifically to solve this. One keyboard shortcut captures your screen recording with audio narration, and automatically packages console errors, network request logs, and system environment info alongside it. The result is a shareable link containing everything a developer needs — steps visible in the video, logs attached below, environment specs included. No follow-up questions. No "can you reproduce it?" Just a fix.</p>
    `.trim(),
    contentId: `
<p>"Bisa direproduksi nggak?" Empat kata yang menandakan bug report telah gagal. Pelapor tahu apa yang terjadi. Developer tidak tahu. Dan keduanya akan menghabiskan 30 menit berikutnya di Slack untuk apa yang seharusnya menjadi percakapan 5 menit.</p>

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
<p>Developer harus bisa membaca laporan kamu dan langsung mulai debugging — bukan mengumpulkan informasi lebih lanjut. Standarnya adalah: "Jika saya mengikuti langkah-langkah ini di akun yang cocok dengan state yang dijelaskan, saya akan melihat kegagalan yang sama."</p>

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
<p><a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer">BugSnap</a> dibangun khusus untuk menyelesaikan ini. Satu pintasan keyboard merekam layarmu dengan narasi audio, dan secara otomatis mengemas console error, log network request, dan info environment sistem bersamanya. Hasilnya adalah link berbagi yang berisi semua yang dibutuhkan developer — langkah-langkah terlihat dalam video, log terlampir di bawah, spesifikasi environment disertakan. Tidak ada pertanyaan lanjutan. Tidak ada "bisa direproduksi nggak?" Hanya perbaikan.</p>
    `.trim(),
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return blogPosts.map((p) => p.slug);
}
