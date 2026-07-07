import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.join(__dirname, '../src/assets/logo.svg');
const buildDir = path.join(__dirname, '../build');

async function generateIcons() {
  const sizes = [16, 32, 48, 64, 128, 256];

  for (const size of sizes) {
    const pngBuffer = await sharp(svgPath)
      .resize(size, size)
      .png()
      .toBuffer();

    fs.writeFileSync(path.join(buildDir, `icon${size}.png`), pngBuffer);
    console.log(`Generated icon${size}.png`);
  }

  const mainIcon = await sharp(svgPath)
    .resize(256, 256)
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(buildDir, 'icon.png'), mainIcon);
  console.log('Generated icon.png (256x256)');
}

generateIcons().catch(console.error);
