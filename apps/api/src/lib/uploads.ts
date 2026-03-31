import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import type { MerchantTaskAttachment } from "@meow/contracts";
import type { TaskAssetAttachmentRecord } from "@meow/database/repository";
import { AppError } from "./errors.js";

const defaultUploadRoot = (): string =>
  process.env.MEOW_UPLOAD_DIR ??
  (process.env.VITEST === "true"
    ? join(tmpdir(), "meow-api-uploads")
    : join(process.cwd(), "apps/api/uploads"));

const mimeTypeByExtension: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm"
};

const extensionByMimeType: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/webm": ".webm"
};

const inferKind = (mimeType: string): MerchantTaskAttachment["kind"] => {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  throw new AppError(400, "unsupported upload type");
};

const inferExtension = (fileName: string, mimeType: string): string => {
  const existing = extname(fileName).toLowerCase();
  if (existing) {
    return existing;
  }

  return extensionByMimeType[mimeType] ?? "";
};

export const saveMerchantTaskAssets = async (
  files: File[]
): Promise<TaskAssetAttachmentRecord[]> => {
  if (files.length === 0) {
    throw new AppError(400, "missing upload files");
  }

  const uploadRoot = defaultUploadRoot();
  await mkdir(uploadRoot, { recursive: true });

  const attachments = await Promise.all(
    files.map(async (file) => {
      const mimeType = file.type || "application/octet-stream";
      const kind = inferKind(mimeType);
      const id = randomUUID();
      const extension = inferExtension(file.name, mimeType);
      const storageName = `${id}${extension}`;
      const filePath = join(uploadRoot, storageName);
      const bytes = new Uint8Array(await file.arrayBuffer());

      await writeFile(filePath, bytes);

      return {
        id,
        kind,
        url: `/merchant/uploads/${storageName}`,
        fileName: file.name || storageName,
        mimeType
      } satisfies TaskAssetAttachmentRecord;
    })
  );

  return attachments;
};

export const readMerchantUploadedAsset = async (
  storageName: string
): Promise<{ body: Uint8Array; mimeType: string }> => {
  const safeStorageName = basename(storageName);
  const uploadRoot = defaultUploadRoot();
  const filePath = join(uploadRoot, safeStorageName);
  const body = await readFile(filePath);
  const mimeType =
    mimeTypeByExtension[extname(safeStorageName).toLowerCase()] ??
    "application/octet-stream";

  return {
    body,
    mimeType
  };
};
