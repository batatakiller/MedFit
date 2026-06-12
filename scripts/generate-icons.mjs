// Gera icon-192.png e icon-512.png (gradiente verde→azul com "pulso" branco)
// sem dependências externas — PNG montado manualmente com zlib do Node.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

// Pontos da linha de "pulso" (coordenadas no espaço 512) — espelha o icon.svg
const polyline = [
  [96, 256], [160, 256], [200, 152], [256, 360], [304, 208], [336, 256], [416, 256],
];
const distToSegment = (px, py, [x1, y1], [x2, y2]) => {
  const dx = x2 - x1, dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
};

function makeIcon(size) {
  const s = size / 512;
  const stroke = 17 * s * 2;
  const radius = 112 * s;
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filtro 0
    for (let x = 0; x < size; x++) {
      const o = y * (size * 4 + 1) + 1 + x * 4;
      // cantos arredondados
      const cx = Math.max(radius - x, x - (size - 1 - radius), 0);
      const cy = Math.max(radius - y, y - (size - 1 - radius), 0);
      const inside = cx === 0 || cy === 0 || Math.hypot(cx, cy) <= radius;
      if (!inside) {
        raw.writeUInt32BE(0, o);
        continue;
      }
      const t = (x + y) / (2 * (size - 1));
      let r = Math.round(0x10 + (0x25 - 0x10) * t);
      let g = Math.round(0xb9 + (0x63 - 0xb9) * t);
      let b = Math.round(0x81 + (0xeb - 0x81) * t);
      // linha de pulso + ponto
      const px = x / s, py = y / s;
      let d = Infinity;
      for (let i = 0; i < polyline.length - 1; i++) d = Math.min(d, distToSegment(px, py, polyline[i], polyline[i + 1]));
      const dot = Math.hypot(px - 416, py - 256) <= 22;
      if (d * s <= stroke / 2 || dot) {
        r = g = b = 255;
      }
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512]) {
  writeFileSync(join(outDir, `icon-${size}.png`), makeIcon(size));
  console.log(`icon-${size}.png ok`);
}
