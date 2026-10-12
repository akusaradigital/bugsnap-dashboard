import fs from "fs";
import zlib from "zlib";

function readPng(path) {
  const buf = fs.readFileSync(path);
  let offset = 8;
  const idat = [];
  let width, height;
  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.toString("ascii", offset + 4, offset + 8);
    if (type === "IHDR") {
      width = buf.readUInt32BE(offset + 8);
      height = buf.readUInt32BE(offset + 12);
    } else if (type === "IDAT") {
      idat.push(buf.subarray(offset + 8, offset + 8 + len));
    }
    offset += 8 + len + 4;
  }
  const decomp = zlib.inflateSync(Buffer.concat(idat));
  const raw = Buffer.alloc(width * height * 4);
  const stride = width * 4;
  let src = 0;
  for (let y = 0; y < height; y++) {
    src++;
    decomp.copy(raw, y * stride, src, src + stride);
    src += stride;
  }
  return { width, height, raw };
}

function resampleAndFit(srcRaw, srcW, srcH, targetSize, marginPercent = 0.05) {
  const innerSize = Math.round(targetSize * (1 - 2 * marginPercent));
  const margin = Math.round(targetSize * marginPercent);
  const dst = Buffer.alloc(targetSize * targetSize * 4); // all zeros = transparent

  const xRatio = srcW / innerSize;
  const yRatio = srcH / innerSize;

  for (let y = 0; y < innerSize; y++) {
    const srcY = y * yRatio;
    const yFloor = Math.floor(srcY);
    const yCeil = Math.min(srcH - 1, Math.ceil(srcY));
    const yWeight = srcY - yFloor;
    const dstY = margin + y;

    for (let x = 0; x < innerSize; x++) {
      const srcX = x * xRatio;
      const xFloor = Math.floor(srcX);
      const xCeil = Math.min(srcW - 1, Math.ceil(srcX));
      const xWeight = srcX - xFloor;
      const dstX = margin + x;

      for (let c = 0; c < 4; c++) {
        const p00 = srcRaw[(yFloor * srcW + xFloor) * 4 + c];
        const p10 = srcRaw[(yFloor * srcW + xCeil) * 4 + c];
        const p01 = srcRaw[(yCeil * srcW + xFloor) * 4 + c];
        const p11 = srcRaw[(yCeil * srcW + xCeil) * 4 + c];

        const top = p00 * (1 - xWeight) + p10 * xWeight;
        const bottom = p01 * (1 - xWeight) + p11 * xWeight;
        const val = Math.round(top * (1 - yWeight) + bottom * yWeight);

        dst[(dstY * targetSize + dstX) * 4 + c] = Math.max(0, Math.min(255, val));
      }
    }
  }
  return dst;
}

function medianCut(pixels, maxBoxes = 255) {
  let boxes = [pixels];
  while (boxes.length < maxBoxes) {
    let bestBoxIdx = -1;
    let bestRange = -1;
    let bestChan = 0;
    for (let b = 0; b < boxes.length; b++) {
      const box = boxes[b];
      if (box.length <= 1) continue;
      let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0, minA = 255, maxA = 0;
      for (const p of box) {
        if (p[0] < minR) minR = p[0]; if (p[0] > maxR) maxR = p[0];
        if (p[1] < minG) minG = p[1]; if (p[1] > maxG) maxG = p[1];
        if (p[2] < minB) minB = p[2]; if (p[2] > maxB) maxB = p[2];
        if (p[3] < minA) minA = p[3]; if (p[3] > maxA) maxA = p[3];
      }
      const rangeR = maxR - minR, rangeG = maxG - minG, rangeB = maxB - minB, rangeA = maxA - minA;
      const maxRng = Math.max(rangeR, rangeG, rangeB, rangeA);
      if (maxRng > bestRange) {
        bestRange = maxRng;
        bestBoxIdx = b;
        if (maxRng === rangeG) bestChan = 1;
        else if (maxRng === rangeR) bestChan = 0;
        else if (maxRng === rangeB) bestChan = 2;
        else bestChan = 3;
      }
    }
    if (bestBoxIdx === -1 || bestRange === 0) break;
    const targetBox = boxes[bestBoxIdx];
    targetBox.sort((a, b) => a[bestChan] - b[bestChan]);
    const mid = Math.floor(targetBox.length / 2);
    boxes.splice(bestBoxIdx, 1, targetBox.slice(0, mid), targetBox.slice(mid));
  }
  return boxes.map((box) => {
    let r = 0, g = 0, b = 0, a = 0;
    for (const p of box) { r += p[0]; g += p[1]; b += p[2]; a += p[3]; }
    return [
      Math.round(r / box.length),
      Math.round(g / box.length),
      Math.round(b / box.length),
      Math.round(a / box.length),
    ];
  });
}

function quantizeRgba(rgba, size) {
  const n = size * size;
  const pixels = [];
  for (let i = 0; i < n; i++) {
    const a = rgba[i * 4 + 3];
    if (a > 6) pixels.push([rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2], a]);
  }
  const palette = medianCut(pixels, 255);
  palette.unshift([0, 0, 0, 0]); // Index 0: pure transparent

  const indexed = Buffer.alloc(n);
  for (let i = 0; i < n; i++) {
    const a = rgba[i * 4 + 3];
    if (a <= 6) {
      indexed[i] = 0;
      continue;
    }
    const r = rgba[i * 4], g = rgba[i * 4 + 1], b = rgba[i * 4 + 2];
    let bestDist = Infinity, bestIdx = 0;
    for (let p = 1; p < palette.length; p++) {
      const pal = palette[p];
      const d = (r - pal[0]) ** 2 + (g - pal[1]) ** 2 + (b - pal[2]) ** 2 + (a - pal[3]) ** 2;
      if (d < bestDist) {
        bestDist = d;
        bestIdx = p;
        if (d === 0) break;
      }
    }
    indexed[i] = bestIdx;
  }
  return { palette, indexed };
}

function crc32(buf) {
  let c = 0xffffffff;
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let v = n;
    for (let k = 0; k < 8; k++) v = (v & 1) ? (0xedb88320 ^ (v >>> 1)) : (v >>> 1);
    table[n] = v;
  }
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const chunk = Buffer.alloc(4 + 4 + data.length + 4);
  chunk.writeUInt32BE(data.length, 0);
  chunk.write(type, 4, 4, "ascii");
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + data.length));
  chunk.writeUInt32BE(crc, 8 + data.length);
  return chunk;
}

function encodeIndexedPng(width, height, indexed, palette) {
  const plte = Buffer.alloc(palette.length * 3);
  const trns = Buffer.alloc(palette.length);
  for (let i = 0; i < palette.length; i++) {
    plte[i * 3] = palette[i][0];
    plte[i * 3 + 1] = palette[i][1];
    plte[i * 3 + 2] = palette[i][2];
    trns[i] = palette[i][3];
  }
  const filtered = Buffer.alloc(height * (width + 1));
  for (let y = 0; y < height; y++) {
    filtered[y * (width + 1)] = 0;
    indexed.copy(filtered, y * (width + 1) + 1, y * width, (y + 1) * width);
  }
  const idat = zlib.deflateSync(filtered, { level: 9 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(3, 9);
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    makeChunk("IHDR", ihdr),
    makeChunk("PLTE", plte),
    makeChunk("tRNS", trns),
    makeChunk("IDAT", idat),
    makeChunk("IEND", Buffer.alloc(0)),
  ]);
}

const daySource = readPng("D:/Akusara/image logo/day-reconstructed.png");
const darkSource = readPng("D:/Akusara/image logo/dark-reconstructed.png");

// 1. Generate 384x384 high-fidelity assets
const sz = 384;
console.log(`Processing ${sz}x${sz} assets...`);
const fittedDay = resampleAndFit(daySource.raw, daySource.width, daySource.height, sz, 0.05);
const fittedDark = resampleAndFit(darkSource.raw, darkSource.width, darkSource.height, sz, 0.05);

const qDay = quantizeRgba(fittedDay, sz);
const qDark = quantizeRgba(fittedDark, sz);

const pngDay = encodeIndexedPng(sz, sz, qDay.indexed, qDay.palette);
const pngDark = encodeIndexedPng(sz, sz, qDark.indexed, qDark.palette);

const b64Day = pngDay.toString("base64");
const b64Dark = pngDark.toString("base64");

// 2. Build SVG files
const svgDay = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sz} ${sz}" width="100%" height="100%">
  <title>BugSnap Logo (Day Mode)</title>
  <image width="${sz}" height="${sz}" href="data:image/png;base64,${b64Day}" preserveAspectRatio="xMidYMid meet" />
</svg>
`;

const svgDark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sz} ${sz}" width="100%" height="100%">
  <title>BugSnap Logo (Dark Mode)</title>
  <image width="${sz}" height="${sz}" href="data:image/png;base64,${b64Dark}" preserveAspectRatio="xMidYMid meet" />
</svg>
`;

const svgAdaptive = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sz} ${sz}" width="100%" height="100%">
  <title>BugSnap Logo</title>
  <style>
    .bugsnap-day { display: block; }
    .bugsnap-dark { display: none; }
    @media (prefers-color-scheme: dark) {
      .bugsnap-day { display: none; }
      .bugsnap-dark { display: block; }
    }
  </style>
  <image class="bugsnap-day" width="${sz}" height="${sz}" href="data:image/png;base64,${b64Day}" preserveAspectRatio="xMidYMid meet" />
  <image class="bugsnap-dark" width="${sz}" height="${sz}" href="data:image/png;base64,${b64Dark}" preserveAspectRatio="xMidYMid meet" />
</svg>
`;

fs.writeFileSync("public/logo-day.svg", svgDay, "utf8");
fs.writeFileSync("public/logo-dark.svg", svgDark, "utf8");
fs.writeFileSync("public/icon.svg", svgAdaptive, "utf8");

// 3. Generate PNG favicons
const faviconSize = 256;
const favFitted = resampleAndFit(daySource.raw, daySource.width, daySource.height, faviconSize, 0.05);
const favQ = quantizeRgba(favFitted, faviconSize);
const favPng = encodeIndexedPng(faviconSize, faviconSize, favQ.indexed, favQ.palette);
fs.writeFileSync("public/icon.png", favPng);

const appleSize = 180;
const appleFitted = resampleAndFit(daySource.raw, daySource.width, daySource.height, appleSize, 0.05);
const appleQ = quantizeRgba(appleFitted, appleSize);
const applePng = encodeIndexedPng(appleSize, appleSize, appleQ.indexed, appleQ.palette);
fs.writeFileSync("public/apple-icon.png", applePng);

console.log("Successfully generated optimized assets:");
console.log("  public/logo-day.svg:", fs.statSync("public/logo-day.svg").size, "bytes");
console.log("  public/logo-dark.svg:", fs.statSync("public/logo-dark.svg").size, "bytes");
console.log("  public/icon.svg (adaptive):", fs.statSync("public/icon.svg").size, "bytes");
console.log("  public/icon.png:", fs.statSync("public/icon.png").size, "bytes");
console.log("  public/apple-icon.png:", fs.statSync("public/apple-icon.png").size, "bytes");
