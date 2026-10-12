import fs from "fs";
import zlib from "zlib";

function readPngFromSvg(svgPath) {
  const svg = fs.readFileSync(svgPath, "utf8");
  const m = svg.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/);
  if (!m) throw new Error("No PNG found in " + svgPath);
  const buf = Buffer.from(m[1], "base64");

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
    src++; // filter byte
    decomp.copy(raw, y * stride, src, src + stride);
    src += stride;
  }
  return { width, height, raw };
}

function resample(srcRaw, srcW, srcH, targetW, targetH) {
  const dst = Buffer.alloc(targetW * targetH * 4);
  const xRatio = srcW / targetW;
  const yRatio = srcH / targetH;

  for (let y = 0; y < targetH; y++) {
    const srcY = y * yRatio;
    const yFloor = Math.floor(srcY);
    const yCeil = Math.min(srcH - 1, Math.ceil(srcY));
    const yWeight = srcY - yFloor;

    for (let x = 0; x < targetW; x++) {
      const srcX = x * xRatio;
      const xFloor = Math.floor(srcX);
      const xCeil = Math.min(srcW - 1, Math.ceil(srcX));
      const xWeight = srcX - xFloor;

      for (let c = 0; c < 4; c++) {
        const p00 = srcRaw[(yFloor * srcW + xFloor) * 4 + c];
        const p10 = srcRaw[(yFloor * srcW + xCeil) * 4 + c];
        const p01 = srcRaw[(yCeil * srcW + xFloor) * 4 + c];
        const p11 = srcRaw[(yCeil * srcW + xCeil) * 4 + c];

        const top = p00 * (1 - xWeight) + p10 * xWeight;
        const bottom = p01 * (1 - xWeight) + p11 * xWeight;
        const val = Math.round(top * (1 - yWeight) + bottom * yWeight);

        dst[(y * targetW + x) * 4 + c] = Math.max(0, Math.min(255, val));
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

function quantizeRgba(rgba, width, height) {
  const n = width * height;
  const pixels = [];
  for (let i = 0; i < n; i++) {
    const a = rgba[i * 4 + 3];
    if (a > 10) {
      pixels.push([rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2], a]);
    }
  }

  // Palette entry 0 is always transparent
  const subPalette = medianCut(pixels, 254);
  const palette = [[0, 0, 0, 0], ...subPalette];

  const indexed = Buffer.alloc(n);
  for (let i = 0; i < n; i++) {
    const a = rgba[i * 4 + 3];
    if (a <= 10) {
      indexed[i] = 0;
      continue;
    }
    const r = rgba[i * 4];
    const g = rgba[i * 4 + 1];
    const b = rgba[i * 4 + 2];

    let bestIdx = 1;
    let bestDist = Infinity;
    for (let p = 1; p < palette.length; p++) {
      const pal = palette[p];
      const dr = r - pal[0];
      const dg = g - pal[1];
      const db = b - pal[2];
      const da = a - pal[3];
      const dist = dr * dr + dg * dg + db * db + da * da;
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = p;
        if (dist === 0) break;
      }
    }
    indexed[i] = bestIdx;
  }
  return { indexed, palette };
}

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[i] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function createChunk(type, data) {
  const len = data ? data.length : 0;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, "ascii");
  if (data) data.copy(buf, 8);
  const toCrc = buf.subarray(4, 8 + len);
  buf.writeUInt32BE(crc32(toCrc), 8 + len);
  return buf;
}

function encodeIndexedPng(width, height, indexed, palette) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 3; // color type: indexed-color
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const plte = Buffer.alloc(palette.length * 3);
  const trns = Buffer.alloc(palette.length);
  for (let i = 0; i < palette.length; i++) {
    plte[i * 3] = palette[i][0];
    plte[i * 3 + 1] = palette[i][1];
    plte[i * 3 + 2] = palette[i][2];
    trns[i] = palette[i][3];
  }

  // Filter 0 for each line
  const scanlines = Buffer.alloc(height * (width + 1));
  for (let y = 0; y < height; y++) {
    scanlines[y * (width + 1)] = 0;
    indexed.copy(scanlines, y * (width + 1) + 1, y * width, (y + 1) * width);
  }
  const idat = zlib.deflateSync(scanlines, { level: 9 });

  return Buffer.concat([
    sig,
    createChunk("IHDR", ihdr),
    createChunk("PLTE", plte),
    createChunk("tRNS", trns),
    createChunk("IDAT", idat),
    createChunk("IEND", null),
  ]);
}

// Process Day and Dark Mode 404s
const targetSz = 512; // 512x512 crisp Retina
console.log(`Processing 404 images at ${targetSz}x${targetSz}...`);

for (const mode of ["day", "dark"]) {
  const svgPath = mode === "day" ? "public/bugsnap-404.svg" : "public/bugsnap-404-dark.svg";
  const title = mode === "day" ? "BugSnap 404" : "BugSnap 404 Dark";

  const src = readPngFromSvg(svgPath);
  console.log(`Read ${mode} mode: ${src.width}x${src.height}`);

  const resampled = resample(src.raw, src.width, src.height, targetSz, targetSz);
  const { indexed, palette } = quantizeRgba(resampled, targetSz, targetSz);

  const png = encodeIndexedPng(targetSz, targetSz, indexed, palette);
  console.log(`Compressed ${mode} PNG: ${png.length} bytes`);

  const b64 = png.toString("base64");
  const svgOut = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${targetSz} ${targetSz}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
  <title>${title}</title>
  <image width="${targetSz}" height="${targetSz}" href="data:image/png;base64,${b64}" />
</svg>
`;

  fs.writeFileSync(svgPath, svgOut, "utf8");
  console.log(`Updated ${svgPath}: ${fs.statSync(svgPath).size} bytes`);
}
