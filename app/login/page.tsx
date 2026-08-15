"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { createSession } from "./actions";

function firebaseErrorToSpanish(code: string) {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Correo o contraseña incorrectos.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Espera un momento e inténtalo de nuevo.";
    default:
      return "No se pudo iniciar sesión. Inténtalo de nuevo.";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const email = String(formData.get("email") ?? "");
        const password = String(formData.get("password") ?? "");
        const auth = getFirebaseAuth();
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await credential.user.getIdToken();
        await createSession(idToken);
        router.push("/dashboard");
        router.refresh();
      } catch (err) {
        const code = err instanceof Error && "code" in err ? String((err as { code: string }).code) : "";
        setError(firebaseErrorToSpanish(code));
      }
    });
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Entra a tu panel para editar tu perfil, propiedades y leads.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <form action={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-zinc-700">Correo</label>
            <input
              type="email"
              name="email"
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-700">Contraseña</label>
              <Link href="/forgot-password" className="text-xs text-zinc-500 underline hover:text-zinc-700">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <input
              type="password"
              name="password"
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="mt-2 w-full rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {pending ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          ¿No tienes cuenta?{" "}
          <Link href="/signup" className="font-medium text-zinc-900 underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
