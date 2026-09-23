const fs = require("fs");
const path = require("path");

function walk(dir) {
  let files = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) files = files.concat(walk(full));
    else if (/\.(tsx|ts|jsx|js|html|css)$/.test(f)) files.push(full);
  }
  return files;
}

const baseDir = path.resolve(__dirname, "..");
const srcFiles = walk(path.join(baseDir, "src"));
const publicDir = path.resolve(path.join(baseDir, "public"));
const missing = new Set();
const checked = new Set();

const imgRegex = /(?:src|href|url)\s*[:=]\s*["'`]((\/icons\/|\/integrations\/|\/[^"'`\s\(\)]+\.(png|svg|jpg|jpeg|webp|ico)))["'`]/gi;

for (const file of srcFiles) {
  const content = fs.readFileSync(file, "utf8");
  let match;
  while ((match = imgRegex.exec(content)) !== null) {
    const assetPath = match[1];
    if (assetPath.startsWith("/api/")) continue;
    checked.add(assetPath);
    const resolved = path.join(publicDir, assetPath.replace(/^\//, ""));
    if (!fs.existsSync(resolved)) {
      missing.add(`${assetPath} (in ${path.relative(baseDir, file)})`);
    }
  }
}

console.log("Checked assets (" + checked.size + "):", Array.from(checked).sort());
if (missing.size === 0) {
  console.log("SUCCESS: 0 missing assets found!");
} else {
  console.log("MISSING ASSETS (" + missing.size + "):", Array.from(missing));
}
