import Link from "next/link";
import {
  FileText,
  Home,
  LogOut,
  Package,
  ShoppingCart
} from "lucide-react";
import type { Profile } from "@/types/database";
import { signOutAction } from "@/app/(protected)/layout-actions";

const navItems = [
  { href: "/dashboard", label: "Panel", icon: Home },
  { href: "/inventory", label: "Inventario", icon: Package },
  { href: "/sales/new", label: "Vender", icon: ShoppingCart },
  { href: "/closing", label: "Cierre", icon: FileText }
];

export function AppShell({
  profile,
  children
}: {
  profile: Profile | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#09090b] text-zinc-100 selection:bg-cyan-500/30">
      <aside className="hidden w-20 shrink-0 flex-col items-center border-r border-white/10 bg-[#0c0c0e] py-6 md:flex lg:w-64 lg:items-stretch lg:py-0">
        <div className="mb-8 flex h-16 items-center justify-center border-white/5 lg:mb-0 lg:justify-start lg:border-b lg:px-6">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-xl font-black text-black shadow-lg lg:mr-3">
            I
          </div>
          <span className="hidden font-display font-semibold tracking-tight lg:block">
            Invendex
          </span>
        </div>

        <nav className="flex flex-1 flex-col items-center gap-6 overflow-y-auto px-3 lg:items-stretch lg:gap-2 lg:py-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="focus-ring group flex w-fit items-center justify-center rounded-lg border border-transparent p-3 text-zinc-500 transition-colors hover:border-white/10 hover:bg-white/5 hover:text-zinc-100 lg:w-full lg:justify-start lg:px-4 lg:py-3"
                title={item.label}
              >
                <Icon className="h-6 w-6 lg:h-5 lg:w-5" strokeWidth={1.7} />
                <span className="ml-3 hidden text-sm font-medium lg:block">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex w-full justify-center border-white/5 p-3 lg:justify-start lg:border-t lg:p-4">
          <form action={signOutAction} className="w-fit lg:w-full">
            <button
              aria-label="Cerrar sesion"
              title="Cerrar sesion"
              className="focus-ring flex w-fit items-center justify-center rounded-lg border border-transparent p-3 text-zinc-500 transition-colors hover:bg-white/5 hover:text-red-400 lg:w-full lg:justify-start lg:px-4 lg:py-3"
            >
              <LogOut className="h-6 w-6 lg:h-5 lg:w-5" strokeWidth={1.7} />
              <span className="ml-3 hidden text-sm font-medium lg:block">
                Cerrar sesion
              </span>
            </button>
          </form>
        </div>
      </aside>

      <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-[#09090b]">
        <header className="hidden h-16 shrink-0 items-center justify-between border-b border-white/5 bg-[#0c0c0e] px-8 md:flex">
          <h1 className="text-lg font-semibold tracking-tight">
            Invendex{" "}
            <span className="text-sm font-normal text-zinc-500">
              • Control operativo
            </span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-medium text-zinc-100">
                {profile?.full_name ?? "Usuario"}
              </div>
              <div className="text-[10px] text-zinc-500">
                {profile?.role === "admin" ? "Administrador" : "Vendedor"}
              </div>
            </div>
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-zinc-800 text-xs font-mono text-zinc-400">
              {(profile?.full_name ?? "U").slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="relative z-10 flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>

        <footer className="hidden h-8 shrink-0 items-center justify-between border-t border-white/5 bg-black px-6 text-[10px] uppercase tracking-widest text-zinc-600 md:flex">
          <div>Invendex</div>
          <div>
            Estado del sistema: <span className="text-green-500">En linea</span>
          </div>
        </footer>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0c0c0e] px-2 pt-2 md:hidden">
        <div className="flex h-16 items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="focus-ring flex h-full w-full flex-col items-center justify-center gap-1 text-zinc-500 transition-colors hover:text-cyan-500"
              >
                <Icon className="h-5 w-5" strokeWidth={1.7} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
