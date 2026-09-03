/**
 * Native client-side gzip compression and decompression helpers for dev_logs
 * Uses standard browser CompressionStream / DecompressionStream (zero dependencies).
 */

export async function compressDevLogs(data: unknown): Promise<string> {
  if (!data) return "";
  try {
    const jsonStr = typeof data === "string" ? data : JSON.stringify(data);
    const stream = new Blob([jsonStr]).stream();
    const compressedStream = stream.pipeThrough(new CompressionStream("gzip"));
    const response = new Response(compressedStream);
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return `gz:${btoa(binary)}`;
  } catch (err) {
    console.warn("DevLogs compression failed, falling back to raw data:", err);
    return typeof data === "string" ? data : JSON.stringify(data);
  }
}

export async function decompressDevLogs(payload: unknown): Promise<unknown> {
  if (!payload) return null;
  if (typeof payload === "object") return payload;
  if (typeof payload !== "string") return payload;

  const trimmed = payload.trim();
  if (trimmed.startsWith("gz:")) {
    try {
      const base64 = trimmed.slice(3);
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const stream = new Blob([bytes]).stream();
      const decompressedStream = stream.pipeThrough(new DecompressionStream("gzip"));
      const response = new Response(decompressedStream);
      const jsonText = await response.text();
      return JSON.parse(jsonText);
    } catch (err) {
      console.warn("DevLogs decompression failed:", err);
      return null;
    }
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}
