"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

// Por seguridad, siempre mostramos el mismo mensaje de éxito exista o no una
// cuenta con ese correo (así nadie puede usar este formulario para adivinar
// qué correos están registrados en LinkAgente).
const GENERIC_SUCCESS_MESSAGE =
  "Si existe una cuenta con ese correo, te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada (y spam).";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const email = String(formData.get("email") ?? "").trim();
      try {
        const auth = getFirebaseAuth();
        await sendPasswordResetEmail(auth, email, {
          url: `${window.location.origin}/reset-password`,
          handleCodeInApp: true,
        });
        setSent(true);
      } catch (err) {
        const code =
          err instanceof Error && "code" in err ? String((err as { code: string }).code) : "";
        // auth/user-not-found no debe distinguirse de un envío exitoso.
        if (code === "auth/user-not-found") {
          setSent(true);
          return;
        }
        if (code === "auth/invalid-email") {
          setError("Ese correo no parece válido.");
          return;
        }
        if (code === "auth/too-many-requests") {
          setError("Demasiados intentos. Espera un momento e inténtalo de nuevo.");
          return;
        }
        setError("No se pudo enviar el correo. Inténtalo de nuevo.");
      }
    });
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Recuperar contraseña</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Te mandamos un enlace a tu correo para que elijas una contraseña nueva.
        </p>

        {sent ? (
          <p className="mt-6 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            {GENERIC_SUCCESS_MESSAGE}
          </p>
        ) : (
          <form action={handleSubmit} className="mt-6 flex flex-col gap-4">
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}
            <div>
              <label className="text-sm font-medium text-zinc-700">Correo</label>
              <input
                type="email"
                name="email"
                required
                autoFocus
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="mt-2 w-full rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {pending ? "Enviando..." : "Enviar enlace"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-zinc-500">
          <Link href="/login" className="font-medium text-zinc-900 underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
