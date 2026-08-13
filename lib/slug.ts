// Convierte un texto libre en un slug de URL: minúsculas, sin acentos, solo
// [a-z0-9-]. Se usa tanto para slugs de agente como de organización.
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}
