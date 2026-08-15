"use client";

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "agent", label: "Agente" },
  { value: "distributor_admin", label: "Distribuidor" },
  { value: "super_admin", label: "Super admin" },
];

// <select> que envía su <form> apenas cambia de valor, para no necesitar un
// botón "Guardar" extra por cada fila de la tabla.
export function RoleSelect({
  uid,
  role,
  action,
}: {
  uid: string;
  role: string;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="uid" value={uid} />
      <select
        name="role"
        defaultValue={role}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="rounded-lg border border-zinc-300 px-2 py-1 text-sm"
      >
        {ROLE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </form>
  );
}
