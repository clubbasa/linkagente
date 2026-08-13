"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { clearSession } from "../login/actions";

export function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await signOut(getFirebaseAuth());
          await clearSession();
          router.push("/login");
          router.refresh();
        })
      }
      className="hover:text-zinc-900 disabled:opacity-60"
    >
      Salir
    </button>
  );
}
