"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { createSession } from "../login/actions";
import { createAgentProfile } from "./actions";

function firebaseErrorToSpanish(code: string) {
  switch (code) {
    case "auth/email-already-in-use":
      return "Ese correo ya tiene una cuenta. Intenta iniciar sesión.";
    case "auth/weak-password":
      return "La contraseña debe tener al menos 6 caracteres.";
    case "auth/invalid-email":
      return "Ese correo no es válido.";
    default:
      return "No se pudo crear la cuenta. Inténtalo de nuevo.";
  }
}

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const email = String(formData.get("email") ?? "");
        const password = String(formData.get("password") ?? "");
        const fullName = String(formData.get("full_name") ?? "");

        const auth = getFirebaseAuth();
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: fullName });

        const idToken = await credential.user.getIdToken();
        await createSession(idToken);
        await createAgentProfile({ uid: credential.user.uid, email, fullName });

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
        <h1 className="text-xl font-semibold text-zinc-900">Crea tu cuenta</h1>
        <p className="mt-1 text-sm text-zinc-500">
          En segundos tendrás tu propio link para compartir con tus clientes.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <form action={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-zinc-700">Nombre completo</label>
            <input
              type="text"
              name="full_name"
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            />
          </div>
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
            <label className="text-sm font-medium text-zinc-700">Contraseña</label>
            <input
              type="password"
              name="password"
              minLength={6}
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="mt-2 w-full rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {pending ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-zinc-900 underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
