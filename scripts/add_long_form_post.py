"""One-off: insert a long-form bilingual (EN + ID) article into src/content/blog.ts
and generate its cover image. Re-runnable: skips if the slug already exists.
"""
import os
import re
import sys
import json
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from publish_blog_post import create_blog_cover, BLOG_TS_PATH, PUBLIC_BLOG_DIR  # noqa: E402

SLUG = "zero-server-storage-bring-your-own-drive"
TITLE = "Why Engineering Teams Are Moving to BYO Storage for Bug Reporting"
TITLE_ID = "Mengapa Tim Engineering Beralih ke BYO Storage untuk Pelaporan Bug"
DESCRIPTION = "Enterprise security teams reject third-party video storage. A practical engineering guide to bring-your-own-storage bug reporting on Google Drive, with the data-flow, threat model, and rollout checklist."
DESCRIPTION_ID = "Tim keamanan perusahaan menolak penyimpanan video di server pihak ketiga. Panduan teknis bug reporting dengan model BYO storage di Google Drive: alur data, threat model, dan checklist rollout."
CATEGORY = "Security & Architecture"
READ_TIME = "9 min read"
TAGS = ["enterprise", "security", "google-drive", "byo-storage", "qa-engineering"]

CONTENT_EN = """
<p>Every bug report that contains a screen recording is, by definition, a copy of something that happened inside a real user's session. It may show a checkout form with a half-typed card number, an internal admin panel with customer emails in the table, or a staging dashboard that reveals a feature nobody has announced yet. Teams have been willing to ignore this for years because the recording tools were so convenient. That tolerance is ending. Security questionnaires now ask where screenshots are stored, how long they live, and who at the vendor can read them.</p>

<p>This article walks through the architecture decision behind <em>bring-your-own-storage</em> (BYO storage) for bug reporting. It explains what changes when the media never touches the vendor's servers, what risks remain, and how an engineering team can evaluate the model before rolling it out. The examples reference BugSnap, the Chrome extension we build, because the design choices are concrete enough to inspect. The reasoning applies to any tool that captures media from a browser.</p>

<h2>Why the default architecture is a problem</h2>
<p>Most visual bug reporters follow the same pattern. The browser uploads a WebM video or a PNG to a multi-tenant object store owned by the vendor, the vendor generates a share link, and the metadata lands in the vendor's relational database. That pattern is simple to build and easy to scale. It also creates three liabilities that grow with every report:</p>
<ul>
  <li><strong>Data sprawl.</strong> Sensitive values such as account numbers, session tokens, and internal feature names end up in a bucket you do not control, with a retention policy you did not negotiate.</li>
  <li><strong>Blast radius.</strong> A misconfigured share link or a vendor-side breach exposes every recording the vendor has ever stored, not only the ones your team created.</li>
  <li><strong>Exit cost.</strong> When you leave the vendor, the archive is either unavailable or locked behind an export queue. Your evidence lives somewhere else.</li>
</ul>
<p>None of these problems is unusual to a security reviewer. They appear in every vendor assessment for SOC 2 Type II, ISO 27001, and HIPAA-scoped engineering work. The question for QA leads is whether the tool can answer them without a long procurement exception.</p>

<h2>What BYO storage changes</h2>
<p>In a BYO model the file path is different. The extension records the screen inside the tester's browser, and the resulting file is uploaded directly to a Google Drive folder that belongs to the tester's organization, using the tester's own Google account and an OAuth grant. The vendor's backend coordinates the metadata: a title, a timestamp, the page URL, the browser and operating system, and a pointer to the Drive file. It does not receive the video bytes.</p>
<p>Three details matter for an engineer reading the design:</p>
<ol>
  <li><strong>Scope.</strong> The OAuth request asks for the narrowest Drive scope that still lets the extension create and update files it made itself. Google calls this scope <code>drive.file</code>. It does not grant access to the rest of the Drive, which is also what makes the consent screen easier for security teams to approve.</li>
  <li><strong>Ownership.</strong> The file lives in the organization's Drive. Retention, sharing, deletion, and audit logging come from Google Workspace, which most teams already govern.</li>
  <li><strong>Metadata only on the vendor side.</strong> A capture row in the vendor database is a small record. In our production measurements the average row for a capture is roughly one to two kilobytes, because the heavy artifacts live in Drive.</li>
</ol>

<h2>The data flow, step by step</h2>
<p>Here is the path a single bug report takes in a BYO design, written as a checklist an auditor can follow:</p>
<ol>
  <li>The tester presses record. The extension captures frames and the event stream locally in the browser.</li>
  <li>Sensitive values are redacted in the browser before anything is serialized. Known token shapes, cookies, and authorization headers are replaced with placeholders.</li>
  <li>The video or screenshot is uploaded to the tester's Drive folder. The browser refreshes its access token when needed.</li>
  <li>The developer-facing telemetry (console errors, network failures, user steps) is uploaded as a JSON file into a <code>logs</code> subfolder next to the media. Only a pointer to that file is stored in the vendor database.</li>
  <li>The extension calls the vendor API with the Drive link and metadata. The API validates the payload and stores the row.</li>
  <li>When someone opens the share page, the server issues a short-lived signed download URL that points back to the Drive file. The media is streamed through a signed link, not copied into vendor storage.</li>
</ol>
<p>Step two deserves emphasis. Redaction that happens after the data leaves the browser is only a promise. Redaction that happens in the browser means the vendor never sees the secret in the first place. Write a test that feeds known secret shapes through the redaction function and asserts they are gone before the payload is built. This is the kind of control that survives an audit.</p>

<h2>Threat model: what BYO does and does not solve</h2>
<p>BYO storage is a reduction of risk, not an elimination. A short threat model keeps the conversation honest:</p>
<ul>
  <li><strong>Solved:</strong> vendor-side bucket exposure, long-lived vendor archives, vendor employees reading recordings, and most cross-tenant leaks.</li>
  <li><strong>Reduced:</strong> the amount of PII that can leave the browser, because redaction runs locally and the redaction rules are testable.</li>
  <li><strong>Not solved:</strong> a tester who records a sensitive screen and shares the Drive link with the wrong person. Drive sharing settings and Workspace DLP policies remain the control here, and the organization owns them.</li>
  <li><strong>Not solved:</strong> a compromised browser profile with an active Drive session. The fix is the same as for any Google account: device management, session policies, and revocation.</li>
</ul>
<p>Writing this table into the rollout document is worth the time. Security reviewers trust a vendor that names its own limits.</p>

<h2>How to evaluate a BYO bug reporter in one afternoon</h2>
<p>If you are comparing tools, run this short test plan. It takes less time than reading a vendor's security whitepaper and tells you more:</p>
<ul>
  <li><strong>Where do bytes go?</strong> Open the browser network panel during a recording. Confirm that the video upload targets the Drive API, not the vendor domain.</li>
  <li><strong>What scope does consent ask for?</strong> Read the OAuth consent screen. A narrow file-level scope is a good sign. Broad Drive access is a reason to ask questions.</li>
  <li><strong>What does the vendor store?</strong> Ask for a sample row. Count the columns. If the row contains large text blobs or base64 images, the storage claim needs a second look.</li>
  <li><strong>Can you leave?</strong> Disconnect the integration and check whether your recordings still open in your own Drive. Confirm the share links keep working or fail cleanly.</li>
  <li><strong>Does redaction run where you think?</strong> Put a fake token in a page header during a test session and check that the uploaded log file does not contain it.</li>
</ul>

<h2>Rollout checklist for engineering teams</h2>
<ul>
  <li>Create a dedicated Drive folder for bug evidence, with a Workspace group as the owner rather than a personal account.</li>
  <li>Set a retention rule. Many teams keep recordings for ninety days and keep only the telemetry JSON for longer.</li>
  <li>Enable audit logging in the Google Workspace Admin console and review who shares evidence externally.</li>
  <li>Document which fields the telemetry captures and which ones it redacts. Keep the list next to the threat model.</li>
  <li>Add one automated test that fails the build if a known secret shape appears in a generated payload.</li>
  <li>Train testers to avoid recording payment forms and identity documents. Redaction helps, but it is not a substitute for judgment.</li>
</ul>

<h2>Where this leaves QA teams</h2>
<p>The argument for BYO storage is not that vendors are careless. It is that the cheapest place to remove a risk is the place where the data never gets copied. A bug report should carry enough context to reproduce the problem, and that context does not require a permanent copy of the customer's screen on someone else's cloud. When the architecture makes that copy unnecessary, the security conversation becomes shorter, and QA can get back to finding bugs.</p>
"""

CONTENT_ID = """
<p>Setiap laporan bug yang memuat rekaman layar pada dasarnya adalah salinan dari sesuatu yang terjadi di dalam sesi pengguna sungguhan. Bisa berupa form checkout dengan nomor kartu yang sedang diketik, panel admin internal yang menampilkan email pelanggan, atau dashboard staging yang memperlihatkan fitur yang belum diumumkan. Tim bertahun-tahun mengabaikan hal ini karena alat perekamnya sangat praktis. Toleransi itu mulai berakhir. Kuesioner keamanan vendor sekarang menanyakan di mana screenshot disimpan, berapa lama, dan siapa di pihak vendor yang bisa membacanya.</p>

<p>Artikel ini membahas keputusan arsitektur di balik <em>bring-your-own-storage</em> (BYO storage) untuk bug reporting. Kita akan melihat apa yang berubah ketika media tidak pernah menyentuh server vendor, risiko apa yang tetap ada, dan bagaimana tim engineering bisa mengevaluasi model ini sebelum diterapkan. Contohnya memakai BugSnap, ekstensi Chrome yang kami bangun, karena pilihan desainnya cukup konkret untuk diperiksa. Penalaran yang sama berlaku untuk alat apa pun yang merekam media dari browser.</p>

<h2>Mengapa arsitektur default bermasalah</h2>
<p>Sebagian besar perekam bug visual mengikuti pola yang sama. Browser mengunggah video WebM atau PNG ke object store multi-tenant milik vendor, vendor membuat tautan berbagi, dan metadata masuk ke database relasional vendor. Pola ini mudah dibangun dan mudah diskalakan. Tapi pola ini menciptakan tiga liabilitas yang terus bertambah di setiap laporan:</p>
<ul>
  <li><strong>Penyebaran data.</strong> Nilai sensitif seperti nomor rekening, token sesi, dan nama fitur internal berakhir di bucket yang tidak Anda kendalikan, dengan kebijakan retensi yang tidak pernah Anda negosiasikan.</li>
  <li><strong>Radius dampak.</strong> Tautan berbagi yang salah konfigurasi atau kebocoran di sisi vendor membuka semua rekaman yang pernah disimpan vendor, bukan hanya milik tim Anda.</li>
  <li><strong>Biaya keluar.</strong> Saat Anda berhenti berlangganan, arsipnya tidak bisa diakses atau harus lewat antrean ekspor. Bukti bug Anda berada di tempat lain.</li>
</ul>
<p>Tidak ada satu pun masalah ini yang asing bagi reviewer keamanan. Semuanya muncul di setiap asesmen vendor untuk pekerjaan yang berada dalam cakupan SOC 2 Type II, ISO 27001, dan HIPAA. Pertanyaan bagi QA lead adalah apakah alatnya bisa menjawab hal-hal tersebut tanpa pengecualian pengadaan yang panjang.</p>

<h2>Apa yang berubah dengan BYO storage</h2>
<p>Dalam model BYO, jalur file-nya berbeda. Ekstensi merekam layar di dalam browser tester, lalu file hasilnya diunggah langsung ke folder Google Drive milik organisasi tester, memakai akun Google tester sendiri dan izin OAuth. Backend vendor hanya mengurus metadata: judul, timestamp, URL halaman, browser dan sistem operasi, serta pointer ke file Drive. Backend tidak menerima byte videonya.</p>
<p>Ada tiga detail yang penting bagi engineer yang membaca desain ini:</p>
<ol>
  <li><strong>Cakupan.</strong> Permintaan OAuth meminta scope Drive paling sempit yang masih memungkinkan ekstensi membuat dan memperbarui file yang dibuatnya sendiri. Google menyebutnya scope <code>drive.file</code>. Scope ini tidak memberi akses ke bagian Drive lain, dan itulah yang membuat layar persetujuan lebih mudah disetujui tim keamanan.</li>
  <li><strong>Kepemilikan.</strong> File berada di Drive organisasi. Retensi, berbagi, penghapusan, dan audit log berasal dari Google Workspace, yang biasanya sudah diatur oleh tim.</li>
  <li><strong>Di sisi vendor hanya metadata.</strong> Baris capture di database vendor adalah rekaman kecil. Dalam pengukuran produksi kami, rata-rata satu baris capture berukuran sekitar satu sampai dua kilobyte, karena artefak yang berat tersimpan di Drive.</li>
</ol>

<h2>Alur data, langkah demi langkah</h2>
<p>Berikut jalur yang ditempuh satu laporan bug dalam desain BYO, ditulis sebagai checklist yang bisa diikuti auditor:</p>
<ol>
  <li>Tester menekan rekam. Ekstensi menangkap frame dan event stream secara lokal di browser.</li>
  <li>Nilai sensitif disensor di browser sebelum apa pun diserialisasi. Bentuk token yang dikenal, cookie, dan header otorisasi diganti placeholder.</li>
  <li>Video atau screenshot diunggah ke folder Drive tester. Browser memperbarui access token saat diperlukan.</li>
  <li>Telemetri untuk developer (error console, kegagalan network, langkah pengguna) diunggah sebagai file JSON ke subfolder <code>logs</code> di sebelah media. Database vendor hanya menyimpan pointer ke file itu.</li>
  <li>Ekstensi memanggil API vendor dengan tautan Drive dan metadata. API memvalidasi payload dan menyimpan baris.</li>
  <li>Saat seseorang membuka halaman berbagi, server membuat URL unduh bertanda tangan yang berumur pendek dan mengarah kembali ke file Drive. Media dialirkan lewat tautan bertanda tangan, bukan disalin ke penyimpanan vendor.</li>
</ol>
<p>Langkah kedua patut ditekankan. Penyensoran yang terjadi setelah data meninggalkan browser hanyalah janji. Penyensoran di dalam browser berarti vendor tidak pernah melihat rahasianya sama sekali. Tulis test yang memasukkan bentuk rahasia yang sudah dikenal ke fungsi redaksi, lalu pastikan rahasia itu hilang sebelum payload dibuat. Kontrol seperti inilah yang bertahan saat audit.</p>

<h2>Threat model: apa yang diselesaikan BYO dan apa yang tidak</h2>
<p>BYO storage adalah pengurangan risiko, bukan penghapusan risiko. Threat model singkat menjaga diskusi tetap jujur:</p>
<ul>
  <li><strong>Terselesaikan:</strong> bucket vendor yang terekspos, arsip vendor berumur panjang, karyawan vendor yang membaca rekaman, dan sebagian besar kebocoran lintas tenant.</li>
  <li><strong>Berkurang:</strong> jumlah data pribadi yang bisa keluar dari browser, karena penyensoran berjalan lokal dan aturannya bisa diuji.</li>
  <li><strong>Tidak terselesaikan:</strong> tester yang merekam layar sensitif lalu membagikan tautan Drive ke orang yang salah. Pengaturan berbagi Drive dan kebijakan DLP Workspace tetap menjadi kontrolnya, dan organisasi yang memilikinya.</li>
  <li><strong>Tidak terselesaikan:</strong> profil browser yang sudah dikompromikan dengan sesi Drive aktif. Solusinya sama seperti akun Google lain: manajemen perangkat, kebijakan sesi, dan pencabutan akses.</li>
</ul>
<p>Menulis tabel ini di dokumen rollout layak dilakukan. Reviewer keamanan lebih percaya pada vendor yang menyebutkan batasannya sendiri.</p>

<h2>Cara mengevaluasi bug reporter BYO dalam satu sore</h2>
<p>Jika Anda sedang membandingkan alat, jalankan rencana uji singkat ini. Waktunya lebih sedikit daripada membaca whitepaper keamanan vendor, dan hasilnya lebih informatif:</p>
<ul>
  <li><strong>Byte-nya pergi ke mana?</strong> Buka panel network browser saat merekam. Pastikan unggahan video menuju Drive API, bukan domain vendor.</li>
  <li><strong>Scope apa yang diminta?</strong> Baca layar persetujuan OAuth. Scope file yang sempit adalah tanda baik. Akses Drive yang luas adalah alasan untuk bertanya lebih jauh.</li>
  <li><strong>Apa yang disimpan vendor?</strong> Minta contoh satu baris. Hitung kolomnya. Jika baris itu berisi blob teks besar atau gambar base64, klaim penyimpanannya perlu diperiksa ulang.</li>
  <li><strong>Bisakah Anda pergi?</strong> Putuskan integrasi lalu cek apakah rekaman masih bisa dibuka di Drive Anda sendiri. Pastikan tautan berbagi tetap berfungsi atau gagal dengan rapi.</li>
  <li><strong>Apakah penyensoran berjalan di tempat yang Anda kira?</strong> Selama sesi uji, sisipkan token palsu di header halaman dan pastikan file log yang diunggah tidak memuatnya.</li>
</ul>

<h2>Checklist rollout untuk tim engineering</h2>
<ul>
  <li>Buat folder Drive khusus untuk bukti bug, dengan Google Group Workspace sebagai pemilik, bukan akun pribadi.</li>
  <li>Tetapkan aturan retensi. Banyak tim menyimpan rekaman selama sembilan puluh hari dan hanya menyimpan JSON telemetri lebih lama.</li>
  <li>Aktifkan audit logging di konsol Google Workspace Admin dan tinjau siapa yang membagikan bukti ke pihak luar.</li>
  <li>Dokumentasikan field apa saja yang ditangkap telemetri dan mana yang disensor. Simpan daftarnya di samping threat model.</li>
  <li>Tambahkan satu test otomatis yang menggagalkan build jika bentuk rahasia yang dikenal muncul di payload yang dihasilkan.</li>
  <li>Latih tester untuk tidak merekam form pembayaran dan dokumen identitas. Redaksi membantu, tetapi bukan pengganti penilaian.</li>
</ul>

<h2>Posisi tim QA setelah ini</h2>
<p>Argumen untuk BYO storage bukan bahwa vendor itu ceroboh. Intinya, cara termurah menghilangkan risiko adalah di titik data tidak pernah disalin. Laporan bug harus memuat konteks yang cukup untuk mereproduksi masalah, dan konteks itu tidak memerlukan salinan permanen layar pelanggan di cloud orang lain. Ketika arsitektur membuat salinan itu tidak diperlukan, percakapan soal keamanan jadi lebih singkat, dan QA bisa kembali menemukan bug.</p>
"""


def main():
    with open(BLOG_TS_PATH, "r", encoding="utf-8") as f:
        blog = f.read()

    if re.search(r'slug:\s*"%s"' % re.escape(SLUG), blog):
        print(f"Slug '{SLUG}' already exists in blog.ts. Nothing to do.")
        return

    today = datetime.now().strftime("%Y-%m-%d")
    image_filename = f"{SLUG}.webp"
    image_path = os.path.join(PUBLIC_BLOG_DIR, image_filename)
    create_blog_cover(title=TITLE, category=CATEGORY, output_path=image_path, slug=SLUG, read_time=READ_TIME)

    entry = f"""  // ─── Article: {TITLE} ───
  {{
    slug: "{SLUG}",
    title: {json.dumps(TITLE)},
    titleId: {json.dumps(TITLE_ID)},
    description: {json.dumps(DESCRIPTION)},
    descriptionId: {json.dumps(DESCRIPTION_ID)},
    date: "{today}",
    author: "BugSnap Team",
    readTime: "{READ_TIME}",
    tags: {json.dumps(TAGS)},
    coverImage: "/blog/{image_filename}",
    ogImage: "/blog/{image_filename}",
    content: `
{CONTENT_EN.strip()}
    `.trim(),
    contentId: `
{CONTENT_ID.strip()}
    `.trim(),
  }},
"""
    marker = "export const blogPosts: BlogPost[] = ["
    if marker not in blog:
        raise RuntimeError("blogPosts marker not found in blog.ts")
    blog = blog.replace(marker, marker + "\n" + entry, 1)
    with open(BLOG_TS_PATH, "w", encoding="utf-8") as f:
        f.write(blog)
    print(json.dumps({"status": "added", "slug": SLUG, "cover": f"/blog/{image_filename}",
                      "words_en": len(re.sub(r"<[^>]+>", " ", CONTENT_EN).split()),
                      "words_id": len(re.sub(r"<[^>]+>", " ", CONTENT_ID).split())}, indent=2))


if __name__ == "__main__":
    main()
