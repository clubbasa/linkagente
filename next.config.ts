import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Las fotos de perfil y propiedades vienen de URLs externas que suben
    // los propios agentes (Supabase Storage, o cualquier otro host), así
    // que desactivamos la optimización en vez de mantener una lista fija
    // de dominios permitidos.
    unoptimized: true,
  },
};

export default nextConfig;
