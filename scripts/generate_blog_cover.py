"""
generate_blog_cover.py - Generates clean, aesthetic 1200x800 WebP editorial illustrations
for BugSnap blog posts, matching the visual photography style of the existing blog posts
(pure visual illustration/photography without text overlays or duplicate title banners).
"""

import os
import io
import urllib.request
from PIL import Image, ImageDraw

CURATED_TOPIC_IMAGES = {
    # 1. SPA Memory Leaks & DOM Bloat (Modern laptop IDE setup with neon violet/cyan developer ambiance)
    "detecting-spa-memory-leaks-and-dom-bloat": "https://images.unsplash.com/photo-1605379399642-870262d3d051",
    # 2. Automated Playwright testing (Deep focus code on dark monitor)
    "from-bug-recording-to-automated-playwright-test": "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
    # 3. Cloud storage & Google Drive security (Clean cloud infrastructure / server data)
    "zero-storage-liability-why-byo-google-drive-wins": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8",
    # 4. Flaky bugs & timeline causality (Data visualization / terminal performance dashboard)
    "flaky-frontend-bugs-causality-timeline": "https://images.unsplash.com/photo-1666875753105-c63a6f3bdc86",
    # 5. Zero-Storage vs SaaS Silos (Global cloud network / data sovereignty)
    "zero-server-storage-bring-your-own-drive": "https://images.unsplash.com/photo-1451187580459-43490279c0fa",
    # 6. CORS & Preflight Telemetry (Cyber matrix / network debugging)
    "debugging-cross-origin-cors-and-preflight-failures": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5",
    # 7. Interaction to Next Paint / INP (High-speed rendering / core web vitals)
    "interaction-to-next-paint-inp-debugging-for-qa": "https://images.unsplash.com/photo-1504639725590-34d0984388bd",
    # 8. Silent Network Failures (Server telemetry / API failure stream)
    "capturing-silent-network-failures-in-spa-apps": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31",
    # 9. Bug Tickets & Telemetry (Engineering team collaboration)
    "automating-reproducible-bug-reports-for-jira-and-github": "https://images.unsplash.com/photo-1522071820081-009f0129c71c",
    # 10. Data Privacy & PII Redaction (Security encryption & compliance)
    "screen-recording-security-and-pii-masking": "https://images.unsplash.com/photo-1510511459019-5dda7724fd87",
}

# Generic tech photo pool fallback
FALLBACK_TECH_IMAGES = [
    "https://images.unsplash.com/photo-1605379399642-870262d3d051",
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
    "https://images.unsplash.com/photo-1544197150-b99a580bb7a8",
    "https://images.unsplash.com/photo-1666875753105-c63a6f3bdc86",
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085"
]

def generate_abstract_fallback(output_path: str, w: int = 1200, h: int = 800):
    """Draws a clean, text-free 3D abstract geometric gradient artwork if offline."""
    img = Image.new("RGB", (w, h), color=(10, 15, 29))
    draw = ImageDraw.Draw(img)
    for y in range(h):
        ratio = y / h
        r = int(10 + ratio * 15)
        g = int(15 + ratio * 35)
        b = int(29 + ratio * 45)
        draw.line([(0, y), (w, y)], fill=(r, g, b))
    # Ambient glows
    cx, cy = 800, 350
    for rad in range(400, 0, -4):
        t = rad / 400
        intensity = 1.0 - t
        glow_r = int(12 + intensity * 80)
        glow_g = int(20 + intensity * 150)
        glow_b = int(35 + intensity * 60)
        draw.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=(glow_r, glow_g, glow_b))
    img.save(output_path, "WEBP", quality=90)

def create_blog_cover(
    title: str,
    category: str,
    output_path: str,
    slug: str = "",
    image_url: str = "",
    tag: str = "",
    read_time: str = ""
):
    target_w, target_h = 1200, 800
    chosen_url = image_url

    if not chosen_url and slug in CURATED_TOPIC_IMAGES:
        chosen_url = CURATED_TOPIC_IMAGES[slug]

    if not chosen_url:
        import hashlib
        h = int(hashlib.md5(title.encode()).hexdigest(), 16)
        chosen_url = FALLBACK_TECH_IMAGES[h % len(FALLBACK_TECH_IMAGES)]

    if chosen_url:
        full_url = f"{chosen_url}?w={target_w}&h={target_h}&fit=crop&q=85"
        try:
            req = urllib.request.Request(full_url, headers={"User-Agent": "curl/7.88.1"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = resp.read()
                im = Image.open(io.BytesIO(data)).convert("RGB")
                # Ensure exact dimensions
                if im.size != (target_w, target_h):
                    im = im.resize((target_w, target_h), Image.Resampling.LANCZOS)
                im.save(output_path, "WEBP", quality=90)
                print(f"OK: Saved clean editorial illustration to {output_path}")
                return
        except Exception as e:
            print(f"Warning: could not fetch image ({e}), falling back to abstract render.")

    generate_abstract_fallback(output_path, target_w, target_h)
    print(f"OK: Saved abstract gradient illustration to {output_path}")

if __name__ == "__main__":
    test_out = "D:/Akusara/EXTENTION CHROME/bugsnap-dashboard/public/blog/detecting-spa-memory-leaks-and-dom-bloat.webp"
    create_blog_cover("Test", "Performance", test_out, slug="detecting-spa-memory-leaks-and-dom-bloat")
