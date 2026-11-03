import React, { useState, useEffect } from 'react';
import { CartProvider } from './context/CartContext';
import { fetchSettings, fetchProducts } from './services/api';
import Header from './components/Header';
import Hero from './components/Hero';
import CategoriesSection from './components/CategoriesSection';
import PresentationsSection from './components/PresentationsSection';
import CatalogSection from './components/CatalogSection';
import EditorialStory from './components/EditorialStory';
import ProductDetailModal from './components/ProductDetailModal';
import CartDrawer from './components/CartDrawer';
import AdminPanel from './components/AdminPanel';
import Footer from './components/Footer';

export default function App() {
  const [settings, setSettings] = useState(null);
  const [products, setProducts] = useState([]);
  const [allBrands, setAllBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de navegación del catálogo
  const [activeCategory, setActiveCategory] = useState('Inspiraciones');
  const [activeSubcategory, setActiveSubcategory] = useState(null);

  // Modales
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Carga inicial
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [settData, prodData] = await Promise.all([
        fetchSettings(),
        fetchProducts({ status: 'publicado', limit: 'all' })
      ]);
      setSettings(settData);
      if (prodData && prodData.data) {
        setProducts(prodData.data);
        setAllBrands(prodData.brands || []);
      }
    } catch (e) {
      console.error('Error loading initial app data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectCategory = (cat) => {
    setActiveCategory(cat);
    setActiveSubcategory(null);
    const catEl = document.getElementById('catalogo');
    if (catEl) catEl.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectSubcategory = (subcat) => {
    setActiveCategory('Inspiraciones');
    setActiveSubcategory(subcat);
    const catEl = document.getElementById('catalogo');
    if (catEl) catEl.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenSearch = () => {
    const catEl = document.getElementById('catalogo');
    if (catEl) {
      catEl.scrollIntoView({ behavior: 'smooth' });
      // Dar foco al buscador
      setTimeout(() => {
        const input = document.querySelector('#catalogo input[type="text"]');
        if (input) input.focus();
      }, 400);
    }
  };

  return (
    <CartProvider initialSettings={settings}>
      <div className="min-h-screen bg-white text-[#111111] flex flex-col font-sans selection:bg-[#000aff] selection:text-white">
        {/* Navigation Bar */}
        <Header
          onOpenAdmin={() => setIsAdminOpen(true)}
          onSearchClick={handleOpenSearch}
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
        />

        {/* Hero Section */}
        <Hero
          products={products}
          settings={settings}
          onExploreInspirations={() => handleSelectCategory('Inspiraciones')}
          onExploreOriginals={() => handleSelectCategory('Originales')}
          onOpenProductDetail={(prod) => setSelectedProduct(prod)}
        />

        {/* Categories & Subcategories Section */}
        <CategoriesSection
          onSelectCategory={handleSelectCategory}
          onSelectSubcategory={handleSelectSubcategory}
        />

        {/* Official Presentations & Pricing Section */}
        <PresentationsSection />

        {/* Main Interactive Catalog */}
        <CatalogSection
          products={products}
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
          activeSubcategory={activeSubcategory}
          onSelectSubcategory={setActiveSubcategory}
          onOpenProductDetail={(prod) => setSelectedProduct(prod)}
          allBrands={allBrands}
        />

        {/* Editorial & Craftsmanship Story */}
        <EditorialStory />

        {/* Footer */}
        <Footer
          onSelectCategory={handleSelectCategory}
          onOpenAdmin={() => setIsAdminOpen(true)}
        />

        {/* Modals & Drawers */}
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />

        <CartDrawer />

        <AdminPanel
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          onRefreshCatalog={loadData}
        />
      </div>
    </CartProvider>
  );
}
