import { createProperty } from "../actions";
import { PropertyForm } from "../property-form";

export default function NewPropertyPage() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h1 className="text-lg font-semibold text-zinc-900">Nueva propiedad</h1>
      <div className="mt-4">
        <PropertyForm action={createProperty} />
      </div>
    </div>
  );
}
