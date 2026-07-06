import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const iconsDir = path.resolve('public/icons');
const source = process.argv[2] ?? path.join(iconsDir, 'logo-source.png');

if (!fs.existsSync(source)) {
  console.error(`Usage: node scripts/make-logo-transparent.mjs [path-to-source.png]`);
  console.error(`Source image not found: ${source}`);
  process.exit(1);
}

const threshold = 42;

function isBackgroundBlack(r, g, b, a) {
  return a > 0 && r <= threshold && g <= threshold && b <= threshold;
}

async function removeOuterBlackBackground(inputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const visited = new Uint8Array(width * height);
  const queue = [];

  const index = (x, y) => y * width + x;
  const pushIfBlack = (x, y) => {
    const i = index(x, y);
    if (visited[i]) {
      return;
    }
    const offset = i * channels;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    const a = data[offset + 3];
    if (!isBackgroundBlack(r, g, b, a)) {
      return;
    }
    visited[i] = 1;
    queue.push(i);
  };

  for (let x = 0; x < width; x += 1) {
    pushIfBlack(x, 0);
    pushIfBlack(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    pushIfBlack(0, y);
    pushIfBlack(width - 1, y);
  }

  while (queue.length > 0) {
    const i = queue.pop();
    const x = i % width;
    const y = (i - x) / width;
    const offset = i * channels;
    data[offset + 3] = 0;

    if (x > 0) {
      pushIfBlack(x - 1, y);
    }
    if (x < width - 1) {
      pushIfBlack(x + 1, y);
    }
    if (y > 0) {
      pushIfBlack(x, y - 1);
    }
    if (y < height - 1) {
      pushIfBlack(x, y + 1);
    }
  }

  return sharp(data, { raw: { width, height, channels } }).png();
}

async function writeIcon(size, outputName) {
  const pipeline = await removeOuterBlackBackground(source);
  await pipeline
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toFile(path.join(iconsDir, outputName));
}

await writeIcon(128, 'icon-128.png');
await writeIcon(48, 'icon-48.png');
await writeIcon(16, 'icon-16.png');

console.log('Transparent PNG icons written to public/icons');
