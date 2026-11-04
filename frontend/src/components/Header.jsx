import React from 'react';
import { ShoppingBag, Search, ShieldCheck, Sparkles, MessageCircle, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Header({ onOpenAdmin, onSearchClick, activeCategory, onSelectCategory }) {
  const { totalCount, setIsCartOpen, settings } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { label: 'Inspiraciones', category: 'Inspiraciones', badge: 'Con Carrito' },
    { label: 'Originales', category: 'Originales', badge: 'Por Encargo' },
    { label: 'Perfumería 1.1', category: 'Perfumería 1.1', badge: 'Bajo Pedido' },
    { label: 'Presentaciones', anchor: '#presentaciones' },
    { label: 'El Atelier', anchor: '#creacion' }
  ];

  const handleNavClick = (link) => {
    setMobileMenuOpen(false);
    if (link.category) {
      onSelectCategory(link.category);
      const catEl = document.getElementById('catalogo');
      if (catEl) catEl.scrollIntoView({ behavior: 'smooth' });
    } else if (link.anchor) {
      const el = document.querySelector(link.anchor);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#ecedee]">
      {/* Announcement Bar: Addi + Medios de Pago + Envíos */}
      <div className="bg-[#0b132b] text-white py-1.5 px-4 text-center text-[12px] font-mono tracking-tight flex flex-wrap items-center justify-center gap-2 sm:gap-3 border-b border-[#00F0D8]/20">
        <div className="flex items-center gap-1.5 bg-[#00F0D8] text-[#111111] px-2 py-0.5 rounded-[5px] font-bold text-[11px] font-sans">
          <span className="lowercase font-extrabold tracking-tight">addi</span>
          <span className="text-[9px] font-mono uppercase bg-black text-[#00F0D8] px-1 rounded leading-none">Nuevo</span>
        </div>
        <span className="font-semibold text-white">¡Paga a cuotas sin tarjeta de crédito! (3 cuotas con 0% de interés)</span>
        <span className="opacity-30 hidden sm:inline">•</span>
        <span className="text-white/80 hidden sm:inline">Todas las Tarjetas, PSE y Nequi</span>
        <span className="opacity-30 hidden md:inline">•</span>
        <span className="text-[#00F0D8] font-medium hidden md:inline">Envíos a toda Colombia</span>
      </div>

      {/* Main Nav */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <a href="#" className="flex items-center gap-3 group">
            <img 
              src="./uploads/system/shine_logo_horizontal.svg" 
              alt="SHINE Fragancias" 
              className="h-10 sm:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
              onError={(e) => {
                // Fallback si no carga el SVG
                e.target.onerror = null;
                e.target.src = './uploads/system/shine_diamond.svg';
              }}
            />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 pl-4 border-l border-[#ecedee]">
            {navLinks.map((link, idx) => {
              const isActive = link.category && activeCategory === link.category;
              return (
                <button
                  key={idx}
                  onClick={() => handleNavClick(link)}
                  className={`px-3.5 py-1.5 rounded-[10px] text-[14px] font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-[#111111] text-white'
                      : 'text-[#111111] hover:bg-[#ecedee]'
                  }`}
                >
                  {link.label}
                  {link.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                      isActive 
                        ? 'bg-[#000aff] text-white' 
                        : link.badge === 'Con Carrito' 
                          ? 'bg-[#e5e7ff] text-[#000aff]' 
                          : 'bg-[#ecedee] text-[#737780]'
                    }`}>
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Search trigger */}
          <button
            onClick={onSearchClick}
            className="p-2 sm:px-3 sm:py-2 rounded-[10px] border border-[#ecedee] hover:bg-[#ecedee] text-[#111111] text-[13px] flex items-center gap-2 transition-colors cursor-pointer"
            title="Buscar perfume por nombre, marca o nota"
          >
            <Search className="w-4 h-4 text-[#737780]" />
            <span className="hidden md:inline text-[#737780]">Buscar en catálogo...</span>
          </button>

          {/* WhatsApp Quick Link */}
          <a
            href={`https://wa.me/${(settings.whatsapp_number || '573105964755').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hola SHINE Fragancias, deseo consultar información sobre el catálogo.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 sm:px-3 sm:py-2 rounded-[10px] bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] text-[13px] font-medium flex items-center gap-1.5 transition-colors"
            title="Contactar vía WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline font-mono">WhatsApp</span>
          </a>

          {/* Shopping Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative px-3 py-2 sm:px-4 sm:py-2 rounded-[10px] bg-[#111111] hover:bg-[#222222] text-white text-[13px] font-medium flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Ver carrito de compras (Inspiraciones)"
          >
            <ShoppingBag className="w-4 h-4 text-white" />
            <span className="hidden sm:inline font-mono">Carrito</span>
            {totalCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-mono font-bold bg-[#000aff] text-white rounded-full min-w-5 h-5 animate-pulse">
                {totalCount}
              </span>
            )}
          </button>

          {/* Admin Panel Access Button */}
          <button
            onClick={onOpenAdmin}
            className="p-2 rounded-[10px] border border-[#ecedee] hover:bg-[#ecedee] text-[#737780] hover:text-[#111111] transition-colors cursor-pointer"
            title="Panel de Administración"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 lg:hidden rounded-[10px] border border-[#ecedee] text-[#111111]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#ecedee] bg-white px-4 pt-3 pb-6 space-y-2 animate-fadeIn">
          {navLinks.map((link, idx) => (
            <button
              key={idx}
              onClick={() => handleNavClick(link)}
              className="w-full text-left px-3 py-2.5 rounded-[10px] text-[15px] font-medium text-[#111111] hover:bg-[#ecedee] flex items-center justify-between"
            >
              <span>{link.label}</span>
              {link.badge && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                  link.badge === 'Con Carrito' ? 'bg-[#e5e7ff] text-[#000aff]' : 'bg-[#ecedee] text-[#737780]'
                }`}>
                  {link.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

