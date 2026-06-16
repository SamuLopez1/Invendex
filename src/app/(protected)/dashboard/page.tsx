import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";
import { EmptyState, StatCard } from "@/components/ui";
import { ProductImage } from "@/components/product-image";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn, formatCOP, formatDateTime } from "@/lib/format";
import { getDailySummary } from "@/services/daily-closings";
import { listLowStockProducts, listProducts } from "@/services/products";
import { listBestSellingProductsToday, listRecentSales } from "@/services/sales";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const [summary, lowStock, products, bestSellers, recentSales] =
    await Promise.all([
      getDailySummary(supabase),
      listLowStockProducts(supabase, 8),
      listProducts(supabase),
      listBestSellingProductsToday(supabase, 5),
      listRecentSales(supabase, 8)
    ]);

  const totalSales = summary?.total_sales ?? 0;
  const grossProfit = summary?.gross_profit ?? 0;
  const salesCount = summary?.sales_count ?? 0;
  const margin = totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(1) : "0";

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ventas de hoy"
          value={formatCOP(totalSales)}
          subtitle="Ingresos totales"
          tone="good"
        />
        <StatCard
          label="Ganancias"
          value={formatCOP(grossProfit)}
          subtitle={`Margen: ${margin}%`}
          tone="good"
        />
        <StatCard
          label="Volumen"
          value={String(salesCount)}
          subtitle={`Prom. ${salesCount > 0 ? formatCOP(totalSales / salesCount) : formatCOP(0)} / venta`}
        />
        <Link
          href="/sales/new"
          className="focus-ring flex min-h-[132px] flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-r from-blue-600 to-cyan-500 p-4 text-left text-black transition-transform hover:scale-[1.02]"
        >
          <div className="mt-2 text-xl font-black uppercase leading-none">
            Registrar
            <br />
            venta
          </div>
          <ArrowUpRight className="h-8 w-8 self-end text-black/45" />
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#141417] xl:col-span-8">
          <div className="flex items-center justify-between border-b border-white/5 p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Supervision de inventario
            </h2>
            <Link
              href="/inventory"
              className="focus-ring rounded-lg border border-white/10 bg-zinc-800 px-3 py-1 text-xs text-zinc-300 transition-colors hover:bg-zinc-700"
            >
              Ver todo
            </Link>
          </div>

          <div className="min-h-[320px] overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead className="border-b border-white/5 text-[10px] uppercase tracking-widest text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium">Inventario</th>
                  <th className="px-4 py-3 font-medium">Precio</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {products.slice(0, 8).map((product) => {
                  const isLowStock = product.stock <= product.min_stock;
                  const isOut = product.stock === 0;
                  return (
                    <tr
                      key={product.id}
                      className={cn(
                        "transition-colors hover:bg-white/5",
                        isLowStock && "bg-red-500/5"
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ProductImage
                            src={product.image_url}
                            alt={product.name}
                            className="h-9 w-9 shrink-0"
                          />
                          <div>
                            <div className="font-medium text-zinc-200">
                              {product.name}
                            </div>
                            <div className="text-[10px] text-zinc-500">
                              {product.category}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 font-mono",
                          isOut && "font-bold text-red-500 underline",
                          !isOut && isLowStock && "font-bold text-cyan-500",
                          !isOut && !isLowStock && "text-zinc-300"
                        )}
                      >
                        {product.stock}{" "}
                        <span className="font-normal text-zinc-600">
                          / {product.min_stock} min
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-zinc-300">
                        {formatCOP(product.sale_price)}
                      </td>
                      <td className="px-4 py-3">
                        <StockBadge stock={product.stock} minStock={product.min_stock} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {products.length === 0 ? (
              <div className="p-6">
                <EmptyState>No se encontraron productos.</EmptyState>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-4 xl:col-span-4">
          <div className="flex min-h-[260px] flex-1 flex-col rounded-2xl border border-white/5 bg-[#141417] p-4">
            <h3 className="mb-4 flex items-center justify-between text-xs font-black uppercase tracking-widest text-zinc-400">
              Ventas recientes
              <FileText className="h-4 w-4 text-zinc-600" />
            </h3>
            <div className="hide-scrollbar flex-1 space-y-3 overflow-y-auto pr-1">
              {recentSales.length === 0 ? (
                <div className="py-8 text-center text-[11px] uppercase tracking-widest text-zinc-500">
                  Aun no hay ventas hoy.
                </div>
              ) : (
                recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between border-b border-white/5 pb-2 text-sm last:border-0 last:pb-0"
                  >
                    <div>
                      <div className="font-bold capitalize text-zinc-200">
                        {sale.payment_method}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {formatDateTime(sale.created_at)}
                      </div>
                    </div>
                    <div className="font-mono text-zinc-300">
                      {formatCOP(sale.total_amount)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#141417] p-4">
            <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-zinc-400">
              Mas vendidos hoy
            </h3>
            {bestSellers.length === 0 ? (
              <p className="text-xs text-zinc-500">Sin ventas registradas.</p>
            ) : (
              <div className="space-y-2">
                {bestSellers.map((item) => (
                  <div
                    key={`${item.category}-${item.name}`}
                    className="flex items-center justify-between rounded-lg bg-black/20 p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium text-zinc-200">{item.name}</p>
                      <p className="text-[10px] text-zinc-500">{item.category}</p>
                    </div>
                    <p className="font-mono font-bold text-cyan-500">
                      {item.quantity}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#141417] p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded bg-cyan-500/20 text-cyan-500">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-200">
                  Cierre de caja
                </div>
                <div className="mt-0.5 text-[10px] leading-tight text-zinc-500">
                  Resumen de fin de turno
                </div>
              </div>
            </div>
            <Link
              href="/closing"
              className="focus-ring rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-bold uppercase text-zinc-400 transition-colors hover:bg-white/5"
            >
              Cerrar
            </Link>
          </div>
        </div>
      </section>

      {lowStock.length > 0 ? (
        <section className="rounded-2xl border border-red-500/15 bg-red-500/5 p-4">
          <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-red-400">
            Alertas activas
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {lowStock.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 p-3"
              >
                <div className="flex items-center gap-3">
                  <ProductImage
                    src={product.image_url}
                    alt={product.name}
                    className="h-9 w-9 shrink-0"
                  />
                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      {product.name}
                    </p>
                    <p className="text-[10px] text-zinc-500">{product.category}</p>
                  </div>
                </div>
                <span className="rounded bg-cyan-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-500">
                  {product.stock}/{product.min_stock}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function StockBadge({ stock, minStock }: { stock: number; minStock: number }) {
  if (stock === 0) {
    return (
      <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-500">
        AGOTADO
      </span>
    );
  }

  if (stock <= minStock) {
    return (
      <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-500">
        BAJO STOCK
      </span>
    );
  }

  return (
    <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-500">
      EN STOCK
    </span>
  );
}
