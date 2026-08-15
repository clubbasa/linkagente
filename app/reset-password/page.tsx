import { ResetPasswordForm } from "./reset-password-form";

// Server component: lee ?oobCode= vía searchParams (nunca useSearchParams()
// en el cliente sobre una ruta prerenderizada — ver /signup?org= en el
// historial del proyecto para el mismo bug ya corregido antes) y se lo pasa
// por props al formulario cliente, que es quien de verdad habla con
// Firebase Auth.
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ oobCode?: string }>;
}) {
  const { oobCode } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Elegir nueva contraseña</h1>
        <ResetPasswordForm oobCode={oobCode ?? null} />
      </div>
    </div>
  );
}
