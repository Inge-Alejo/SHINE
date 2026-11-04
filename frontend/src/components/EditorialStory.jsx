import React from 'react';
import { Sparkles, Compass, Feather } from 'lucide-react';

export default function EditorialStory() {
  return (
    <section id="creacion" className="py-24 bg-white border-t border-[#ecedee] overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        {/* Block 1: El Atelier de Creación (img_creacion.jpg) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ecedee] text-[#111111] text-[11px] font-mono font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#000aff]" />
              <span>PROCESO ARTESANAL</span>
            </div>
            
            <h2 className="text-3xl sm:text-5xl font-bold text-[#111111] tracking-[-0.04em] leading-[1.1]">
              maceración paciente, <br />
              fidelidad olfativa absoluta
            </h2>

            <p className="text-[15px] sm:text-[16px] text-[#444955] leading-relaxed">
              En SHINE Fragancias concebimos cada botella como una partitura aromática. Desde las resinas amaderadas de Oriente Medio y el oud ahumado, hasta los acordes cítricos mediterráneos de bergamota y sándalo, cada formulación atraviesa un riguroso periodo de reposo y maceración.
            </p>

            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[#ecedee]">
              <div>
                <span className="text-2xl sm:text-3xl font-mono font-bold text-[#111111]">
                  +390
                </span>
                <p className="text-[12px] font-mono text-[#737780] pt-1 uppercase">
                  Referencias Catalogadas
                </p>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-mono font-bold text-[#000aff]">
                  100%
                </span>
                <p className="text-[12px] font-mono text-[#737780] pt-1 uppercase">
                  Inspección Individual
                </p>
              </div>
            </div>
          </div>

          <div className="relative rounded-[10px] overflow-hidden bg-[#ecedee] shadow-sm border border-[#ecedee] group">
            <img
              src="./uploads/system/img_creacion.jpg"
              alt="Atelier y laboratorio de formulación SHINE Fragancias"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-[6px] text-white flex items-center justify-between text-[12px] font-mono">
              <span>Laboratorio Olfativo SHINE</span>
              <span className="text-[#e5e7ff]">Formulación 2026</span>
            </div>
          </div>
        </div>

        {/* Block 2: Estilo de Vida y Presencia (estilo_de_vida.jpg) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="order-2 lg:order-1 relative rounded-[10px] overflow-hidden bg-[#ecedee] shadow-sm border border-[#ecedee] group">
            <img
              src="./uploads/system/estilo_de_vida.jpg"
              alt="Estilo de vida y elegancia con SHINE Fragancias"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-[6px] text-white flex items-center justify-between text-[12px] font-mono">
              <span>Estilo & Sofisticación</span>
              <span className="text-[#000aff] font-bold">SHINE</span>
            </div>
          </div>

          <div className="order-1 lg:order-2 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ecedee] text-[#111111] text-[11px] font-mono font-medium">
              <Feather className="w-3.5 h-3.5 text-[#000aff]" />
              <span>EL TOQUE FINAL</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-bold text-[#111111] tracking-[-0.04em] leading-[1.1]">
              tu firma personal <br />
              en cada instante
            </h2>

            <p className="text-[15px] sm:text-[16px] text-[#444955] leading-relaxed">
              Un perfume no es simplemente un accesorio; es la memoria invisible que dejas al entrar a una habitación. Diseñamos nuestras inspiraciones y seleccionamos nuestras piezas bajo encargo para que proyectes seguridad, distinción y carácter propio en cualquier ocasión.
            </p>

            <blockquote className="border-l-2 border-[#000aff] pl-4 italic text-[14px] text-[#737780] font-mono">
              "El perfume es la forma más intensa del recuerdo y la mayor expresión de la elegancia personal."
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
}

