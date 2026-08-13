"use client";

import { useState, useTransition, type KeyboardEvent } from "react";
import { ChevronDown, Mail, MessageCircle, Phone } from "lucide-react";
import type { Lead } from "@/lib/types";
import { updateLeadNotes } from "./actions";
import { LeadStatusSelect } from "./status-select";

export function LeadRow({ lead, itemTitle }: { lead: Lead; itemTitle?: string | null }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function toggle() {
    setOpen((value) => !value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle();
    }
  }

  function saveNotes() {
    const formData = new FormData();
    formData.set("id", lead.id);
    formData.set("notes", notes);
    startTransition(async () => {
      await updateLeadNotes(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  const whatsappHref = lead.phone
    ? `https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`
    : null;

  return (
    <div className="border-t border-zinc-100 first:border-t-0">
      <div
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        aria-expanded={open}
        className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3 hover:bg-zinc-50 sm:flex-nowrap"
      >
        <ChevronDown
          size={16}
          className={`shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-zinc-900">{lead.name}</p>
          <p className="truncate text-xs text-zinc-500">
            {lead.email}
            {lead.email && lead.phone && " · "}
            {lead.phone}
            {itemTitle && ` · Interesado en: ${itemTitle}`}
          </p>
        </div>
        <p className="hidden max-w-xs truncate text-sm text-zinc-600 md:block">{lead.message}</p>
        <p className="shrink-0 text-xs text-zinc-500">
          {new Date(lead.created_at).toLocaleDateString("es-MX")}
        </p>
        <div onClick={(event) => event.stopPropagation()}>
          <LeadStatusSelect lead={lead} />
        </div>
      </div>

      {open && (
        <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Mensaje</p>
              <p className="mt-1 text-sm text-zinc-700">{lead.message || "Sin mensaje."}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {lead.phone && (
                  <a
                    href={`tel:${lead.phone}`}
                    className="flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700"
                  >
                    <Phone size={14} /> Llamar
                  </a>
                )}
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700"
                  >
                    <Mail size={14} /> Correo
                  </a>
                )}
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700"
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Notas internas
              </label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                placeholder="Solo tú ves estas notas..."
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={saveNotes}
                  disabled={pending}
                  className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                >
                  {pending ? "Guardando..." : "Guardar nota"}
                </button>
                {saved && <span className="text-xs text-green-700">Guardado.</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
