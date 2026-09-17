import fs from "fs";
import path from "path";

interface DownloadItem {
  pos: string;
  name: string;
  id: string;
  filename: string;
}

const items: DownloadItem[] = [
  // POS 7
  { pos: "pos7", name: "Tongkonan", id: "10hYyDJm3Z61kpuoDK8KxN8RMmPaxrJtY", filename: "soal_1_tongkonan.jpg" },
  { pos: "pos7", name: "Cenderawasih", id: "1pEojMQRr_HWorBlNIy04iJklgPtrJkkb", filename: "soal_2_cenderawasih.jpg" },
  { pos: "pos7", name: "Gudeg", id: "1oVvPNilB_t6K96vmIodFMgkY8z1WUPG9", filename: "soal_3_gudeg.jpg" },
  { pos: "pos7", name: "Gadang", id: "1zoZ7qiIofoC9Wxh4lDn5PrZT7XBDIvrw", filename: "soal_4_gadang.jpg" },
  { pos: "pos7", name: "Jenggolo", id: "1GjAz2B6I8DIv2mKd9mW_ItlJ3YQh-SJ9", filename: "soal_5_jenggolo.jpg" },

  // POS 8
  { pos: "pos8", name: "Amphiteater Lt2", id: "1Yyxf7m4tb83xOGe0IH4q72t4lSQsG2yW", filename: "soal_1_amphiteater_lt2.jpg" },
  { pos: "pos8", name: "Student Hub Lt4", id: "1alaoLPnHhU-nbpyGPt2UtsV0O9s7P26E", filename: "soal_2_student_hub_lt4.jpg" },
  { pos: "pos8", name: "Lobby Lt1", id: "1AeC5fxt5jaWec-QrNY0XItnka6K3HW-Q", filename: "soal_3_lobby_lt1.jpg" },
  { pos: "pos8", name: "Kolaborasi Lt4", id: "1Ksd55wXqi0DsP7hzjZMmJToKdiFwOSuU", filename: "soal_4_kolaborasi_lt4.jpg" },
  { pos: "pos8", name: "FTI Lab Lt3", id: "1wRZ-7UQjUqCKdsBCd8mgN3aIgnEyyHLb", filename: "soal_5_fti_lab_lt3.jpg" },
];

async function downloadDriveImage(id: string): Promise<Buffer | null> {
  const candidates = [
    `https://drive.usercontent.google.com/download?id=${id}&export=download&authuser=0`,
    `https://lh3.googleusercontent.com/d/${id}`,
    `https://drive.google.com/thumbnail?id=${id}&sz=w1600`,
    `https://docs.google.com/uc?export=download&id=${id}`
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        redirect: "follow"
      });
      const ct = res.headers.get("content-type") || "";
      if (res.status === 200 && ct.startsWith("image/")) {
        const ab = await res.arrayBuffer();
        return Buffer.from(ab);
      }
    } catch (e: any) {
      // try next candidate
    }
  }
  return null;
}

const targetDirs = [
  path.resolve(process.cwd(), "frontend/user/public/images/quiz"),
  path.resolve(process.cwd(), "frontend/admin/public/images/quiz"),
  path.resolve(process.cwd(), "frontend/admin/public/images"),
];

async function main() {
  console.log("📥 Downloading quiz images for Pos 7 & Pos 8...");

  for (const item of items) {
    console.log(`⏳ Downloading [${item.pos}] ${item.name} (${item.id})...`);
    const buf = await downloadDriveImage(item.id);
    if (!buf) {
      console.error(`❌ FAILED to download ${item.name}`);
      continue;
    }

    console.log(`   ✅ Success (${buf.length} bytes). Writing to target directories...`);

    for (const baseDir of targetDirs) {
      const dir = path.join(baseDir, item.pos);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const filePath = path.join(dir, item.filename);
      fs.writeFileSync(filePath, buf);
      console.log(`      -> Saved to ${filePath}`);
    }
  }

  console.log("🎉 All images downloaded and saved successfully!");
}

main().catch(console.error);
