"use client";

import { useState, useTransition } from "react";
import { createLead } from "./actions";

export function ContactForm({
  agentId,
  propertyId = null,
  brandColor,
}: {
  agentId: string;
  propertyId?: string | null;
  brandColor: string;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          const res = await createLead(agentId, propertyId, formData);
          setResult(res);
        });
      }}
      className="flex flex-col gap-3"
    >
      <input
        name="name"
        required
        placeholder="Tu nombre"
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
      <input
        name="email"
        type="email"
        placeholder="Tu correo"
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
      <input
        name="phone"
        placeholder="Tu teléfono"
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
      <textarea
        name="message"
        rows={3}
        placeholder="¿En qué te ayudamos?"
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        style={{ backgroundColor: brandColor }}
        className="rounded-lg py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Enviar"}
      </button>
      {result && (
        <p className={`text-sm ${result.ok ? "text-green-700" : "text-red-600"}`}>
          {result.message}
        </p>
      )}
    </form>
  );
}
