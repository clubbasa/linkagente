"use client";

import type { CatalogItem } from "@/lib/types";
import type { VerticalConfig } from "@/lib/verticals";

export function CatalogItemForm({
  item,
  vertical,
  action,
}: {
  item?: CatalogItem;
  vertical: VerticalConfig;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {item && <input type="hidden" name="id" value={item.id} />}
      <div className="sm:col-span-2">
        <label className="text-sm font-medium text-zinc-700">Título</label>
        <input
          name="title"
          required
          defaultValue={item?.title ?? ""}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      {/* Campos específicos del giro del agente — ver lib/verticals.ts */}
      {vertical.extraFields.map((field) => (
        <div key={field.key} className="sm:col-span-2">
          <label className="text-sm font-medium text-zinc-700">{field.label}</label>
          {field.type === "select" ? (
            <select
              name={`extra_${field.key}`}
              defaultValue={item?.extra_fields[field.key] ?? ""}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="">Selecciona una opción</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              name={`extra_${field.key}`}
              placeholder={field.placeholder}
              defaultValue={item?.extra_fields[field.key] ?? ""}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          )}
        </div>
      ))}

      <div>
        <label className="text-sm font-medium text-zinc-700">Precio</label>
        <input
          type="number"
          name="price"
          defaultValue={item?.price ?? ""}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-700">Moneda</label>
        <input
          name="currency"
          defaultValue={item?.currency ?? "MXN"}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-700">Estado</label>
        <select
          name="status"
          defaultValue={item?.status ?? "for_sale"}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="featured">{vertical.statusLabels.featured}</option>
          <option value="for_sale">{vertical.statusLabels.for_sale}</option>
          <option value="sold">{vertical.statusLabels.sold}</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-700">Foto (URL)</label>
        <input
          name="photo_url"
          defaultValue={item?.photo_url ?? ""}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="text-sm font-medium text-zinc-700">Descripción</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={item?.description ?? ""}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="sm:col-span-2">
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Guardar {vertical.itemLabel.toLowerCase()}
        </button>
      </div>
    </form>
  );
}
