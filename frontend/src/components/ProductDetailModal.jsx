import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, MessageCircle, Check, Sparkles, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ProductDetailModal({ product, onClose }) {
  const { addToCart, getPriceForPresentation, getWhatsAppIndividualOrderUrl, getWhatsAppAvailabilityUrl } = useCart();

  const effectiveCategory = product?.displayCategory || product?.category || 'Inspiraciones';
  const isInspiracion = effectiveCategory === 'Inspiraciones' || (!product?.category && effectiveCategory !== 'Perfumería 1.1' && effectiveCategory !== 'Originales');
  const isOriginal = effectiveCategory === 'Originales';
  const is11 = effectiveCategory === 'Perfumería 1.1';

  // Presentación por defecto para Inspiraciones (60 ml es la más popular)
  const [selectedPresentation, setSelectedPresentation] = useState('60 ml');
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Bloquear el scroll de la página de fondo cuando el modal esté abierto en móviles y desktop
  useEffect(() => {
    if (product) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [product]);

  if (!product) return null;

  const currentPrice = isInspiracion ? getPriceForPresentation(selectedPresentation) : 0;
  const currentSubtotal = currentPrice * quantity;

  const handleAddToCart = () => {
    const success = addToCart(product, selectedPresentation, quantity);
    if (success) {
      setAddedAnimation(true);
      setTimeout(() => {
        setAddedAnimation(false);
        onClose();
      }, 500);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-t-[24px] sm:rounded-[16px] max-w-2xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border border-[#ecedee] flex flex-col md:flex-row relative animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator Bar */}
        <div className="w-12 h-1 bg-[#d7d7d7] rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 w-8 h-8 rounded-full bg-white/90 sm:bg-[#ecedee] hover:bg-[#d7d7d7] text-[#111111] flex items-center justify-center transition-colors cursor-pointer shadow-sm"
          aria-label="Cerrar modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left: Product Image & Badges */}
        <div className="md:w-1/2 bg-[#ecedee] p-4 sm:p-8 flex flex-col items-center justify-center relative shrink-0">
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
            <span className={`text-[11px] font-mono px-3 py-1 rounded-full font-semibold shadow-xs ${
              isInspiracion 
                ? 'bg-[#000aff] text-white' 
                : isOriginal 
                  ? 'bg-[#111111] text-white' 
                  : 'bg-[#444955] text-white'
            }`}>
              {effectiveCategory}
            </span>
          </div>

          <div className="w-full h-44 sm:h-56 md:h-64 flex items-center justify-center my-1 sm:my-3">
            <img
              src={product.image_url || './uploads/system/presentaciones_shine.jpg'}
              alt={product.name}
              className="max-h-full max-w-[85%] object-contain mix-blend-multiply transition-transform duration-500 hover:scale-105"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = './uploads/system/presentaciones_shine.jpg';
              }}
            />
          </div>

          <div className="text-center pt-1">
            <span className="text-[11px] font-mono text-[#737780]">
              {product.image_url ? 'Fotografía Verificada' : 'Presentación SHINE Fragancias'}
            </span>
          </div>
        </div>

        {/* Right: Details & Actions */}
        <div className="md:w-1/2 p-5 sm:p-8 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            {/* Title & Brand */}
            <div>
              <span className="text-[12px] font-mono text-[#000aff] font-semibold uppercase tracking-wider block">
                {product.brand}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-[#111111] tracking-tight leading-snug">
                {product.name}
              </h3>
              <div className="flex items-center gap-2 pt-1.5">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${
                  (product.gender || 'Unisex') === 'Mujer'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : (product.gender || 'Unisex') === 'Hombre'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-purple-50 text-purple-700 border-purple-200'
                }`}>
                  {product.gender || 'Unisex'}
                </span>
                {product.subcategory && (
                  <span className="text-[12px] font-mono text-[#737780]">
                    • {product.subcategory}
                  </span>
                )}
              </div>
            </div>

            {/* Description / Olfactory notes */}
            <div className="bg-[#ecedee]/60 rounded-[10px] p-3 text-[13px] text-[#444955] space-y-1">
              <p className="font-semibold text-[#111111]">Familia y Notas Olfativas:</p>
              <p className="text-[12px] leading-relaxed">
                {product.description || product.olfactory_family || 'Acorde aromático balanceado de alta fijación.'}
              </p>
            </div>

            {/* COMMERCIAL LOGIC BASED ON CATEGORY */}
            {isInspiracion ? (
              /* INSPIRACIONES: Precios, Selector obligatorio de presentación y cantidad */
              <div className="space-y-3 pt-2 border-t border-[#ecedee]">
                <div>
                  <label className="text-[12px] font-mono text-[#111111] font-semibold block mb-2">
                    Selecciona Presentación (Obligatoria):
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { size: '30 ml', price: getPriceForPresentation('30ml') },
                      { size: '60 ml', price: getPriceForPresentation('60ml') },
                      { size: '100 ml', price: getPriceForPresentation('100ml') }
                    ].map(pres => (
                      <button
                        key={pres.size}
                        type="button"
                        onClick={() => setSelectedPresentation(pres.size)}
                        className={`p-2 sm:p-2.5 rounded-[10px] text-center border transition-all cursor-pointer ${
                          selectedPresentation === pres.size
                            ? 'border-[#000aff] bg-[#e5e7ff]/50 text-[#111111] font-bold shadow-xs'
                            : 'border-[#ecedee] bg-white text-[#444955] hover:border-[#a1a4aa]'
                        }`}
                      >
                        <span className="block text-[12px] sm:text-[13px] font-mono">{pres.size}</span>
                        <span className="block text-[11px] sm:text-[12px] font-mono text-[#000aff] font-semibold">
                          ${pres.price.toLocaleString('es-CO')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity selector */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[12px] font-mono text-[#737780]">Cantidad:</span>
                  <div className="flex items-center gap-2 border border-[#d7d7d7] rounded-[8px] p-1 bg-[#ecedee]">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-7 h-7 rounded bg-white text-[#111111] font-bold text-sm flex items-center justify-center hover:bg-neutral-100 cursor-pointer shadow-xs active:scale-95"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-mono font-bold text-[14px]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-7 h-7 rounded bg-white text-[#111111] font-bold text-sm flex items-center justify-center hover:bg-neutral-100 cursor-pointer shadow-xs active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="flex items-center justify-between pt-2 border-t border-[#ecedee]">
                  <span className="text-[12px] font-mono text-[#737780]">Subtotal:</span>
                  <span className="text-xl font-mono font-bold text-[#111111]">
                    ${currentSubtotal.toLocaleString('es-CO')} <span className="text-xs text-[#737780]">COP</span>
                  </span>
                </div>

                {/* Financiación Addi */}
                <div className="flex items-center justify-between p-2 rounded-[8px] bg-[#00F0D8]/15 border border-[#00F0D8]/40 text-[11.5px] font-mono text-[#111111]">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-[#00F0D8] text-[#111111] px-1.5 py-0.5 rounded font-extrabold text-[11px] font-sans lowercase leading-none">
                      addi
                    </span>
                    <span>O en <strong>3 cuotas de ${(Math.round(currentSubtotal / 3)).toLocaleString('es-CO')} COP</strong></span>
                  </div>
                  <span className="text-[10px] font-bold text-[#006e62] bg-white/70 px-1.5 py-0.5 rounded">0% interés</span>
                </div>
              </div>
            ) : (
              /* ORIGINALES & 1.1: Restricción absoluta de precios y ml */
              <div className="space-y-3 pt-2 border-t border-[#ecedee]">
                <div className="p-3 bg-[#ecedee] rounded-[10px] space-y-1">
                  <p className="text-[12px] font-mono text-[#000aff] font-semibold">
                    Referencia Bajo Encargo Exclusivo
                  </p>
                  <p className="text-[12px] text-[#444955] leading-relaxed">
                    Esta pieza se comercializa por encargo personal y verificación de disponibilidad con distribuidor oficial. No cuenta con disponibilidad inmediata en tienda ni precios estándar de mostrador.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Action Buttons Area for Mobile & Desktop */}
          <div className="space-y-2 pt-2 sticky bottom-0 bg-white/95 sm:static py-2 border-t border-[#ecedee] sm:border-0 z-20">
            {isInspiracion ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full sm:flex-1 py-3.5 rounded-[10px] bg-[#111111] hover:bg-[#222222] text-white text-[13px] sm:text-[14px] font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  {addedAnimation ? <Check className="w-4 h-4 text-green-400" /> : <ShoppingBag className="w-4 h-4" />}
                  <span>{addedAnimation ? '¡Agregado al Carrito!' : 'Agregar al Carrito'}</span>
                </button>

                <a
                  href={getWhatsAppIndividualOrderUrl(product, selectedPresentation, quantity)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto py-3 px-4 rounded-[10px] bg-[#25D366] hover:bg-[#1EBE5D] text-white text-[13px] font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 text-center"
                  title="Comprar directo por WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Pedir por WhatsApp</span>
                </a>
              </div>
            ) : (
              <a
                href={getWhatsAppAvailabilityUrl(product)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-[10px] bg-[#111111] hover:bg-[#222222] text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 text-center"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>Consultar Disponibilidad por WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
