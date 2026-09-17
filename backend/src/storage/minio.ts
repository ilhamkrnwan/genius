import * as Minio from "minio";

const endPoint = process.env.MINIO_ENDPOINT || "localhost";
const port = parseInt(process.env.MINIO_PORT || "9000", 10);
const useSSL = process.env.MINIO_USE_SSL === "true";
const accessKey = process.env.MINIO_ACCESS_KEY || "genius_minio";
const secretKey = process.env.MINIO_SECRET_KEY || "genius_minio_secret_2026";
export const DEFAULT_BUCKET = process.env.MINIO_BUCKET || "genius-assets";
export const PUBLIC_BASE_URL =
  process.env.MINIO_PUBLIC_URL ||
  `http://${endPoint}:${port}/${DEFAULT_BUCKET}`;

export const minioClient = new Minio.Client({
  endPoint,
  port,
  useSSL,
  accessKey,
  secretKey,
});

/**
 * Policy for public read access to objects in bucket
 */
function getPublicReadPolicy(bucket: string) {
  return JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "PublicReadGetObject",
        Effect: "Allow",
        Principal: "*",
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  });
}

/**
 * Ensure specified bucket exists and is configured for public read
 */
export async function ensureBucketExists(bucket: string = DEFAULT_BUCKET): Promise<boolean> {
  try {
    const exists = await minioClient.bucketExists(bucket);
    if (!exists) {
      await minioClient.makeBucket(bucket, "us-east-1");
      console.log(`🪣 [MinIO] Bucket "${bucket}" created.`);
      await minioClient.setBucketPolicy(bucket, getPublicReadPolicy(bucket));
      console.log(`🔓 [MinIO] Public read policy set for bucket "${bucket}".`);
    }
    return true;
  } catch (err: any) {
    console.warn(`⚠️ [MinIO] Unable to ensure bucket "${bucket}": ${err.message}`);
    return false;
  }
}

/**
 * Upload a Buffer to MinIO
 */
export async function uploadBuffer(
  objectName: string,
  buffer: Buffer,
  contentType: string = "application/octet-stream",
  bucket: string = DEFAULT_BUCKET
): Promise<{ url: string; key: string; size: number }> {
  await ensureBucketExists(bucket);

  await minioClient.putObject(bucket, objectName, buffer, buffer.length, {
    "Content-Type": contentType,
  });

  const url = `${PUBLIC_BASE_URL.replace(/\/+$/, "")}/${objectName}`;
  return {
    url,
    key: objectName,
    size: buffer.length,
  };
}

/**
 * Upload a local file to MinIO
 */
export async function uploadLocalFile(
  objectName: string,
  filePath: string,
  contentType: string = "application/octet-stream",
  bucket: string = DEFAULT_BUCKET
): Promise<{ url: string; key: string }> {
  await ensureBucketExists(bucket);

  await minioClient.fPutObject(bucket, objectName, filePath, {
    "Content-Type": contentType,
  });

  const url = `${PUBLIC_BASE_URL.replace(/\/+$/, "")}/${objectName}`;
  return {
    url,
    key: objectName,
  };
}

/**
 * Get public URL for an object key
 */
export function getPublicUrl(objectName: string): string {
  if (objectName.startsWith("http://") || objectName.startsWith("https://")) {
    return objectName;
  }
  const cleanKey = objectName.replace(/^\/+/, "");
  return `${PUBLIC_BASE_URL.replace(/\/+$/, "")}/${cleanKey}`;
}

/**
 * Check if MinIO service is reachable
 */
export async function checkMinioHealth(): Promise<boolean> {
  try {
    await minioClient.listBuckets();
    return true;
  } catch {
    return false;
  }
}
