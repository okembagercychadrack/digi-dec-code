"use client";

import { useState, useRef } from "react";
import { uploadFiles } from "@/lib/uploadthing-client";
import { Camera, Loader2, X } from "lucide-react";

const MAX_FILE_SIZE = 4 * 1024 * 1024;

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  initials?: string;
  disabled?: boolean;
}

export function PhotoUploadField({ value, onChange, initials = "?", disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const preview = localPreview ?? value;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setNotice(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choisis une image JPG, PNG ou WebP.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("La photo doit faire 4 Mo maximum.");
      e.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setUploading(true);

    try {
      let photoUrl: string | null = null;
      const uploadConfigResponse = await fetch("/api/uploads", { cache: "no-store" });
      if (!uploadConfigResponse.ok) {
        throw new Error("Impossible de vérifier le service d’hébergement des photos.");
      }
      const uploadConfig = await uploadConfigResponse.json();

      if (uploadConfig.remoteAvailable === true) {
        try {
          const uploadedFiles = await uploadFiles("agentPhoto", { files: [file] });
          photoUrl = uploadedFiles[0]?.ufsUrl ?? null;
        } catch (uploadThingError) {
          console.warn("[PhotoUploadField] UploadThing indisponible, envoi local.", uploadThingError);
        }
      }

      if (!photoUrl) {
        const body = new FormData();
        body.set("file", file);
        const response = await fetch("/api/uploads", { method: "POST", body });
        const result = await response.json();
        if (!response.ok || typeof result.url !== "string") {
          throw new Error(typeof result.error === "string" ? result.error : "Enregistrement de la photo impossible.");
        }
        photoUrl = result.url;
        setNotice("Photo prête sur ce serveur. Enregistre l’agent pour la conserver.");
      } else {
        setNotice("Photo prête. Enregistre l’agent pour la conserver.");
      }

      onChange(photoUrl);
    } catch (err) {
      console.error("[PhotoUploadField]", err);
      const details = err instanceof Error ? err.message : "Erreur inconnue.";
      setError(
        `Impossible d’ajouter cette photo. ${details}`
      );
    } finally {
      setUploading(false);
      setLocalPreview(null);
      URL.revokeObjectURL(objectUrl);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function clear() {
    onChange(null);
    setLocalPreview(null);
    setError(null);
    setNotice(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col gap-1">
        <button
          type="button"
          aria-label="Choisir une photo"
          disabled={disabled || uploading}
          onClick={() => {
            const input = inputRef.current;
            if (!input) return;
            if (typeof input.showPicker === "function") input.showPicker();
            else input.click();
          }}
          className="group relative flex h-32 w-26 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-2xl font-bold text-slate-400 transition hover:border-[var(--navy)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--navy)] disabled:cursor-wait"
          style={{ width: 104, height: 128 }}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Aperçu de la photo" className="h-full w-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}

          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            ) : (
              <Camera className="h-6 w-6 text-white" />
            )}
          </span>

          {uploading && (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </span>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={disabled || uploading}
          onChange={handleFile}
          tabIndex={-1}
        />
      </div>

      <div className="flex flex-col gap-1 pt-1">
        <p className="text-sm font-medium text-slate-700">Photo de l&apos;agent</p>
        <p className="text-xs text-slate-500">JPG, PNG ou WebP, 4 Mo maximum. Cadrage portrait recommandé.</p>
        {uploading && <p className="text-xs text-slate-500">Ajout de la photo en cours…</p>}
        {preview && !uploading && (
          <button
            type="button"
            onClick={clear}
            className="mt-1 inline-flex w-fit items-center gap-1 text-xs font-medium text-red-600 hover:underline"
          >
            <X className="h-3 w-3" /> Retirer la photo
          </button>
        )}
        {notice && <p className="text-xs text-emerald-700">{notice}</p>}
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      </div>
    </div>
  );
}
