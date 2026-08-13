import Link from "next/link";
import { QrCode, Users, LineChart, Link2 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-950 text-white">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-lg font-semibold">LinkAgente</span>
        <div className="flex gap-3 text-sm">
          <Link href="/login" className="rounded-lg px-4 py-2 hover:bg-white/10">
            Iniciar sesión
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-white px-4 py-2 font-medium text-zinc-950 hover:bg-zinc-200"
          >
            Crear mi link
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-6 py-16 text-center">
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
          Así debería verse tu link inmobiliario
        </h1>
        <p className="mt-4 max-w-xl text-zinc-400">
          Un solo link con tu perfil, tus propiedades, tus redes y un formulario que
          capta leads automáticamente. Listo para compartir en minutos.
        </p>
        <Link
          href="/signup"
          className="mt-8 rounded-xl bg-white px-6 py-3 font-medium text-zinc-950 hover:bg-zinc-200"
        >
          Crear mi link gratis →
        </Link>

        <div className="mt-16 grid grid-cols-1 gap-6 text-left sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <Link2 className="text-rose-400" />
            <h3 className="mt-3 font-medium">Perfil profesional</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Foto, redes sociales y tus propiedades en un solo lugar.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <Users className="text-rose-400" />
            <h3 className="mt-3 font-medium">Captación de leads</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Cada visita puede convertirse en un contacto guardado en tu bandeja.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <QrCode className="text-rose-400" />
            <h3 className="mt-3 font-medium">Código QR + analítica</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Comparte tu código y mide vistas, clics y conversión.
            </p>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-2 text-sm text-zinc-500">
          <LineChart size={16} /> Creado específicamente para agentes inmobiliarios
        </div>
      </main>
    </div>
  );
}
