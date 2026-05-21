"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ShoppingBag, Star, AtSign } from "lucide-react";
import { gsap } from "gsap";

const wearCollection = [
  {
    id: "model-1",
    name: "DAWGS Signature Hoodie (Burgundy & Rose)",
    price: "75",
    image: "/images/kristina_merch.png",
    modelName: "Kristina (@kris_handle)",
    // MODIFICA EL LINK DE INSTAGRAM DE KRISTINA AQUÍ:
    instagramUrl: "https://instagram.com/kris_handle",
    description: "Heavyweight 450gsm luxury cotton blend. Features dropped shoulders, double-lined hood, and signature raw-cut aesthetic."
  },
  {
    id: "model-2",
    name: "DAWGS Classic Tracksuit (Deep Cherry)",
    price: "110",
    image: "/images/ariana_merch.png",
    modelName: "Ariana (@ariana_handle)",
    // MODIFICA EL LINK DE INSTAGRAM DE ARIANA AQUÍ:
    instagramUrl: "https://instagram.com/ariana_handle",
    description: "Complete luxury streetwear tracksuit set. Premium plush cotton interior, custom ribbing, and relaxed oversized silhouette."
  },
  {
    id: "model-3",
    name: "DAWGS Heavyweight Hoodie (Crimson)",
    price: "75",
    image: "/images/johanel_merch.png",
    modelName: "Johanel (@johanel_handle)",
    // MODIFICA EL LINK DE INSTAGRAM DE JOHANEL AQUÍ:
    instagramUrl: "https://instagram.com/johanel_handle",
    description: "Oversized drop-shoulder silhouette in rich mineral-washed crimson. Minimalist design with high-density embroidery."
  }
];

export default function DawgsWearSection() {
  const [activeItem, setActiveItem] = useState(wearCollection[0]);
  const [selectedSize, setSelectedSize] = useState("M");

  // GSAP transition when active item changes
  useEffect(() => {
    gsap.fromTo(
      ".wear-showcase-img",
      { scale: 1.08, opacity: 0, filter: "blur(15px)" },
      { scale: 1, opacity: 1, filter: "blur(0px)", duration: 1.4, ease: "power4.out" }
    );
    gsap.fromTo(
      ".wear-showcase-details",
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, delay: 0.2, ease: "power3.out" }
    );
  }, [activeItem]);

  // Autoplay loop every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveItem(prev => {
        const currentIndex = wearCollection.findIndex(item => item.id === prev.id);
        const nextIndex = (currentIndex + 1) % wearCollection.length;
        return wearCollection[nextIndex];
      });
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="wear" className="relative z-10 w-full min-h-screen bg-transparent py-32 border-t border-white/5 overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-red-950/25 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-red-900/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1600px] w-full px-6 md:px-12 lg:px-16 xl:px-20">

        {/* Header Editorial */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-24">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.5em] text-zinc-500 mb-4">Creative</p>
            <h2 className="text-5xl md:text-8xl font-black text-white leading-none tracking-tighter">
              DAWGS<br />MERCH
            </h2>
          </div>
          <p className="mt-8 md:mt-0 max-w-sm text-sm text-zinc-400 leading-relaxed">
            Piezas exclusivas limitadas. Diseñadas para la cultura underground. Materiales premium, cortes oversize.
          </p>
        </div>

        {/* Layout Dinámico */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

          {/* Main Showcase Image */}
          <div className="md:col-span-7 relative h-[65vh] md:h-[800px] rounded-[30px] overflow-hidden group border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)]">
            <div className="wear-showcase-img absolute inset-0 w-full h-full">
              <Image
                src={activeItem.image}
                alt={activeItem.name}
                fill
                priority
                className="object-cover object-top transition-transform duration-[1.5s] group-hover:scale-105"
              />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.85))]" />

            {/* Detalles Modelo */}
            <div className="wear-showcase-details absolute bottom-8 left-8 right-8 flex justify-between items-end">
              <div>
                <p className="text-white text-2xl md:text-3xl font-black drop-shadow-[0_0_10px_black]">{activeItem.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Star className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
                  <span className="text-xs font-bold text-zinc-300">PREMIUM HEAVY COTTON</span>
                </div>
              </div>
              <a
                href={activeItem.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10 hover:border-red-500/50 hover:bg-black/80 transition-all duration-300 cursor-pointer"
              >
                <AtSign className="w-4 h-4 text-red-500 animate-pulse" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{activeItem.modelName}</span>
              </a>
            </div>
          </div>

          {/* Product Details & Selection */}
          <div className="md:col-span-5 flex flex-col justify-center px-4 md:px-12 py-8">
            <div className="wear-showcase-details flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black text-white">{activeItem.name}</h3>
                <p className="text-sm text-zinc-400 mt-1">{activeItem.description}</p>
              </div>
              <p className="text-3xl font-black text-red-500 drop-shadow-[0_0_10px_rgba(255,0,0,0.2)]">${activeItem.price}</p>
            </div>

            {/* Size Selector */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Select Size</span>
                <span className="text-xs font-bold text-red-400 animate-pulse">Strictly Limited</span>
              </div>
              <div className="flex gap-3">
                {["S", "M", "L", "XL"].map((size) => {
                  const isAvailable = size === "M" || size === "L";
                  return (
                    <button
                      key={size}
                      disabled={!isAvailable}
                      onClick={() => setSelectedSize(size)}
                      className={`flex-1 h-12 flex items-center justify-center rounded-xl text-sm font-black transition-all ${selectedSize === size
                        ? "bg-white text-black shadow-[0_0_15px_white]"
                        : isAvailable
                          ? "bg-white/5 text-white border border-white/20 hover:bg-white/10"
                          : "bg-white/5 text-zinc-600 border border-transparent cursor-not-allowed line-through"
                        }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CTA */}
            <button className="w-full flex items-center justify-center gap-3 bg-red-600 hover:bg-red-500 text-white h-14 rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,0,24,0.4)]">
              <ShoppingBag className="w-5 h-5" />
              PRE-ORDER NOW
            </button>

            {/* Other Items Thumbnail Slider (Manual Selector) */}
            <div className="mt-16">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Model Showcase Gallery</p>
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                {wearCollection.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveItem(item)}
                    className={`relative w-24 h-32 rounded-xl overflow-hidden shrink-0 border-2 transition-all duration-300 ${activeItem.id === item.id ? "border-red-500 scale-105 shadow-[0_0_15px_rgba(255,0,24,0.3)]" : "border-transparent opacity-50 hover:opacity-100"}`}
                  >
                    <Image src={item.image} alt={item.name} fill className="object-cover object-top" />
                    <div className="absolute bottom-1 left-0 right-0 text-center bg-black/70 py-0.5 text-[7px] font-black text-white uppercase tracking-widest truncate">
                      {item.modelName.split(" ")[0]}
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
