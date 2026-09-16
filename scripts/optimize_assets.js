import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function optimizeFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const inputBuffer = fs.readFileSync(filePath);
  const origSizeKB = Math.round(inputBuffer.length / 1024);
  const ext = path.extname(filePath).toLowerCase();
  const baseName = path.basename(filePath).toLowerCase();

  try {
    const metadata = await sharp(inputBuffer).metadata();

    if (ext === '.jpg' || ext === '.jpeg') {
      let maxW = 1600;
      if (baseName.includes('avatar')) maxW = 256;
      else if (baseName.includes('half')) maxW = 800;
      else if (baseName.includes('ambient')) maxW = 1280;

      const outputBuffer = await sharp(inputBuffer)
        .resize({ width: Math.min(metadata.width || maxW, maxW), withoutEnlargement: true })
        .jpeg({ quality: 82, mozjpeg: true })
        .toBuffer();

      if (outputBuffer.length < inputBuffer.length) {
        fs.writeFileSync(filePath, outputBuffer);
        const newSizeKB = Math.round(outputBuffer.length / 1024);
        console.log(`[OPT JPEG] ${filePath}: ${origSizeKB} KB -> ${newSizeKB} KB (-${Math.round((1 - newSizeKB/origSizeKB)*100)}%)`);
      }
    } else if (ext === '.png') {
      let maxW = 1600;
      if (baseName.includes('avatar')) maxW = 256;
      else if (baseName.includes('character-')) maxW = 600;
      else if (baseName.includes('background')) maxW = 1400;

      const outputBuffer = await sharp(inputBuffer)
        .resize({ width: Math.min(metadata.width || maxW, maxW), withoutEnlargement: true })
        .png({ quality: 85, compressionLevel: 9, palette: true })
        .toBuffer();

      if (outputBuffer.length < inputBuffer.length) {
        fs.writeFileSync(filePath, outputBuffer);
        const newSizeKB = Math.round(outputBuffer.length / 1024);
        console.log(`[OPT PNG] ${filePath}: ${origSizeKB} KB -> ${newSizeKB} KB (-${Math.round((1 - newSizeKB/origSizeKB)*100)}%)`);
      }
    }
  } catch (err) {
    console.warn(`[WARN] Failed to optimize ${filePath}:`, err.message);
  }
}

async function run() {
  const dirs = [
    'frontend/user/public',
    'frontend/user/public/games',
    'frontend/user/public/mascots',
    'frontend/user/public/character',
    'frontend/user/public/logo',
    'frontend/admin/public',
    'frontend/admin/public/games',
  ];

  console.log('=== STARTING ASSET COMPRESSION & OPTIMIZATION ===');
  for (const d of dirs) {
    if (!fs.existsSync(d)) continue;
    const files = fs.readdirSync(d);
    for (const f of files) {
      const full = path.join(d, f);
      if (fs.statSync(full).isFile()) {
        const ext = path.extname(f).toLowerCase();
        if (['.jpg', '.jpeg', '.png'].includes(ext)) {
          await optimizeFile(full);
        }
      }
    }
  }
  console.log('=== ASSET COMPRESSION COMPLETE ===');
}

run();
