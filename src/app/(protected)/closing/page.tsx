import { LockKeyhole, WalletCards } from "lucide-react";
import { Notice, StatCard } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCOP, todayBogota } from "@/lib/format";
import { getCurrentProfile } from "@/services/auth";
import { getDailySummary, listDailyClosings } from "@/services/daily-closings";
import { closeDayAction } from "./actions";

export default async function ClosingPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [profile, summary, closings] = await Promise.all([
    getCurrentProfile(supabase),
    getDailySummary(supabase),
    listDailyClosings(supabase, 15)
  ]);
  const isAdmin = profile?.role === "admin";
  const date = summary?.closing_date ?? todayBogota();

  return (
    <div className="space-y-6">
      <Notice message={params.message} />
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cierre diario</h2>
          <p className="text-sm text-neutral-600">
            Resumen del dia por ventas, costos, utilidad y metodo de pago.
          </p>
        </div>
        {summary?.already_closed ? (
          <span className="inline-flex items-center gap-2 rounded-md border border-brand-100 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-900">
            <LockKeyhole size={16} />
            Ya cerrado
          </span>
        ) : null}
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total vendido"
          value={formatCOP(summary?.total_sales ?? 0)}
        />
        <StatCard
          label="Costo total"
          value={formatCOP(summary?.total_cost ?? 0)}
        />
        <StatCard
          label="Utilidad bruta"
          value={formatCOP(summary?.gross_profit ?? 0)}
          tone="good"
        />
        <StatCard
          label="Ventas"
          value={String(summary?.sales_count ?? 0)}
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-line bg-white p-4 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <WalletCards size={19} className="text-brand-600" />
            <h3 className="font-bold">Totales por metodo</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <PaymentTotal label="Efectivo" value={summary?.cash_total ?? 0} />
            <PaymentTotal label="Tarjeta" value={summary?.card_total ?? 0} />
            <PaymentTotal
              label="Transferencia"
              value={summary?.transfer_total ?? 0}
            />
            <PaymentTotal label="Nequi" value={summary?.nequi_total ?? 0} />
            <PaymentTotal label="Otro" value={summary?.other_total ?? 0} />
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-4 shadow-soft">
          <h3 className="font-bold">Accion de cierre</h3>
          <p className="mt-2 text-sm text-neutral-600">
            Al cerrar, se guarda el resumen del dia y se evita duplicarlo.
          </p>
          <form action={closeDayAction} className="mt-4">
            <input type="hidden" name="closing_date" value={date} />
            <button
              disabled={!isAdmin || summary?.already_closed}
              className="focus-ring h-12 w-full rounded-md bg-brand-600 px-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cerrar dia
            </button>
          </form>
          {!isAdmin ? (
            <p className="mt-3 text-sm text-neutral-500">
              Solo un administrador puede cerrar el dia.
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
        <h3 className="mb-4 font-bold">Historial de cierres</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-neutral-500">
              <tr>
                <th className="py-2 font-medium">Fecha</th>
                <th className="py-2 font-medium">Ventas</th>
                <th className="py-2 font-medium">Costo</th>
                <th className="py-2 font-medium">Utilidad</th>
                <th className="py-2 font-medium">Efectivo</th>
                <th className="py-2 font-medium">Nequi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {closings.map((closing) => (
                <tr key={closing.id}>
                  <td className="py-3">{closing.closing_date}</td>
                  <td className="py-3 font-medium">
                    {formatCOP(closing.total_sales)}
                  </td>
                  <td className="py-3">{formatCOP(closing.total_cost)}</td>
                  <td className="py-3 font-bold text-mint-700">
                    {formatCOP(closing.gross_profit)}
                  </td>
                  <td className="py-3">{formatCOP(closing.cash_total)}</td>
                  <td className="py-3">{formatCOP(closing.nequi_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function PaymentTotal({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-paper p-3">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-lg font-bold">{formatCOP(value)}</p>
    </div>
  );
}
