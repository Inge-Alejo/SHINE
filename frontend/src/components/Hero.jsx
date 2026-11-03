import React from 'react';
import { ArrowRight, Sparkles, MessageCircle } from 'lucide-react';

export default function Hero({ onExploreInspirations, onExploreOriginals, onOpenProductDetail }) {
  // Producto destacado para la Floating Card del Hero (Sauvage Dior o Club de Nuit Intense)
  const featuredProduct = {
    id: "SHINE-0012",
    name: "CLUB DE NUIT INTENSE",
    brand: "Armaf",
    category: "Inspiraciones",
    subcategory: "Árabes",
    priceText: "Desde $17.000 COP",
    image_url: "./uploads/products/armaf-club-de-nuit-intense.png"
  };

  return (
    <section className="relative w-full min-h-[82vh] lg:min-h-[88vh] bg-[#111111] overflow-hidden flex items-end">
      {/* Background Image full-bleed */}
      <div className="absolute inset-0 z-0">
        <img
          src="./uploads/system/banner.jpg"
          alt="SHINE Fragancias - Alta Perfumería"
          className="w-full h-full object-cover object-center filter brightness-[0.88] contrast-[1.05]"
        />
        {/* Soft dark gradient overlays for maximum text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-24 flex flex-col lg:flex-row items-end justify-between gap-10">
        {/* Left Column: Headlines & Badges */}
        <div className="max-w-2xl text-left space-y-5">
          {/* New In Badge (DESIGN.md: Electric Cobalt #000aff, pill 30px, white text) */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#000aff] text-white text-[12px] font-semibold tracking-wide shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
            <span>COLECCIÓN 2026</span>
            <span className="opacity-40">|</span>
            <span className="font-mono font-normal">Alta Fijación</span>
          </div>

          {/* Display Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white tracking-[-0.04em] leading-[1.05]">
            el arte de la <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/95 to-white/70">
              alta perfumería
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-white/80 font-normal max-w-xl leading-relaxed">
            Inspiraciones de las casas más icónicas del mundo en presentaciones de 30, 60 y 100 ml, además de fragancias Originales y Perfumería 1.1 bajo encargo exclusivo con asesoría personalizada.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onExploreInspirations}
              className="px-6 py-3.5 rounded-[10px] bg-[#000aff] hover:bg-[#0008cc] text-white text-[14px] font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>Explorar Inspiraciones</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onExploreOriginals}
              className="px-6 py-3.5 rounded-[10px] bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-[14px] font-medium flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <span>Consultar Originales</span>
            </button>
          </div>
        </div>

        {/* Right Column: Floating Product Info Card (Exact DESIGN.md specs) */}
        <div className="w-full sm:w-[320px] bg-white rounded-[14.4px] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.25)] border border-white/40 flex flex-col gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-[10px] bg-[#ecedee] p-1 flex items-center justify-center overflow-hidden shrink-0">
              <img
                src={featuredProduct.image_url}
                alt={featuredProduct.name}
                className="w-full h-full object-contain mix-blend-multiply"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = './uploads/system/presentaciones_shine.jpg';
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#000aff] font-bold block">
                Top Más Vendido
              </span>
              <h3 className="text-[15px] font-semibold text-[#111111] truncate tracking-tight">
                {featuredProduct.name}
              </h3>
              <p className="text-[12px] font-mono text-[#737780]">
                By {featuredProduct.brand}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#ecedee]">
            <div>
              <span className="text-[11px] text-[#737780] block">Inspiración</span>
              <span className="text-[14px] font-mono font-bold text-[#111111]">
                {featuredProduct.priceText}
              </span>
            </div>
            <button
              onClick={() => onOpenProductDetail(featuredProduct)}
              className="px-4 py-2 rounded-[10px] bg-[#111111] hover:bg-[#222222] text-white text-[12px] font-medium transition-all active:scale-95 cursor-pointer"
            >
              Ver Opciones
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

