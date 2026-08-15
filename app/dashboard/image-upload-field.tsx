"use client";

import { useState } from "react";
import Image from "next/image";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { getFirebaseAuth, getFirebaseStorage } from "@/lib/firebase/client";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type Status = "idle" | "uploading" | "error";

// Campo de subida de imágenes: sube el archivo directo desde el navegador a
// Firebase Storage (usando el SDK de cliente, con las reglas en
// firebase/storage.rules) y deja la URL resultante en un <input type="hidden">
// con el `name` que se le pase — así el Server Action que recibe el <form>
// (updateProfile, createCatalogItem, etc.) no cambia nada, sigue leyendo un
// string normal de FormData, solo que ahora es una URL de Storage en vez de
// una que el usuario pegó a mano.
export function ImageUploadField({
  name,
  label,
  defaultValue,
  folder,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  folder: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // permite volver a elegir el mismo archivo si falla
    if (!file) return;

    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Formato no soportado. Usa JPG, PNG, WEBP o GIF.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("La imagen pesa más de 5MB. Usa una más ligera.");
      return;
    }

    const auth = getFirebaseAuth();
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setError("Tu sesión expiró. Recarga la página e inicia sesión de nuevo.");
      return;
    }

    setStatus("uploading");
    setProgress(0);

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${folder}/${uid}/${Date.now()}-${safeName}`;
    const storageRef = ref(getFirebaseStorage(), path);
    const task = uploadBytesResumable(storageRef, file, { contentType: file.type });

    task.on(
      "state_changed",
      (snapshot) => {
        setProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
      },
      () => {
        setStatus("error");
        setError("No se pudo subir la imagen. Inténtalo de nuevo.");
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(task.snapshot.ref);
          setUrl(downloadUrl);
          setStatus("idle");
        } catch {
          setStatus("error");
          setError("La imagen se subió pero no se pudo confirmar. Inténtalo de nuevo.");
        }
      }
    );
  }

  return (
    <div>
      <label className="text-sm font-medium text-zinc-700">{label}</label>
      <input type="hidden" name={name} value={url} />

      {url && (
        <Image
          src={url}
          alt=""
          width={80}
          height={80}
          className="mt-2 h-20 w-20 rounded-lg border border-zinc-200 object-cover"
        />
      )}

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        disabled={status === "uploading"}
        className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200 disabled:opacity-60"
      />

      {status === "uploading" && (
        <p className="mt-1 text-xs text-zinc-500">Subiendo… {progress}%</p>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      <p className="mt-1 text-xs text-zinc-400">
        JPG, PNG, WEBP o GIF · máximo 5MB. Al subir una imagen confirmas que es tuya o que
        cuentas con permiso para usarla. LinkAgente no revisa el contenido que subes y no se
        hace responsable por imágenes que infrinjan derechos de autor o de terceros — esa
        responsabilidad es del usuario que la sube.
      </p>
    </div>
  );
}
