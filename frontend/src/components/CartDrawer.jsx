import React from 'react';
import { X, ShoppingBag, Trash2, MessageCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartDrawer() {
  const {
    isCartOpen,
    setIsCartOpen,
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalAmount,
    totalCount,
    getWhatsAppCartUrl,
    settings
  } = useCart();

  if (!isCartOpen) return null;

  const handleFinishWhatsAppOrder = () => {
    const url = getWhatsAppCartUrl();
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      ></div>

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-[#ecedee] animate-slideInRight">
          {/* Top Bar */}
          <div className="p-6 border-b border-[#ecedee] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#000aff]" />
              <h3 className="text-xl font-bold text-[#111111] tracking-tight">
                Bolsa de Pedido
              </h3>
              <span className="text-[12px] font-mono px-2 py-0.5 rounded-full bg-[#e5e7ff] text-[#000aff] font-bold">
                {totalCount} {totalCount === 1 ? 'ítem' : 'ítems'}
              </span>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-full hover:bg-[#ecedee] text-[#737780] hover:text-[#111111] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#ecedee] text-[#737780] flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8 opacity-40" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-bold text-[#111111]">Tu carrito está vacío</p>
                  <p className="text-[13px] text-[#737780] max-w-xs mx-auto">
                    Explora nuestra colección de Inspiraciones y selecciona tu presentación favorita (30, 60 o 100 ml).
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-5 py-2.5 rounded-[10px] bg-[#111111] text-white text-[13px] font-medium"
                >
                  Ver Catálogo de Inspiraciones
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.itemKey}
                  className="p-4 rounded-[10px] bg-[#ecedee] flex gap-3.5 items-center relative group"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-[8px] bg-white p-1 flex items-center justify-center shrink-0 border border-[#d7d7d7]">
                    <img
                      src={item.image_url || './uploads/system/presentaciones_shine.jpg'}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain mix-blend-multiply"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = './uploads/system/presentaciones_shine.jpg';
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="text-[14px] font-semibold text-[#111111] truncate">
                      {item.name}
                    </h4>
                    <p className="text-[12px] font-mono text-[#737780]">
                      {item.brand} • <span className="text-[#000aff] font-bold">{item.presentation}</span>
                    </p>
                    <p className="text-[13px] font-mono font-bold text-[#111111]">
                      ${item.subtotal.toLocaleString('es-CO')} <span className="text-[10px] font-normal text-[#737780]">COP</span>
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1.5 bg-white border border-[#d7d7d7] rounded-[8px] p-1">
                    <button
                      onClick={() => updateQuantity(item.itemKey, -1)}
                      className="w-6 h-6 rounded bg-[#ecedee] text-[#111111] text-xs font-bold flex items-center justify-center hover:bg-[#d7d7d7] cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-mono font-bold text-[12px]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.itemKey, 1)}
                      className="w-6 h-6 rounded bg-[#ecedee] text-[#111111] text-xs font-bold flex items-center justify-center hover:bg-[#d7d7d7] cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.itemKey)}
                    className="p-1.5 text-[#737780] hover:text-red-500 transition-colors cursor-pointer"
                    title="Eliminar producto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Bottom Checkout Section */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-[#ecedee] bg-white space-y-4">
              {/* Summary */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[13px] text-[#737780] font-mono">
                  <span>Productos en carrito:</span>
                  <span>{totalCount} unidades</span>
                </div>
                <div className="flex items-center justify-between text-[16px] text-[#111111] font-bold">
                  <span>Total Estimado:</span>
                  <span className="text-2xl font-mono text-[#000aff]">
                    ${totalAmount.toLocaleString('es-CO')} <span className="text-xs font-normal text-[#737780]">COP</span>
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleFinishWhatsAppOrder}
                className="w-full py-4 rounded-[10px] bg-[#000aff] hover:bg-[#0008cc] text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 text-white" />
                <span>Finalizar Pedido por WhatsApp</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Notice */}
              <div className="p-3 bg-[#ecedee] rounded-[8px] space-y-1">
                <p className="text-[11px] text-[#444955] leading-relaxed">
                  <strong>Aviso:</strong> Serás dirigido a nuestro WhatsApp oficial (<strong>{settings.whatsapp_display || '+57 310 5964755'}</strong>) con el desglose exacto de tu solicitud. La disponibilidad, entrega y métodos de pago se acordarán directamente por el chat.
                </p>
              </div>

              <div className="flex justify-between items-center pt-1 text-[11px] text-[#737780]">
                <button
                  onClick={clearCart}
                  className="hover:text-red-500 cursor-pointer"
                >
                  Vaciar carrito
                </button>
                <span className="font-mono">SHINE Fragancias</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

