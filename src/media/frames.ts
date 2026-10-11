import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Draft, Goal, ResearchBundle, StoryboardFrame, VerificationResult } from "../types.js";

export function buildStoryboard(
  goal: Goal,
  research: ResearchBundle,
  draft: Draft,
  verification: VerificationResult,
): StoryboardFrame[] {
  const highlights = draft.notes.highlights.slice(0, 3);
  return [
    {
      index: 0,
      title: `${goal.name} ${goal.tag}`,
      body: `${goal.repo} · ${research.compareRange}`,
      durationMs: 2800,
    },
    {
      index: 1,
      title: "What shipped",
      body: `${research.stats.commits} commits · ${research.stats.files} files · +${research.stats.additions}/-${research.stats.deletions}`,
      durationMs: 3200,
    },
    ...highlights.map((line, index) => ({
      index: index + 2,
      title: `Highlight ${index + 1}`,
      body: line,
      durationMs: 3200,
    })),
    {
      index: highlights.length + 2,
      title: "Verified",
      body: `${verification.claims.filter((claim) => claim.status !== "unsupported").length} grounded claims · ${verification.rejectedFeatures.length} rejected`,
      durationMs: 2800,
    },
    {
      index: highlights.length + 3,
      title: "ReleaseCrew",
      body: "Planner · researcher · writer · verifier · media",
      durationMs: 2600,
    },
  ];
}

export function writePpmFrames(dir: string, frames: StoryboardFrame[]): string[] {
  mkdirSync(dir, { recursive: true });
  return frames.map((frame) => {
    const path = join(dir, `frame-${String(frame.index).padStart(2, "0")}.ppm`);
    writeFileSync(path, renderPpm(frame));
    return path;
  });
}

function renderPpm(frame: StoryboardFrame): Buffer {
  const width = 1280;
  const height = 720;
  const header = Buffer.from(`P6\n${width} ${height}\n255\n`);
  const pixels = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 3;
      const t = y / height;
      pixels[i] = Math.round(11 + t * 18);
      pixels[i + 1] = Math.round(16 + t * 28);
      pixels[i + 2] = Math.round(32 + t * 40);
    }
  }
  drawBar(pixels, width, 96, 112, 214, 90);
  blitText(pixels, width, height, frame.title, 80, 260, 5);
  blitText(pixels, width, height, wrapLine(frame.body, 42), 80, 380, 3);
  return Buffer.concat([header, pixels]);
}

function drawBar(pixels: Buffer, width: number, y: number, r: number, g: number, b: number): void {
  for (let row = y; row < y + 8; row += 1) {
    for (let x = 64; x < width - 64; x += 1) {
      const i = (row * width + x) * 3;
      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
    }
  }
}

function wrapLine(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function blitText(
  pixels: Buffer,
  width: number,
  height: number,
  text: string,
  x0: number,
  y0: number,
  scale: number,
): void {
  let cursor = x0;
  for (const char of text.toUpperCase()) {
    const glyph = GLYPHS[char] ?? GLYPHS["?"] ?? [];
    for (let gy = 0; gy < 7; gy += 1) {
      for (let gx = 0; gx < 5; gx += 1) {
        if (!glyph[gy]?.[gx]) continue;
        for (let dy = 0; dy < scale; dy += 1) {
          for (let dx = 0; dx < scale; dx += 1) {
            const x = cursor + gx * scale + dx;
            const y = y0 + gy * scale + dy;
            if (x < 0 || y < 0 || x >= width || y >= height) continue;
            const i = (y * width + x) * 3;
            pixels[i] = 240;
            pixels[i + 1] = 244;
            pixels[i + 2] = 250;
          }
        }
      }
    }
    cursor += 6 * scale;
  }
}

const GLYPHS: Record<string, number[][]> = buildGlyphs();

function buildGlyphs(): Record<string, number[][]> {
  const raw: Record<string, string[]> = {
    " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
    A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
    C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
    D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
    E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
    F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
    G: ["01110", "10001", "10000", "10111", "10001", "10001", "01110"],
    H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
    I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
    J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
    K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
    L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
    M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
    N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
    O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
    Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
    R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
    S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
    T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
    U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
    V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
    W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
    X: ["10001", "01010", "00100", "00100", "00100", "01010", "10001"],
    Y: ["10001", "01010", "00100", "00100", "00100", "00100", "00100"],
    Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
    "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
    "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
    "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
    "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
    "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
    "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
    "6": ["01110", "10000", "11110", "10001", "10001", "10001", "01110"],
    "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
    "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
    "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
    ".": ["00000", "00000", "00000", "00000", "00000", "00100", "00100"],
    ",": ["00000", "00000", "00000", "00000", "00100", "00100", "01000"],
    "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
    "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
    "/": ["00001", "00010", "00100", "01000", "10000", "00000", "00000"],
    ":": ["00000", "00100", "00100", "00000", "00100", "00100", "00000"],
    "#": ["01010", "11111", "01010", "01010", "11111", "01010", "00000"],
    "?": ["01110", "10001", "00010", "00100", "00100", "00000", "00100"],
    "·": ["00000", "00000", "00100", "00000", "00000", "00000", "00000"],
    "…": ["00000", "00000", "00000", "00000", "00000", "10101", "00000"],
  };
  const glyphs: Record<string, number[][]> = {};
  for (const [char, rows] of Object.entries(raw)) {
    glyphs[char] = rows.map((row) => row.split("").map((bit) => Number(bit)));
  }
  return glyphs;
}
