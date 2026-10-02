// Draws the app icon (a jade pillow under three grains of millet) as SVG and as PNGs for the web manifest.
// Usage: node tools/icons.ts   — writes public/icon.svg, public/icon-192.png and public/icon-512.png

import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

type RGB = [number, number, number];
const INK: RGB = [0x20, 0x1d, 0x16];
const JADE: RGB = [0x3f, 0x8a, 0x5a];
const JADE_LIGHT: RGB = [0x6c, 0xc4, 0x8b];
const MILLET: RGB = [0xd8, 0xa9, 0x4a];

/** Shapes in a 0..1 square, drawn back to front. Everything sits inside the maskable safe zone (the middle 80%). */
interface Shape {
  color: RGB;
  inside: (x: number, y: number) => boolean;
}

const roundRect = (x0: number, y0: number, x1: number, y1: number, r: number) => (x: number, y: number) => {
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r && x >= x0 && x <= x1 && y >= y0 && y <= y1;
};
const ellipse = (cx: number, cy: number, rx: number, ry: number) => (x: number, y: number) =>
  ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

const SHAPES: Shape[] = [
  { color: JADE, inside: roundRect(0.2, 0.5, 0.8, 0.72, 0.1) },
  { color: JADE_LIGHT, inside: roundRect(0.27, 0.55, 0.73, 0.58, 0.015) },
  { color: MILLET, inside: ellipse(0.38, 0.36, 0.045, 0.06) },
  { color: MILLET, inside: ellipse(0.5, 0.3, 0.045, 0.06) },
  { color: MILLET, inside: ellipse(0.62, 0.36, 0.045, 0.06) },
];

function colorAt(x: number, y: number): RGB {
  let c = INK;
  for (const s of SHAPES) if (s.inside(x, y)) c = s.color;
  return c;
}

/** Renders with 4×4 supersampling so the edges are smooth. */
function render(size: number): Buffer {
  const SS = 4;
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let py = 0; py < size; py++) {
    raw[py * (size * 3 + 1)] = 0; // filter: none
    for (let px = 0; px < size; px++) {
      const sum = [0, 0, 0];
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const c = colorAt((px + (sx + 0.5) / SS) / size, (py + (sy + 0.5) / SS) / size);
          for (let k = 0; k < 3; k++) sum[k]! += c[k]!;
        }
      }
      for (let k = 0; k < 3; k++) raw[py * (size * 3 + 1) + 1 + px * 3 + k] = Math.round(sum[k]! / (SS * SS));
    }
  }
  return png(size, size, raw);
}

function png(width: number, height: number, raw: Buffer): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // colour type: RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function crc32(buf: Buffer): number {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

const hex = (c: RGB) => `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="18" fill="${hex(INK)}"/>
  <rect x="20" y="50" width="60" height="22" rx="10" fill="${hex(JADE)}"/>
  <rect x="27" y="55" width="46" height="3" rx="1.5" fill="${hex(JADE_LIGHT)}"/>
  <ellipse cx="38" cy="36" rx="4.5" ry="6" fill="${hex(MILLET)}"/>
  <ellipse cx="50" cy="30" rx="4.5" ry="6" fill="${hex(MILLET)}"/>
  <ellipse cx="62" cy="36" rx="4.5" ry="6" fill="${hex(MILLET)}"/>
</svg>
`;

mkdirSync('public', { recursive: true });
writeFileSync('public/icon.svg', svg);
writeFileSync('public/icon-192.png', render(192));
writeFileSync('public/icon-512.png', render(512));
console.log('public/icon.svg, icon-192.png, icon-512.png');
