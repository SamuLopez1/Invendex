export function formatCOP(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota"
  }).format(new Date(value));
}

export function todayBogota() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota"
  }).format(new Date());
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const DEFAULT_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=500&h=500&fit=crop";
