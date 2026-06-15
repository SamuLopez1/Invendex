import { AlertTriangle, TrendingUp } from "lucide-react";
import { EmptyState, StatCard } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCOP, formatDateTime } from "@/lib/format";
import { getDailySummary } from "@/services/daily-closings";
import { listLowStockProducts } from "@/services/products";
import { listBestSellingProductsToday, listRecentSales } from "@/services/sales";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const [summary, lowStock, bestSellers, recentSales] = await Promise.all([
    getDailySummary(supabase),
    listLowStockProducts(supabase, 6),
    listBestSellingProductsToday(supabase, 5),
    listRecentSales(supabase, 8)
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink">Panel del dia</h2>
          <p className="text-sm text-neutral-600">
            Ventas, utilidad y alertas operativas en tiempo real.
          </p>
        </div>
        {summary?.already_closed ? (
          <span className="rounded-md border border-brand-100 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-900">
            Dia cerrado
          </span>
        ) : null}
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Ventas de hoy"
          value={formatCOP(summary?.total_sales ?? 0)}
        />
        <StatCard
          label="Utilidad bruta"
          value={formatCOP(summary?.gross_profit ?? 0)}
          tone="good"
        />
        <StatCard
          label="Numero de ventas"
          value={String(summary?.sales_count ?? 0)}
        />
        <StatCard
          label="Productos bajos"
          value={String(lowStock.length)}
          tone={lowStock.length > 0 ? "warn" : "default"}
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <div className="rounded-lg border border-line bg-white p-4 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle size={19} className="text-brand-600" />
            <h3 className="font-bold">Alertas de bajo stock</h3>
          </div>
          {lowStock.length === 0 ? (
            <EmptyState>Sin productos por debajo del minimo.</EmptyState>
          ) : (
            <div className="space-y-3">
              {lowStock.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-md border border-line p-3"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-neutral-500">{product.category}</p>
                  </div>
                  <p className="text-right text-sm">
                    <span className="block font-bold text-brand-600">
                      {product.stock}
                    </span>
                    <span className="text-neutral-500">min {product.min_stock}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-line bg-white p-4 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={19} className="text-mint-700" />
            <h3 className="font-bold">Mas vendidos hoy</h3>
          </div>
          {bestSellers.length === 0 ? (
            <EmptyState>Aun no hay ventas registradas hoy.</EmptyState>
          ) : (
            <div className="space-y-3">
              {bestSellers.map((product) => (
                <div
                  key={`${product.category}-${product.name}`}
                  className="flex items-center justify-between rounded-md border border-line p-3"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-neutral-500">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{product.quantity} und</p>
                    <p className="text-sm text-neutral-500">
                      {formatCOP(product.subtotal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
        <h3 className="mb-4 font-bold">Ventas recientes</h3>
        {recentSales.length === 0 ? (
          <EmptyState>No hay ventas registradas todavia.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line text-neutral-500">
                <tr>
                  <th className="py-2 font-medium">Fecha</th>
                  <th className="py-2 font-medium">Pago</th>
                  <th className="py-2 font-medium">Total</th>
                  <th className="py-2 font-medium">Costo</th>
                  <th className="py-2 font-medium">Utilidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="py-3">{formatDateTime(sale.created_at)}</td>
                    <td className="py-3 capitalize">{sale.payment_method}</td>
                    <td className="py-3 font-medium">
                      {formatCOP(sale.total_amount)}
                    </td>
                    <td className="py-3">{formatCOP(sale.total_cost)}</td>
                    <td className="py-3 font-bold text-mint-700">
                      {formatCOP(sale.gross_profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
