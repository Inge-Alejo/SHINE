import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

// Pool curado de los perfumes icónicos más vendidos con fotografía real de alta calidad
const CURATED_BESTSELLERS = [
  {
    id: "SHINE-0012",
    name: "CLUB DE NUIT INTENSE",
    brand: "Armaf",
    category: "Inspiraciones",
    subcategory: "Árabes",
    gender: "Hombre",
    image_url: "./uploads/products/armaf-club-de-nuit-intense.png"
  },
  {
    id: "SHINE-0215",
    name: "KHAMRAH",
    brand: "Lattafa",
    category: "Inspiraciones",
    subcategory: "Árabes",
    gender: "Unisex",
    image_url: "./uploads/products/lattafa-khamrah.png"
  },
  {
    id: "SHINE-0218",
    name: "ASAD",
    brand: "Lattafa",
    category: "Inspiraciones",
    subcategory: "Árabes",
    gender: "Hombre",
    image_url: "./uploads/products/lattafa-asad.png"
  },
  {
    id: "SHINE-0204",
    name: "YARA",
    brand: "Lattafa",
    category: "Inspiraciones",
    subcategory: "Árabes",
    gender: "Mujer",
    image_url: "./uploads/products/lattafa-yara.png"
  },
  {
    id: "SHINE-0054",
    name: "BLEU CHANNEL",
    brand: "Chanel",
    category: "Inspiraciones",
    subcategory: "Hombres",
    gender: "Hombre",
    image_url: "./uploads/products/chanel-bleu-de-chanel.png"
  },
  {
    id: "SHINE-0136",
    name: "IMAGINATION",
    brand: "Louis Vuitton",
    category: "Inspiraciones",
    subcategory: "Nicho",
    gender: "Unisex",
    image_url: "./uploads/products/louis-vuitton-imagination.png"
  },
  {
    id: "SHINE-0137",
    name: "OMBRE NOMADA",
    brand: "Louis Vuitton",
    category: "Inspiraciones",
    subcategory: "Nicho",
    gender: "Unisex",
    image_url: "./uploads/products/louis-vuitton-ombre-nomade.png"
  },
  {
    id: "SHINE-0260",
    name: "GOOD GIRL",
    brand: "Carolina Herrera",
    category: "Inspiraciones",
    subcategory: "Mujeres",
    gender: "Mujer",
    image_url: "./uploads/products/carolina-herrera-good-girl.png"
  },
  {
    id: "SHINE-0356",
    name: "DELINA",
    brand: "Parfums de Marly",
    category: "Inspiraciones",
    subcategory: "Nicho",
    gender: "Mujer",
    image_url: "./uploads/products/parfums-de-marly-delina.png"
  },
  {
    id: "SHINE-0186",
    name: "LIBRE",
    brand: "Yves Saint Laurent",
    category: "Inspiraciones",
    subcategory: "Mujeres",
    gender: "Mujer",
    image_url: "./uploads/products/ysl-libre.png"
  },
  {
    id: "ORIG-0001",
    name: "BACCARAT ROUGE 540 EXTRAIT",
    brand: "Maison Francis Kurkdjian",
    category: "Originales",
    subcategory: "Nicho",
    gender: "Unisex",
    image_url: "./uploads/products/mfk-baccarat-rouge-540.png"
  },
  {
    id: "ORIG-0002",
    name: "SAUVAGE ELIXIR",
    brand: "Dior",
    category: "Originales",
    subcategory: "Diseñador",
    gender: "Hombre",
    image_url: "./uploads/products/dior-sauvage.png"
  },
  {
    id: "ORIG-0003",
    name: "AVENTUS",
    brand: "Creed",
    category: "Originales",
    subcategory: "Nicho",
    gender: "Hombre",
    image_url: "./uploads/products/creed-aventus.png"
  },
  {
    id: "ORIG-0004",
    name: "NAXOS 1861",
    brand: "Xerjoff",
    category: "Originales",
    subcategory: "Nicho",
    gender: "Unisex",
    image_url: "./uploads/products/xerjoff-naxos.png"
  },
  {
    id: "P11-0001",
    name: "SAUVAGE EAU DE PARFUM 1.1",
    brand: "Dior",
    category: "Perfumería 1.1",
    subcategory: "Diseñador",
    gender: "Hombre",
    image_url: "./uploads/products/dior-sauvage.png"
  },
  {
    id: "P11-0003",
    name: "OUD WOOD 1.1",
    brand: "Tom Ford",
    category: "Perfumería 1.1",
    subcategory: "Nicho",
    gender: "Unisex",
    image_url: "./uploads/products/tom-ford-oud-wood.png"
  }
];

export default function Hero({ 
  products = [], 
  settings = null, 
  onExploreInspirations, 
  onExploreOriginals, 
  onOpenProductDetail 
}) {
  // Función validadora estricta: solo perfumes que posean fotografía real propia
  const hasRealPhoto = (item) => {
    const url = item?.image_url;
    return Boolean(
      url && 
      typeof url === 'string' && 
      url.trim().length > 5 && 
      !url.includes('presentaciones_shine')
    );
  };

  // Construir pool dinámico garantizando 100% que tengan fotografía real
  const rotatingPool = useMemo(() => {
    const validCurated = CURATED_BESTSELLERS.filter(hasRealPhoto);

    if (!products || products.length === 0) {
      return validCurated;
    }

    // Vincular curados con sus datos reales actualizados de la BD si coinciden
    const matchedCurated = validCurated.map(c => {
      const match = products.find(p => p.id === c.id || (p.name && p.name.toUpperCase() === c.name.toUpperCase()));
      if (match && hasRealPhoto(match)) {
        return match;
      }
      return match ? { ...match, image_url: c.image_url } : c;
    });

    // Agregar cualquier otro producto de la base de datos que tenga foto real subida y no esté en la lista curada
    const othersWithPhoto = products.filter(p => 
      hasRealPhoto(p) && !matchedCurated.some(m => m.id === p.id)
    );

    const merged = [...matchedCurated, ...othersWithPhoto].filter(hasRealPhoto);
    return merged.length > 0 ? merged : validCurated;
  }, [products]);

  // Arrancar de inicio con un índice aleatorio en cada carga de página
  const [currentIndex, setCurrentIndex] = useState(() => Math.floor(Math.random() * CURATED_BESTSELLERS.length));
  const [isFading, setIsFading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Inicializar aleatoriamente cuando el pool de productos cargue
  useEffect(() => {
    if (rotatingPool.length > 0) {
      setCurrentIndex(Math.floor(Math.random() * rotatingPool.length));
    }
  }, [rotatingPool.length]);

  // Rotación continua 100% aleatoria (sin orden fijo) cada 4.5 segundos
  useEffect(() => {
    if (rotatingPool.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentIndex((prev) => {
          if (rotatingPool.length <= 1) return 0;
          let next;
          // Selección aleatoria pura garantizando no repetir el mismo inmediatamente
          do {
            next = Math.floor(Math.random() * rotatingPool.length);
          } while (next === prev && rotatingPool.length > 1);
          return next;
        });
        setIsFading(false);
      }, 250);
    }, 4500);

    return () => clearInterval(timer);
  }, [rotatingPool.length, isPaused]);

  const currentProduct = rotatingPool[currentIndex] || CURATED_BESTSELLERS[0];

  // Cálculo del texto de precio comercial según la categoría y los settings
  const getPriceText = (prod) => {
    if (prod.category === 'Inspiraciones' || !prod.category) {
      const p30 = settings?.prices?.['30ml'] || 17000;
      return `Desde $${p30.toLocaleString('es-CO')} COP`;
    }
    if (prod.category === 'Perfumería 1.1') return 'Bajo Encargo 1.1';
    if (prod.category === 'Originales') return 'Bajo Pedido';
    return 'Consultar';
  };

  return (
    <section className="relative w-full min-h-[82vh] lg:min-h-[88vh] bg-[#111111] overflow-hidden flex items-end">
      {/* Background Image full-bleed */}
      <div className="absolute inset-0 z-0">
        <img
          src="./uploads/system/banner.jpg"
          alt="SHINE Fragancias - Alta Perfumería"
          fetchPriority="high"
          decoding="async"
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
          {/* New In Badge */}
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

        {/* Right Column: Floating Product Info Card Automática y 100% Aleatoria */}
        <div 
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="w-full sm:w-[325px] bg-white/95 backdrop-blur-md rounded-[16px] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.3)] border border-white/60 flex flex-col gap-3.5 transition-all hover:shadow-[0_16px_40px_rgba(0,0,0,0.38)]"
        >
          {/* Header de la tarjeta limpio y minimalista */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#000aff] animate-pulse"></span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#000aff] font-bold">
                Top Más Vendido
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#737780] bg-[#ecedee] px-2 py-0.5 rounded-full font-medium">
              Destacado
            </span>
          </div>

          {/* Cuerpo del perfume con transición de desvanecimiento suave */}
          <div 
            onClick={() => onOpenProductDetail(currentProduct)}
            className={`flex items-center gap-3.5 cursor-pointer transition-all duration-300 ${
              isFading ? 'opacity-0 scale-95 translate-y-1' : 'opacity-100 scale-100 translate-y-0'
            }`}
          >
            <div className="w-16 h-16 rounded-[12px] bg-[#f4f5f6] p-1.5 flex items-center justify-center overflow-hidden shrink-0 border border-[#ecedee] shadow-inner group">
              <img
                src={currentProduct.image_url}
                alt={currentProduct.name}
                className="w-full h-full object-contain mix-blend-multiply transition-transform duration-300 hover:scale-110"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = './uploads/products/armaf-club-de-nuit-intense.png';
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[14.5px] font-bold text-[#111111] truncate tracking-tight hover:text-[#000aff] transition-colors">
                {currentProduct.name}
              </h3>
              <p className="text-[12px] font-mono text-[#737780] truncate">
                By {currentProduct.brand}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
                  (currentProduct.gender || 'Unisex') === 'Mujer'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : (currentProduct.gender || 'Unisex') === 'Hombre'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-purple-50 text-purple-700 border-purple-200'
                }`}>
                  {currentProduct.gender || 'Unisex'}
                </span>
                {currentProduct.subcategory && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-[#000aff]">
                    {currentProduct.subcategory}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Footer de la tarjeta con precio y botón de acción */}
          <div className="flex items-center justify-between pt-2.5 border-t border-[#ecedee]">
            <div>
              <span className="text-[10.5px] text-[#737780] block font-medium">
                {currentProduct.category || 'Inspiración'}
              </span>
              <span className="text-[13.5px] font-mono font-bold text-[#111111]">
                {getPriceText(currentProduct)}
              </span>
            </div>
            <button
              onClick={() => onOpenProductDetail(currentProduct)}
              className="px-4 py-2 rounded-[10px] bg-[#111111] hover:bg-[#000aff] text-white text-[12px] font-medium transition-all active:scale-95 cursor-pointer shadow-sm hover:shadow"
            >
              Ver Opciones
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
