import React from 'react';
import { MessageCircle, Shield, Heart, Sparkles, MapPin, ArrowUp } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Footer({ onSelectCategory, onOpenAdmin }) {
  const { settings } = useCart();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#111111] text-white pt-16 pb-12 border-t border-white/10">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="./uploads/system/shine_diamond.svg"
                alt="SHINE Diamond Icon"
                className="w-8 h-8 object-contain"
              />
              <span className="text-2xl font-bold tracking-tight">SHINE</span>
              <span className="text-[12px] font-mono tracking-widest text-[#e5e7ff] -ml-1">fragancias</span>
            </div>
            <p className="text-[13px] text-white/70 leading-relaxed">
              Atelier especializado en alta perfumería. Inspiraciones exclusivas con alta concentración y fijación, fragancias originales bajo encargo y asesoría olfativa personalizada.
            </p>
            <div className="flex items-center gap-2 text-[12px] font-mono text-white/60">
              <MapPin className="w-3.5 h-3.5 text-[#000aff]" />
              <span>Cobertura y envíos a toda Colombia</span>
            </div>
          </div>

          {/* Categories Col */}
          <div className="space-y-3">
            <h4 className="text-[13px] font-mono uppercase tracking-wider text-white font-bold">
              Categorías Comerciales
            </h4>
            <ul className="space-y-2 text-[13px] text-white/70">
              <li>
                <button
                  onClick={() => onSelectCategory('Inspiraciones')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Inspiraciones (30, 60 y 100 ml con Carrito)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('Originales')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Originales (Bajo Encargo Directo)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('Perfumería 1.1')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Perfumería 1.1 (Por Encargo)
                </button>
              </li>
              <li>
                <a href="#presentaciones" className="hover:text-white transition-colors">
                  Tarifas y Presentaciones Oficiales
                </a>
              </li>
            </ul>
          </div>

          {/* Subcategories Inspiraciones */}
          <div className="space-y-3">
            <h4 className="text-[13px] font-mono uppercase tracking-wider text-white font-bold">
              Familias de Inspiración
            </h4>
            <ul className="space-y-2 text-[13px] text-white/70">
              <li>Perfumes Árabes (Armaf, Lattafa, Afnan, Al Haramain)</li>
              <li>Perfumería Nicho (Creed, MFK, Xerjoff, Parfums de Marly)</li>
              <li>Perfumes de Diseñador (Dior, Chanel, Carolina Herrera, Paco Rabanne)</li>
              <li>Fórmulas de alta concentración y maceración prolongada</li>
            </ul>
          </div>

          {/* Contact & WhatsApp */}
          <div className="space-y-4">
            <h4 className="text-[13px] font-mono uppercase tracking-wider text-white font-bold">
              Atención Oficial
            </h4>
            <p className="text-[13px] text-white/70 leading-relaxed">
              Realiza tus pedidos y consultas directamente a nuestra línea oficial de WhatsApp:
            </p>
            <a
              href={`https://wa.me/${(settings.whatsapp_number || '573105964755').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hola SHINE Fragancias, deseo solicitar asesoría sobre el catálogo de perfumes.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#25D366] hover:bg-[#1EBE5D] text-white text-[13px] font-semibold transition-all shadow-sm active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{settings.whatsapp_display || '+57 310 5964755'}</span>
            </a>
            <div className="pt-2">
              <button
                onClick={onOpenAdmin}
                className="text-[11px] font-mono text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                Acceso Administrativo
              </button>
            </div>
          </div>
        </div>

        {/* Bottom copyright & Scroll top */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] font-mono text-white/50">
          <div>
            © 2026 SHINE Fragancias. Todos los derechos reservados. Colombia.
          </div>

          <div className="flex items-center gap-6">
            <span>Catálogo Oficial 2026</span>
            <button
              onClick={scrollToTop}
              className="p-2 rounded-[8px] bg-white/5 hover:bg-white/10 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Subir</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

