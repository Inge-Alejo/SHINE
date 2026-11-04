import React from 'react';
import { CheckCircle2, Sparkles, Shield, Droplets } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function PresentationsSection() {
  const { settings, getPriceForPresentation } = useCart();

  const presentations = [
    {
      size: '30 ml',
      name: 'Formato Esencial',
      price: getPriceForPresentation('30ml'),
      tag: 'Portátil & Práctico',
      highlight: false,
      desc: 'Frasco esbelto con tapa de color metálico. Tamaño ideal para llevar en el bolsillo, bolso o viajes sin ocupar espacio.',
      features: ['Atomizador microdifusor', 'Ideal para probar aromas', 'Aprobado para equipaje de mano']
    },
    {
      size: '60 ml',
      name: 'Formato Equilibrio',
      price: getPriceForPresentation('60ml'),
      tag: 'El Más Popular',
      highlight: true,
      desc: 'Cilindro estilizado de cristal con tapa plateada pulida. El balance perfecto entre portabilidad y durabilidad de uso frecuente.',
      features: ['Excelente rendimiento costo-volumen', 'Mayor autonomía para uso diario', 'El favorito de nuestros clientes']
    },
    {
      size: '100 ml',
      name: 'Formato Generoso',
      price: getPriceForPresentation('100ml'),
      tag: 'Máxima Durabilidad',
      highlight: false,
      desc: 'Frasco arquitectónico de base ancha con tapa oscura elegante. Para quienes ya tienen su fragancia insignia y buscan mayor abundancia.',
      features: ['Mayor rendimiento por mililitro', 'Presencia imponente en tocador', 'Máxima duración garantizada']
    }
  ];

  return (
    <section id="presentaciones" className="py-20 bg-[#ecedee]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-[12px] font-mono text-[#000aff] uppercase tracking-widest font-semibold block">
            Línea Inspiraciones
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#111111] tracking-[-0.04em]">
            presentaciones y tarifas oficiales
          </h2>
          <p className="text-base text-[#737780]">
            Precios únicos y transparentes para todas las fragancias de la categoría Inspiraciones, envasadas con fórmula concentrada y atomizador de alta dispersión.
          </p>
        </div>

        {/* Hero split: Official Photo + Pricing cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Real Photo showcase (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-[10px] p-4 shadow-sm border border-[#d7d7d7] overflow-hidden group">
            <div className="relative aspect-[3/4] rounded-[8px] overflow-hidden bg-neutral-900">
              <img
                src="./uploads/system/presentaciones_shine.jpg"
                alt="Presentaciones Oficiales SHINE Fragancias - 30ml, 60ml, 100ml"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-md rounded-[6px] p-2.5 text-white flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold">Presentación de los frascos</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#000aff] text-white">
                  Verificados
                </span>
              </div>
            </div>
            <p className="text-[12px] text-center text-[#737780] pt-3 font-mono">
              Frascos reales de 100 ml, 60 ml y 30 ml sobre plinto de mármol.
            </p>
          </div>

          {/* Pricing Cards (7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {presentations.map((p, idx) => (
              <div
                key={idx}
                className={`rounded-[10px] p-6 flex flex-col justify-between transition-all duration-300 ${
                  p.highlight
                    ? 'bg-white border-2 border-[#000aff] shadow-md scale-[1.02]'
                    : 'bg-white border border-[#d7d7d7] shadow-sm hover:border-[#a1a4aa]'
                }`}
              >
                <div className="space-y-4">
                  {/* Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-[20px] font-bold font-mono text-[#111111]">
                      {p.size}
                    </span>
                    <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-semibold ${
                      p.highlight ? 'bg-[#000aff] text-white' : 'bg-[#ecedee] text-[#737780]'
                    }`}>
                      {p.tag}
                    </span>
                  </div>

                  {/* Price */}
                  <div>
                    <span className="text-[11px] font-mono text-[#737780] uppercase block">
                      Precio Oficial
                    </span>
                    <div className="text-2xl sm:text-3xl font-mono font-bold text-[#111111] tracking-tight">
                      ${p.price.toLocaleString('es-CO')}
                      <span className="text-xs font-normal text-[#737780] ml-1">COP</span>
                    </div>
                  </div>

                  <p className="text-[13px] text-[#444955] leading-relaxed">
                    {p.desc}
                  </p>

                  {/* Feature bullets */}
                  <div className="space-y-2 pt-2 border-t border-[#ecedee]">
                    {p.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2 text-[12px] text-[#111111]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#000aff] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <a
                    href="#catalogo"
                    className={`w-full py-2.5 rounded-[10px] text-[13px] font-medium flex items-center justify-center transition-all cursor-pointer ${
                      p.highlight
                        ? 'bg-[#000aff] hover:bg-[#0008cc] text-white'
                        : 'bg-[#111111] hover:bg-[#222222] text-white'
                    }`}
                  >
                    Elegir {p.size} en Catálogo
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quality Guarantees Bar */}
        <div className="bg-white rounded-[10px] p-6 border border-[#d7d7d7] grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-[10px] bg-[#e5e7ff] text-[#000aff] flex items-center justify-center shrink-0">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[14px] font-bold text-[#111111]">Fórmula de Alta Maceración</h4>
              <p className="text-[12px] text-[#737780]">Concentración equilibrada para estela y proyección duradera.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-[10px] bg-[#e5e7ff] text-[#000aff] flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[14px] font-bold text-[#111111]">Embalaje y Envío Seguro</h4>
              <p className="text-[12px] text-[#737780]">Protección contra impactos para entregas intactas en Colombia.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-[10px] bg-[#e5e7ff] text-[#000aff] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[14px] font-bold text-[#111111]">Atención Personalizada</h4>
              <p className="text-[12px] text-[#737780]">Confirmación directa por WhatsApp y asesoría olfativa experta.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

