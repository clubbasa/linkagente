#!/usr/bin/env node
// Crea (o promueve a) un super_admin: un usuario de Firebase Auth + su
// documento en Firestore con role: "super_admin".
//
// Corre esto en TU terminal, nunca le pegues el email/password a Claude: el
// script los pide de forma interactiva, no hace echo de la contraseña en
// pantalla, y no los guarda ni los escribe en ningún archivo ni log.
//
// Uso (desde la raíz del repo, con tu .env.local ya configurado):
//   node scripts/create-super-admin.mjs
//
// Si el email ya existe en Firebase Auth, NO toca su contraseña — solo
// asegura que su documento de agente tenga role: "super_admin".

import { createInterface } from "node:readline";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

function loadEnvLocal() {
  if (!existsSync(envPath)) {
    console.error(`No encontré ${envPath}. Corre esto desde la raíz del repo, con tu .env.local ya configurado.`);
    process.exit(1);
  }
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const { cert, initializeApp } = await import("firebase-admin/app");
const { getAuth } = await import("firebase-admin/auth");
const { getFirestore } = await import("firebase-admin/firestore");

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error(
    "Faltan FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY en .env.local."
  );
  process.exit(1);
}

const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const adminAuth = getAuth(app);
const adminDb = getFirestore(app);

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    })
  );
}

// Codepoints de teclas de control que nos importan al leer el password en
// modo "raw" (sin usar readline, para poder ocultar el texto tecleado).
const KEY_ENTER = [0x0d, 0x0a]; // \r, \n
const KEY_EOF = 0x04; // Ctrl+D
const KEY_INTERRUPT = 0x03; // Ctrl+C
const KEY_BACKSPACE = [0x08, 0x7f]; // Backspace / Delete

// Password oculto: no hace echo de lo que se escribe en la terminal.
function askHidden(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(question);
    stdin.resume();
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");
    let input = "";
    const onData = (char) => {
      const code = char.charCodeAt(0);
      if (KEY_ENTER.includes(code) || code === KEY_EOF) {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(input);
        return;
      }
      if (code === KEY_INTERRUPT) {
        process.stdout.write("\n");
        process.exit(1);
      }
      if (KEY_BACKSPACE.includes(code)) {
        input = input.slice(0, -1);
        return;
      }
      input += char;
    };
    stdin.on("data", onData);
  });
}

const email = (await ask("Email del super admin: ")).toLowerCase();
if (!email || !email.includes("@")) {
  console.error("Email inválido.");
  process.exit(1);
}
const password = await askHidden("Password (no se muestra en pantalla): ");
if (!password || password.length < 6) {
  console.error("La contraseña debe tener al menos 6 caracteres (mínimo de Firebase Auth).");
  process.exit(1);
}
const fullName =
  (await ask('Nombre completo para el perfil (Enter para "Super Admin"): ')) || "Super Admin";

let uid;
try {
  const existing = await adminAuth.getUserByEmail(email);
  uid = existing.uid;
  console.log(`Ya existe un usuario de Auth con ese email (uid ${uid}) — no toco su contraseña, solo su rol.`);
} catch {
  const created = await adminAuth.createUser({ email, password, displayName: fullName });
  uid = created.uid;
  console.log(`Usuario de Auth creado (uid ${uid}).`);
}

const now = new Date().toISOString();
const slug = `agente-${uid.slice(0, 8)}`;

const existingDocSnap = await adminDb.collection("agents").doc(uid).get();
const existingData = existingDocSnap.exists ? existingDocSnap.data() : null;

await adminDb.collection("agents").doc(uid).set(
  {
    slug: existingData?.slug ?? slug,
    fullName,
    title: existingData?.title ?? "Super Admin",
    bio: existingData?.bio ?? "",
    photoUrl: existingData?.photoUrl ?? null,
    coverUrl: existingData?.coverUrl ?? null,
    phone: existingData?.phone ?? null,
    email,
    whatsapp: existingData?.whatsapp ?? null,
    brandColor: existingData?.brandColor ?? "#e11d48",
    plan: existingData?.plan ?? "free",
    organizationId: existingData?.organizationId ?? null,
    role: "super_admin",
    vertical: existingData?.vertical ?? "real_estate",
    createdAt: existingData?.createdAt ?? now,
    updatedAt: now,
  },
  { merge: true }
);

if (!existingDocSnap.exists) {
  await adminDb.collection("slugs").doc(slug).set({ uid });
}

console.log("");
console.log("========================================");
console.log(`Listo. ${email} ya es super_admin (uid ${uid}).`);
console.log("Inicia sesión normal en /login con ese email y password.");
console.log("========================================");
