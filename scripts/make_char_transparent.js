import sharp from 'sharp';

async function removeWhiteBackground(inputPath, outputPath) {
  const image = sharp(inputPath);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // RGBA buffer
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4] = data[i * channels];
    rgba[i * 4 + 1] = data[i * channels + 1];
    rgba[i * 4 + 2] = data[i * channels + 2];
    rgba[i * 4 + 3] = 255;
  }

  function isWhite(idx) {
    const r = rgba[idx];
    const g = rgba[idx + 1];
    const b = rgba[idx + 2];
    return r >= 240 && g >= 240 && b >= 240;
  }

  // BFS flood fill from all 4 borders
  const visited = new Uint8Array(width * height);
  const queue = [];

  for (let x = 0; x < width; x++) {
    queue.push(x, 0);
    queue.push(x, height - 1);
    visited[x] = 1;
    visited[(height - 1) * width + x] = 1;
  }
  for (let y = 0; y < height; y++) {
    queue.push(0, y);
    queue.push(width - 1, y);
    visited[y * width] = 1;
    visited[y * width + (width - 1)] = 1;
  }

  let head = 0;
  while (head < queue.length) {
    const cx = queue[head++];
    const cy = queue[head++];
    const pIdx = (cy * width + cx) * 4;

    if (isWhite(pIdx)) {
      rgba[pIdx + 3] = 0; // transparent!

      const neighbors = [
        [cx + 1, cy],
        [cx - 1, cy],
        [cx, cy + 1],
        [cx, cy - 1],
      ];

      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nIndex = ny * width + nx;
          if (!visited[nIndex]) {
            visited[nIndex] = 1;
            if (isWhite(nIndex * 4)) {
              queue.push(nx, ny);
            }
          }
        }
      }
    }
  }

  // Crop tight bounding box
  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (rgba[(y * width + x) * 4 + 3] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  console.log(inputPath, 'tight bbox:', { minX, maxX, minY, maxY, w: maxX - minX + 1, h: maxY - minY + 1 });

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const cropped = Buffer.alloc(cropW * cropH * 4);

  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const srcIdx = ((minY + y) * width + (minX + x)) * 4;
      const destIdx = (y * cropW + x) * 4;
      cropped[destIdx] = rgba[srcIdx];
      cropped[destIdx + 1] = rgba[srcIdx + 1];
      cropped[destIdx + 2] = rgba[srcIdx + 2];
      cropped[destIdx + 3] = rgba[srcIdx + 3];
    }
  }

  await sharp(cropped, { raw: { width: cropW, height: cropH, channels: 4 } })
    .png()
    .toFile(outputPath);

  console.log(`Saved transparent character: ${outputPath}`);
}

await removeWhiteBackground(
  'frontend/user/public/character/laki-laki.png',
  'frontend/user/public/mascots/character-cowok.png'
);

await removeWhiteBackground(
  'frontend/user/public/character/perempuan.png',
  'frontend/user/public/mascots/character-cewek.png'
);
