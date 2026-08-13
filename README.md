# LinkAgente — Fase 1 (MVP)

Plataforma tipo "link en bio" para agentes inmobiliarios: perfil público,
propiedades, redes sociales, captación de leads y login. Construida con
**Next.js 16 + Firebase (Auth + Firestore) + Tailwind**, pensada para
desplegarse en **Vercel**.

Este repo implementa la **Fase 1** del documento maestro del proyecto
(perfil público + editor de perfil + propiedades + formulario de contacto).
Faltan por construir las fases 2-4 (analítica visual, multi-tenant/marca
blanca, Stripe, integración MLS).

> **Nota:** el proyecto arrancó sobre Supabase y se migró a Firebase porque
> ya usábamos Firebase en otro proyecto y queríamos mantener todo en un solo
> ecosistema. La arquitectura de datos (Firestore) y el modelo de
> autenticación cambiaron respecto a versiones anteriores de este README.

## 1. Crear tu proyecto de Firebase

1. Ve a [console.firebase.google.com](https://console.firebase.google.com) y crea un proyecto nuevo.
2. Activa **Authentication → Sign-in method → Correo/contraseña**.
3. Activa **Firestore Database** (modo producción).
4. Ve a **Project Settings → General → Tus apps** y agrega una app **Web**.
   Copia los 6 valores de configuración (`apiKey`, `authDomain`, etc.).
5. Ve a **Project Settings → Cuentas de servicio** y dale **Generar nueva
   clave privada** — descarga el archivo JSON. De ahí necesitas 3 valores:
   `project_id`, `client_email` y `private_key`.
6. Copia `.env.local.example` a `.env.local` y llena los 9 valores (6 del
   paso 4, 3 del paso 5).
7. En **Firestore → Reglas**, pega el contenido de `firebase/firestore.rules`
   (cierra el acceso directo del cliente a propósito — toda la app pasa por
   el servidor con Firebase Admin, ver sección "Notas técnicas").

## 2. Correr el proyecto en local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Crea una cuenta desde
`/signup` — se te asigna automáticamente un perfil en `/dashboard` y una URL
pública temporal en `/agente-xxxxxxxx` (puedes cambiar el "slug" desde el
panel).

## 3. Subir cambios a GitHub

```bash
git add .
git commit -m "Migración a Firebase"
git push
```

## 4. Desplegar en Vercel

1. Importa el repositorio de GitHub en [vercel.com/new](https://vercel.com/new)
   (o usa el proyecto que ya hayas conectado).
2. En "Environment Variables" agrega las 9 variables de `.env.local` (las 6
   `NEXT_PUBLIC_FIREBASE_*` y las 3 `FIREBASE_*` de Admin — para
   `FIREBASE_PRIVATE_KEY`, pega el valor completo con las comillas y los
   `\n` tal como están en `.env.local`).
3. Deploy. Cada vez que subas cambios a `main`, Vercel vuelve a desplegar
   automáticamente.

## Estructura del proyecto

```
app/
  page.tsx                 → landing de marketing
  login/, signup/           → autenticación (Firebase Auth, componentes cliente)
  dashboard/                → panel del agente (protegido)
    page.tsx                → editor de perfil + redes sociales
    properties/              → CRUD de propiedades
    leads/                   → bandeja de leads capturados
  [slug]/page.tsx           → perfil público (el "link en bio")
lib/
  firebase/
    client.ts               → SDK de cliente (solo Auth, en el navegador)
    admin.ts                 → SDK de administrador (Firestore + Auth, solo servidor)
    session.ts                → helpers de sesión (cookie httpOnly, "use server")
    constants.ts              → nombre de la cookie (sin dependencias pesadas)
  types.ts                  → tipos compartidos
firebase/
  firestore.rules           → reglas de seguridad (deny-all, ver notas técnicas)
proxy.ts                    → protege /dashboard (redirige a /login sin sesión)
```

## Notas técnicas

- Este proyecto usa **Next.js 16**, que tiene cambios importantes respecto a
  versiones anteriores (`middleware.ts` → `proxy.ts`, `params`/`cookies()`
  siempre asíncronos, `next lint` removido en favor de ESLint directo, etc.).
  Si un asistente de IA va a seguir editando este código, debe leer primero
  `node_modules/next/dist/docs/` — ver `AGENTS.md`.
- **Modelo de acceso a datos:** toda la lectura/escritura a Firestore pasa
  por el servidor (Server Components y Server Actions) usando el SDK de
  Firebase **Admin**, que ignora las reglas de seguridad. El SDK de
  **cliente** solo se usa para autenticación (login/signup/logout) en el
  navegador — nunca para leer o escribir Firestore directamente. Por eso
  `firebase/firestore.rules` cierra el acceso directo por completo: es una
  capa de defensa extra, no la que realmente protege los datos día a día.
- **Sesión:** al iniciar sesión o registrarte, el cliente obtiene un ID
  token de Firebase Auth y lo manda a una Server Action que lo cambia por
  una cookie de sesión `httpOnly` (dura 5 días). `proxy.ts` solo revisa que
  la cookie exista (para redirigir rápido); la verificación real de que sea
  válida ocurre en el layout del dashboard vía Firebase Admin.
- **Estructura de datos:** cada agente es un documento en la colección
  `agents` (id = uid de Firebase Auth), con subcolecciones `socialLinks`,
  `properties`, `leads` y `analyticsEvents`. La colección `slugs` mapea
  cada slug público a su uid, para poder resolver `/[slug]` sin tener que
  escanear toda la colección de agentes.
- Las imágenes (`next/image`) están configuradas con `unoptimized: true`
  porque las fotos de perfil/propiedades vienen de URLs externas arbitrarias
  que suben los propios agentes.

## Próximos pasos (Fase 2 en adelante)

Ver la sección "Plan de fases" del documento maestro en Notion: bandeja de
leads con más detalle, código QR, analítica visual, multi-tenant/marca
blanca para distribuidores, cobros con Stripe.
