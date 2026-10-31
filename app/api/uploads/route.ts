import {
  hasUploadThingToken,
  InvalidPhotoError,
  MAX_PHOTO_SIZE,
  saveLocalPhoto,
} from "@/lib/local-photo-storage";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ remoteAvailable: hasUploadThingToken() });
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Formulaire d’envoi invalide." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Aucune photo reçue." }, { status: 400 });
  }
  if (file.size > MAX_PHOTO_SIZE) {
    return Response.json({ error: "La photo doit faire 4 Mo maximum." }, { status: 413 });
  }

  try {
    const filename = await saveLocalPhoto(file);
    const photoUrl = new URL(`/api/uploads/${filename}`, request.url).toString();
    return Response.json({ url: photoUrl }, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidPhotoError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    console.error("[POST /api/uploads]", error);
    return Response.json({ error: "Impossible d’enregistrer la photo sur le serveur." }, { status: 500 });
  }
}
