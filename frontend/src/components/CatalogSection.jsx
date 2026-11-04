import React, { useState, useMemo } from 'react';
import { Search, Filter, Sparkles, MessageCircle, ShoppingBag, Eye, X, ArrowUpDown } from 'lucide-react';
import { useCart } from '../context/CartContext';

// Clases de estilo con color distintivo y elegante para cada género
const getGenderBadgeClasses = (gender) => {
  const g = gender || 'Unisex';
  if (g === 'Mujer') {
    return 'bg-rose-50/90 text-rose-700 border-rose-200/80';
  }
  if (g === 'Hombre') {
    return 'bg-blue-50/90 text-blue-700 border-blue-200/80';
  }
  return 'bg-purple-50/90 text-purple-700 border-purple-200/80';
};

export default function CatalogSection({
  products,
  activeCategory,
  onSelectCategory,
  activeSubcategory,
  onSelectSubcategory,
  onOpenProductDetail,
  allBrands = []
}) {
  const { getWhatsAppAvailabilityUrl, getPriceForPresentation } = useCart();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [sortOption, setSortOption] = useState('brand_asc');
  const [displayLimit, setDisplayLimit] = useState(24);

  // Filtrado reactivo de alta velocidad
  const filteredProducts = useMemo(() => {
    let list = products || [];

    // Filtro por Categoría
    if (activeCategory === 'Inspiraciones') {
      list = list.filter(p => p.category === 'Inspiraciones' || !p.category || p.category === 'Originales');
    } else if (activeCategory === 'Originales') {
      // Los perfumes de inspiración y originales son los mismos
      list = list.filter(p => p.category === 'Inspiraciones' || p.category === 'Originales' || !p.category);
    } else if (activeCategory === 'Perfumería 1.1') {
      // Configurado mediante el panel administrativo
      list = list.filter(p => p.category === 'Perfumería 1.1');
    } else if (activeCategory) {
      list = list.filter(p => p.category === activeCategory);
    }

    // Filtro por Subcategoría (solo aplica a Inspiraciones)
    if (activeCategory === 'Inspiraciones' && activeSubcategory) {
      if (activeSubcategory === 'pendiente') {
        list = list.filter(p => !p.subcategory);
      } else {
        list = list.filter(p => p.subcategory === activeSubcategory);
      }
    }

    // Filtro por Marca
    if (selectedBrand) {
      list = list.filter(p => p.brand === selectedBrand);
    }

    // Filtro por Género (Hombre y Mujer incluyen fragancias Unisex para catálogo inclusivo)
    if (selectedGender === 'Hombre') {
      list = list.filter(p => p.gender === 'Hombre' || p.gender === 'Unisex');
    } else if (selectedGender === 'Mujer') {
      list = list.filter(p => p.gender === 'Mujer' || p.gender === 'Unisex');
    } else if (selectedGender === 'Unisex') {
      list = list.filter(p => p.gender === 'Unisex');
    }

    // Búsqueda textual
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.olfactory_family && p.olfactory_family.toLowerCase().includes(q)) ||
        (p.raw_inspiracion && p.raw_inspiracion.toLowerCase().includes(q))
      );
    }

    // Ordenamiento
    const sorted = [...list];
    if (sortOption === 'brand_asc') {
      sorted.sort((a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name));
    } else if (sortOption === 'name_asc') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === 'name_desc') {
      sorted.sort((a, b) => b.name.localeCompare(a.name));
    }

    return sorted;
  }, [products, activeCategory, activeSubcategory, selectedBrand, selectedGender, searchTerm, sortOption]);

  const displayedProducts = filteredProducts.slice(0, displayLimit);

  // Marcas únicas disponibles según la categoría seleccionada
  const availableBrands = useMemo(() => {
    let list = products || [];
    if (activeCategory === 'Inspiraciones' || activeCategory === 'Originales') {
      list = list.filter(p => p.category === 'Inspiraciones' || p.category === 'Originales' || !p.category);
    } else if (activeCategory === 'Perfumería 1.1') {
      list = list.filter(p => p.category === 'Perfumería 1.1');
    } else if (activeCategory) {
      list = list.filter(p => p.category === activeCategory);
    }
    return Array.from(new Set(list.map(p => p.brand))).filter(Boolean).sort();
  }, [products, activeCategory]);

  return (
    <section id="catalogo" className="py-20 bg-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#ecedee]">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#000aff]"></span>
              <span className="text-[12px] font-mono text-[#000aff] uppercase tracking-wider font-semibold">
                Catálogo General SHINE 2026
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#111111] tracking-[-0.04em]">
              {activeCategory ? `colección ${activeCategory.toLowerCase()}` : 'todas las fragancias'}
            </h2>
            <p className="text-[14px] text-[#737780]">
              Mostrando {filteredProducts.length} referencias de perfumería auténtica y de autor.
            </p>
          </div>

          {/* Category Pills (Tabs principales) */}
          <div className="flex flex-wrap items-center gap-2">
            {['Inspiraciones', 'Originales', 'Perfumería 1.1'].map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    onSelectCategory(cat);
                    setDisplayLimit(24);
                  }}
                  className={`px-4 py-2 rounded-[10px] text-[13px] font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#111111] text-white shadow-sm'
                      : 'bg-[#ecedee] text-[#111111] hover:bg-[#d7d7d7]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Subcategory sub-tabs (solo visibles si activeCategory === 'Inspiraciones') */}
        {activeCategory === 'Inspiraciones' && (
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#ecedee] rounded-[10px] w-fit">
            <button
              onClick={() => {
                onSelectSubcategory(null);
                setDisplayLimit(24);
              }}
              className={`px-3 py-1.5 rounded-[8px] text-[12px] font-mono font-medium transition-all cursor-pointer ${
                !activeSubcategory ? 'bg-white text-[#111111] shadow-sm' : 'text-[#737780] hover:text-[#111111]'
              }`}
            >
              Todas las Subcategorías
            </button>
            {['Árabes', 'Nicho', 'Diseñador'].map(sub => (
              <button
                key={sub}
                onClick={() => {
                  onSelectSubcategory(sub);
                  setDisplayLimit(24);
                }}
                className={`px-3 py-1.5 rounded-[8px] text-[12px] font-mono font-medium transition-all cursor-pointer ${
                  activeSubcategory === sub ? 'bg-white text-[#000aff] font-bold shadow-sm' : 'text-[#737780] hover:text-[#111111]'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#737780] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar perfume, casa o nota..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setDisplayLimit(24);
              }}
              className="w-full pl-9 pr-4 py-2.5 bg-[#ecedee] rounded-[10px] text-[13px] text-[#111111] placeholder-[#737780] focus:outline-none focus:ring-1 focus:ring-[#000aff]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737780] hover:text-[#111111]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Brand Filter */}
          <div>
            <select
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setDisplayLimit(24);
              }}
              className="w-full px-3 py-2.5 bg-[#ecedee] rounded-[10px] text-[13px] text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#000aff]"
            >
              <option value="">Todas las Casas ({availableBrands.length})</option>
              {availableBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div>
            <select
              value={selectedGender}
              onChange={(e) => {
                setSelectedGender(e.target.value);
                setDisplayLimit(24);
              }}
              className="w-full px-3 py-2.5 bg-[#ecedee] rounded-[10px] text-[13px] text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#000aff]"
            >
              <option value="">Todos los Géneros</option>
              <option value="Hombre">Hombre (incluye Unisex)</option>
              <option value="Mujer">Mujer (incluye Unisex)</option>
              <option value="Unisex">Solo Unisex</option>
            </select>
          </div>

          {/* Sort Option */}
          <div>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#ecedee] rounded-[10px] text-[13px] text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#000aff]"
            >
              <option value="brand_asc">Ordenar por Casa (A-Z)</option>
              <option value="name_asc">Ordenar por Perfume (A-Z)</option>
              <option value="name_desc">Ordenar por Perfume (Z-A)</option>
            </select>
          </div>
        </div>

        {/* Active Filters Reset */}
        {(searchTerm || selectedBrand || selectedGender || (activeCategory === 'Inspiraciones' && activeSubcategory)) && (
          <div className="flex items-center gap-2 text-[12px] text-[#737780]">
            <span>Filtros activos:</span>
            {searchTerm && <span className="px-2 py-0.5 rounded bg-[#ecedee] text-[#111] font-mono">Texto: "{searchTerm}"</span>}
            {selectedBrand && <span className="px-2 py-0.5 rounded bg-[#ecedee] text-[#111] font-mono">Casa: {selectedBrand}</span>}
            {selectedGender && (
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${getGenderBadgeClasses(selectedGender)}`}>
                Género: {selectedGender}
              </span>
            )}
            {activeSubcategory && <span className="px-2 py-0.5 rounded bg-[#ecedee] text-[#111] font-mono">Subcat: {activeSubcategory}</span>}
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedBrand('');
                setSelectedGender('');
                onSelectSubcategory(null);
              }}
              className="text-[#000aff] hover:underline ml-2 cursor-pointer font-medium"
            >
              Limpiar todos
            </button>
          </div>
        )}

        {/* Products Grid (Standard Product Card according to DESIGN.md) */}
        {displayedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayedProducts.map((p) => {
              const currentCategory = activeCategory || p.category || 'Inspiraciones';
              const isInspiracion = currentCategory === 'Inspiraciones';
              const isOriginal = currentCategory === 'Originales';
              const is11 = currentCategory === 'Perfumería 1.1';
              const hasPhoto = Boolean(p.image_url);
              const productWithContext = { ...p, displayCategory: currentCategory };

              // Initials for Brand Thumbnail (40x40 white square)
              const brandInitials = (p.brand || 'SH')
                .split(' ')
                .map(w => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <div
                  key={p.id}
                  className="group bg-[#ecedee] rounded-[10px] p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-md border border-transparent hover:border-[#a1a4aa]/40 relative"
                >
                  {/* Status Badge (DESIGN.md: 30px pill, top-left offset 12px) */}
                  <div className="absolute top-4 left-4 z-10">
                    {isInspiracion && (
                      <span className="px-2.5 py-1 rounded-full bg-[#000aff] text-white text-[11px] font-mono font-semibold">
                        Inspiración
                      </span>
                    )}
                    {isOriginal && (
                      <span className="px-2.5 py-1 rounded-full bg-[#111111] text-white text-[11px] font-mono font-semibold">
                        Original • Por Encargo
                      </span>
                    )}
                    {is11 && (
                      <span className="px-2.5 py-1 rounded-full bg-[#444955] text-white text-[11px] font-mono font-semibold">
                        1.1 • Por Encargo
                      </span>
                    )}
                  </div>

                  {/* Gender pill top right */}
                  <div className="absolute top-4 right-4 z-10">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold backdrop-blur-md shadow-xs border transition-colors ${getGenderBadgeClasses(p.gender)}`}>
                      {p.gender || 'Unisex'}
                    </span>
                  </div>

                  {/* Product Image Frame */}
                  <div 
                    onClick={() => onOpenProductDetail(productWithContext)}
                    className="relative aspect-square w-full my-6 flex items-center justify-center cursor-pointer overflow-hidden"
                  >
                    {hasPhoto ? (
                      <img
                        src={p.image_url}
                        alt={`${p.name} - ${p.brand}`}
                        loading="lazy"
                        decoding="async"
                        className="max-h-[85%] max-w-[85%] object-contain transition-transform duration-500 group-hover:scale-108 mix-blend-multiply"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = './uploads/system/presentaciones_shine.jpg';
                        }}
                      />
                    ) : (
                      // Elegante presentación cuando la fotografía específica del frasco está en proceso de verificación
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                        <img 
                          src="./uploads/system/presentaciones_shine.jpg" 
                          alt="Presentación SHINE"
                          loading="lazy"
                          decoding="async"
                          className="max-h-[75%] object-contain opacity-70 group-hover:opacity-90 transition-opacity"
                        />
                        <span className="text-[10px] font-mono text-[#737780] pt-1">
                          Presentación SHINE Fragancias
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Metadata Cluster (DESIGN.md: 40x40 brand thumbnail leading) */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3">
                      {/* Brand Logo Thumbnail 40x40 */}
                      <div className="w-10 h-10 rounded-[8px] bg-white border border-[#ecedee] flex items-center justify-center text-[12px] font-mono font-bold text-[#111111] shrink-0 shadow-sm overflow-hidden p-1.5 transition-transform group-hover:scale-105">
                        {p.brand_logo_url ? (
                          <img 
                            src={p.brand_logo_url} 
                            alt={p.brand} 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              e.target.parentElement.innerText = brandInitials;
                            }}
                          />
                        ) : (
                          brandInitials
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 
                          onClick={() => onOpenProductDetail(productWithContext)}
                          className="text-[15px] font-semibold text-[#111111] truncate tracking-tight hover:text-[#000aff] cursor-pointer"
                          title={p.name}
                        >
                          {p.name}
                        </h4>
                        <p className="text-[12px] font-mono text-[#737780] truncate">
                          By {p.brand}
                        </p>
                      </div>
                    </div>

                    {/* Olfactory description tag */}
                    {p.olfactory_family && (
                      <p className="text-[11px] font-mono text-[#444955] bg-white/60 px-2 py-1 rounded-[6px] truncate">
                        {p.olfactory_family}
                      </p>
                    )}

                    {/* Commercial Actions & Prices */}
                    <div className="pt-2 border-t border-[#d7d7d7]/60 flex items-center justify-between">
                      {isInspiracion ? (
                        <>
                          <div>
                            <span className="text-[10px] font-mono text-[#737780] block">Desde</span>
                            <span className="text-[13px] font-mono font-bold text-[#111111]">
                              ${(getPriceForPresentation ? getPriceForPresentation('30ml') : 50000).toLocaleString('es-CO')} COP
                            </span>
                          </div>
                          <button
                            onClick={() => onOpenProductDetail(productWithContext)}
                            className="px-3 py-1.5 rounded-[10px] bg-[#000aff] hover:bg-[#0008cc] text-white text-[12px] font-medium flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Elegir</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <div>
                            <span className="text-[10px] font-mono text-[#737780] block">Bajo Encargo</span>
                            <span className="text-[12px] font-mono font-medium text-[#111111]">
                              {isOriginal ? 'Pieza Original' : 'Edición 1.1'}
                            </span>
                          </div>
                          <a
                            href={getWhatsAppAvailabilityUrl(productWithContext)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-[10px] bg-[#111111] hover:bg-[#222222] text-white text-[12px] font-medium flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                            <span>Consultar</span>
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-20 bg-[#ecedee] rounded-[10px] space-y-4">
            <p className="text-xl font-semibold text-[#111111]">No se encontraron perfumes coincidentes</p>
            <p className="text-[13px] text-[#737780] max-w-md mx-auto">
              Intenta cambiar los términos de búsqueda o seleccionar otra casa de perfumería.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedBrand('');
                setSelectedGender('');
                onSelectSubcategory(null);
              }}
              className="px-4 py-2 rounded-[10px] bg-[#111111] text-white text-[13px]"
            >
              Restablecer Filtros
            </button>
          </div>
        )}

        {/* Load More Button (See All according to DESIGN.md) */}
        {filteredProducts.length > displayLimit && (
          <div className="pt-6 text-center">
            <button
              onClick={() => setDisplayLimit(prev => prev + 24)}
              className="w-full max-w-md mx-auto py-3.5 rounded-[10px] bg-white border border-[#ecedee] hover:bg-[#ecedee] text-[#111111] text-[14px] font-medium transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)] cursor-pointer"
            >
              Cargar más fragancias (Mostrando {displayedProducts.length} de {filteredProducts.length})
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

