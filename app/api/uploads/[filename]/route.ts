import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getLocalPhotoFilename, LOCAL_PHOTO_DIRECTORY } from "@/lib/local-photo-storage";

export const runtime = "nodejs";

const CONTENT_TYPES = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const photoUrl = new URL(`/api/uploads/${filename}`, "http://localhost").toString();
  if (getLocalPhotoFilename(photoUrl) !== filename) {
    return new Response("Photo introuvable.", { status: 404 });
  }

  const extension = filename.slice(filename.lastIndexOf(".") + 1) as keyof typeof CONTENT_TYPES;
  try {
    const bytes = await readFile(join(LOCAL_PHOTO_DIRECTORY, filename));
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": CONTENT_TYPES[extension],
        "Content-Length": String(bytes.length),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return new Response("Photo introuvable.", { status: 404 });
    }
    console.error("[GET /api/uploads/:filename]", error);
    return new Response("Lecture de la photo impossible.", { status: 500 });
  }
}
