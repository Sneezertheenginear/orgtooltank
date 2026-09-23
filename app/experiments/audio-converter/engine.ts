import { Mp3Encoder } from "@breezystack/lamejs";

export type AudioFormat = "mp3" | "wav";
export const mp3Bitrates = [128, 192, 256, 320] as const;
export type Mp3Bitrate = typeof mp3Bitrates[number];
export const MAX_INPUT_BYTES = 100 * 1024 * 1024;
export const MAX_DURATION_SECONDS = 15 * 60;
export type AudioInfo = { format: AudioFormat; sampleRate: number; channels: number; duration: number | null };
export type Detection = { ok: true; info: AudioInfo } | { ok: false; error: string };

const text = (bytes: Uint8Array, at: number, length: number) => String.fromCharCode(...bytes.subarray(at, at + length));
const view = (bytes: Uint8Array) => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

/** Identifies MP3 or WAV from the file contents, not its name. */
export function detectAudio(bytes: Uint8Array): Detection {
  if (bytes.length < 12) return { ok: false, error: "This file is empty or too small to be audio." };
  if (text(bytes, 0, 4) === "RIFF" && text(bytes, 8, 4) === "WAVE") return detectWav(bytes);
  const mp3 = detectMp3(bytes);
  if (mp3) return { ok: true, info: mp3 };
  return { ok: false, error: "This doesn’t look like an MP3 or WAV file. Choose an .mp3 or .wav audio file." };
}

function detectWav(bytes: Uint8Array): Detection {
  const data = view(bytes);
  let format: { code: number; channels: number; sampleRate: number; blockAlign: number } | null = null;
  for (let at = 12; at + 8 <= bytes.length;) {
    const id = text(bytes, at, 4), size = data.getUint32(at + 4, true), body = at + 8;
    if (id === "fmt " && body + 16 <= bytes.length) format = { code: data.getUint16(body, true), channels: data.getUint16(body + 2, true), sampleRate: data.getUint32(body + 4, true), blockAlign: data.getUint16(body + 12, true) };
    if (id === "data") {
      if (!format) break;
      if (![1, 3, 0xfffe].includes(format.code)) return { ok: false, error: "This WAV file uses a compressed encoding. Only uncompressed (PCM or float) WAV files are supported." };
      if (!format.channels || !format.sampleRate || !format.blockAlign) break;
      const bytesOfAudio = Math.min(size, bytes.length - body);
      return { ok: true, info: { format: "wav", sampleRate: format.sampleRate, channels: format.channels, duration: bytesOfAudio / format.blockAlign / format.sampleRate } };
    }
    at = body + size + (size % 2);
  }
  return { ok: false, error: "This WAV file is damaged or incomplete. Its audio data couldn’t be found." };
}

const mpegRates = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] } as Record<number, number[]>;
const mpeg1Kbps = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
const mpeg2Kbps = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];

/** Reads an MPEG Layer III frame header. Returns null when `at` isn't a valid frame. */
export function readMp3Frame(bytes: Uint8Array, at: number) {
  if (at + 4 > bytes.length || bytes[at] !== 0xff || (bytes[at + 1] & 0xe0) !== 0xe0) return null;
  const version = (bytes[at + 1] >> 3) & 3, layer = (bytes[at + 1] >> 1) & 3;
  const bitrateIndex = bytes[at + 2] >> 4, rateIndex = (bytes[at + 2] >> 2) & 3, padding = (bytes[at + 2] >> 1) & 1;
  if (version === 1 || layer !== 1 || bitrateIndex === 0 || bitrateIndex === 15 || rateIndex === 3) return null;
  const mpeg1 = version === 3, sampleRate = mpegRates[version][rateIndex];
  const kbps = (mpeg1 ? mpeg1Kbps : mpeg2Kbps)[bitrateIndex];
  const mono = bytes[at + 3] >> 6 === 3;
  return { sampleRate, kbps, mono, mpeg1, samples: mpeg1 ? 1152 : 576, length: Math.floor((mpeg1 ? 144000 : 72000) * kbps / sampleRate) + padding };
}

function detectMp3(bytes: Uint8Array): AudioInfo | null {
  let start = 0;
  if (text(bytes, 0, 3) === "ID3") start = 10 + ((bytes[6] & 0x7f) << 21 | (bytes[7] & 0x7f) << 14 | (bytes[8] & 0x7f) << 7 | (bytes[9] & 0x7f)) + (bytes[5] & 0x10 ? 10 : 0);
  // Require two consecutive frames so stray 0xFF bytes in other files aren't mistaken for MP3.
  for (let at = start; at < Math.min(bytes.length, start + 65536); at++) {
    const frame = readMp3Frame(bytes, at);
    if (!frame) continue;
    const next = at + frame.length;
    if (next + 4 <= bytes.length && !readMp3Frame(bytes, next)) continue;
    // Xing/Info headers carry an exact frame count for VBR files; otherwise estimate from the bitrate.
    const xing = at + 4 + (frame.mpeg1 ? (frame.mono ? 17 : 32) : (frame.mono ? 9 : 17));
    const tag = text(bytes, xing, 4);
    const frames = (tag === "Xing" || tag === "Info") && bytes.length >= xing + 12 && view(bytes).getUint32(xing + 4) & 1 ? view(bytes).getUint32(xing + 8) : 0;
    const duration = frames ? frames * frame.samples / frame.sampleRate : (bytes.length - at) * 8 / (frame.kbps * 1000);
    return { format: "mp3", sampleRate: frame.sampleRate, channels: frame.mono ? 1 : 2, duration };
  }
  return null;
}

/** MP3 output keeps 32/44.1/48 kHz so every offered bitrate is valid; other rates become 44.1 kHz. */
export function targetSampleRate(sourceRate: number, output: AudioFormat) {
  if (output === "mp3") return [32000, 44100, 48000].includes(sourceRate) ? sourceRate : 44100;
  return sourceRate >= 8000 && sourceRate <= 96000 ? sourceRate : 48000;
}

export function outputName(name: string, format: AudioFormat) {
  const dot = name.lastIndexOf(".");
  const stem = (dot >= 0 ? name.slice(0, dot) : name).trim() || "audio";
  return `${stem}.${format}`;
}

/** Cleans a user-typed download name and always ends it with the output extension exactly once. */
export function downloadName(input: string, format: AudioFormat): { name: string; error: string | null } {
  let stem = [...input.normalize("NFC").replace(/\s/g, " ")].filter(char => char.charCodeAt(0) >= 32 && char.charCodeAt(0) !== 127).join("")
    .replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, " ").trim();
  // A typed .mp3/.wav is dropped so "Song.wav" or "Song.mp3" never becomes "Song.wav.wav" or "Song.mp3.wav".
  while (/\.(mp3|wav)$/i.test(stem)) stem = stem.replace(/\.(mp3|wav)$/i, "").trim();
  stem = stem.replace(/^[. ]+|[. ]+$/g, "");
  const name = `${stem}.${format}`;
  if (!stem) return { name, error: "Enter a file name before downloading." };
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(stem)) return { name, error: "That name is reserved by Windows. Choose a different name." };
  if (new TextEncoder().encode(name).length > 255) return { name, error: "That name is too long. Keep it under 255 characters." };
  return { name, error: null };
}

export function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1).replace(/\.0$/, "")} MB`;
}

export function formatDuration(seconds: number) {
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

type EncodeOptions = { onProgress?: (fraction: number) => void; signal?: AbortSignal; pause?: () => Promise<void> };
const yieldToBrowser = () => new Promise<void>(resolve => setTimeout(resolve, 0));
const toInt16 = (sample: number) => sample < 0 ? Math.max(-32768, Math.round(sample * 32768)) : Math.min(32767, Math.round(sample * 32767));

/** Encodes planar float samples as 16-bit PCM WAV. */
export async function encodeWav(channels: Float32Array[], sampleRate: number, { onProgress, signal, pause = yieldToBrowser }: EncodeOptions = {}) {
  const frames = channels[0]?.length ?? 0, count = channels.length, dataSize = frames * count * 2;
  if (!count || dataSize > 0xffffffff - 36) throw new Error("This audio is too long for a WAV file.");
  const bytes = new Uint8Array(44 + dataSize), data = view(bytes);
  const write = (at: number, value: string) => [...value].forEach((char, i) => { bytes[at + i] = char.charCodeAt(0); });
  write(0, "RIFF"); data.setUint32(4, 36 + dataSize, true); write(8, "WAVE");
  write(12, "fmt "); data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, count, true);
  data.setUint32(24, sampleRate, true); data.setUint32(28, sampleRate * count * 2, true); data.setUint16(32, count * 2, true); data.setUint16(34, 16, true);
  write(36, "data"); data.setUint32(40, dataSize, true);
  const step = 1 << 18;
  for (let start = 0, at = 44; start < frames; start += step) {
    signal?.throwIfAborted();
    for (let i = start, end = Math.min(frames, start + step); i < end; i++) for (let c = 0; c < count; c++, at += 2) data.setInt16(at, toInt16(channels[c][i]), true);
    onProgress?.(Math.min(frames, start + step) / frames);
    await pause();
  }
  onProgress?.(1);
  return [bytes];
}

/** Encodes planar float samples as constant-bitrate MP3 with LAME. Mono or stereo only. */
export async function encodeMp3(channels: Float32Array[], sampleRate: number, kbps: Mp3Bitrate, { onProgress, signal, pause = yieldToBrowser }: EncodeOptions = {}) {
  if (channels.length < 1 || channels.length > 2) throw new Error("MP3 output supports mono or stereo audio only.");
  const encoder = new Mp3Encoder(channels.length, sampleRate, kbps);
  const frames = channels[0].length, block = 1152, parts: Uint8Array<ArrayBuffer>[] = [];
  const left = new Int16Array(block), right = new Int16Array(block);
  for (let start = 0, blocks = 0; start < frames; start += block, blocks++) {
    const size = Math.min(block, frames - start);
    for (let i = 0; i < size; i++) { left[i] = toInt16(channels[0][start + i]); if (channels[1]) right[i] = toInt16(channels[1][start + i]); }
    const out = channels[1] ? encoder.encodeBuffer(left.subarray(0, size), right.subarray(0, size)) : encoder.encodeBuffer(left.subarray(0, size));
    if (out.length) parts.push(new Uint8Array(out));
    if (blocks % 200 === 199) { signal?.throwIfAborted(); onProgress?.((start + size) / frames); await pause(); }
  }
  const tail = encoder.flush();
  if (tail.length) parts.push(new Uint8Array(tail));
  onProgress?.(1);
  return parts;
}

export const mimeTypes: Record<AudioFormat, string> = { mp3: "audio/mpeg", wav: "audio/wav" };
