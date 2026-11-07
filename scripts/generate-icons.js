import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const fontPath = fs.existsSync(path.resolve('scripts/fonts/Manjari-Bold.ttf'))
  ? path.resolve('scripts/fonts/Manjari-Bold.ttf')
  : '/tmp/Manjari-Bold.ttf';

if (!fs.existsSync(fontPath)) {
  console.error('Font not found at ' + fontPath);
  process.exit(1);
}

const fontBase64 = fs.readFileSync(fontPath).toString('base64');

// Generates cohesive Chilavu brand SVGs
function getChilavuSvg({ size, rx = 0, isFavicon = false }) {
  // Optical vertical offset and sizing
  // On 512 canvas: fontSize 280, x 258, y 362 gives exact bounding box center at (256, 256)
  const scale = size / 512;
  const fontSize = Math.round(280 * scale);
  const textX = Math.round(258 * scale);
  const textY = Math.round(362 * scale);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <style>
      @font-face {
        font-family: 'Manjari';
        font-weight: bold;
        src: url(data:font/ttf;charset=utf-8;base64,${fontBase64}) format('truetype');
      }
      .mark {
        font-family: 'Manjari', 'Noto Sans Malayalam', sans-serif;
        font-weight: bold;
        fill: #ffffff;
        text-anchor: middle;
      }
    </style>
    <linearGradient id="pineFill" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3885a3"/>
      <stop offset="55%" stop-color="#31748f"/>
      <stop offset="100%" stop-color="#245970"/>
    </linearGradient>
    <linearGradient id="highlight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Consistent Rich Pine Gradient Background -->
  <rect width="${size}" height="${size}" ${rx > 0 ? `rx="${rx}"` : ''} fill="url(#pineFill)"/>
  <rect width="${size}" height="${size}" ${rx > 0 ? `rx="${rx}"` : ''} fill="url(#highlight)"/>

  <!-- Centered Malayalam Standalone Logo Mark: ചി -->
  <text x="${textX}" y="${textY}" font-size="${fontSize}" xml:lang="ml" class="mark">ചി</text>
</svg>`;
}

// Favicon SVG with higher relative stroke weight/size for tiny viewports (16-48px)
function getFaviconSvg(size = 48) {
  const scale = size / 512;
  const fontSize = Math.round(310 * scale);
  const textX = Math.round(258 * scale);
  const textY = Math.round(366 * scale);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <style>
      @font-face {
        font-family: 'Manjari';
        font-weight: bold;
        src: url(data:font/ttf;charset=utf-8;base64,${fontBase64}) format('truetype');
      }
      .fav-mark {
        font-family: 'Manjari', 'Noto Sans Malayalam', sans-serif;
        font-weight: bold;
        fill: #ffffff;
        text-anchor: middle;
      }
    </style>
    <linearGradient id="favPine" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3885a3"/>
      <stop offset="100%" stop-color="#245970"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="url(#favPine)"/>
  <text x="${textX}" y="${textY}" font-size="${fontSize}" xml:lang="ml" class="fav-mark">ചി</text>
</svg>`;
}

// Helper to create an ICO format containing PNG data
function createIcoFromPngBuffers(pngBuffers) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(count, 4);

  let offset = 6 + count * 16;
  const dirEntries = [];

  for (const item of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(item.width >= 256 ? 0 : item.width, 0);
    entry.writeUInt8(item.height >= 256 ? 0 : item.height, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(item.buffer.length, 8); // image bytes
    entry.writeUInt32LE(offset, 12); // offset
    dirEntries.push(entry);
    offset += item.buffer.length;
  }

  return Buffer.concat([
    header,
    ...dirEntries,
    ...pngBuffers.map((item) => item.buffer),
  ]);
}

async function run() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  console.log('Generating consistent Chilavu brand icons (symbol: ചി)...');

  // 1. Vector SVG (with rounded corners for standalone preview)
  const svg512 = getChilavuSvg({ size: 512, rx: 112 });
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svg512, 'utf-8');
  console.log('✓ Wrote public/icon.svg');

  // 2. Full-bleed SVG for raster generation (safe zone ≤ 80% circle)
  const fullBleedSvg = getChilavuSvg({ size: 512, rx: 0 });

  // 3. PWA 512x512
  const pwa512Buf = await sharp(Buffer.from(fullBleedSvg))
    .resize(512, 512)
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512Buf);
  console.log('✓ Wrote public/pwa-512x512.png');

  // 4. PWA 192x192
  const pwa192Buf = await sharp(Buffer.from(fullBleedSvg))
    .resize(192, 192)
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192Buf);
  console.log('✓ Wrote public/pwa-192x192.png');

  // 5. PWA Maskable 512x512
  fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwa512Buf);
  console.log('✓ Wrote public/pwa-maskable-512x512.png');

  // 6. Apple Touch Icon (180x180)
  const appleBuf = await sharp(Buffer.from(fullBleedSvg))
    .resize(180, 180)
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleBuf);
  console.log('✓ Wrote public/apple-touch-icon.png');

  // 7. Favicon ICO (Multi-size: 16, 32, 48)
  const fav16Buf = await sharp(Buffer.from(getFaviconSvg(16)))
    .resize(16, 16)
    .png()
    .toBuffer();
  const fav32Buf = await sharp(Buffer.from(getFaviconSvg(32)))
    .resize(32, 32)
    .png()
    .toBuffer();
  const fav48Buf = await sharp(Buffer.from(getFaviconSvg(48)))
    .resize(48, 48)
    .png()
    .toBuffer();

  const icoBuf = createIcoFromPngBuffers([
    { width: 16, height: 16, buffer: fav16Buf },
    { width: 32, height: 32, buffer: fav32Buf },
    { width: 48, height: 48, buffer: fav48Buf },
  ]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuf);
  console.log('✓ Wrote public/favicon.ico (16, 32, 48 multiresolution)');

  console.log('All Chilavu icon assets generated successfully!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
