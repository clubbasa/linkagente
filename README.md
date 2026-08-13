# LinkAgente — Fase 1 (MVP)

Plataforma tipo "link en bio" para agentes inmobiliarios: perfil público,
propiedades, redes sociales, captación de leads y login. Construida con
**Next.js 16 + Supabase + Tailwind**, pensada para desplegarse en **Vercel**.

Este repo implementa la **Fase 1** del [documento maestro del proyecto]
(perfil público + editor de perfil + propiedades + formulario de contacto).
Faltan por construir las fases 2-4 (analítica visual, multi-tenant/marca
blanca, Stripe, integración MLS).

## 1. Conectar tu proyecto de Supabase

1. Crea un proyecto nuevo en [app.supabase.com](https://app.supabase.com).
2. Ve a **SQL Editor** y pega el contenido completo de
   `supabase/migrations/0001_init.sql`. Ejecútalo — esto crea todas las
   tablas, las políticas de seguridad (RLS) y el trigger que crea
   automáticamente un perfil de agente cuando alguien se registra.
3. Ve a **Project Settings → API** y copia:
   - `Project URL`
   - `anon public` key
4. Copia `.env.local.example` a `.env.local` y pega esos dos valores.

## 2. Correr el proyecto en local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Crea una cuenta desde
`/signup` — se te asigna automáticamente un perfil en `/dashboard` y una URL
pública temporal en `/agente-xxxxxxxx` (puedes cambiar el "slug" desde el
panel).

## 3. Subir el código a GitHub

```bash
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git add .
git commit -m "Fase 1: perfil público, propiedades, leads"
git push -u origin main
```

## 4. Desplegar en Vercel

1. Importa el repositorio de GitHub en [vercel.com/new](https://vercel.com/new).
2. En "Environment Variables" agrega `NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (los mismos valores de tu `.env.local`).
3. Deploy. Cada vez que subas cambios a `main`, Vercel vuelve a desplegar
   automáticamente.

## Estructura del proyecto

```
app/
  page.tsx                 → landing de marketing
  login/, signup/           → autenticación (Supabase Auth)
  auth/callback/route.ts   → callback de confirmación de correo
  dashboard/                → panel del agente (protegido)
    page.tsx                → editor de perfil + redes sociales
    properties/              → CRUD de propiedades
    leads/                   → bandeja de leads capturados
  [slug]/page.tsx           → perfil público (el "link en bio")
lib/
  supabase/                 → clientes de Supabase (browser/server/proxy)
  types.ts                  → tipos compartidos
supabase/migrations/
  0001_init.sql             → esquema completo + RLS + trigger
proxy.ts                    → protege /dashboard (redirige a /login sin sesión)
```

## Notas técnicas

- Este proyecto usa **Next.js 16**, que tiene cambios importantes respecto a
  versiones anteriores (`middleware.ts` → `proxy.ts`, `params`/`cookies()`
  siempre asíncronos, `next lint` removido en favor de ESLint directo, etc.).
  Si un asistente de IA va a seguir editando este código, debe leer primero
  `node_modules/next/dist/docs/` — ver `AGENTS.md`.
- Las imágenes (`next/image`) están configuradas con `unoptimized: true`
  porque las fotos de perfil/propiedades vienen de URLs externas arbitrarias
  que suben los propios agentes.
- La seguridad de datos (que cada agente solo vea sus propios leads y
  propiedades) está resuelta a nivel de base de datos con Row Level Security
  de Supabase, no solo en el código de la app.

## Próximos pasos (Fase 2 en adelante)

Ver la sección "Plan de fases" del documento maestro en Notion: bandeja de
leads con más detalle, código QR, analítica visual, multi-tenant/marca
blanca para distribuidores, cobros con Stripe.
