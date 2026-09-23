import assert from "node:assert/strict";
import { test } from "node:test";
import { detectAudio, downloadName, encodeMp3, encodeWav, mp3Bitrates, outputName, readMp3Frame, targetSampleRate } from "./engine.ts";

const noPause = { pause: async () => {} };
const sine = (seconds, rate, channels = 2) => Array.from({ length: channels }, (_, c) => Float32Array.from({ length: Math.round(seconds * rate) }, (_, i) => 0.5 * Math.sin(2 * Math.PI * (440 + c * 110) * i / rate)));
const join = parts => { const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let at = 0; for (const p of parts) { out.set(p, at); at += p.length; } return out; };

test("encodes 16-bit PCM WAV that detects with the right rate, channels and duration", async () => {
  const bytes = join(await encodeWav(sine(1.5, 22050), 22050, noPause));
  assert.equal(bytes.length, 44 + 1.5 * 22050 * 2 * 2);
  assert.deepEqual(detectAudio(bytes), { ok: true, info: { format: "wav", sampleRate: 22050, channels: 2, duration: 1.5 } });
  const view = new DataView(bytes.buffer);
  assert.equal(view.getUint16(20, true), 1); assert.equal(view.getUint16(34, true), 16);
});

test("clamps out-of-range samples instead of wrapping", async () => {
  const bytes = join(await encodeWav([Float32Array.of(2, -2, 1, -1, 0)], 8000, noPause));
  const view = new DataView(bytes.buffer);
  assert.deepEqual([0, 1, 2, 3, 4].map(i => view.getInt16(44 + i * 2, true)), [32767, -32768, 32767, -32768, 0]);
});

test("encodes real MP3 frames at every offered bitrate", async () => {
  for (const kbps of mp3Bitrates) {
    const progress = [];
    const bytes = join(await encodeMp3(sine(2, 44100), 44100, kbps, { ...noPause, onProgress: f => progress.push(f) }));
    const frame = readMp3Frame(bytes, 0);
    assert.equal(frame.kbps, kbps); assert.equal(frame.sampleRate, 44100); assert.equal(frame.mono, false);
    assert.equal(progress.at(-1), 1);
    const detected = detectAudio(bytes);
    assert.equal(detected.ok && detected.info.format, "mp3");
    assert.ok(Math.abs(detected.info.duration - 2) < 0.1, `duration ${detected.info.duration}`);
    // Constant bitrate: file size tracks the chosen bitrate.
    assert.ok(Math.abs(bytes.length - kbps * 1000 / 8 * 2) < kbps * 1000 / 8 * 0.1);
  }
});

test("encodes mono MP3 and rejects more than two channels", async () => {
  const bytes = join(await encodeMp3(sine(1, 48000, 1), 48000, 128, noPause));
  assert.equal(readMp3Frame(bytes, 0).mono, true);
  await assert.rejects(encodeMp3(sine(0.1, 44100, 3), 44100, 128, noPause), /mono or stereo/);
});

test("skips ID3 tags and stops when aborted", async () => {
  const mp3 = join(await encodeMp3(sine(1, 44100), 44100, 192, noPause));
  const id3 = new Uint8Array(10 + 300); id3.set([0x49, 0x44, 0x33, 3, 0, 0, 0, 0, 2, 44]);
  assert.equal(detectAudio(join([id3, mp3])).ok, true);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(encodeMp3(sine(10, 44100), 44100, 128, { ...noPause, signal: controller.signal }));
  await assert.rejects(encodeWav(sine(1, 44100), 44100, { ...noPause, signal: controller.signal }));
});

test("rejects files that aren't MP3 or supported WAV", () => {
  const bytes = s => new TextEncoder().encode(s);
  assert.equal(detectAudio(new Uint8Array()).ok, false);
  assert.equal(detectAudio(bytes("just a text file pretending to be audio")).ok, false);
  assert.equal(detectAudio(Uint8Array.from({ length: 5000 }, (_, i) => (i * 7919) % 251)).ok, false);
  assert.equal(detectAudio(Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10, 0, 0, 0, 13, 0xff, 0xfb)).ok, false);
  assert.match(detectAudio(bytes("RIFF\0\0\0\0WAVEjunk")).error, /damaged/);
  const adpcm = new Uint8Array(60); adpcm.set(bytes("RIFF\0\0\0\0WAVEfmt ")); new DataView(adpcm.buffer).setUint32(16, 16, true);
  new DataView(adpcm.buffer).setUint16(20, 2, true); adpcm.set(bytes("data"), 36);
  assert.match(detectAudio(adpcm).error, /compressed/);
});

test("chooses output names and sample rates", () => {
  assert.equal(outputName("My Song.final.WAV", "mp3"), "My Song.final.mp3");
  assert.equal(outputName("track", "wav"), "track.wav");
  assert.equal(outputName(".mp3", "wav"), "audio.wav");
  assert.equal(targetSampleRate(48000, "mp3"), 48000);
  assert.equal(targetSampleRate(22050, "mp3"), 44100);
  assert.equal(targetSampleRate(96000, "mp3"), 44100);
  assert.equal(targetSampleRate(96000, "wav"), 96000);
  assert.equal(targetSampleRate(192000, "wav"), 48000);
});

test("cleans download names and protects the output extension", () => {
  const name = (input, format = "wav") => downloadName(input, format).name;
  assert.equal(name("Victory Lap (feat. Stacy Barthe) [mF2BXkkJxgk]"), "Victory Lap (feat. Stacy Barthe) [mF2BXkkJxgk].wav");
  assert.equal(name("  Victory Lap Clean  "), "Victory Lap Clean.wav");
  assert.equal(name("Victory Lap Clean.wav"), "Victory Lap Clean.wav");
  assert.equal(name("Victory Lap Clean.WAV.wav"), "Victory Lap Clean.wav");
  assert.equal(name("Song.mp3"), "Song.wav");
  assert.equal(name("Song.wav", "mp3"), "Song.mp3");
  assert.equal(name("Mix v1.2"), "Mix v1.2.wav");
  assert.equal(name('a<b>c:d"e/f\\g|h?i*j'), "abcdefghij.wav");
  assert.equal(name("tab\there\u0000"), "tab here.wav");
  assert.equal(name("...hidden. . "), "hidden.wav");
  for (const bad of ["", "   ", ".wav", "???", "..."]) assert.match(downloadName(bad, "wav").error, /Enter a file name/, JSON.stringify(bad));
  assert.match(downloadName("CON", "mp3").error, /reserved/);
  assert.match(downloadName("é".repeat(130), "mp3").error, /too long/);
  assert.equal(downloadName("fine", "mp3").error, null);
});
