import React from 'react';
import { MessageCircle, Shield, Heart, Sparkles, MapPin, ArrowUp, ShieldCheck, Lock, CreditCard } from 'lucide-react';
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

        {/* MÉTODOS DE PAGO Y FINANCIACIÓN (Addi + Todas las Tarjetas + Billeteras) */}
        <div className="pt-10 pb-2 border-t border-white/10 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#00F0D8]" />
                <h4 className="text-[13px] font-mono uppercase tracking-wider text-white font-bold">
                  Métodos de Pago y Financiación Oficial
                </h4>
              </div>
              <p className="text-[12px] text-white/60 mt-0.5">
                Financia tus fragancias sin tarjeta con <strong className="text-[#00F0D8]">Addi</strong> (0% interés en hasta 3 cuotas), o paga con todas las tarjetas de crédito, débito, PSE y billeteras digitales.
              </p>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-white/60 bg-white/5 px-3 py-1.5 rounded-[8px] border border-white/10 shrink-0 w-fit">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Transacciones Seguras y Encriptadas</span>
            </div>
          </div>

          {/* Galería de Tarjetas y Medios de Pago */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
            {/* 1. ADDI (Destacado BNPL) */}
            <div 
              className="h-9 px-3 rounded-[8px] bg-[#00F0D8] text-[#111111] flex items-center gap-2 shadow-sm hover:scale-105 transition-transform cursor-pointer select-none"
              title="Addi: Paga a cuotas sin tarjeta de crédito y 0% de interés"
            >
              <span className="font-extrabold text-[16px] lowercase font-sans tracking-tight leading-none">
                addi
              </span>
              <span className="text-[9px] font-mono font-bold bg-[#111111] text-[#00F0D8] px-1.5 py-0.5 rounded uppercase leading-none">
                3 Cuotas 0%
              </span>
            </div>

            {/* 2. VISA */}
            <div 
              className="h-9 px-3.5 rounded-[8px] bg-white text-[#1a1f71] flex items-center justify-center font-bold italic text-[16px] font-serif tracking-wider shadow-sm hover:scale-105 transition-transform cursor-pointer select-none"
              title="Tarjetas de Crédito y Débito Visa"
            >
              VISA
            </div>

            {/* 3. MASTERCARD */}
            <div 
              className="h-9 px-3 rounded-[8px] bg-white text-[#111111] flex items-center gap-1.5 shadow-sm hover:scale-105 transition-transform cursor-pointer select-none"
              title="Tarjetas de Crédito y Débito Mastercard"
            >
              <div className="flex -space-x-2">
                <div className="w-4 h-4 rounded-full bg-[#eb001b]"></div>
                <div className="w-4 h-4 rounded-full bg-[#f79e1b] opacity-90"></div>
              </div>
              <span className="text-[11.5px] font-bold tracking-tight font-sans">mastercard</span>
            </div>

            {/* 4. AMERICAN EXPRESS */}
            <div 
              className="h-9 px-3 rounded-[8px] bg-[#006fcf] text-white flex items-center justify-center font-extrabold text-[12px] tracking-wider shadow-sm hover:scale-105 transition-transform cursor-pointer select-none"
              title="Tarjetas American Express"
            >
              AMEX
            </div>

            {/* 5. DINERS CLUB */}
            <div 
              className="h-9 px-3 rounded-[8px] bg-white text-[#004a97] flex items-center gap-1.5 shadow-sm hover:scale-105 transition-transform cursor-pointer select-none"
              title="Diners Club International"
            >
              <div className="w-3.5 h-3.5 rounded-full border-2 border-[#004a97] flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-[#004a97]"></div>
              </div>
              <span className="text-[11px] font-bold font-sans">Diners</span>
            </div>

            {/* 6. PSE */}
            <div 
              className="h-9 px-3 rounded-[8px] bg-white text-[#00386b] flex items-center gap-1.5 shadow-sm hover:scale-105 transition-transform cursor-pointer select-none"
              title="PSE - Pagos Seguros en Línea (Todos los bancos de Colombia)"
            >
              <div className="w-4 h-4 rounded-full bg-[#00386b] flex items-center justify-center text-white text-[9px] font-black leading-none">
                ✓
              </div>
              <span className="font-extrabold text-[12.5px] tracking-tight font-sans">PSE</span>
            </div>

            {/* 7. BANCOLOMBIA */}
            <div 
              className="h-9 px-3 rounded-[8px] bg-white text-[#111111] flex items-center gap-1.5 shadow-sm hover:scale-105 transition-transform cursor-pointer select-none"
              title="Bancolombia: Transferencia, QR y Botón Bancolombia"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-yellow-400 via-blue-600 to-red-500"></div>
              <span className="text-[11.5px] font-bold font-sans">Bancolombia</span>
            </div>

            {/* 8. NEQUI */}
            <div 
              className="h-9 px-3 rounded-[8px] bg-[#200020] text-white flex items-center gap-1.5 border border-[#ff007a]/40 shadow-sm hover:scale-105 transition-transform cursor-pointer select-none"
              title="Nequi: Envíos inmediatos y pagos por QR"
            >
              <span className="w-2 h-2 rounded-full bg-[#ff007a] animate-pulse"></span>
              <span className="text-[12px] font-bold tracking-tight font-sans">nequi</span>
            </div>

            {/* 9. DAVIPLATA */}
            <div 
              className="h-9 px-3 rounded-[8px] bg-[#ed1c24] text-white flex items-center gap-1.5 shadow-sm hover:scale-105 transition-transform cursor-pointer select-none"
              title="Daviplata"
            >
              <span className="text-[12px] font-bold tracking-tight font-sans">daviplata</span>
            </div>

            {/* 10. EFECTIVO / TRANSFERENCIAS */}
            <div 
              className="h-9 px-3 rounded-[8px] bg-white/10 text-white/90 border border-white/20 flex items-center gap-1.5 text-[11px] font-mono hover:bg-white/20 transition-colors select-none"
              title="Efecty, Transferencias y Efectivo"
            >
              <span>💵 Efectivo / Transferencias</span>
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

