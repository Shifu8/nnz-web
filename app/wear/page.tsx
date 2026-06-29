/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * DescripciÃ³n: Vista de colecciÃ³n NENEZ WEAR.
 */

"use client";

import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";

const products = [
  {
    name: "Bloodline Hoodie",
    type: "Oversized Hoodie",
    price: 58,
    color: "Black / Red",
    description: "Hoodie pesado con fit ancho, arte frontal NENEZ y detalle rojo.",
  },
  {
    name: "Loud Energy Tee",
    type: "Oversized Tee",
    price: 34,
    color: "Washed Black",
    description: "Camiseta suave de corte amplio para festival, club y diario.",
  },
  {
    name: "Night Run Cap",
    type: "Cap",
    price: 28,
    color: "Black",
    description: "Gorra baja con logo bordado y ajuste trasero.",
  },
];

const sizes = ["S", "M", "L", "XL"];

export default function WearPage() {
  const [selectedProduct, setSelectedProduct] = useState(products[0]);
  const [selectedSize, setSelectedSize] = useState("M");
  const [quantity, setQuantity] = useState(1);

  const total = useMemo(
    () => selectedProduct.price * quantity,
    [quantity, selectedProduct.price],
  );

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-black/60 px-5 py-3 text-xs font-bold uppercase tracking-[0.25em] text-zinc-200 transition hover:border-red-500/70 hover:text-white"
        >
          <ArrowLeft size={16} />
          Back
        </Link>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative min-h-[620px] overflow-hidden rounded-[32px] border border-red-500/20 bg-zinc-950 p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(239,68,68,0.28),transparent_35%),radial-gradient(circle_at_70%_70%,rgba(255,255,255,0.08),transparent_30%)]" />
            <div className="absolute inset-x-10 bottom-12 top-28 rounded-[28px] border border-red-500/20 bg-black/50 shadow-[0_0_100px_rgba(239,68,68,0.18)]" />

            <div className="relative z-10 flex h-full min-h-[560px] flex-col justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-red-400">
                  Nenez Wear
                </p>

                <h1 className="mt-4 text-5xl font-black uppercase leading-none text-white sm:text-7xl">
                  {selectedProduct.name}
                </h1>
              </div>

              <div className="mx-auto flex h-72 w-56 items-center justify-center rounded-[30px] border border-red-500/30 bg-black text-center shadow-[0_0_70px_rgba(239,68,68,0.22)] sm:h-96 sm:w-72">
                <div>
                  <p className="text-7xl font-black text-red-600">D</p>
                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.45em] text-zinc-300">
                    {selectedProduct.type}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-red-500/20 bg-black/60 p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
                    Color
                  </p>
                  <p className="mt-2 font-bold">{selectedProduct.color}</p>
                </div>

                <div className="rounded-2xl border border-red-500/20 bg-black/60 p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
                    Size
                  </p>
                  <p className="mt-2 font-bold">{selectedSize}</p>
                </div>

                <div className="rounded-2xl border border-red-500/20 bg-black/60 p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
                    Price
                  </p>
                  <p className="mt-2 font-bold">${selectedProduct.price}</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-[32px] border border-red-500/20 bg-zinc-950 p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.4em] text-red-400">
              Choose your piece
            </p>

            <div className="mt-6 space-y-4">
              {products.map((product) => {
                const isSelected = product.name === selectedProduct.name;

                return (
                  <button
                    key={product.name}
                    onClick={() => setSelectedProduct(product)}
                    className={`w-full rounded-2xl border p-5 text-left transition ${
                      isSelected
                        ? "border-red-500 bg-red-500/10"
                        : "border-red-500/20 bg-black/50 hover:border-red-500/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
                          {product.type}
                        </p>

                        <h2 className="mt-2 text-xl font-black">
                          {product.name}
                        </h2>
                      </div>

                      <p className="text-xl font-black text-red-500">
                        ${product.price}
                      </p>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-zinc-400">
                      {product.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-8">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                Size
              </p>

              <div className="mt-4 grid grid-cols-4 gap-3">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`h-12 rounded-full border text-sm font-black transition ${
                      selectedSize === size
                        ? "border-white bg-white text-black"
                        : "border-red-500/20 bg-black text-white hover:border-red-500/60"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                Quantity
              </p>

              <div className="mt-4 flex w-full items-center justify-between rounded-full border border-red-500/20 bg-black p-2">
                <button
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  className="h-11 w-11 rounded-full border border-red-500/20 text-xl font-black transition hover:border-red-500/60"
                >
                  -
                </button>

                <span className="text-lg font-black">{quantity}</span>

                <button
                  onClick={() => setQuantity((value) => value + 1)}
                  className="h-11 w-11 rounded-full border border-red-500/20 text-xl font-black transition hover:border-red-500/60"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-red-500/20 bg-black/70 p-6">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                  Total
                </p>

                <p className="text-3xl font-black">${total}</p>
              </div>

              <button className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-red-600 px-6 py-4 text-xs font-bold uppercase tracking-[0.3em] text-white transition hover:scale-[1.02] hover:bg-red-500">
                <ShoppingBag size={18} />
                Add to Cart
              </button>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
