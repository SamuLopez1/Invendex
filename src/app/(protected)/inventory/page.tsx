import { Edit2, Package, PackagePlus, Plus, Search, SlidersHorizontal } from "lucide-react";
import { ProductImage } from "@/components/product-image";
import { Notice } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn, formatCOP, formatDateTime } from "@/lib/format";
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
    listInventoryMovements(supabase, 14)
  ]);

  return (
    <div className="flex flex-col gap-6 bg-[#09090b] p-6 md:p-8">
      <Notice message={params.message} />
      <header className="flex shrink-0 flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
            <span className="h-2 w-2 rounded-full bg-cyan-500" />
            Gestion de inventario
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Productos, stock, precios y movimientos auditables.
          </p>
        </div>
        {isAdmin ? (
          <a
            href="#crear-producto"
            className="focus-ring flex w-full items-center justify-center rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-cyan-400 sm:w-auto"
          >
            <Plus className="mr-1.5 h-4 w-4" strokeWidth={3} />
            Agregar producto
          </a>
        ) : null}
      </header>

      <form className="flex shrink-0 flex-col gap-4 sm:flex-row">
        <label className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Buscar productos..."
            className="focus-ring block w-full rounded-lg border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-500 transition-colors focus:border-cyan-500"
          />
        </label>

        <select
          name="category"
          defaultValue={params.category ?? ""}
          className="focus-ring h-10 rounded-lg border border-white/10 bg-[#141417] px-3 text-xs text-zinc-300"
        >
          <option value="">Todas las categorias</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <button className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 text-xs font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:bg-white/10">
          <SlidersHorizontal className="h-4 w-4" />
          Filtrar
        </button>
      </form>

      {isAdmin ? (
        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div
            id="crear-producto"
            className="rounded-2xl border border-white/5 bg-[#141417] p-5"
          >
            <div className="mb-4 flex items-center gap-2">
              <PackagePlus className="h-5 w-5 text-cyan-500" />
              <h3 className="text-sm font-semibold text-zinc-100">Crear producto</h3>
            </div>
            <form action={createProductAction} className="grid gap-3">
              <input
                name="name"
                required
                placeholder="Nombre completo del producto"
                className="field-dark"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  name="category"
                  required
                  placeholder="Categoria"
                  className="field-dark"
                />
                <input
                  name="min_stock"
                  type="number"
                  min="0"
                  required
                  placeholder="Stock minimo"
                  className="field-dark font-mono"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  name="purchase_price"
                  type="number"
                  min="0"
                  required
                  placeholder="Costo unidad COP"
                  className="field-dark font-mono"
                />
                <input
                  name="sale_price"
                  type="number"
                  min="0"
                  required
                  placeholder="Precio venta COP"
                  className="field-dark font-mono text-cyan-400"
                />
              </div>
              <input
                name="image_url"
                type="url"
                placeholder="URL de imagen opcional"
                className="field-dark font-mono"
              />
              <button className="focus-ring h-11 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 text-xs font-black uppercase tracking-widest text-black shadow-lg shadow-blue-900/20">
                Guardar producto
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#141417] p-5">
            <h3 className="mb-4 text-sm font-semibold text-zinc-100">
              Registrar movimiento
            </h3>
            <form
              action={recordInventoryMovementAction}
              className="grid gap-3 md:grid-cols-2"
            >
              <select name="product_id" required className="field-dark">
                <option value="">Producto</option>
                {products
                  .filter((product) => product.is_active)
                  .map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.stock})
                    </option>
                  ))}
              </select>
              <select name="movement_type" required className="field-dark">
                <option value="purchase">Compra / entrada</option>
                <option value="adjustment">Ajuste manual</option>
                <option value="damaged">Danado</option>
                <option value="gift">Cortesia</option>
                <option value="internal_consumption">Consumo interno</option>
              </select>
              <input
                name="quantity"
                type="number"
                required
                placeholder="Cantidad"
                className="field-dark font-mono"
              />
              <input
                name="reason"
                required
                placeholder="Razon"
                className="field-dark"
              />
              <button className="focus-ring h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-bold uppercase tracking-widest text-zinc-200 transition-colors hover:bg-white/10 md:col-span-2">
                Guardar movimiento
              </button>
            </form>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-white/5 bg-[#141417]">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-white/5 bg-[#141417] text-[10px] uppercase tracking-widest text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Inventario</th>
                <th className="px-4 py-3 font-medium">Compra</th>
                <th className="px-4 py-3 font-medium">Venta</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {products.map((product) => (
                <tr
                  key={product.id}
                  className={cn(
                    "transition-colors hover:bg-white/5",
                    product.stock <= product.min_stock && "bg-red-500/5"
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ProductImage
                        src={product.image_url}
                        alt={product.name}
                        className="h-10 w-10 shrink-0"
                      />
                      <div>
                        <div className="font-medium text-zinc-100">{product.name}</div>
                        <div className="text-[10px] text-zinc-500">
                          {product.category}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <span
                      className={cn(
                        product.stock === 0 && "font-bold text-red-500 underline",
                        product.stock > 0 &&
                          product.stock <= product.min_stock &&
                          "font-bold text-cyan-500",
                        product.stock > product.min_stock && "text-zinc-200"
                      )}
                    >
                      {product.stock}
                    </span>
                    <span className="text-zinc-600"> / {product.min_stock}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-400">
                    {formatCOP(product.purchase_price)}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                    {formatCOP(product.sale_price)}
                  </td>
                  <td className="px-4 py-3">
                    <StockBadge stock={product.stock} minStock={product.min_stock} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isAdmin ? <ProductEditDetails product={product} /> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {products.map((product) => (
            <article
              key={product.id}
              className={cn(
                "relative rounded-xl border border-white/5 bg-[#0c0c0e] p-4",
                product.stock <= product.min_stock && "border-cyan-500/30 bg-cyan-500/5"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <ProductImage
                    src={product.image_url}
                    alt={product.name}
                    className="h-12 w-12 shrink-0"
                  />
                  <div>
                    <h3 className="leading-tight text-zinc-100">{product.name}</h3>
                    <p className="mt-0.5 text-[10px] text-zinc-500">
                      {product.category}
                    </p>
                  </div>
                </div>
                {isAdmin ? <ProductEditDetails product={product} compact /> : null}
              </div>
              <div className="mt-3">
                <StockBadge stock={product.stock} minStock={product.min_stock} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
                <Metric label="Costo" value={formatCOP(product.purchase_price)} />
                <Metric
                  label="Venta"
                  value={formatCOP(product.sale_price)}
                  accent
                />
              </div>
            </article>
          ))}
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
            <Package className="mb-4 h-12 w-12 text-zinc-700" />
            <p className="text-sm">No se encontraron productos.</p>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-white/5 bg-[#141417] p-5">
        <h3 className="mb-4 text-sm font-semibold text-zinc-100">
          Historial reciente de movimientos
        </h3>
        <div className="space-y-3">
          {movements.map((movement) => {
            const product = Array.isArray(movement.products)
              ? movement.products[0]
              : movement.products;
            return (
              <div
                key={movement.id}
                className="grid gap-2 rounded-xl border border-white/5 bg-black/20 p-3 sm:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="font-medium text-zinc-200">
                    {product?.name ?? "Producto"}
                  </p>
                  <p className="text-sm text-zinc-500">{movement.reason}</p>
                </div>
                <div className="text-sm sm:text-right">
                  <p className="font-mono font-bold text-cyan-500">
                    {movement.quantity > 0 ? "+" : ""}
                    {movement.quantity} und
                  </p>
                  <p className="text-zinc-500">
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
        BAJO STOCK: {stock}
      </span>
    );
  }

  return (
    <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-500">
      EN STOCK
    </span>
  );
}

function Metric({
  label,
  value,
  accent
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="mb-0.5 text-[10px] uppercase tracking-widest text-zinc-600">
        {label}
      </p>
      <p
        className={cn(
          "font-mono text-xs",
          accent ? "font-bold text-cyan-500" : "text-zinc-400"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ProductEditDetails({
  product,
  compact
}: {
  product: {
    id: string;
    name: string;
    category: string;
    min_stock: number;
    purchase_price: number;
    sale_price: number;
    image_url: string | null;
    is_active: boolean;
  };
  compact?: boolean;
}) {
  return (
    <details className={cn("group inline-block text-left", compact && "absolute right-3 top-3")}>
      <summary
        className={cn(
          "focus-ring grid cursor-pointer list-none place-items-center rounded-lg border border-transparent text-zinc-500 transition-colors hover:border-white/10 hover:bg-white/5 hover:text-cyan-500",
          compact ? "h-8 w-8 bg-white/5" : "h-9 w-9"
        )}
        title="Editar"
      >
        <Edit2 className="h-4 w-4" />
      </summary>
      <div className="absolute right-4 z-20 mt-2 w-[min(92vw,420px)] rounded-2xl border border-white/10 bg-[#141417] p-4 shadow-2xl">
        <form action={updateProductAction} className="grid gap-3">
          <input type="hidden" name="id" value={product.id} />
          <input name="name" defaultValue={product.name} required className="field-dark" />
          <input
            name="category"
            defaultValue={product.category}
            required
            className="field-dark"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              name="min_stock"
              type="number"
              min="0"
              defaultValue={product.min_stock}
              required
              className="field-dark font-mono"
            />
            <input
              name="purchase_price"
              type="number"
              min="0"
              defaultValue={product.purchase_price}
              required
              className="field-dark font-mono"
            />
            <input
              name="sale_price"
              type="number"
              min="0"
              defaultValue={product.sale_price}
              required
              className="field-dark font-mono text-cyan-400"
            />
          </div>
          <input
            name="image_url"
            type="url"
            defaultValue={product.image_url ?? ""}
            placeholder="URL de imagen"
            className="field-dark font-mono"
          />
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            <input
              name="is_active"
              type="checkbox"
              defaultChecked={product.is_active}
              className="h-4 w-4 rounded border-white/10 bg-black/50 text-cyan-500"
            />
            Activo para venta
          </label>
          <button className="focus-ring h-10 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-3 text-xs font-black uppercase tracking-widest text-black">
            Guardar cambios
          </button>
        </form>
        <form action={deactivateProductAction} className="mt-2">
          <input type="hidden" name="id" value={product.id} />
          <button className="focus-ring h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:bg-red-500/10 hover:text-red-300">
            Desactivar
          </button>
        </form>
      </div>
    </details>
  );
}
