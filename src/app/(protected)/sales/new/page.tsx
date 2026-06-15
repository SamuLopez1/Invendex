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
    <div className="space-y-5">
      <Notice message={params.message} />
      <div>
        <h2 className="text-2xl font-bold">Registrar venta</h2>
        <p className="text-sm text-neutral-600">
          Busca, agrega cantidades y confirma en una sola pantalla.
        </p>
      </div>
      <QuickSaleForm products={products} />
    </div>
  );
}
