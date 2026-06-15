import { PackagePlus, Search, SlidersHorizontal } from "lucide-react";
import { Notice } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCOP, formatDateTime } from "@/lib/format";
import { getCurrentProfile } from "@/services/auth";
import { listInventoryMovements } from "@/services/inventory-movements";
import { listCategories, listProducts } from "@/services/products";
import {
  createProductAction,
  deactivateProductAction,
  recordInventoryMovementAction,
  updateProductAction
} from "./actions";

export default async function InventoryPage({
  searchParams
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    message?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const profile = await getCurrentProfile(supabase);
  const isAdmin = profile?.role === "admin";
  const [categories, products, movements] = await Promise.all([
    listCategories(supabase),
    listProducts(supabase, {
      search: params.q,
      category: params.category || undefined,
      includeInactive: isAdmin
    }),
    listInventoryMovements(supabase, 12)
  ]);

  return (
    <div className="space-y-6">
      <Notice message={params.message} />
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inventario</h2>
          <p className="text-sm text-neutral-600">
            Productos activos, alertas y movimientos auditables.
          </p>
        </div>
        <span className="text-sm text-neutral-500">
          {products.length} productos visibles
        </span>
      </div>

      <form className="grid gap-3 rounded-lg border border-line bg-white p-4 shadow-soft md:grid-cols-[1fr_220px_auto]">
        <label className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Buscar por nombre"
            className="focus-ring h-11 w-full rounded-md border border-line pl-10 pr-3"
          />
        </label>
        <select
          name="category"
          defaultValue={params.category ?? ""}
          className="focus-ring h-11 rounded-md border border-line bg-white px-3"
        >
          <option value="">Todas las categorias</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <button className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink px-4 font-semibold text-white">
          <SlidersHorizontal size={18} />
          Filtrar
        </button>
      </form>

      {isAdmin ? (
        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-line bg-white p-4 shadow-soft">
            <div className="mb-4 flex items-center gap-2">
              <PackagePlus size={19} className="text-brand-600" />
              <h3 className="font-bold">Crear producto</h3>
            </div>
            <form action={createProductAction} className="grid gap-3">
              <input
                name="name"
                required
                placeholder="Nombre"
                className="focus-ring h-11 rounded-md border border-line px-3"
              />
              <input
                name="category"
                required
                placeholder="Categoria"
                className="focus-ring h-11 rounded-md border border-line px-3"
              />
              <div className="grid grid-cols-3 gap-3">
                <input
                  name="min_stock"
                  type="number"
                  min="0"
                  required
                  placeholder="Min"
                  className="focus-ring h-11 rounded-md border border-line px-3"
                />
                <input
                  name="purchase_price"
                  type="number"
                  min="0"
                  required
                  placeholder="Costo"
                  className="focus-ring h-11 rounded-md border border-line px-3"
                />
                <input
                  name="sale_price"
                  type="number"
                  min="0"
                  required
                  placeholder="Venta"
                  className="focus-ring h-11 rounded-md border border-line px-3"
                />
              </div>
              <button className="focus-ring h-11 rounded-md bg-brand-600 px-4 font-semibold text-white">
                Crear
              </button>
            </form>
          </div>

          <div className="rounded-lg border border-line bg-white p-4 shadow-soft">
            <h3 className="mb-4 font-bold">Registrar movimiento</h3>
            <form
              action={recordInventoryMovementAction}
              className="grid gap-3 md:grid-cols-2"
            >
              <select
                name="product_id"
                required
                className="focus-ring h-11 rounded-md border border-line bg-white px-3"
              >
                <option value="">Producto</option>
                {products
                  .filter((product) => product.is_active)
                  .map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.stock})
                    </option>
                  ))}
              </select>
              <select
                name="movement_type"
                required
                className="focus-ring h-11 rounded-md border border-line bg-white px-3"
              >
                <option value="purchase">Compra / entrada</option>
                <option value="adjustment">Ajuste manual</option>
                <option value="damaged">Dañado</option>
                <option value="gift">Cortesia</option>
                <option value="internal_consumption">Consumo interno</option>
              </select>
              <input
                name="quantity"
                type="number"
                required
                placeholder="Cantidad"
                className="focus-ring h-11 rounded-md border border-line px-3"
              />
              <input
                name="reason"
                required
                placeholder="Razon"
                className="focus-ring h-11 rounded-md border border-line px-3"
              />
              <button className="focus-ring h-11 rounded-md bg-ink px-4 font-semibold text-white md:col-span-2">
                Guardar movimiento
              </button>
            </form>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4">
        {products.map((product) => (
          <article
            key={product.id}
            className="rounded-lg border border-line bg-white p-4 shadow-soft"
          >
            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold">{product.name}</h3>
                  {!product.is_active ? (
                    <span className="rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-500">
                      Inactivo
                    </span>
                  ) : null}
                  {product.stock <= product.min_stock ? (
                    <span className="rounded-md bg-brand-50 px-2 py-1 text-xs font-medium text-brand-900">
                      Bajo stock
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-neutral-500">{product.category}</p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
                  <Metric label="Stock" value={String(product.stock)} />
                  <Metric label="Minimo" value={String(product.min_stock)} />
                  <Metric
                    label="Costo"
                    value={formatCOP(product.purchase_price)}
                  />
                  <Metric label="Venta" value={formatCOP(product.sale_price)} />
                  <Metric
                    label="Margen"
                    value={formatCOP(product.sale_price - product.purchase_price)}
                  />
                </div>
              </div>

              {isAdmin ? (
                <div className="grid gap-2 sm:min-w-[340px]">
                  <details className="rounded-md border border-line p-3">
                    <summary className="cursor-pointer font-medium">
                      Editar producto
                    </summary>
                    <form action={updateProductAction} className="mt-3 grid gap-2">
                      <input type="hidden" name="id" value={product.id} />
                      <input
                        name="name"
                        defaultValue={product.name}
                        required
                        className="focus-ring h-10 rounded-md border border-line px-3"
                      />
                      <input
                        name="category"
                        defaultValue={product.category}
                        required
                        className="focus-ring h-10 rounded-md border border-line px-3"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          name="min_stock"
                          type="number"
                          min="0"
                          defaultValue={product.min_stock}
                          required
                          className="focus-ring h-10 rounded-md border border-line px-3"
                        />
                        <input
                          name="purchase_price"
                          type="number"
                          min="0"
                          defaultValue={product.purchase_price}
                          required
                          className="focus-ring h-10 rounded-md border border-line px-3"
                        />
                        <input
                          name="sale_price"
                          type="number"
                          min="0"
                          defaultValue={product.sale_price}
                          required
                          className="focus-ring h-10 rounded-md border border-line px-3"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          name="is_active"
                          type="checkbox"
                          defaultChecked={product.is_active}
                        />
                        Activo
                      </label>
                      <button className="focus-ring h-10 rounded-md bg-ink px-3 text-sm font-semibold text-white">
                        Guardar cambios
                      </button>
                    </form>
                  </details>
                  <form action={deactivateProductAction}>
                    <input type="hidden" name="id" value={product.id} />
                    <button className="focus-ring h-10 w-full rounded-md border border-line bg-white px-3 text-sm font-semibold text-brand-900">
                      Desactivar
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
        <h3 className="mb-4 font-bold">Historial reciente de movimientos</h3>
        <div className="space-y-3">
          {movements.map((movement) => {
            const product = Array.isArray(movement.products)
              ? movement.products[0]
              : movement.products;
            return (
              <div
                key={movement.id}
                className="grid gap-2 rounded-md border border-line p-3 sm:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="font-medium">{product?.name ?? "Producto"}</p>
                  <p className="text-sm text-neutral-500">{movement.reason}</p>
                </div>
                <div className="text-sm sm:text-right">
                  <p className="font-bold">
                    {movement.quantity > 0 ? "+" : ""}
                    {movement.quantity} und
                  </p>
                  <p className="text-neutral-500">
                    {movement.movement_type} · {formatDateTime(movement.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-paper p-3">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}
