import fs from "fs";
import path from "path";
import { uploadBuffer, checkMinioHealth, ensureBucketExists, DEFAULT_BUCKET } from "../src/storage/minio";

interface MediaItem {
  id: string;
  pos: string;
  soalIndex: number;
  slug: string;
  defaultExt: string;
}

const MEDIA_LIST: MediaItem[] = [
  // Pos 9 (Lantai 4)
  { id: "1S0ZOeETjD1l9xPpoE6KnvIC-_L32vlzL", pos: "pos9", soalIndex: 1, slug: "internet_center", defaultExt: "png" },
  { id: "1yJ9kD3DW9WMNNOaea8RKCVixVGANmQEO", pos: "pos9", soalIndex: 2, slug: "creative_corner", defaultExt: "png" },
  { id: "1J1v_rdHQm7aw_YDemSLYiuJMAaecED4P", pos: "pos9", soalIndex: 3, slug: "bright_future", defaultExt: "png" },
  { id: "1QDVanLV67fUH8cRn769xUdYPo7ce17bY", pos: "pos9", soalIndex: 4, slug: "build_startup", defaultExt: "png" },
  { id: "1Q3Cht2fn4Sn9VxArIEnXH8e3HGwI7t9y", pos: "pos9", soalIndex: 5, slug: "tokoh_muassis_nu", defaultExt: "png" },

  // Pos 7 (Lantai 6)
  { id: "1gSO19MNNdMX5qpbn7At81Fp8ZNKmjiBu", pos: "pos7", soalIndex: 1, slug: "mbg_bahlil", defaultExt: "png" },
  { id: "1Ov580yOxG6Wt3350XnQcHFaeC8JdSo2m", pos: "pos7", soalIndex: 2, slug: "jokowi_solo", defaultExt: "png" },
  { id: "1rPBsyOTf8FBT1IYOj0TZCvzIb6GWB1F9", pos: "pos7", soalIndex: 3, slug: "prabowo_nyawit", defaultExt: "png" },
  { id: "1a6p4BbTwVNhLoulpsjlf7w7e6Hi6vm59", pos: "pos7", soalIndex: 4, slug: "monyet_saudara", defaultExt: "png" },
  { id: "1K_JfdcvOdBC-rmtSmCUdyzH_OMzgE7xH", pos: "pos7", soalIndex: 5, slug: "suara_ajeng_febri", defaultExt: "png" },

  // Pos 8 (Lantai 6)
  { id: "1Yyxf7m4tb83xOGe0IH4q72t4lSQsG2yW", pos: "pos8", soalIndex: 1, slug: "amphiteater_lt2", defaultExt: "png" },
  { id: "1alaoLPnHhU-nbpyGPt2UtsV0O9s7P26E", pos: "pos8", soalIndex: 2, slug: "student_hub_lt4", defaultExt: "png" },
  { id: "1AeC5fxt5jaWec-QrNY0XItnka6K3HW-Q", pos: "pos8", soalIndex: 3, slug: "lobby_lt1", defaultExt: "png" },
  { id: "1Ksd55wXqi0DsP7hzjZMmJToKdiFwOSuU", pos: "pos8", soalIndex: 4, slug: "kolaborasi_lt4", defaultExt: "png" },
  { id: "1wRZ-7UQjUqCKdsBCd8mgN3aIgnEyyHLb", pos: "pos8", soalIndex: 5, slug: "fti_lab_lt3", defaultExt: "png" },
];

async function fetchGoogleDriveFile(id: string): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  const directUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download`;
  
  let res = await fetch(directUrl, { redirect: "follow" });
  if (!res.ok) {
    // Fallback to standard url
    const fallbackUrl = `https://drive.google.com/uc?export=download&id=${id}`;
    res = await fetch(fallbackUrl, { redirect: "follow" });
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const contentType = res.headers.get("content-type") || "image/png";
  let ext = "png";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
  else if (contentType.includes("webp")) ext = "webp";
  else if (contentType.includes("svg")) ext = "svg";
  else if (contentType.includes("audio") || contentType.includes("mpeg") || contentType.includes("mp3")) ext = "mp3";
  else if (contentType.includes("mp4") || contentType.includes("video")) ext = "mp4";

  const arrayBuf = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuf);
  return { buffer, contentType, ext };
}

async function runMigration() {
  console.log("🚀 [MIGRASI] Memulai proses unduh 15 aset kuis dari Google Drive...");

  const basePublicDir = path.resolve(__dirname, "../../frontend/user/public/images/quiz");
  if (!fs.existsSync(basePublicDir)) {
    fs.mkdirSync(basePublicDir, { recursive: true });
  }

  const isMinioAvailable = await checkMinioHealth();
  if (isMinioAvailable) {
    console.log(`✅ [MinIO] Terhubung ke MinIO service. Bucket: ${DEFAULT_BUCKET}`);
    await ensureBucketExists(DEFAULT_BUCKET);
  } else {
    console.log("ℹ️ [MinIO] MinIO belum aktif di localhost:9000 (aset akan disimpan ke public/ local backup)");
  }

  const results: any[] = [];

  for (let i = 0; i < MEDIA_LIST.length; i++) {
    const item = MEDIA_LIST[i];
    const posDir = path.join(basePublicDir, item.pos);
    if (!fs.existsSync(posDir)) {
      fs.mkdirSync(posDir, { recursive: true });
    }

    try {
      console.log(`⬇️ [${i + 1}/15] Mengunduh ${item.pos} - Soal ${item.soalIndex} (${item.slug}) [ID: ${item.id}]...`);
      const { buffer, contentType, ext } = await fetchGoogleDriveFile(item.id);

      const fileName = `soal_${item.soalIndex}_${item.slug}.${ext}`;
      const localFilePath = path.join(posDir, fileName);
      fs.writeFileSync(localFilePath, buffer);
      console.log(`   💾 Tersimpan lokal: /images/quiz/${item.pos}/${fileName} (${(buffer.length / 1024).toFixed(1)} KB)`);

      let minioUrl: string | null = null;
      if (isMinioAvailable) {
        const objectKey = `quiz/${item.pos}/${fileName}`;
        const minioRes = await uploadBuffer(objectKey, buffer, contentType);
        minioUrl = minioRes.url;
        console.log(`   🪣 Terunggah ke MinIO: ${minioUrl}`);
      }

      results.push({
        ...item,
        fileName,
        localPath: `/images/quiz/${item.pos}/${fileName}`,
        minioUrl,
        sizeKb: (buffer.length / 1024).toFixed(1),
        success: true,
      });
    } catch (err: any) {
      console.error(`   ❌ Gagal mengunduh ${item.id}: ${err.message}`);
      results.push({
        ...item,
        error: err.message,
        success: false,
      });
    }
  }

  console.log("\n📊 [RINGKASAN MIGRASI]:");
  console.table(
    results.map((r) => ({
      Pos: r.pos,
      Soal: r.soalIndex,
      Slug: r.slug,
      Status: r.success ? "✅ Berhasil" : "❌ Gagal",
      FileLokal: r.localPath || "-",
      Ukuran: r.sizeKb ? `${r.sizeKb} KB` : "-",
    }))
  );

  console.log("🎉 Proses migrasi dan backup lokal aset kuis selesai!");
}

runMigration().catch(console.error);
