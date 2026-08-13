"use client";

import type { Lead } from "@/lib/types";
import { updateLeadStatus } from "./actions";

export function LeadStatusSelect({ lead }: { lead: Lead }) {
  return (
    <form action={updateLeadStatus}>
      <input type="hidden" name="id" value={lead.id} />
      <select
        name="status"
        defaultValue={lead.status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-lg border border-zinc-300 px-2 py-1 text-xs"
      >
        <option value="new">Nuevo</option>
        <option value="contacted">Contactado</option>
        <option value="closed">Cerrado</option>
      </select>
    </form>
  );
}
