import React from 'react';
import { ShoppingBag, Sparkles, MessageCircle, ArrowRight } from 'lucide-react';

export default function CategoriesSection({ onSelectCategory, onSelectSubcategory }) {
  const mainCategories = [
    {
      id: 'Inspiraciones',
      title: 'Inspiraciones',
      tagline: 'Fórmulas maestras con carrito y compra directa',
      image: './uploads/system/categoria_inspiraciones.jpg',
      badge: 'Compra Online & Carrito',
      badgeColor: 'bg-[#000aff] text-white',
      description: 'Nuestra línea insigne. Fragancias de alta concentración en presentaciones de 30 ml ($17k), 60 ml ($24k) y 100 ml ($37k COP). Puedes agregarlas al carrito y tramitar tu pedido por WhatsApp.',
      cta: 'Ver Colección Inspiraciones',
      action: () => onSelectCategory('Inspiraciones')
    },
    {
      id: 'Originales',
      title: 'Originales',
      tagline: 'Perfumería auténtica bajo encargo exclusivo',
      image: './uploads/system/categoria_originales.jpg',
      badge: 'Bajo Encargo Exclusivo',
      badgeColor: 'bg-[#111111] text-white',
      description: 'Frascos originales sellados de las casas matrices más prestigiosas del mundo. No manejamos stock inmediato en tienda; se importan bajo pedido directo.',
      cta: 'Consultar Catálogo Originales',
      action: () => onSelectCategory('Originales')
    },
    {
      id: 'Perfumería 1.1',
      title: 'Perfumería 1.1',
      tagline: 'Máxima fidelidad olfativa y presentación',
      image: './uploads/system/categoria_1_1.jpg',
      badge: 'Bajo Encargo',
      badgeColor: 'bg-[#444955] text-white',
      description: 'Línea 1.1 con acabados idénticos en frasco, peso y estela aromática para clientes exigentes. Comercializados exclusivamente por encargo.',
      cta: 'Consultar Perfumería 1.1',
      action: () => onSelectCategory('Perfumería 1.1')
    }
  ];

  const subcategories = [
    {
      name: 'Árabes',
      casaExamples: 'Lattafa, Armaf, Afnan, Orientica',
      image: './uploads/system/subcategoria_arabe.jpg',
      desc: 'Maderas preciosas, oud, especias cálidas y vainillas envolventes con longevidad legendaria.',
      subcat: 'Árabes'
    },
    {
      name: 'Nicho',
      casaExamples: 'Creed, MFK, Parfums de Marly, Xerjoff',
      image: './uploads/system/subcategoria_nicho.jpg',
      desc: 'Creaciones artísticas de perfumería de autor para quienes buscan una firma olfativa única.',
      subcat: 'Nicho'
    },
    {
      name: 'Diseñador',
      casaExamples: 'Dior, Chanel, Carolina Herrera, Paco Rabanne',
      image: './uploads/system/subcategoria_disenador.jpg',
      desc: 'Los clásicos contemporáneos y lanzamientos más aclamados de las grandes pasarelas.',
      subcat: 'Diseñador'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-[12px] font-mono text-[#000aff] uppercase tracking-widest font-semibold block">
            Estructura Comercial
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#111111] tracking-[-0.04em]">
            nuestras tres categorías
          </h2>
          <p className="text-base text-[#737780]">
            Descubre nuestra cuidada división comercial: fragancias con compra inmediata en tres presentaciones y referencias originales bajo encargo.
          </p>
        </div>

        {/* 3 Main Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {mainCategories.map((cat, idx) => (
            <div
              key={idx}
              className="group bg-[#ecedee] rounded-[10px] overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md border border-[#ecedee]"
            >
              {/* Image Frame */}
              <div className="relative aspect-[16/10] overflow-hidden bg-black">
                <img
                  src={cat.image}
                  alt={cat.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3">
                  <span className={`text-[11px] font-mono px-3 py-1 rounded-full font-semibold ${cat.badgeColor}`}>
                    {cat.badge}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-[#111111] tracking-tight">
                    {cat.title}
                  </h3>
                  <p className="text-[13px] font-mono text-[#000aff] font-medium">
                    {cat.tagline}
                  </p>
                  <p className="text-[14px] text-[#444955] leading-relaxed pt-1">
                    {cat.description}
                  </p>
                </div>

                <button
                  onClick={cat.action}
                  className="w-full py-3 rounded-[10px] bg-[#111111] hover:bg-[#222222] text-white text-[13px] font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>{cat.cta}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Subcategories of Inspirations Banner */}
        <div className="pt-10 border-t border-[#ecedee] space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[12px] font-mono text-[#737780] uppercase tracking-wider block">
                Subcategorías de Inspiraciones
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight">
                explora por estilo y origen
              </h3>
            </div>
            <p className="text-[13px] text-[#737780] max-w-md">
              Selecciona una subcategoría para filtrar instantáneamente el catálogo de Inspiraciones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subcategories.map((sub, sIdx) => (
              <div
                key={sIdx}
                onClick={() => onSelectSubcategory(sub.subcat)}
                className="group relative bg-[#ecedee] rounded-[10px] overflow-hidden cursor-pointer border border-[#ecedee] hover:border-[#a1a4aa] transition-all duration-300"
              >
                <div className="aspect-[16/9] overflow-hidden bg-black">
                  <img
                    src={sub.image}
                    alt={sub.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                </div>

                <div className="absolute bottom-0 inset-x-0 p-5 text-white space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-bold tracking-tight">{sub.name}</h4>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white">
                      Ver Catálogo
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-[#e5e7ff] truncate">
                    {sub.casaExamples}
                  </p>
                  <p className="text-[12px] text-white/80 line-clamp-2 pt-1 leading-snug">
                    {sub.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

