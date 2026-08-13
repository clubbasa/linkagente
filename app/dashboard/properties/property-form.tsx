"use client";

import type { Property } from "@/lib/types";

export function PropertyForm({
  property,
  action,
}: {
  property?: Property;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {property && <input type="hidden" name="id" value={property.id} />}
      <div className="sm:col-span-2">
        <label className="text-sm font-medium text-zinc-700">Título</label>
        <input
          name="title"
          required
          defaultValue={property?.title ?? ""}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="text-sm font-medium text-zinc-700">Dirección</label>
        <input
          name="address"
          defaultValue={property?.address ?? ""}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-700">Precio</label>
        <input
          type="number"
          name="price"
          defaultValue={property?.price ?? ""}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-700">Moneda</label>
        <input
          name="currency"
          defaultValue={property?.currency ?? "USD"}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-700">Estado</label>
        <select
          name="status"
          defaultValue={property?.status ?? "for_sale"}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="featured">Destacada</option>
          <option value="for_sale">En venta</option>
          <option value="sold">Vendida</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-700">Foto (URL)</label>
        <input
          name="photo_url"
          defaultValue={property?.photo_url ?? ""}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="text-sm font-medium text-zinc-700">Descripción</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={property?.description ?? ""}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="sm:col-span-2">
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Guardar propiedad
        </button>
      </div>
    </form>
  );
}
