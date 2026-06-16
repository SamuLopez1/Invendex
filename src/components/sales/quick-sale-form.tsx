"use client";

import { useMemo, useState } from "react";
import { CheckCircle, Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { ProductImage } from "@/components/product-image";
import { cn, formatCOP } from "@/lib/format";
import type { PaymentMethod, Product } from "@/types/database";
import { registerSaleAction } from "@/app/(protected)/sales/new/actions";

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Efectivo" },
  { value: "card", label: "Tarjeta" },
  { value: "transfer", label: "Transfer." },
  { value: "nequi", label: "Nequi" },
  { value: "other", label: "Otro" }
];

interface CartItem {
  product: Product;
  quantity: number;
}

export function QuickSaleForm({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [submitted, setSubmitted] = useState(false);

  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products
      .filter((product) => product.is_active)
      .filter((product) =>
        normalized ? product.name.toLowerCase().includes(normalized) : true
      )
      .slice(0, 40);
  }, [products, query]);

  const total = cart.reduce(
    (sum, item) => sum + item.product.sale_price * item.quantity,
    0
  );

  const totalCost = cart.reduce(
    (sum, item) => sum + item.product.purchase_price * item.quantity,
    0
  );

  function addProduct(product: Product) {
    if (product.stock <= 0) return;

    setCart((current) => {
      const found = current.find((item) => item.product.id === product.id);
      if (found) {
        return current.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, item.product.stock)
              }
            : item
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  }

  function changeQuantity(productId: string, delta: number) {
    setCart((current) =>
      current
        .map((item) =>
          item.product.id === productId
            ? {
                ...item,
                quantity: Math.max(
                  0,
                  Math.min(item.quantity + delta, item.product.stock)
                )
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  const payload = cart.map((item) => ({
    product_id: item.product.id,
    quantity: item.quantity
  }));

  if (submitted) {
    return (
      <div className="flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#141417] p-8">
        <div className="mb-6 grid h-24 w-24 place-items-center rounded-full bg-green-500/20">
          <CheckCircle className="h-12 w-12 animate-bounce text-green-500" />
        </div>
        <h2 className="font-display text-center text-3xl font-black italic text-white">
          TRANSACCION ENVIADA
        </h2>
        <p className="mt-2 text-sm text-zinc-500">Guardando venta y actualizando stock.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] min-h-[720px] flex-col gap-6 overflow-hidden lg:flex-row">
      <section className="order-2 flex min-h-0 flex-1 flex-col overflow-hidden lg:order-1">
        <div className="mb-4 shrink-0">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar producto..."
              className="focus-ring block w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-9 pr-3 text-sm text-white placeholder-zinc-500 transition-colors focus:border-cyan-500"
            />
          </label>
        </div>

        <div className="hide-scrollbar flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {visibleProducts.map((product) => {
              const inCart =
                cart.find((item) => item.product.id === product.id)?.quantity ?? 0;
              const outOfStock = product.stock === 0;
              const maxReached = inCart >= product.stock;

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addProduct(product)}
                  disabled={outOfStock || maxReached}
                  className={cn(
                    "focus-ring relative flex min-h-[178px] flex-col items-start rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5",
                    outOfStock
                      ? "cursor-not-allowed border-red-900/30 bg-[#0c0c0e] opacity-50"
                      : maxReached
                        ? "border-cyan-900/30 bg-[#0c0c0e] opacity-75"
                        : "border-white/5 bg-[#141417] hover:border-white/10 hover:bg-white/5"
                  )}
                >
                  {inCart > 0 ? (
                    <div className="absolute -right-2 -top-2 z-10 grid h-6 w-6 place-items-center rounded-full border-2 border-[#141417] bg-cyan-500 text-xs font-bold text-black shadow shadow-cyan-500/20">
                      {inCart}
                    </div>
                  ) : null}

                  <ProductImage
                    src={product.image_url}
                    alt={product.name}
                    className="mb-3 h-24 w-full shrink-0"
                  />

                  <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-tight text-zinc-200">
                    {product.name}
                  </h3>
                  <div className="mt-auto flex w-full items-end justify-between gap-2">
                    <span className="font-mono font-bold text-emerald-400">
                      {formatCOP(product.sale_price)}
                    </span>
                    <span className="text-[10px] text-zinc-600">
                      {product.stock} disp.
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <form
        action={registerSaleAction}
        onSubmit={() => setSubmitted(true)}
        className="order-1 flex h-[48vh] w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-blue-500/20 bg-blue-900/10 p-4 shadow-2xl md:p-5 lg:order-2 lg:h-full lg:w-[420px]"
      >
        <input type="hidden" name="payment_method" value={paymentMethod} />
        <input type="hidden" name="items" value={JSON.stringify(payload)} />

        <h3 className="mb-4 flex shrink-0 items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-400">
          Borrador de venta
        </h3>

        <div className="hide-scrollbar relative min-h-0 flex-1 space-y-3 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-zinc-600">
              <ShoppingCart className="mb-2 h-8 w-8 opacity-30" />
              <p className="text-xs uppercase tracking-widest">El carrito esta vacio</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="group flex items-center justify-between rounded-lg border border-white/5 bg-black/20 p-2.5 text-sm"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2 pr-2">
                  <ProductImage
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="h-8 w-8 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="truncate font-bold leading-tight text-zinc-200">
                      {item.product.name}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {item.quantity} unids. ·{" "}
                      {formatCOP(item.product.sale_price * item.quantity)}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => changeQuantity(item.product.id, -1)}
                    disabled={item.quantity <= 1}
                    className="grid h-6 w-6 place-items-center rounded bg-zinc-800 text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center font-mono text-zinc-200">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => changeQuantity(item.product.id, 1)}
                    disabled={item.quantity >= item.product.stock}
                    className="grid h-6 w-6 place-items-center rounded bg-zinc-800 text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCart((current) =>
                        current.filter(
                          (cartItem) => cartItem.product.id !== item.product.id
                        )
                      )
                    }
                    className="ml-1 grid h-6 w-6 place-items-center rounded bg-red-500/10 text-red-500 transition-colors hover:bg-red-500/20"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 shrink-0 border-t border-blue-500/10 pt-4">
          <div className="mb-1 flex justify-between text-xs text-zinc-500">
            <span>Costo estimado</span>
            <span className="font-mono">{formatCOP(totalCost)}</span>
          </div>
          <div className="mb-1 flex justify-between text-xs text-zinc-500">
            <span>Utilidad estimada</span>
            <span className="font-mono">{formatCOP(total - totalCost)}</span>
          </div>
          <div className="flex justify-between text-lg font-black italic text-white md:text-xl">
            <span>TOTAL</span>
            <span className="font-mono text-cyan-500">{formatCOP(total)}</span>
          </div>

          <div className="mt-4 grid grid-cols-5 gap-2">
            {paymentMethods.map((method) => (
              <button
                key={method.value}
                type="button"
                onClick={() => setPaymentMethod(method.value)}
                className={cn(
                  "focus-ring rounded-lg border py-2 text-[10px] font-bold transition-colors",
                  paymentMethod === method.value
                    ? "border-white/20 bg-cyan-500 text-black shadow-sm"
                    : "border-white/5 bg-black/60 text-zinc-400 hover:border-cyan-500/50"
                )}
              >
                {method.label}
              </button>
            ))}
          </div>

          <button
            disabled={cart.length === 0 || submitted}
            className="focus-ring mt-4 h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 text-xs font-black uppercase tracking-widest text-black shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale md:text-sm"
          >
            Completar transaccion
          </button>
        </div>
      </form>
    </div>
  );
}
