import Link from "next/link";
import { BarChart3, Boxes, LogOut, ReceiptText, WalletCards } from "lucide-react";
import type { Profile } from "@/types/database";
import { signOutAction } from "@/app/(protected)/layout-actions";

const navItems = [
  { href: "/dashboard", label: "Panel", icon: BarChart3 },
  { href: "/inventory", label: "Inventario", icon: Boxes },
  { href: "/sales/new", label: "Venta", icon: ReceiptText },
  { href: "/closing", label: "Cierre", icon: WalletCards }
];

export function AppShell({
  profile,
  children
}: {
  profile: Profile | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-brand-600">
              Noches de Luna
            </p>
            <h1 className="text-lg font-bold text-ink">Inventario y ventas</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right text-sm sm:block">
              <p className="font-medium">{profile?.full_name ?? "Usuario"}</p>
              <p className="text-xs text-neutral-500">
                {profile?.role === "admin" ? "Administrador" : "Vendedor"}
              </p>
            </div>
            <form action={signOutAction}>
              <button
                aria-label="Cerrar sesion"
                title="Cerrar sesion"
                className="focus-ring grid h-10 w-10 place-items-center rounded-md border border-line bg-white"
              >
                <LogOut size={18} />
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="focus-ring inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-medium text-ink"
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-5">{children}</main>
    </div>
  );
}
