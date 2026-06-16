import { CheckCircle, Lock, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { ProductImage } from "@/components/product-image";
import { Notice } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn, formatCOP, todayBogota } from "@/lib/format";
import { getCurrentProfile } from "@/services/auth";
import { getDailySummary, listDailyClosings } from "@/services/daily-closings";
import { listLowStockProducts } from "@/services/products";
import { closeDayAction } from "./actions";

const paymentRows = [
  ["Efectivo", "cash_total"],
  ["Tarjeta", "card_total"],
  ["Transfer.", "transfer_total"],
  ["Nequi", "nequi_total"],
  ["Otro", "other_total"]
] as const;

export default async function ClosingPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [profile, summary, closings, lowStockProducts] = await Promise.all([
    getCurrentProfile(supabase),
    getDailySummary(supabase),
    listDailyClosings(supabase, 12),
    listLowStockProducts(supabase, 8)
  ]);
  const isAdmin = profile?.role === "admin";
  const date = summary?.closing_date ?? todayBogota();
  const totalSales = summary?.total_sales ?? 0;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 bg-[#09090b] p-6 md:p-8">
      <Notice message={params.message} />
      <header className="flex shrink-0 items-end justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Reporte de operaciones diarias
          </h2>
          <p className="mt-1 font-mono text-xs tracking-wide text-zinc-500">
            {date}
          </p>
        </div>
        {summary?.already_closed ? (
          <span className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-cyan-300">
            <Lock className="h-4 w-4" />
            Cerrado
          </span>
        ) : null}
      </header>

      <section className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#141417] p-6 md:p-8">
        <h3 className="mb-6 text-xs font-black uppercase tracking-widest text-blue-400">
          Resumen financiero
        </h3>
        <div className="relative z-10 grid gap-4 md:grid-cols-3">
          <SummaryCard label="Ingresos totales" value={formatCOP(totalSales)} />
          <SummaryCard
            label="Costo de mercancia"
            value={formatCOP(summary?.total_cost ?? 0)}
            muted
          />
          <SummaryCard
            label="Ganancia bruta"
            value={formatCOP(summary?.gross_profit ?? 0)}
            accent
            icon={<TrendingUp className="ml-1 h-3 w-3" />}
          />
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-[#141417] p-6">
          <h3 className="mb-6 text-xs font-black uppercase tracking-widest text-zinc-400">
            Desglose de caja
          </h3>
          <div className="space-y-4">
            {paymentRows.map(([label, key]) => {
              const amount = summary?.[key] ?? 0;
              const percentage = totalSales > 0 ? (amount / totalSales) * 100 : 0;
              return (
                <div key={key}>
                  <div className="mb-1.5 flex justify-between text-xs font-medium">
                    <span className="uppercase tracking-wider text-zinc-400">
                      {label}
                    </span>
                    <span className="font-mono text-zinc-200">
                      {formatCOP(amount)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full border border-white/5 bg-black/40">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#141417] p-6">
          <h3 className="mb-6 text-xs font-black uppercase tracking-widest text-red-500">
            Alertas de inventario
          </h3>
          {lowStockProducts.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center p-6 text-center">
              <CheckCircle className="mb-2 h-6 w-6 text-green-500/60" />
              <p className="text-xs uppercase tracking-widest text-zinc-500">
                Inventario optimizado
              </p>
            </div>
          ) : (
            <div className="hide-scrollbar max-h-[260px] space-y-2 overflow-y-auto">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 p-3 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <ProductImage
                      src={product.image_url}
                      alt={product.name}
                      className="h-8 w-8 shrink-0"
                    />
                    <span className="block truncate text-xs font-medium text-zinc-200">
                      {product.name}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 font-mono text-[10px] font-bold",
                      product.stock === 0
                        ? "bg-red-500/20 text-red-500"
                        : "bg-cyan-500/20 text-cyan-500"
                    )}
                  >
                    {product.stock} / {product.min_stock}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <form action={closeDayAction} className="border-t border-white/10 pt-4">
        <input type="hidden" name="closing_date" value={date} />
        <button
          disabled={!isAdmin || summary?.already_closed}
          className="focus-ring flex h-14 w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 text-sm font-black uppercase tracking-widest text-black shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:grayscale"
        >
          <Lock className="mr-2 h-4 w-4" />
          Confirmar y cerrar dia
        </button>
        {!isAdmin ? (
          <p className="mt-3 text-center text-xs text-zinc-500">
            Solo un administrador puede cerrar el dia.
          </p>
        ) : null}
      </form>

      <section className="rounded-2xl border border-white/5 bg-[#141417] p-5">
        <h3 className="mb-4 text-sm font-semibold text-zinc-100">
          Historial de cierres
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-white/5 text-[10px] uppercase tracking-widest text-zinc-500">
              <tr>
                <th className="py-2 font-medium">Fecha</th>
                <th className="py-2 font-medium">Ventas</th>
                <th className="py-2 font-medium">Costo</th>
                <th className="py-2 font-medium">Utilidad</th>
                <th className="py-2 font-medium">Efectivo</th>
                <th className="py-2 font-medium">Nequi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {closings.map((closing) => (
                <tr key={closing.id}>
                  <td className="py-3 text-zinc-300">{closing.closing_date}</td>
                  <td className="py-3 font-mono font-medium text-zinc-100">
                    {formatCOP(closing.total_sales)}
                  </td>
                  <td className="py-3 font-mono text-zinc-400">
                    {formatCOP(closing.total_cost)}
                  </td>
                  <td className="py-3 font-mono font-bold text-cyan-500">
                    {formatCOP(closing.gross_profit)}
                  </td>
                  <td className="py-3 font-mono text-zinc-400">
                    {formatCOP(closing.cash_total)}
                  </td>
                  <td className="py-3 font-mono text-zinc-400">
                    {formatCOP(closing.nequi_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  muted,
  accent,
  icon
}: {
  label: string;
  value: string;
  muted?: boolean;
  accent?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        accent ? "border-blue-500/20 bg-blue-900/10" : "border-white/5 bg-black/20"
      )}
    >
      <p
        className={cn(
          "mb-1 flex items-center text-xs uppercase tracking-widest",
          accent ? "text-blue-400" : "text-zinc-500"
        )}
      >
        {label}
        {icon}
      </p>
      <p
        className={cn(
          "font-mono text-2xl italic",
          accent && "font-bold text-cyan-500",
          muted && "font-semibold text-zinc-400",
          !accent && !muted && "font-bold text-zinc-100"
        )}
      >
        {value}
      </p>
    </div>
  );
}
