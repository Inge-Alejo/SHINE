import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children, initialSettings }) {
  const [settings, setSettings] = useState(initialSettings || {
    whatsapp_number: '573105964755',
    whatsapp_display: '+57 310 5964755',
    prices: {
      '30ml': 17000,
      '60ml': 24000,
      '100ml': 37000
    }
  });

  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('shine_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error reading localStorage cart:', e);
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('shine_cart_items', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Error saving cart to localStorage:', e);
    }
  }, [cartItems]);

  // Actualizar settings si cambian desde la API
  const updateSettings = (newSettings) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
      prices: {
        ...prev.prices,
        ...(newSettings.prices || {})
      }
    }));
  };

  /**
   * Obtiene el precio oficial según la presentación elegida
   */
  const getPriceForPresentation = (presentation) => {
    const key = String(presentation).replace(/\s+/g, '').toLowerCase(); // '30ml', '60ml', '100ml'
    if (settings.prices && settings.prices[key]) {
      return settings.prices[key];
    }
    if (key === '30ml') return 17000;
    if (key === '60ml') return 24000;
    if (key === '100ml') return 37000;
    return 17000;
  };

  /**
   * Agrega un perfume al carrito.
   * RESTRICCIÓN: Solo se permiten perfumes de la categoría 'Inspiraciones'
   * y la selección de presentación es OBLIGATORIA.
   */
  const addToCart = (product, presentation, quantity = 1) => {
    if (!product || product.category !== 'Inspiraciones') {
      alert('Solo las fragancias de la categoría Inspiraciones cuentan con opción de compra y carrito.');
      return false;
    }

    if (!presentation) {
      alert('Debe seleccionar una presentación obligatoria (30 ml, 60 ml o 100 ml).');
      return false;
    }

    const unitPrice = getPriceForPresentation(presentation);
    const itemKey = `${product.id}_${presentation}`;

    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.itemKey === itemKey);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        updated[existingIndex].subtotal = updated[existingIndex].quantity * unitPrice;
        return updated;
      } else {
        return [
          ...prev,
          {
            itemKey,
            productId: product.id,
            name: product.name,
            brand: product.brand,
            category: product.category,
            subcategory: product.subcategory || 'General',
            image_url: product.image_url,
            presentation: presentation, // '30 ml', '60 ml', '100 ml'
            unitPrice: unitPrice,
            quantity: quantity,
            subtotal: unitPrice * quantity
          }
        ];
      }
    });

    setIsCartOpen(true);
    return true;
  };

  const updateQuantity = (itemKey, delta) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.itemKey === itemKey) {
          const newQty = Math.max(1, item.quantity + delta);
          return {
            ...item,
            quantity: newQty,
            subtotal: newQty * item.unitPrice
          };
        }
        return item;
      });
    });
  };

  const removeFromCart = (itemKey) => {
    setCartItems(prev => prev.filter(item => item.itemKey !== itemKey));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const totalAmount = cartItems.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0);
  const totalCount = cartItems.reduce((acc, it) => acc + it.quantity, 0);

  /**
   * Genera el enlace de WhatsApp para pedido completo del carrito
   */
  const getWhatsAppCartUrl = () => {
    if (cartItems.length === 0) return null;

    let msg = `Hola, quiero realizar el siguiente pedido en ${settings.brand_name || 'SHINE Fragancias'}:\n\n`;

    cartItems.forEach((it, idx) => {
      msg += `Perfume ${idx + 1}: ${it.name}\n`;
      msg += `Marca: ${it.brand}\n`;
      msg += `Presentación: ${it.presentation}\n`;
      msg += `Cantidad: ${it.quantity}\n`;
      msg += `Precio unitario: $${it.unitPrice.toLocaleString('es-CO')} COP\n`;
      msg += `Subtotal: $${it.subtotal.toLocaleString('es-CO')} COP\n\n`;
    });

    msg += `Total: $${totalAmount.toLocaleString('es-CO')} COP.\n\n`;
    msg += `Quedo atento a la confirmación de disponibilidad y los detalles del pedido.`;

    const cleanPhone = (settings.whatsapp_number || '573105964755').replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  /**
   * Genera el enlace de WhatsApp para pedido individual (Inspiraciones)
   */
  const getWhatsAppIndividualOrderUrl = (product, presentation, quantity = 1) => {
    const unitPrice = getPriceForPresentation(presentation);
    const subtotal = unitPrice * quantity;

    let msg = `Hola, quiero realizar el siguiente pedido en ${settings.brand_name || 'SHINE Fragancias'}:\n\n`;
    msg += `Perfume: ${product.name}\n`;
    msg += `Marca: ${product.brand}\n`;
    msg += `Presentación: ${presentation}\n`;
    msg += `Cantidad: ${quantity}\n`;
    msg += `Precio unitario: $${unitPrice.toLocaleString('es-CO')}\n`;
    msg += `Subtotal: $${subtotal.toLocaleString('es-CO')}\n`;
    msg += `Total: $${subtotal.toLocaleString('es-CO')} COP.\n\n`;
    msg += `Quedo atento a la confirmación de disponibilidad y los detalles del pedido.`;

    const cleanPhone = (settings.whatsapp_number || '573105964755').replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  /**
   * Genera el enlace de WhatsApp para consulta de disponibilidad (Originales y Perfumería 1.1)
   * REGLA: SIN precios, SIN tamaños en ml, SIN carrito.
   */
  const getWhatsAppAvailabilityUrl = (product) => {
    const cat = product.displayCategory || product.category || 'Originales';
    let msg = `Hola, estoy interesado en consultar la disponibilidad de este perfume:\n\n`;
    msg += `Producto: ${product.name}\n`;
    msg += `Marca: ${product.brand}\n`;
    msg += `Categoría: ${cat}.\n\n`;
    msg += `¿Podrían brindarme más información?`;

    const cleanPhone = (settings.whatsapp_number || '573105964755').replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <CartContext.Provider value={{
      settings,
      updateSettings,
      cartItems,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      totalAmount,
      totalCount,
      getPriceForPresentation,
      getWhatsAppCartUrl,
      getWhatsAppIndividualOrderUrl,
      getWhatsAppAvailabilityUrl
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}

