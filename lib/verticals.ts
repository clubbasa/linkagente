import type { CatalogItemStatus, Vertical } from "@/lib/types";

// Definición de cada giro de mercado soportado por la plataforma. El motor
// (login, leads, QR, analítica, perfil público) es el mismo para todos los
// giros — lo único que cambia es esta configuración: cómo se llama el
// catálogo, cómo se llama cada ítem, y qué campos extra se piden.
//
// Para agregar un giro nuevo: agrega una entrada aquí, no hace falta tocar
// el esquema de Firestore (los campos extra viven en `extraFields`, un mapa
// libre dentro de cada documento de catalogItems).

export interface ExtraFieldDef {
  key: string;
  label: string;
  type: "text" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export interface VerticalConfig {
  id: Vertical;
  label: string; // nombre del giro, para el selector en el registro
  catalogLabel: string; // "Propiedades", "Catálogo de productos"...
  itemLabel: string; // "Propiedad", "Producto"...
  newItemLabel: string; // "Nueva propiedad", "Nuevo producto"... (con género correcto)
  defaultTitle: string; // título profesional por defecto al registrarse
  statusLabels: Record<CatalogItemStatus, string>;
  extraFields: ExtraFieldDef[];
}

export const VERTICALS: Record<Vertical, VerticalConfig> = {
  real_estate: {
    id: "real_estate",
    label: "Inmobiliaria",
    catalogLabel: "Propiedades",
    itemLabel: "Propiedad",
    newItemLabel: "Nueva propiedad",
    defaultTitle: "Asesor Inmobiliario",
    statusLabels: {
      featured: "Destacada",
      for_sale: "En venta",
      sold: "Vendida",
    },
    extraFields: [
      { key: "address", label: "Dirección", type: "text", placeholder: "Calle, colonia, ciudad" },
    ],
  },
  herbalife: {
    id: "herbalife",
    label: "Distribuidor Herbalife / nutrición",
    catalogLabel: "Catálogo de productos",
    itemLabel: "Producto",
    newItemLabel: "Nuevo producto",
    defaultTitle: "Distribuidor Independiente",
    statusLabels: {
      featured: "Destacado",
      for_sale: "Disponible",
      sold: "Agotado",
    },
    extraFields: [
      {
        key: "category",
        label: "Categoría",
        type: "select",
        options: [
          { value: "proteina", label: "Proteína" },
          { value: "te", label: "Té / bebida energética" },
          { value: "control_peso", label: "Control de peso" },
          { value: "bienestar", label: "Bienestar general" },
          { value: "cuidado_personal", label: "Cuidado personal" },
          { value: "otro", label: "Otro" },
        ],
      },
      { key: "size", label: "Presentación / tamaño", type: "text", placeholder: "Ej. 550 g, 30 sobres" },
    ],
  },
  sales: {
    id: "sales",
    label: "Agente de ventas (general)",
    catalogLabel: "Catálogo",
    itemLabel: "Producto o servicio",
    newItemLabel: "Nuevo producto o servicio",
    defaultTitle: "Asesor de Ventas",
    statusLabels: {
      featured: "Destacado",
      for_sale: "Disponible",
      sold: "No disponible",
    },
    extraFields: [
      { key: "category", label: "Categoría", type: "text", placeholder: "Opcional" },
    ],
  },
  insurance: {
    id: "insurance",
    label: "Seguros / servicios financieros",
    catalogLabel: "Planes y pólizas",
    itemLabel: "Plan",
    newItemLabel: "Nuevo plan",
    defaultTitle: "Asesor de Seguros",
    statusLabels: {
      featured: "Destacado",
      for_sale: "Disponible",
      sold: "Descontinuado",
    },
    extraFields: [
      {
        key: "planType",
        label: "Tipo de plan",
        type: "select",
        options: [
          { value: "vida", label: "Vida" },
          { value: "auto", label: "Auto" },
          { value: "gastos_medicos", label: "Gastos médicos" },
          { value: "ahorro", label: "Ahorro / inversión" },
          { value: "otro", label: "Otro" },
        ],
      },
      { key: "coverage", label: "Cobertura", type: "text", placeholder: "Ej. hasta $2,000,000 MXN" },
    ],
  },
};

export const VERTICAL_OPTIONS: VerticalConfig[] = Object.values(VERTICALS);

export function getVerticalConfig(vertical: string | null | undefined): VerticalConfig {
  return VERTICALS[vertical as Vertical] ?? VERTICALS.real_estate;
}
