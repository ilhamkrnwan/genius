import { Elysia, t } from "elysia";
import { uploadBuffer, checkMinioHealth, DEFAULT_BUCKET, getPublicUrl } from "../storage/minio";
import { authMiddleware, requireAdmin } from "../middleware/auth";

export const storageRoutes = new Elysia({
  prefix: "/api/storage",
  detail: {
    tags: ["Storage & MinIO Object Service"],
  },
})
  // Health / Connection status check
  .get("/status", async () => {
    const isConnected = await checkMinioHealth();
    return {
      success: true,
      data: {
        service: "MinIO S3 Storage",
        connected: isConnected,
        bucket: DEFAULT_BUCKET,
      },
    };
  })

  // Authenticated upload route (Admin / Organizer)
  .use(authMiddleware)
  .use(requireAdmin)
  .post(
    "/upload",
    async ({ body, set }) => {
      try {
        const file = (body as any).file as File;
        const folder = (body as any).folder || "quiz";

        if (!file) {
          set.status = 400;
          return {
            success: false,
            error: { code: "INVALID_FILE", message: "File wajib disertakan." },
          };
        }

        // Generate clean object key
        const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
        const sanitizedBase = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[^a-zA-Z0-9_-]/g, "_")
          .toLowerCase();
        const timestamp = Date.now();
        const objectKey = `${folder}/${sanitizedBase}_${timestamp}.${ext}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const result = await uploadBuffer(
          objectKey,
          buffer,
          file.type || "application/octet-stream"
        );

        return {
          success: true,
          data: {
            url: result.url,
            key: result.key,
            filename: file.name,
            size: result.size,
            mimeType: file.type,
          },
        };
      } catch (err: any) {
        set.status = 500;
        return {
          success: false,
          error: {
            code: "STORAGE_UPLOAD_ERROR",
            message: `Gagal mengunggah file ke MinIO: ${err.message}`,
          },
        };
      }
    },
    {
      body: t.Object({
        file: t.File({
          maxSize: "15m",
        }),
        folder: t.Optional(t.String()),
      }),
    }
  );
