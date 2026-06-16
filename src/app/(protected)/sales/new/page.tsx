import { Notice } from "@/components/ui";
import { QuickSaleForm } from "@/components/sales/quick-sale-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listProducts } from "@/services/products";

export default async function NewSalePage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const products = await listProducts(supabase);

  return (
    <div className="space-y-5 bg-[#09090b] p-4 md:p-6">
      <Notice message={params.message} />
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
          <span className="h-2 w-2 rounded-full bg-cyan-500" />
          Registrar venta
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Busca, agrega cantidades y confirma en una sola pantalla.
        </p>
      </div>
      <QuickSaleForm products={products} />
    </div>
  );
}
