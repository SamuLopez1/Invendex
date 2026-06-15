"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, Search, Trash2 } from "lucide-react";
import { formatCOP } from "@/lib/format";
import type { PaymentMethod, Product } from "@/types/database";
import { registerSaleAction } from "@/app/(protected)/sales/new/actions";

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Efectivo" },
  { value: "card", label: "Tarjeta" },
  { value: "transfer", label: "Transferencia" },
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

  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products
      .filter((product) => product.is_active && product.stock > 0)
      .filter((product) =>
        normalized ? product.name.toLowerCase().includes(normalized) : true
      )
      .slice(0, 12);
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

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
      <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
        <label className="relative block">
          <Search
            size={20}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar producto para vender"
            className="focus-ring h-12 w-full rounded-md border border-line pl-11 pr-3"
          />
        </label>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibleProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => addProduct(product)}
              className="focus-ring min-h-[112px] rounded-lg border border-line bg-paper p-3 text-left"
            >
              <div className="flex h-full flex-col justify-between">
                <div>
                  <p className="font-bold">{product.name}</p>
                  <p className="text-sm text-neutral-500">{product.category}</p>
                </div>
                <div className="mt-3 flex items-end justify-between gap-2">
                  <p className="text-lg font-bold text-brand-600">
                    {formatCOP(product.sale_price)}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {product.stock} und
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <form action={registerSaleAction} className="rounded-lg border border-line bg-white p-4 shadow-soft">
        <input type="hidden" name="payment_method" value={paymentMethod} />
        <input type="hidden" name="items" value={JSON.stringify(payload)} />

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Venta actual</h3>
          <p className="text-sm text-neutral-500">{cart.length} productos</p>
        </div>

        <div className="space-y-3">
          {cart.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-neutral-500">
              Agrega productos para empezar.
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="rounded-md border border-line p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{item.product.name}</p>
                    <p className="text-sm text-neutral-500">
                      {formatCOP(item.product.sale_price)} · stock {item.product.stock}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Quitar producto"
                    title="Quitar producto"
                    onClick={() =>
                      setCart((current) =>
                        current.filter(
                          (cartItem) => cartItem.product.id !== item.product.id
                        )
                      )
                    }
                    className="focus-ring grid h-9 w-9 place-items-center rounded-md border border-line"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="inline-flex items-center rounded-md border border-line">
                    <button
                      type="button"
                      aria-label="Restar"
                      title="Restar"
                      onClick={() => changeQuantity(item.product.id, -1)}
                      className="focus-ring grid h-10 w-10 place-items-center"
                    >
                      <Minus size={17} />
                    </button>
                    <span className="grid h-10 min-w-12 place-items-center font-bold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Sumar"
                      title="Sumar"
                      onClick={() => changeQuantity(item.product.id, 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="focus-ring grid h-10 w-10 place-items-center disabled:opacity-40"
                    >
                      <Plus size={17} />
                    </button>
                  </div>
                  <p className="font-bold">
                    {formatCOP(item.product.sale_price * item.quantity)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 space-y-3 border-t border-line pt-4">
          <div>
            <p className="mb-2 text-sm font-medium">Metodo de pago</p>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value)}
                  className={`focus-ring h-11 rounded-md border px-3 text-sm font-semibold ${
                    paymentMethod === method.value
                      ? "border-brand-600 bg-brand-50 text-brand-900"
                      : "border-line bg-white text-ink"
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-paper p-3">
            <div className="flex justify-between text-sm text-neutral-600">
              <span>Costo estimado</span>
              <span>{formatCOP(totalCost)}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm text-neutral-600">
              <span>Utilidad estimada</span>
              <span>{formatCOP(total - totalCost)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-bold">Total</span>
              <span className="text-2xl font-bold">{formatCOP(total)}</span>
            </div>
          </div>

          <button
            disabled={cart.length === 0}
            className="focus-ring h-12 w-full rounded-md bg-brand-600 px-4 font-bold text-white disabled:opacity-50"
          >
            Confirmar venta
          </button>
        </div>
      </form>
    </div>
  );
}
