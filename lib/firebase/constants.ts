// Sin dependencias pesadas aquí a propósito: este archivo lo importa
// proxy.ts, que corre en cada request, así que debe mantenerse ligero
// (nada de firebase-admin ni del SDK de cliente).
export const SESSION_COOKIE_NAME = "session";
