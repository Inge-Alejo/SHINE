import React from 'react';
import { Sparkles, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export default function AddiBanner() {
  return (
    <section className="bg-gradient-to-r from-[#0b132b] via-[#111111] to-[#0b132b] text-white border-y border-[#00F0D8]/20 py-4 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Glow decorativo sutil */}
      <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-48 h-48 bg-[#00F0D8]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-48 h-48 bg-[#000aff]/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-4 relative z-10">
        {/* Lado izquierdo: Logo Addi + Titular */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 text-center sm:text-left">
          <div className="flex items-center gap-2 bg-[#00F0D8] text-[#111111] px-3.5 py-1.5 rounded-[10px] shadow-sm shrink-0">
            <span className="font-extrabold text-[18px] lowercase font-sans tracking-tight leading-none">
              addi
            </span>
            <span className="text-[10px] font-mono font-bold bg-[#111111] text-[#00F0D8] px-1.5 py-0.5 rounded uppercase leading-none">
              Oficial
            </span>
          </div>

          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h3 className="text-[14px] sm:text-[15px] font-bold text-white tracking-tight">
                ¡Paga tus perfumes a cuotas con Addi!
              </h3>
              <span className="text-[10px] font-mono font-semibold bg-[#00F0D8]/20 text-[#00F0D8] px-2 py-0.5 rounded-full border border-[#00F0D8]/40 hidden sm:inline-block">
                0% Interés
              </span>
            </div>
            <p className="text-[12px] text-white/70">
              Compra hoy y difiere en <strong className="text-white">hasta 3 cuotas con 0% de interés</strong>. Sin tarjeta de crédito ni trámites pesados.
            </p>
          </div>
        </div>

        {/* Lado derecho: Ventajas Rápidas */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[11.5px] font-mono text-white/80">
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-[8px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00F0D8] shrink-0" />
            <span>Solo con tu Cédula y WhatsApp</span>
          </div>

          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-[8px]">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Aprobación en 2 minutos</span>
          </div>

          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-[8px]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00F0D8] shrink-0" />
            <span>100% Digital y Seguro</span>
          </div>
        </div>
      </div>
    </section>
  );
}
