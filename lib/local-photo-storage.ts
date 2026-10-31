import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export const MAX_PHOTO_SIZE = 4 * 1024 * 1024;
export const LOCAL_PHOTO_DIRECTORY = join(process.cwd(), "uploads");

export class InvalidPhotoError extends Error {}

export function hasUploadThingToken(): boolean {
  const token = process.env.UPLOADTHING_TOKEN?.trim();
  if (!token) return false;

  try {
    const parsed: unknown = JSON.parse(Buffer.from(token, "base64").toString("utf8"));
    if (!parsed || typeof parsed !== "object") return false;
    const value = parsed as Record<string, unknown>;
    return (
      typeof value.apiKey === "string" &&
      value.apiKey.length > 0 &&
      typeof value.appId === "string" &&
      value.appId.length > 0 &&
      Array.isArray(value.regions) &&
      value.regions.every((region) => typeof region === "string")
    );
  } catch {
    return false;
  }
}

const IMAGE_TYPES = {
  "image/jpeg": { extension: "jpg", signature: (bytes: Buffer) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": {
    extension: "png",
    signature: (bytes: Buffer) => bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  },
  "image/webp": {
    extension: "webp",
    signature: (bytes: Buffer) => bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP",
  },
} as const;

export async function saveLocalPhoto(file: File): Promise<string> {
  const image = IMAGE_TYPES[file.type as keyof typeof IMAGE_TYPES];
  if (!image) throw new InvalidPhotoError("Format refusé. Utilise une image JPG, PNG ou WebP.");
  if (file.size === 0 || file.size > MAX_PHOTO_SIZE) {
    throw new InvalidPhotoError("La photo doit faire entre 1 octet et 4 Mo.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!image.signature(bytes)) {
    throw new InvalidPhotoError("Le contenu du fichier ne correspond pas à son format image.");
  }

  await mkdir(LOCAL_PHOTO_DIRECTORY, { recursive: true });
  const filename = `${randomUUID()}.${image.extension}`;
  await writeFile(join(LOCAL_PHOTO_DIRECTORY, filename), bytes, { flag: "wx" });
  return filename;
}

export function getLocalPhotoFilename(photoUrl: string | null): string | null {
  if (!photoUrl) return null;

  let pathname: string;
  try {
    pathname = new URL(photoUrl, "http://localhost").pathname;
  } catch {
    return null;
  }

  const match = /^\/api\/uploads\/([0-9a-f-]{36}\.(?:jpg|png|webp))$/.exec(pathname);
  return match?.[1] ?? null;
}

export async function deleteLocalPhoto(photoUrl: string | null): Promise<void> {
  const filename = getLocalPhotoFilename(photoUrl);
  if (!filename) return;

  try {
    await unlink(join(LOCAL_PHOTO_DIRECTORY, filename));
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return;
    throw error;
  }
}
