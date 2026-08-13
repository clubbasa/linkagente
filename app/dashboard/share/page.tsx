import { redirect } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { getSessionAgent } from "@/lib/firebase/session";
import { getSiteUrl } from "@/lib/site-url";

export default async function SharePage() {
  const session = await getSessionAgent();
  if (!session) redirect("/login");
  const { agent } = session;

  const publicUrl = `${getSiteUrl()}/${agent.slug}`;
  const qrDataUrl = await QRCode.toDataURL(publicUrl, {
    width: 480,
    margin: 2,
    color: { dark: "#18181b", light: "#ffffff" },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold text-zinc-900">Comparte tu link</h1>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <p className="text-sm text-zinc-500">Tu link público</p>
        <Link
          href={`/${agent.slug}`}
          target="_blank"
          className="mt-1 block break-all font-medium text-zinc-900 underline"
        >
          {publicUrl}
        </Link>

        <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="rounded-2xl border border-zinc-200 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL generado en el servidor, no aplica next/image */}
            <img src={qrDataUrl} alt={`Código QR de ${publicUrl}`} width={240} height={240} />
          </div>
          <div className="flex flex-col gap-3 text-sm text-zinc-600">
            <p>
              Imprime este código o compártelo digitalmente — cualquiera que lo escanee llega
              directo a tu perfil.
            </p>
            <a
              href={qrDataUrl}
              download={`qr-${agent.slug}.png`}
              className="w-fit rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Descargar QR (PNG)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
