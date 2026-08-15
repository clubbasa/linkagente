"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

type VerifyState =
  | { status: "checking" }
  | { status: "invalid" }
  | { status: "valid"; email: string }
  | { status: "done" };

function firebaseErrorToSpanish(code: string) {
  switch (code) {
    case "auth/expired-action-code":
      return "Este enlace ya expiró. Pide uno nuevo desde \"Recuperar contraseña\".";
    case "auth/invalid-action-code":
      return "Este enlace ya se usó o no es válido. Pide uno nuevo desde \"Recuperar contraseña\".";
    case "auth/weak-password":
      return "La contraseña debe tener al menos 6 caracteres.";
    default:
      return "No se pudo cambiar la contraseña. Inténtalo de nuevo.";
  }
}

export function ResetPasswordForm({ oobCode }: { oobCode: string | null }) {
  const router = useRouter();
  // Estado inicial calculado a partir de la prop (no con un setState
  // síncrono dentro del efecto) — si no hay oobCode, arranca directo en
  // "invalid" sin necesidad de esperar al efecto.
  const [state, setState] = useState<VerifyState>(() =>
    oobCode ? { status: "checking" } : { status: "invalid" }
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!oobCode) return;
    let cancelled = false;

    (async () => {
      try {
        const auth = getFirebaseAuth();
        const email = await verifyPasswordResetCode(auth, oobCode);
        if (!cancelled) setState({ status: "valid", email });
      } catch {
        if (!cancelled) setState({ status: "invalid" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [oobCode]);

  function handleSubmit(formData: FormData) {
    if (!oobCode) return;
    setError(null);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    startTransition(async () => {
      try {
        const auth = getFirebaseAuth();
        await confirmPasswordReset(auth, oobCode, password);
        setState({ status: "done" });
      } catch (err) {
        const code =
          err instanceof Error && "code" in err ? String((err as { code: string }).code) : "";
        setError(firebaseErrorToSpanish(code));
      }
    });
  }

  if (state.status === "checking") {
    return <p className="mt-4 text-sm text-zinc-500">Verificando enlace...</p>;
  }

  if (state.status === "invalid") {
    return (
      <div className="mt-4 flex flex-col gap-4">
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          Este enlace no es válido o ya expiró.
        </p>
        <Link
          href="/forgot-password"
          className="text-center text-sm font-medium text-zinc-900 underline"
        >
          Pedir un enlace nuevo
        </Link>
      </div>
    );
  }

  if (state.status === "done") {
    return (
      <div className="mt-4 flex flex-col gap-4">
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Tu contraseña se cambió correctamente.
        </p>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="w-full rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Ir a iniciar sesión
        </button>
      </div>
    );
  }

  return (
    <>
      <p className="mt-1 text-sm text-zinc-500">
        Elige una nueva contraseña para <strong>{state.email}</strong>.
      </p>
      <form action={handleSubmit} className="mt-6 flex flex-col gap-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <div>
          <label className="text-sm font-medium text-zinc-700">Nueva contraseña</label>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            autoFocus
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700">Confirmar contraseña</label>
          <input
            type="password"
            name="confirmPassword"
            required
            minLength={6}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="mt-2 w-full rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending ? "Guardando..." : "Cambiar contraseña"}
        </button>
      </form>
    </>
  );
}
