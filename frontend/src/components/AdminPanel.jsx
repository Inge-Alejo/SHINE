import React, { useState, useEffect } from 'react';
import { 
  X, Lock, ShieldCheck, Database, RefreshCw, Settings, Image as ImageIcon, 
  Plus, Edit, Trash2, CheckCircle2, AlertTriangle, ExternalLink, Sparkles, 
  Upload, Search, Eye, LogOut, Bot, CheckSquare, Square, Play, Pause, Zap,
  ChevronLeft, ChevronRight, Link as LinkIcon, ImagePlus
} from 'lucide-react';
import { 
  adminLogin, fetchDashboard, updateCommercialSettings, createProduct, 
  updateProduct, deleteProduct, fetchProducts,
  fetchPendingImages, uploadProductImage, approveImageCandidate,
  assignProductImageUrl, removeProductImage,
  enrichWithGemini, batchEnrichWithGemini, getGeminiBottleReference
} from '../services/api';
import { useCart } from '../context/CartContext';

export default function AdminPanel({ isOpen, onClose, onRefreshCatalog }) {
  const { settings, updateSettings } = useCart();

  // Estados de Auth
  const [token, setToken] = useState(() => sessionStorage.getItem('shine_admin_token') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Tabs del panel: 'dashboard', 'products', 'commercial', 'gemini', 'images'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Datos del Dashboard
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  // Gestión de Productos
  const [adminProducts, setAdminProducts] = useState([]);
  const [isLoadingProds, setIsLoadingProds] = useState(false);
  const [prodSearch, setProdSearch] = useState('');
  const [prodCategoryFilter, setProdCategoryFilter] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    brand: '',
    category: 'Inspiraciones',
    subcategory: 'Diseñador',
    description: '',
    olfactory_family: '',
    gender: 'Unisex',
    image_url: '',
    status: 'publicado'
  });

  // Configuración Comercial Form
  const [commForm, setCommForm] = useState({
    whatsapp_number: settings.whatsapp_number || '573105964755',
    whatsapp_display: settings.whatsapp_display || '+57 310 5964755',
    price_30ml: settings.prices?.['30ml'] || 17000,
    price_60ml: settings.prices?.['60ml'] || 24000,
    price_100ml: settings.prices?.['100ml'] || 37000
  });
  const [commSuccess, setCommSuccess] = useState('');

  // Paginación y escalabilidad del catálogo
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50); // 25, 50, 100, 250, 500, 'all'

  // Selección múltiple para automatización IA
  const [selectedProdIds, setSelectedProdIds] = useState([]);
  const [filterImageStatus, setFilterImageStatus] = useState('all'); // 'all', 'with_image', 'without_image'
  const [filterNotesStatus, setFilterNotesStatus] = useState('all'); // 'all', 'with_notes', 'without_notes'

  // Automatización Gemini IA & Scraping
  const [isAiRunning, setIsAiRunning] = useState(false);
  const [aiProgress, setAiProgress] = useState({ current: 0, total: 0, currentName: '', status: '' });
  const [singleEnrichingId, setSingleEnrichingId] = useState(null);
  const [aiLogs, setAiLogs] = useState([]);

  // Imágenes
  const [pendingImagesData, setPendingImagesData] = useState({ products_without_image: [], image_candidates: [] });
  const [uploadSelectedProduct, setUploadSelectedProduct] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadNotes, setUploadNotes] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Buscador, Asignador Rápido y Vista Previa de Imágenes
  const [imgUrlInput, setImgUrlInput] = useState('');
  const [imgSearchTerm, setImgSearchTerm] = useState('');
  const [imgFilterTab, setImgFilterTab] = useState('without_image'); // 'without_image', 'all', 'with_image'
  const [bottleReferenceData, setBottleReferenceData] = useState(null);
  const [isLoadingBottleRef, setIsLoadingBottleRef] = useState(false);
  const [isAssigningUrl, setIsAssigningUrl] = useState(false);

  // Cargar datos al abrir o loguear
  useEffect(() => {
    if (isOpen && token) {
      loadDashboardData();
      loadPendingImages();
      loadAdminProducts();
    }
  }, [isOpen, token, activeTab]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError('');
    try {
      const res = await adminLogin(username, password);
      if (res.success && res.token) {
        setToken(res.token);
        sessionStorage.setItem('shine_admin_token', res.token);
        setPassword('');
      } else {
        setAuthError(res.error || 'Credenciales inválidas');
      }
    } catch (err) {
      setAuthError('Error al contactar con el backend PHP');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    sessionStorage.removeItem('shine_admin_token');
  };

  const loadDashboardData = async () => {
    if (!token) return;
    setIsLoadingDashboard(true);
    try {
      const res = await fetchDashboard(token);
      if (res.success) {
        setDashboardData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  // Fin de carga de dashboard

  const loadPendingImages = async () => {
    if (!token) return;
    try {
      const res = await fetchPendingImages(token);
      if (res.success) {
        setPendingImagesData(res);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadAdminProducts = async () => {
    if (!token) return;
    setIsLoadingProds(true);
    try {
      const res = await fetchProducts({ limit: 'all', status: 'all' });
      if (res && res.data) {
        setAdminProducts(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingProds(false);
    }
  };

  // Alternar rápidamente un perfume entre Inspiraciones y Perfumería 1.1
  const handleToggle11 = async (p) => {
    const newCategory = p.category === 'Perfumería 1.1' ? 'Inspiraciones' : 'Perfumería 1.1';
    try {
      const res = await updateProduct(token, p.id, {
        ...p,
        category: newCategory
      });
      if (res.success) {
        setAdminProducts(prev => prev.map(item => item.id === p.id ? { ...item, category: newCategory } : item));
        loadDashboardData();
        if (onRefreshCatalog) onRefreshCatalog();
      } else {
        alert(res.error || 'Error al actualizar');
      }
    } catch (e) {
      alert('Error de conexión al actualizar categoría');
    }
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name || '',
      brand: prod.brand || '',
      category: prod.category || 'Inspiraciones',
      subcategory: prod.subcategory || 'Diseñador',
      description: prod.description || '',
      olfactory_family: prod.olfactory_family || '',
      gender: prod.gender || 'Unisex',
      image_url: prod.image_url || '',
      status: prod.status || 'publicado'
    });
    setIsCreatingProduct(true);
  };

  const handleOpenNewProduct = (defaultCategory = 'Perfumería 1.1') => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      brand: '',
      category: defaultCategory,
      subcategory: defaultCategory === 'Inspiraciones' ? 'Diseñador' : '',
      description: '',
      olfactory_family: '',
      gender: 'Unisex',
      image_url: '',
      status: 'publicado'
    });
    setIsCreatingProduct(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        const res = await updateProduct(token, editingProduct.id, productForm);
        if (res.success) {
          alert('Perfume actualizado correctamente en la base de datos');
          setIsCreatingProduct(false);
          setEditingProduct(null);
          loadAdminProducts();
          loadDashboardData();
          if (onRefreshCatalog) onRefreshCatalog();
        } else {
          alert(res.error || 'Error al actualizar');
        }
      } else {
        const res = await createProduct(token, productForm);
        if (res.success) {
          alert('Nuevo perfume creado exitosamente');
          setIsCreatingProduct(false);
          loadAdminProducts();
          loadDashboardData();
          if (onRefreshCatalog) onRefreshCatalog();
        } else {
          alert(res.error || 'Error al crear');
        }
      }
    } catch (e) {
      alert('Error al guardar el perfume');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este perfume del catálogo?')) return;
    try {
      const res = await deleteProduct(token, id);
      if (res.success) {
        setAdminProducts(prev => prev.filter(p => p.id !== id));
        loadDashboardData();
        if (onRefreshCatalog) onRefreshCatalog();
      }
    } catch (e) {
      alert('Error al eliminar perfume');
    }
  };

  // Guardar configuración comercial
  const handleSaveCommercial = async (e) => {
    e.preventDefault();
    setCommSuccess('');
    try {
      const res = await updateCommercialSettings(token, commForm);
      if (res.success) {
        setCommSuccess('Tarifas y WhatsApp actualizados en base de datos correctamente');
        updateSettings({
          whatsapp_number: commForm.whatsapp_number,
          whatsapp_display: commForm.whatsapp_display,
          prices: {
            '30ml': parseInt(commForm.price_30ml, 10),
            '60ml': parseInt(commForm.price_60ml, 10),
            '100ml': parseInt(commForm.price_100ml, 10)
          }
        });
        setTimeout(() => setCommSuccess(''), 4000);
      }
    } catch (e) {
      alert('Error al guardar configuración comercial');
    }
  };

  // Alternar selección de un perfume con checkbox
  const handleToggleSelectProduct = (id) => {
    setSelectedProdIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Seleccionar / Deseleccionar todos los mostrados
  const handleSelectAllProducts = (list) => {
    const listIds = list.map(p => p.id);
    const allSelected = listIds.length > 0 && listIds.every(id => selectedProdIds.includes(id));
    if (allSelected) {
      setSelectedProdIds(prev => prev.filter(id => !listIds.includes(id)));
    } else {
      setSelectedProdIds(prev => Array.from(new Set([...prev, ...listIds])));
    }
  };

  // Enriquecer un solo producto con Gemini IA
  const handleEnrichSingle = async (prod) => {
    setSingleEnrichingId(prod.id);
    try {
      const res = await enrichWithGemini(token, {
        perfume_name: prod.name,
        brand: prod.brand,
        product_id: prod.id
      });
      if (res.success && res.data) {
        setAdminProducts(prev => prev.map(p => p.id === prod.id ? {
          ...p,
          olfactory_family: res.data.olfactory_family,
          description: res.data.description,
          gender: res.data.gender || p.gender
        } : p));
        setAiLogs(prev => [
          { time: new Date().toLocaleTimeString(), name: prod.name, status: 'success', details: res.data.olfactory_family },
          ...prev.slice(0, 49)
        ]);
        alert(`¡Ficha técnica generada con Gemini IA para ${prod.name}!\n\nFamilia: ${res.data.olfactory_family}\nSalida: ${res.data.top_notes || 'N/A'}`);
        if (onRefreshCatalog) onRefreshCatalog();
      } else {
        alert(res.error || 'No se pudo obtener información con Gemini IA');
      }
    } catch (e) {
      alert('Error de conexión con el servicio de Gemini IA');
    } finally {
      setSingleEnrichingId(null);
    }
  };

  // Procesar seleccionados con Gemini IA
  const handleProcessSelectedAi = async () => {
    if (selectedProdIds.length === 0) {
      alert('Selecciona al menos un perfume de la lista con la casilla de verificación.');
      return;
    }

    const itemsToProcess = adminProducts.filter(p => selectedProdIds.includes(p.id));
    if (!confirm(`¿Deseas procesar ${itemsToProcess.length} perfume(s) seleccionados con Gemini IA para obtener notas olfativas y descripción?`)) return;

    setIsAiRunning(true);
    setAiProgress({ current: 0, total: itemsToProcess.length, currentName: '', status: 'Iniciando...' });

    let successCount = 0;

    for (let i = 0; i < itemsToProcess.length; i++) {
      const p = itemsToProcess[i];
      setAiProgress({
        current: i + 1,
        total: itemsToProcess.length,
        currentName: `${p.name} (${p.brand})`,
        status: `Analizando ${i + 1} de ${itemsToProcess.length}...`
      });

      try {
        const res = await enrichWithGemini(token, {
          perfume_name: p.name,
          brand: p.brand,
          product_id: p.id
        });

        if (res.success && res.data) {
          successCount++;
          setAdminProducts(prev => prev.map(item => item.id === p.id ? {
            ...item,
            olfactory_family: res.data.olfactory_family,
            description: res.data.description,
            gender: res.data.gender || item.gender
          } : item));

          setAiLogs(prev => [
            { time: new Date().toLocaleTimeString(), name: p.name, status: 'success', details: res.data.olfactory_family },
            ...prev.slice(0, 49)
          ]);
        }
      } catch (err) {
        setAiLogs(prev => [
          { time: new Date().toLocaleTimeString(), name: p.name, status: 'error', details: err.message },
          ...prev.slice(0, 49)
        ]);
      }

      await new Promise(r => setTimeout(r, 250));
    }

    setIsAiRunning(false);
    setSelectedProdIds([]);
    loadDashboardData();
    if (onRefreshCatalog) onRefreshCatalog();
    alert(`¡Proceso IA completado! ${successCount} de ${itemsToProcess.length} perfumes enriquecidos exitosamente.`);
  };

  // Procesar todo el catálogo completo que esté pendiente
  const handleProcessAllCatalogAi = async () => {
    const pending = adminProducts.filter(p => !p.olfactory_family || p.olfactory_family.length < 5 || !p.description);
    const targetList = pending.length > 0 ? pending : adminProducts;

    if (!confirm(`¿Iniciar escaneo y enriquecimiento con IA para ${targetList.length} perfumes? Las notas olfativas y descripciones se guardarán directamente en la base de datos.`)) return;

    setIsAiRunning(true);
    setAiProgress({ current: 0, total: targetList.length, currentName: '', status: 'Iniciando escaneo masivo...' });

    let successCount = 0;

    for (let i = 0; i < targetList.length; i++) {
      const p = targetList[i];
      setAiProgress({
        current: i + 1,
        total: targetList.length,
        currentName: `${p.name} (${p.brand})`,
        status: `Escaneando e indexando ${i + 1} de ${targetList.length}...`
      });

      try {
        const res = await enrichWithGemini(token, {
          perfume_name: p.name,
          brand: p.brand,
          product_id: p.id
        });

        if (res.success && res.data) {
          successCount++;
          setAdminProducts(prev => prev.map(item => item.id === p.id ? {
            ...item,
            olfactory_family: res.data.olfactory_family,
            description: res.data.description,
            gender: res.data.gender || item.gender
          } : item));

          setAiLogs(prev => [
            { time: new Date().toLocaleTimeString(), name: p.name, status: 'success', details: res.data.olfactory_family },
            ...prev.slice(0, 49)
          ]);
        }
      } catch (err) {
        setAiLogs(prev => [
          { time: new Date().toLocaleTimeString(), name: p.name, status: 'error', details: err.message },
          ...prev.slice(0, 49)
        ]);
      }

      await new Promise(r => setTimeout(r, 250));
    }

    setIsAiRunning(false);
    loadDashboardData();
    if (onRefreshCatalog) onRefreshCatalog();
    alert(`¡Scraping IA masivo finalizado! ${successCount} perfumes enriquecidos y guardados en Neon Postgres.`);
  };

  // Subir imagen
  const handleUploadImageSubmit = async (e) => {
    e.preventDefault();
    if (!uploadSelectedProduct || !uploadFile) {
      alert('Selecciona un producto y un archivo de imagen');
      return;
    }
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('product_id', uploadSelectedProduct);
      formData.append('image', uploadFile);
      formData.append('notes', uploadNotes);
      formData.append('source_name', 'Carga Directa Admin');

      const res = await uploadProductImage(token, formData);
      if (res.success) {
        alert('Fotografía asignada correctamente al perfume');
        setUploadFile(null);
        setUploadNotes('');
        loadPendingImages();
        loadDashboardData();
        if (onRefreshCatalog) onRefreshCatalog();
      } else {
        alert(res.error || 'Error al subir la imagen');
      }
    } catch (e) {
      alert('Error de subida');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Consultar ficha visual del frasco con Gemini IA
  const handleGetBottleRef = async (prod) => {
    setIsLoadingBottleRef(true);
    setBottleReferenceData(null);
    try {
      const res = await getGeminiBottleReference(token, {
        perfume_name: prod.name,
        brand: prod.brand
      });
      if (res.success && res.reference) {
        setBottleReferenceData({
          product: prod,
          reference: res.reference
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingBottleRef(false);
    }
  };

  // Asignar imagen (por URL o por Base64 de archivo) directamente a Postgres
  const handleAssignImageUrl = async (productId, url) => {
    if (!productId || !url) {
      alert('Por favor selecciona un perfume y proporciona una URL o archivo de imagen.');
      return;
    }
    setIsAssigningUrl(true);
    try {
      const res = await assignProductImageUrl(token, {
        product_id: productId,
        image_url: url,
        notes: 'Asignada desde buscador de imágenes'
      });
      if (res.success) {
        setAdminProducts(prev => prev.map(p => p.id === productId ? { ...p, image_url: url } : p));
        setImgUrlInput('');
        setUploadSelectedProduct('');
        loadDashboardData();
        loadPendingImages();
        if (onRefreshCatalog) onRefreshCatalog();
        alert('¡Fotografía asignada al perfume y guardada en Neon Postgres!');
      } else {
        alert(res.error || 'Error al asignar imagen');
      }
    } catch (e) {
      alert('Error de conexión al asignar imagen');
    } finally {
      setIsAssigningUrl(false);
    }
  };

  // Quitar imagen actual del perfume
  const handleRemoveImage = async (productId) => {
    if (!confirm('¿Deseas quitar la fotografía actual de este perfume?')) return;
    try {
      const res = await removeProductImage(token, productId);
      if (res.success) {
        setAdminProducts(prev => prev.map(p => p.id === productId ? { ...p, image_url: null } : p));
        loadDashboardData();
        loadPendingImages();
        if (onRefreshCatalog) onRefreshCatalog();
      }
    } catch (e) {
      alert('Error al quitar imagen');
    }
  };

  // Convertir archivo local seleccionado a Base64 para guardarlo directo en Postgres
  const handleFileToUrl = (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('El archivo es superior a 2MB. Te recomendamos usar imágenes optimizadas PNG de menos de 1MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImgUrlInput(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-[14.4px] w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl border border-[#ecedee] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#ecedee] bg-[#111111] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[6px] bg-[#000aff] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Panel Administrativo</h2>
              <p className="text-[11px] font-mono text-white/70">SHINE Fragancias • Gestión de Catálogo y Tarifas</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {token && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-[8px] bg-white/10 hover:bg-white/20 text-white text-[12px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auth Barrier or Main Body */}
        {!token ? (
          /* LOGIN FORM */
          <div className="p-8 sm:p-12 max-w-md mx-auto w-full space-y-6 my-auto">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#e5e7ff] text-[#000aff] flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-[#111111]">Acceso de Gestión</h3>
              <p className="text-[13px] text-[#737780]">
                Ingresa tus credenciales maestras para administrar productos, tarifas y sincronizaciones.
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-[8px] bg-red-50 border border-red-200 text-red-700 text-[13px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[12px] font-mono text-[#111111] font-semibold block mb-1">
                  Usuario Administrador:
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#ecedee] rounded-[10px] text-[14px] text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#000aff]"
                  placeholder="Ingresa tu usuario"
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="text-[12px] font-mono text-[#111111] font-semibold block mb-1">
                  Contraseña:
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#ecedee] rounded-[10px] text-[14px] text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#000aff]"
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 rounded-[10px] bg-[#000aff] hover:bg-[#0008cc] text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {isLoggingIn ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>{isLoggingIn ? 'Verificando...' : 'Iniciar Sesión'}</span>
              </button>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED PANEL CONTENT */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 bg-[#ecedee] border-r border-[#d7d7d7] p-3 flex md:flex-col gap-1 overflow-x-auto shrink-0">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: Database },
                { id: 'products', label: 'Catálogo & 1.1', icon: Sparkles },
                { id: 'commercial', label: 'Tarifas & WhatsApp', icon: Settings },
                { id: 'gemini', label: 'Gemini IA & Scraping', icon: Bot },
                { id: 'images', label: 'Gestión de Fotos', icon: ImageIcon }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3.5 py-2.5 rounded-[10px] text-[13px] font-medium flex items-center gap-2.5 transition-all text-left cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-white text-[#000aff] font-bold shadow-sm'
                        : 'text-[#444955] hover:bg-white/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-6 bg-white space-y-6">
              {/* TAB 1: DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-[#111111] tracking-tight">Resumen Ejecutivo</h3>
                      <p className="text-[13px] text-[#737780]">Métricas en tiempo real del catálogo activo y sincronizaciones.</p>
                    </div>
                    <button
                      onClick={loadDashboardData}
                      className="p-2 rounded-[8px] border border-[#ecedee] hover:bg-[#ecedee] text-[#111111] text-[12px] font-mono flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDashboard ? 'animate-spin' : ''}`} />
                      <span>Actualizar</span>
                    </button>
                  </div>

                  {dashboardData && (
                    <>
                      {/* Metric cards */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 rounded-[10px] bg-[#ecedee] border border-[#d7d7d7]/50 space-y-1">
                          <span className="text-[11px] font-mono text-[#737780] uppercase">Total Productos</span>
                          <p className="text-3xl font-mono font-bold text-[#111111]">{dashboardData.total_products}</p>
                          <span className="text-[11px] font-mono text-[#000aff]">100% Catálogo Real</span>
                        </div>

                        <div className="p-4 rounded-[10px] bg-[#ecedee] border border-[#d7d7d7]/50 space-y-1">
                          <span className="text-[11px] font-mono text-[#737780] uppercase">Inspiraciones</span>
                          <p className="text-3xl font-mono font-bold text-[#000aff]">{dashboardData.by_category?.['Inspiraciones'] || 0}</p>
                          <span className="text-[11px] font-mono text-[#737780]">Con Carrito Habilitado</span>
                        </div>

                        <div className="p-4 rounded-[10px] bg-[#ecedee] border border-[#d7d7d7]/50 space-y-1">
                          <span className="text-[11px] font-mono text-[#737780] uppercase">Bajo Encargo</span>
                          <p className="text-3xl font-mono font-bold text-[#111111]">
                            {(dashboardData.by_category?.['Originales'] || 0) + (dashboardData.by_category?.['Perfumería 1.1'] || 0)}
                          </p>
                          <span className="text-[11px] font-mono text-[#737780]">Originales y 1.1</span>
                        </div>

                        <div className="p-4 rounded-[10px] bg-[#ecedee] border border-[#d7d7d7]/50 space-y-1">
                          <span className="text-[11px] font-mono text-[#737780] uppercase">Con Fotografía</span>
                          <p className="text-3xl font-mono font-bold text-green-700">{dashboardData.with_image}</p>
                          <span className="text-[11px] font-mono text-[#737780]">
                            {dashboardData.without_image} en verificación
                          </span>
                        </div>
                      </div>

                      {/* Subcategory breakdown */}
                      <div className="p-5 rounded-[10px] border border-[#ecedee] space-y-3">
                        <h4 className="text-base font-bold text-[#111111]">Distribución por Subcategoría (Inspiraciones)</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {Object.entries(dashboardData.by_subcategory || {}).map(([subcat, count]) => (
                            <div key={subcat} className="p-3 bg-[#ecedee] rounded-[8px]">
                              <span className="text-[12px] font-mono text-[#737780] block">{subcat}</span>
                              <span className="text-xl font-mono font-bold text-[#111111]">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Estado de Automatización & Gemini IA */}
                      <div className="p-5 rounded-[10px] border border-[#ecedee] space-y-3 bg-[#ecedee]/40">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Bot className="w-5 h-5 text-[#000aff]" />
                            <h4 className="text-base font-bold text-[#111111]">Automatización & Gemini IA</h4>
                          </div>
                          <span className="text-[12px] font-mono px-3 py-1 rounded-full font-bold bg-[#e5e7ff] text-[#000aff]">
                            Activo & En Línea
                          </span>
                        </div>
                        <p className="text-[13px] text-[#444955]">
                          Catálogo Total: <strong>{dashboardData.total_products}</strong> perfumes • 
                          Con Fotografía: <strong>{dashboardData.with_image}</strong> • 
                          Pendientes de enriquecer: <strong>{dashboardData.without_image}</strong>
                        </p>
                        <div className="pt-1 flex gap-2">
                          <button
                            onClick={() => setActiveTab('gemini')}
                            className="px-3.5 py-1.5 rounded-[8px] bg-[#000aff] text-white text-[12px] font-semibold flex items-center gap-1.5 hover:bg-[#0008cc] cursor-pointer"
                          >
                            <Bot className="w-3.5 h-3.5" />
                            <span>Abrir Centro de Scraping IA</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB: CATÁLOGO Y CONFIGURACIÓN DE PERFUMERÍA 1.1 */}
              {activeTab === 'products' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ecedee]">
                    <div>
                      <h3 className="text-2xl font-bold text-[#111111] tracking-tight">Gestión de Catálogo y Perfumería 1.1</h3>
                      <p className="text-[13px] text-[#737780]">
                        Configura y personaliza qué perfumes componen el catálogo de <strong>Perfumería 1.1</strong> en tiempo real.
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenNewProduct('Perfumería 1.1')}
                      className="px-4 py-2.5 rounded-[8px] bg-[#000aff] hover:bg-[#0008cc] text-white text-[13px] font-semibold flex items-center gap-2 cursor-pointer shadow-sm self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Nuevo Perfume (1.1)</span>
                    </button>
                  </div>

                  {/* Formulario Modal de Creación / Edición */}
                  {isCreatingProduct && (
                    <div className="p-6 rounded-[12px] bg-[#ecedee]/60 border border-[#d7d7d7] space-y-4 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-bold text-[#111111]">
                          {editingProduct ? `Editar Perfume: ${editingProduct.name}` : 'Crear / Configurar Perfume'}
                        </h4>
                        <button
                          onClick={() => {
                            setIsCreatingProduct(false);
                            setEditingProduct(null);
                          }}
                          className="p-1 rounded-full hover:bg-neutral-300 text-[#111111]"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveProduct} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[12px] font-mono text-[#111111] font-semibold block mb-1">Nombre del Perfume:</label>
                          <input
                            type="text"
                            required
                            value={productForm.name}
                            onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                            className="w-full px-3 py-2 bg-white rounded-[8px] border border-[#d7d7d7] text-[13px]"
                            placeholder="Ej: SAUVAGE ELIXIR"
                          />
                        </div>

                        <div>
                          <label className="text-[12px] font-mono text-[#111111] font-semibold block mb-1">Marca o Casa:</label>
                          <input
                            type="text"
                            required
                            value={productForm.brand}
                            onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                            className="w-full px-3 py-2 bg-white rounded-[8px] border border-[#d7d7d7] text-[13px]"
                            placeholder="Ej: Dior"
                          />
                        </div>

                        <div>
                          <label className="text-[12px] font-mono text-[#111111] font-semibold block mb-1">Categoría Comercial:</label>
                          <select
                            value={productForm.category}
                            onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                            className="w-full px-3 py-2 bg-white rounded-[8px] border border-[#d7d7d7] text-[13px] font-semibold text-[#000aff]"
                          >
                            <option value="Perfumería 1.1">Perfumería 1.1 (Bajo Encargo)</option>
                            <option value="Inspiraciones">Inspiraciones (Con Carrito)</option>
                            <option value="Originales">Originales (Bajo Encargo)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[12px] font-mono text-[#111111] font-semibold block mb-1">Subcategoría:</label>
                          <select
                            value={productForm.subcategory || ''}
                            onChange={(e) => setProductForm({ ...productForm, subcategory: e.target.value })}
                            className="w-full px-3 py-2 bg-white rounded-[8px] border border-[#d7d7d7] text-[13px]"
                          >
                            <option value="Árabes">Árabes</option>
                            <option value="Nicho">Nicho</option>
                            <option value="Diseñador">Diseñador</option>
                            <option value="">Sin subcategoría</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[12px] font-mono text-[#111111] font-semibold block mb-1">Género:</label>
                          <select
                            value={productForm.gender}
                            onChange={(e) => setProductForm({ ...productForm, gender: e.target.value })}
                            className="w-full px-3 py-2 bg-white rounded-[8px] border border-[#d7d7d7] text-[13px]"
                          >
                            <option value="Unisex">Unisex</option>
                            <option value="Hombre">Hombre</option>
                            <option value="Mujer">Mujer</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[12px] font-mono text-[#111111] font-semibold block mb-1">URL de Imagen (Opcional):</label>
                          <input
                            type="text"
                            value={productForm.image_url}
                            onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                            placeholder="./uploads/products/dior-sauvage.png"
                            className="w-full px-3 py-2 bg-white rounded-[8px] border border-[#d7d7d7] text-[13px]"
                          />
                        </div>

                        <div className="sm:col-span-2 lg:col-span-3">
                          <label className="text-[12px] font-mono text-[#111111] font-semibold block mb-1">Familia Olfativa / Descripción:</label>
                          <input
                            type="text"
                            value={productForm.description}
                            onChange={(e) => setProductForm({ ...productForm, description: e.target.value, olfactory_family: e.target.value })}
                            placeholder="Ej: AMADERADO ESPECIADO AROMATICO"
                            className="w-full px-3 py-2 bg-white rounded-[8px] border border-[#d7d7d7] text-[13px]"
                          />
                        </div>

                        <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsCreatingProduct(false);
                              setEditingProduct(null);
                            }}
                            className="px-4 py-2 rounded-[8px] bg-white border border-[#d7d7d7] text-[13px] text-[#444955] cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 rounded-[8px] bg-[#111111] text-white text-[13px] font-semibold hover:bg-[#222222] cursor-pointer"
                          >
                            {editingProduct ? 'Actualizar Perfume' : 'Guardar en Catálogo'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Filtros de Búsqueda, Categoría y Control de Paginación */}
                  <div className="space-y-3">
                    <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-[#737780] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Buscar por nombre, casa o notas olfativas..."
                          value={prodSearch}
                          onChange={(e) => {
                            setProdSearch(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="w-full pl-9 pr-4 py-2 bg-[#ecedee] rounded-[8px] text-[13px] focus:outline-none focus:ring-1 focus:ring-[#000aff]"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => {
                            setProdCategoryFilter('');
                            setCurrentPage(1);
                          }}
                          className={`px-3 py-1.5 rounded-[8px] text-[12px] font-mono cursor-pointer transition-all ${
                            prodCategoryFilter === '' ? 'bg-[#111111] text-white font-bold' : 'bg-[#ecedee] text-[#444955]'
                          }`}
                        >
                          Todos ({adminProducts.length})
                        </button>

                        <button
                          onClick={() => {
                            setProdCategoryFilter('Perfumería 1.1');
                            setCurrentPage(1);
                          }}
                          className={`px-3 py-1.5 rounded-[8px] text-[12px] font-mono cursor-pointer transition-all flex items-center gap-1.5 ${
                            prodCategoryFilter === 'Perfumería 1.1' ? 'bg-[#000aff] text-white font-bold shadow-sm' : 'bg-[#ecedee] text-[#000aff]'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Perfumería 1.1 ({adminProducts.filter(p => p.category === 'Perfumería 1.1').length})</span>
                        </button>

                        <button
                          onClick={() => {
                            setProdCategoryFilter('Inspiraciones');
                            setCurrentPage(1);
                          }}
                          className={`px-3 py-1.5 rounded-[8px] text-[12px] font-mono cursor-pointer transition-all ${
                            prodCategoryFilter === 'Inspiraciones' ? 'bg-[#111111] text-white font-bold' : 'bg-[#ecedee] text-[#444955]'
                          }`}
                        >
                          Inspiraciones ({adminProducts.filter(p => p.category === 'Inspiraciones').length})
                        </button>

                        {/* Selector de volumen por página */}
                        <div className="flex items-center gap-1 bg-[#ecedee] px-2.5 py-1 rounded-[8px] text-[12px] font-mono">
                          <span className="text-[#737780]">Ver:</span>
                          <select
                            value={itemsPerPage}
                            onChange={(e) => {
                              const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10);
                              setItemsPerPage(val);
                              setCurrentPage(1);
                            }}
                            className="bg-transparent font-bold text-[#111111] cursor-pointer focus:outline-none"
                          >
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={250}>250</option>
                            <option value={500}>500</option>
                            <option value="all">Todos ({adminProducts.length})</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Barra de Acciones por Lote / Selección Múltiple */}
                    {selectedProdIds.length > 0 && (
                      <div className="p-3 bg-[#e5e7ff] border border-[#000aff]/30 rounded-[10px] flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
                        <div className="flex items-center gap-2 text-[13px] text-[#000aff] font-bold">
                          <CheckSquare className="w-4 h-4" />
                          <span>{selectedProdIds.length} perfume(s) seleccionado(s)</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={handleProcessSelectedAi}
                            disabled={isAiRunning}
                            className="px-3.5 py-1.5 rounded-[8px] bg-[#000aff] hover:bg-[#0008cc] text-white text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Procesar con IA ({selectedProdIds.length})</span>
                          </button>
                          <button
                            onClick={() => setSelectedProdIds([])}
                            className="px-3 py-1.5 rounded-[8px] bg-white border border-[#d7d7d7] text-[#444955] hover:bg-neutral-100 text-[12px] font-medium cursor-pointer"
                          >
                            Deseleccionar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tabla de Productos con Paginación y Soporte de Crecimiento Infinito */}
                  {(() => {
                    const filteredList = adminProducts.filter(p => {
                      if (prodCategoryFilter && p.category !== prodCategoryFilter) return false;
                      if (prodSearch.trim()) {
                        const q = prodSearch.toLowerCase().trim();
                        return (
                          (p.name && p.name.toLowerCase().includes(q)) ||
                          (p.brand && p.brand.toLowerCase().includes(q)) ||
                          (p.id && p.id.toLowerCase().includes(q)) ||
                          (p.olfactory_family && p.olfactory_family.toLowerCase().includes(q))
                        );
                      }
                      return true;
                    });

                    const totalItems = filteredList.length;
                    const pageSize = itemsPerPage === 'all' ? totalItems : itemsPerPage;
                    const totalPages = itemsPerPage === 'all' ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
                    const safePage = Math.min(currentPage, totalPages);
                    const startIndex = itemsPerPage === 'all' ? 0 : (safePage - 1) * pageSize;
                    const endIndex = itemsPerPage === 'all' ? totalItems : Math.min(startIndex + pageSize, totalItems);
                    const displayedList = itemsPerPage === 'all' ? filteredList : filteredList.slice(startIndex, endIndex);
                    const allCurrentSelected = displayedList.length > 0 && displayedList.every(p => selectedProdIds.includes(p.id));

                    return (
                      <div className="space-y-3">
                        {/* Selector rápido para seleccionar todo el catálogo o la página actual */}
                        <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-[#737780] px-1">
                          <div>
                            Mostrando <strong className="text-[#111111]">{totalItems === 0 ? 0 : startIndex + 1} - {endIndex}</strong> de <strong className="text-[#111111]">{totalItems}</strong> perfumes encontrados (Catálogo total: {adminProducts.length})
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                const allFilteredIds = filteredList.map(p => p.id);
                                const allIn = allFilteredIds.every(id => selectedProdIds.includes(id));
                                if (allIn) {
                                  setSelectedProdIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
                                } else {
                                  setSelectedProdIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
                                }
                              }}
                              className="text-[#000aff] hover:underline cursor-pointer font-semibold"
                            >
                              {filteredList.every(p => selectedProdIds.includes(p.id)) && filteredList.length > 0
                                ? 'Deseleccionar todos los filtrados'
                                : `Seleccionar los ${totalItems} filtrados`}
                            </button>
                          </div>
                        </div>

                        {/* Contenedor con Scroll de la Tabla */}
                        <div className="border border-[#ecedee] rounded-[10px] overflow-hidden max-h-[60vh] overflow-y-auto bg-white">
                          <table className="w-full text-left text-[12px] font-mono">
                            <thead className="bg-[#ecedee] sticky top-0 z-10">
                              <tr>
                                <th className="p-3 w-10 text-center">
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4 cursor-pointer accent-[#000aff]"
                                    checked={allCurrentSelected}
                                    onChange={() => handleSelectAllProducts(displayedList)}
                                    title="Seleccionar / deseleccionar los visibles en esta página"
                                  />
                                </th>
                                <th className="p-3">Perfume</th>
                                <th className="p-3">Casa</th>
                                <th className="p-3">Notas Olfativas IA</th>
                                <th className="p-3">Categoría</th>
                                <th className="p-3 text-center">Config 1.1</th>
                                <th className="p-3 text-right">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {displayedList.length === 0 ? (
                                <tr>
                                  <td colSpan={7} className="p-8 text-center text-[#737780]">
                                    No se encontraron perfumes con los filtros aplicados.
                                  </td>
                                </tr>
                              ) : (
                                displayedList.map((p) => {
                                  const is11 = p.category === 'Perfumería 1.1';
                                  const isSelected = selectedProdIds.includes(p.id);
                                  const hasNotes = p.olfactory_family && p.olfactory_family.length > 4;
                                  const isEnrichingThis = singleEnrichingId === p.id;

                                  return (
                                    <tr key={p.id} className={`border-b border-[#ecedee] hover:bg-neutral-50 transition-colors ${isSelected ? 'bg-[#f4f6ff]' : ''}`}>
                                      <td className="p-3 text-center">
                                        <input
                                          type="checkbox"
                                          className="w-4 h-4 cursor-pointer accent-[#000aff]"
                                          checked={isSelected}
                                          onChange={() => handleToggleSelectProduct(p.id)}
                                        />
                                      </td>
                                      <td className="p-3">
                                        <div className="flex items-center gap-2.5">
                                          {p.image_url ? (
                                            <img src={p.image_url} alt="" className="w-8 h-8 rounded object-cover border border-[#ecedee] shrink-0 bg-white" />
                                          ) : (
                                            <div className="w-8 h-8 rounded bg-[#ecedee] flex items-center justify-center text-[10px] text-[#737780] shrink-0">
                                              Sin foto
                                            </div>
                                          )}
                                          <div>
                                            <span className="font-bold text-[#111111] block leading-tight">{p.name}</span>
                                            <span className="text-[10px] text-[#737780]">{p.id}</span>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="p-3">{p.brand}</td>
                                      <td className="p-3">
                                        {hasNotes ? (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-max">
                                            <CheckCircle2 className="w-3 h-3" />
                                            <span className="truncate max-w-[140px]" title={p.olfactory_family}>{p.olfactory_family}</span>
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 flex items-center gap-1 w-max">
                                            <span>Pendiente IA</span>
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                          is11 ? 'bg-[#000aff] text-white' : 'bg-neutral-200 text-neutral-800'
                                        }`}>
                                          {p.category}
                                        </span>
                                      </td>
                                      <td className="p-3 text-center">
                                        <button
                                          onClick={() => handleToggle11(p)}
                                          className={`px-3 py-1 rounded-[6px] text-[11px] font-semibold transition-all cursor-pointer ${
                                            is11
                                              ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                                              : 'bg-[#e5e7ff] text-[#000aff] hover:bg-[#000aff] hover:text-white border border-[#000aff]/30'
                                          }`}
                                        >
                                          {is11 ? 'Quitar de 1.1' : '+ Asignar a 1.1'}
                                        </button>
                                      </td>
                                      <td className="p-3 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                          <button
                                            onClick={() => handleEnrichSingle(p)}
                                            disabled={isEnrichingThis || isAiRunning}
                                            className="px-2 py-1 rounded bg-[#e5e7ff] text-[#000aff] hover:bg-[#000aff] hover:text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                                            title="Generar notas y ficha técnica con Gemini IA"
                                          >
                                            {isEnrichingThis ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Bot className="w-3 h-3" />}
                                            <span>IA</span>
                                          </button>
                                          <button
                                            onClick={() => handleOpenEditProduct(p)}
                                            className="p-1.5 rounded hover:bg-neutral-200 text-[#111111] cursor-pointer"
                                            title="Editar datos"
                                          >
                                            <Edit className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteProduct(p.id)}
                                            className="p-1.5 rounded hover:bg-red-100 text-red-600 cursor-pointer"
                                            title="Eliminar del catálogo"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Barra Inferior de Navegación / Paginador */}
                        {totalPages > 1 && (
                          <div className="p-3 bg-[#ecedee]/60 border border-[#d7d7d7] rounded-[10px] flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] font-mono">
                            <span className="text-[#444955]">
                              Página <strong>{safePage}</strong> de <strong>{totalPages}</strong>
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={safePage <= 1}
                                className="px-3 py-1.5 rounded-[6px] bg-white border border-[#d7d7d7] text-[#111111] hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                              >
                                <ChevronLeft className="w-4 h-4" />
                                <span>Anterior</span>
                              </button>

                              <div className="flex items-center gap-1 px-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                                  // Calcular ventana deslizante de páginas
                                  let pageNum = safePage - 2 + idx;
                                  if (pageNum < 1) pageNum = idx + 1;
                                  if (pageNum > totalPages) pageNum = totalPages - 4 + idx;
                                  if (pageNum < 1 || pageNum > totalPages) return null;

                                  const isActive = pageNum === safePage;
                                  return (
                                    <button
                                      key={pageNum}
                                      onClick={() => setCurrentPage(pageNum)}
                                      className={`w-8 h-8 rounded-[6px] text-[12px] font-bold cursor-pointer transition-all ${
                                        isActive
                                          ? 'bg-[#000aff] text-white shadow-sm'
                                          : 'bg-white border border-[#d7d7d7] text-[#444955] hover:bg-neutral-100'
                                      }`}
                                    >
                                      {pageNum}
                                    </button>
                                  );
                                })}
                              </div>

                              <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={safePage >= totalPages}
                                className="px-3 py-1.5 rounded-[6px] bg-white border border-[#d7d7d7] text-[#111111] hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                              >
                                <span>Siguiente</span>
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 2: TARIFAS & WHATSAPP */}
              {activeTab === 'commercial' && (
                <div className="max-w-2xl space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-[#111111] tracking-tight">Tarifas Comerciales & WhatsApp</h3>
                    <p className="text-[13px] text-[#737780]">
                      Modifica los precios únicos de las tres presentaciones de Inspiraciones y el número oficial de atención.
                    </p>
                  </div>

                  {commSuccess && (
                    <div className="p-3 rounded-[8px] bg-green-50 border border-green-200 text-green-800 text-[13px] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <span>{commSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveCommercial} className="space-y-6">
                    {/* WhatsApp configuration */}
                    <div className="p-5 rounded-[10px] border border-[#ecedee] space-y-4 bg-[#ecedee]/30">
                      <h4 className="text-base font-bold text-[#111111] flex items-center gap-2">
                        <span>Configuración de WhatsApp</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[12px] font-mono text-[#111111] font-semibold block mb-1">
                            Número Internacional (sin +):
                          </label>
                          <input
                            type="text"
                            required
                            value={commForm.whatsapp_number}
                            onChange={(e) => setCommForm({ ...commForm, whatsapp_number: e.target.value })}
                            className="w-full px-3 py-2 bg-white rounded-[8px] border border-[#d7d7d7] text-[13px] font-mono"
                            placeholder="573105964755"
                          />
                          <span className="text-[10px] text-[#737780]">Ej: 573105964755</span>
                        </div>

                        <div>
                          <label className="text-[12px] font-mono text-[#111111] font-semibold block mb-1">
                            Formato Visible al Cliente:
                          </label>
                          <input
                            type="text"
                            required
                            value={commForm.whatsapp_display}
                            onChange={(e) => setCommForm({ ...commForm, whatsapp_display: e.target.value })}
                            className="w-full px-3 py-2 bg-white rounded-[8px] border border-[#d7d7d7] text-[13px] font-mono"
                            placeholder="+57 310 5964755"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Prices configuration */}
                    <div className="p-5 rounded-[10px] border border-[#ecedee] space-y-4">
                      <h4 className="text-base font-bold text-[#111111]">
                        Tabla Centralizada de Precios (Inspiraciones)
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[12px] font-mono text-[#111111] font-semibold block mb-1">
                            Presentación 30 ml (COP):
                          </label>
                          <input
                            type="number"
                            required
                            min="1000"
                            step="500"
                            value={commForm.price_30ml}
                            onChange={(e) => setCommForm({ ...commForm, price_30ml: e.target.value })}
                            className="w-full px-3 py-2 bg-[#ecedee] rounded-[8px] text-[14px] font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[12px] font-mono text-[#111111] font-semibold block mb-1">
                            Presentación 60 ml (COP):
                          </label>
                          <input
                            type="number"
                            required
                            min="1000"
                            step="500"
                            value={commForm.price_60ml}
                            onChange={(e) => setCommForm({ ...commForm, price_60ml: e.target.value })}
                            className="w-full px-3 py-2 bg-[#ecedee] rounded-[8px] text-[14px] font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[12px] font-mono text-[#111111] font-semibold block mb-1">
                            Presentación 100 ml (COP):
                          </label>
                          <input
                            type="number"
                            required
                            min="1000"
                            step="500"
                            value={commForm.price_100ml}
                            onChange={(e) => setCommForm({ ...commForm, price_100ml: e.target.value })}
                            className="w-full px-3 py-2 bg-[#ecedee] rounded-[8px] text-[14px] font-mono font-bold"
                          />
                        </div>
                      </div>

                      <p className="text-[12px] text-[#737780]">
                        * Al actualizar estos valores, los precios del carrito, fichas de producto y cálculos de subtotales se actualizarán de forma instantánea.
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-3 rounded-[10px] bg-[#000aff] hover:bg-[#0008cc] text-white text-[14px] font-semibold transition-all cursor-pointer shadow-md"
                    >
                      Guardar Cambios Comerciales
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 3: GEMINI IA & SCRAPING */}
              {activeTab === 'gemini' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-[#111111] tracking-tight flex items-center gap-2">
                      <Bot className="w-6 h-6 text-[#000aff]" />
                      <span>Automatización & Scraping con Gemini IA</span>
                    </h3>
                    <p className="text-[13px] text-[#737780]">
                      Extracción autónoma de notas olfativas de salida, corazón y fondo, acordes aromáticos, descripciones de lujo e imágenes de catálogo directamente a Neon Postgres.
                    </p>
                  </div>

                  {/* Barra de Progreso en Vivo cuando la IA está ejecutándose */}
                  {isAiRunning && (
                    <div className="p-5 rounded-[12px] bg-[#111111] text-white space-y-3 shadow-lg animate-fadeIn border border-[#000aff]/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <RefreshCw className="w-5 h-5 text-[#000aff] animate-spin" />
                          <span className="font-bold text-[14px]">Scraping y Enriquecimiento con IA en curso</span>
                        </div>
                        <span className="text-[12px] font-mono px-2.5 py-0.5 rounded-full bg-[#000aff] text-white font-bold">
                          {Math.round((aiProgress.current / (aiProgress.total || 1)) * 100)}%
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[12px] text-neutral-300 font-mono">
                          <span className="truncate max-w-[280px] sm:max-w-md">{aiProgress.currentName || 'Consultando base olfativa...'}</span>
                          <span>{aiProgress.current} de {aiProgress.total}</span>
                        </div>
                        {/* Progress Bar Track */}
                        <div className="w-full bg-neutral-800 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-[#000aff] to-indigo-400 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${Math.round((aiProgress.current / (aiProgress.total || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <p className="text-[11px] text-neutral-400 italic">
                        {aiProgress.status} • Los cambios se sincronizan en Neon Postgres en tiempo real.
                      </p>
                    </div>
                  )}

                  {/* Opciones de Enriquecimiento: Masivo vs Granular */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Opción 1: Enriquecer Todo el Catálogo Una Sola Vez */}
                    <div className="p-6 rounded-[12px] border border-[#ecedee] bg-white space-y-4 shadow-sm flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-full bg-[#e5e7ff] text-[#000aff] flex items-center justify-center">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <h4 className="text-lg font-bold text-[#111111]">1. Enriquecer Todo el Catálogo (Scrapeo Único)</h4>
                        <p className="text-[13px] text-[#444955] leading-relaxed">
                          Escanea todos los perfumes del catálogo que aún no tengan notas olfativas completas. Gemini IA investiga y guarda las notas de salida, corazón, fondo y acordes directamente en la base de datos de producción.
                        </p>

                        <div className="pt-2 grid grid-cols-3 gap-2 text-center text-mono">
                          <div className="p-2.5 bg-[#ecedee] rounded-[8px]">
                            <span className="text-[10px] text-[#737780] block">Catálogo</span>
                            <span className="text-base font-bold text-[#111111]">{adminProducts.length}</span>
                          </div>
                          <div className="p-2.5 bg-emerald-50 rounded-[8px] border border-emerald-100">
                            <span className="text-[10px] text-emerald-800 block">Con Notas</span>
                            <span className="text-base font-bold text-emerald-800">
                              {adminProducts.filter(p => p.olfactory_family && p.olfactory_family.length >= 5).length}
                            </span>
                          </div>
                          <div className="p-2.5 bg-amber-50 rounded-[8px] border border-amber-100">
                            <span className="text-[10px] text-amber-800 block">Pendientes</span>
                            <span className="text-base font-bold text-amber-800">
                              {adminProducts.filter(p => !p.olfactory_family || p.olfactory_family.length < 5).length}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleProcessAllCatalogAi}
                        disabled={isAiRunning}
                        className="w-full py-3 rounded-[10px] bg-[#111111] hover:bg-[#222222] text-white text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 shadow-sm"
                      >
                        {isAiRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                        <span>{isAiRunning ? 'Procesando...' : '🚀 Enriquecer Todo el Catálogo Pendiente'}</span>
                      </button>
                    </div>

                    {/* Opción 2: Enriquecimiento Granular / Selectivo para nuevos perfumes */}
                    <div className="p-6 rounded-[12px] border border-[#ecedee] bg-white space-y-4 shadow-sm flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-full bg-[#000aff]/10 text-[#000aff] flex items-center justify-center">
                          <CheckSquare className="w-5 h-5" />
                        </div>
                        <h4 className="text-lg font-bold text-[#111111]">2. Enriquecimiento Granular (Perfumes Nuevos)</h4>
                        <p className="text-[13px] text-[#444955] leading-relaxed">
                          ¿Agregaste uno o varios perfumes nuevos? <strong>No necesitas re-escanear todo el catálogo.</strong> Ve a la pestaña <em>Catálogo & 1.1</em>, marca las casillas de los perfumes que desees enriquecer y pulsa el botón de procesar selección.
                        </p>

                        <div className="p-3 rounded-[8px] bg-[#ecedee]/60 text-[12px] text-[#444955] space-y-1">
                          <p>
                            <strong>Estado actual:</strong> {selectedProdIds.length > 0 
                              ? <span className="text-[#000aff] font-bold">{selectedProdIds.length} perfume(s) seleccionado(s) listos</span>
                              : <span className="text-[#737780]">0 perfumes seleccionados en la tabla</span>}
                          </p>
                          <p className="text-[11px] text-[#737780]">
                            También puedes enriquecer un perfume individual pulsando el botón <strong>IA</strong> en su fila.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {selectedProdIds.length > 0 ? (
                          <button
                            onClick={handleProcessSelectedAi}
                            disabled={isAiRunning}
                            className="w-full py-3 rounded-[10px] bg-[#000aff] hover:bg-[#0008cc] text-white text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 shadow-md"
                          >
                            <Zap className="w-4 h-4" />
                            <span>Procesar {selectedProdIds.length} Seleccionados con IA</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setActiveTab('products')}
                            className="w-full py-3 rounded-[10px] bg-white border border-[#d7d7d7] hover:bg-neutral-50 text-[#111111] text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
                          >
                            <CheckSquare className="w-4 h-4 text-[#000aff]" />
                            <span>Ir a Seleccionar Perfumes en el Catálogo</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Registro de Actividad IA en Tiempo Real */}
                  <div className="p-5 rounded-[12px] border border-[#ecedee] bg-white space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-[#111111] flex items-center gap-2">
                        <Bot className="w-4 h-4 text-[#000aff]" />
                        <span>Registro de Operaciones de Gemini IA</span>
                      </h4>
                      {aiLogs.length > 0 && (
                        <button
                          onClick={() => setAiLogs([])}
                          className="text-[11px] text-[#737780] hover:text-[#111111] font-mono cursor-pointer"
                        >
                          Limpiar registro
                        </button>
                      )}
                    </div>

                    {aiLogs.length === 0 ? (
                      <div className="p-6 text-center text-[#737780] text-[13px] bg-[#ecedee]/40 rounded-[8px]">
                        <p>No hay ejecuciones recientes en esta sesión.</p>
                        <p className="text-[11px] pt-1">
                          Inicia el enriquecimiento masivo o procesa perfumes seleccionados para ver el reporte olfativo en tiempo real.
                        </p>
                      </div>
                    ) : (
                      <div className="border border-[#ecedee] rounded-[8px] max-h-60 overflow-y-auto font-mono text-[11px]">
                        <table className="w-full text-left">
                          <thead className="bg-[#ecedee] sticky top-0">
                            <tr>
                              <th className="p-2.5">Hora</th>
                              <th className="p-2.5">Perfume</th>
                              <th className="p-2.5">Estado</th>
                              <th className="p-2.5">Familia Olfativa / Detalle</th>
                            </tr>
                          </thead>
                          <tbody>
                            {aiLogs.map((log, idx) => (
                              <tr key={idx} className="border-b border-[#ecedee] hover:bg-neutral-50">
                                <td className="p-2 text-[#737780]">{log.time}</td>
                                <td className="p-2 font-bold text-[#111111]">{log.name}</td>
                                <td className="p-2">
                                  {log.status === 'success' ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-green-100 text-green-800 font-bold">
                                      Guardado
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-100 text-red-800 font-bold">
                                      Error
                                    </span>
                                  )}
                                </td>
                                <td className="p-2 text-[#444955] truncate max-w-xs">{log.details}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: GESTIÓN Y ADQUISICIÓN DE FOTOGRAFÍAS */}
              {activeTab === 'images' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-[#111111] tracking-tight flex items-center gap-2">
                      <ImageIcon className="w-6 h-6 text-[#000aff]" />
                      <span>Centro de Adquisición de Fotografías (Sin Fondo)</span>
                    </h3>
                    <p className="text-[13px] text-[#737780]">
                      Encuentra frascos oficiales en formato PNG transparente, previsualízalos en tiempo real y asígnalos directamente a la base de datos de Neon Postgres.
                    </p>
                  </div>

                  {/* Asistente Rápido de Asignación y Previsualización */}
                  <div className="p-6 rounded-[12px] border border-[#ecedee] bg-white space-y-5 shadow-sm">
                    <h4 className="text-base font-bold text-[#111111] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImagePlus className="w-5 h-5 text-[#000aff]" />
                        <span>Asistente de Búsqueda y Asignación de Frasco</span>
                      </div>
                      {uploadSelectedProduct && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#e5e7ff] text-[#000aff] font-bold">
                          Perfume Seleccionado: {uploadSelectedProduct}
                        </span>
                      )}
                    </h4>

                    {/* Selector de Perfume */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-[12px] font-mono text-[#111111] font-semibold block mb-1">
                          1. Elige el Perfume que deseas configurar:
                        </label>
                        <select
                          value={uploadSelectedProduct}
                          onChange={(e) => {
                            setUploadSelectedProduct(e.target.value);
                            const p = adminProducts.find(x => x.id === e.target.value);
                            if (p && p.image_url) {
                              setImgUrlInput(p.image_url);
                            } else {
                              setImgUrlInput('');
                            }
                            setBottleReferenceData(null);
                          }}
                          className="w-full px-3 py-2 bg-[#ecedee] rounded-[8px] text-[13px] font-mono font-medium focus:ring-1 focus:ring-[#000aff]"
                        >
                          <option value="">-- Selecciona un perfume del catálogo --</option>
                          <optgroup label="⚠️ Pendientes de Fotografía">
                            {adminProducts.filter(p => !p.image_url).map(p => (
                              <option key={p.id} value={p.id}>
                                ⚠️ [{p.id}] {p.name} - {p.brand} ({p.category})
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="✅ Con Fotografía Asignada">
                            {adminProducts.filter(p => p.image_url).map(p => (
                              <option key={p.id} value={p.id}>
                                ✅ [{p.id}] {p.name} - {p.brand}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>

                      {/* Botones de Asistencia de Búsqueda con 1 Clic */}
                      {(() => {
                        const targetProd = adminProducts.find(p => p.id === uploadSelectedProduct);
                        if (!targetProd) return null;

                        const googleQuery = `${targetProd.name} ${targetProd.brand} perfume bottle png`;
                        const googlePngUrl = `https://www.google.com/search?tbm=isch&tbs=ic:trans&q=${encodeURIComponent(googleQuery)}`;
                        const fragranticaUrl = `https://www.google.com/search?q=${encodeURIComponent('site:fragrantica.com ' + targetProd.name + ' ' + targetProd.brand)}`;

                        return (
                          <div className="p-4 rounded-[10px] bg-[#f8f9fa] border border-[#ecedee] space-y-3 animate-fadeIn">
                            <span className="text-[12px] font-mono font-bold text-[#111111] block">
                              2. Búsqueda con 1 Clic para: <span className="text-[#000aff]">{targetProd.name} ({targetProd.brand})</span>
                            </span>

                            <div className="flex flex-wrap gap-2">
                              <a
                                href={googlePngUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2 rounded-[8px] bg-[#000aff] hover:bg-[#0008cc] text-white text-[12px] font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Buscar PNG Transparente en Google</span>
                              </a>

                              <a
                                href={fragranticaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2 rounded-[8px] bg-white border border-[#d7d7d7] hover:bg-neutral-100 text-[#111111] text-[12px] font-medium flex items-center gap-1.5 transition-all"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
                                <span>Ver Ficha en Fragrantica</span>
                              </a>

                              <button
                                type="button"
                                onClick={() => handleGetBottleRef(targetProd)}
                                disabled={isLoadingBottleRef}
                                className="px-3.5 py-2 rounded-[8px] bg-[#e5e7ff] text-[#000aff] hover:bg-[#000aff] hover:text-white text-[12px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {isLoadingBottleRef ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                                <span>Consultar Frasco con Gemini IA</span>
                              </button>
                            </div>

                            {/* Ficha Visual de Gemini IA */}
                            {bottleReferenceData && bottleReferenceData.product?.id === targetProd.id && (
                              <div className="p-3 bg-white rounded-[8px] border border-[#000aff]/30 text-[12px] font-mono space-y-1.5 animate-fadeIn">
                                <p className="font-bold text-[#000aff]">✨ Referencia Oficial de Frasco (Gemini IA):</p>
                                <p>• <strong>Búsqueda sugerida:</strong> {bottleReferenceData.reference.query_reference || targetProd.name}</p>
                                <p>• <strong>Color del frasco y líquido:</strong> {bottleReferenceData.reference.bottle_color || 'N/A'}</p>
                                <p>• <strong>Estilo de tapa:</strong> {bottleReferenceData.reference.cap_style || 'N/A'}</p>
                                <p className="text-[11px] text-[#737780] pt-1">💡 {bottleReferenceData.reference.transparency_advice}</p>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Campo para Pegar URL o Cargar Archivo */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                          <label className="text-[12px] font-mono text-[#111111] font-semibold block">
                            3. Pegar Enlace Directo de la Imagen (URL):
                          </label>
                          <div className="relative">
                            <LinkIcon className="w-4 h-4 text-[#737780] absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="url"
                              value={imgUrlInput}
                              onChange={(e) => setImgUrlInput(e.target.value)}
                              placeholder="https://.../botella-sauvage.png"
                              className="w-full pl-9 pr-3 py-2 bg-[#ecedee] rounded-[8px] text-[13px] font-mono focus:outline-none focus:ring-1 focus:ring-[#000aff]"
                            />
                          </div>
                          <span className="text-[11px] text-[#737780] block">
                            Copia el enlace de la imagen con fondo transparente o blanco y pégalo aquí.
                          </span>

                          <div className="pt-2">
                            <label className="text-[12px] font-mono text-[#111111] font-semibold block mb-1">
                              O cargar archivo PNG / WebP desde tu equipo:
                            </label>
                            <input
                              type="file"
                              accept="image/png,image/webp,image/jpeg"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleFileToUrl(e.target.files[0]);
                                }
                              }}
                              className="w-full px-3 py-1.5 bg-[#ecedee] rounded-[8px] text-[12px] cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Previsualizador de Frasco en Tiempo Real */}
                        <div className="space-y-2">
                          <label className="text-[12px] font-mono text-[#111111] font-semibold block">
                            Previsualización en Catálogo SHINE:
                          </label>
                          <div className="h-48 border border-dashed border-[#d7d7d7] rounded-[10px] bg-white flex items-center justify-center relative overflow-hidden p-4 group">
                            {imgUrlInput ? (
                              <div className="flex flex-col items-center justify-center text-center space-y-2">
                                <img
                                  src={imgUrlInput}
                                  alt="Preview"
                                  className="max-h-36 object-contain drop-shadow-md transition-transform group-hover:scale-105"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                  }}
                                />
                                <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                                  ✓ Vista Previa Lista
                                </span>
                              </div>
                            ) : (
                              <div className="text-center text-[#737780] space-y-1">
                                <ImageIcon className="w-8 h-8 mx-auto text-[#d7d7d7]" />
                                <span className="text-[12px] font-mono block">Sin imagen seleccionada</span>
                                <span className="text-[10px] block">Pega una URL o sube un archivo para ver la vista previa.</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Botón de Confirmación y Guardado */}
                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ecedee]">
                        {uploadSelectedProduct && adminProducts.find(p => p.id === uploadSelectedProduct)?.image_url && (
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(uploadSelectedProduct)}
                            className="px-4 py-2 rounded-[8px] border border-red-200 text-red-600 hover:bg-red-50 text-[12px] font-medium cursor-pointer"
                          >
                            Quitar Imagen Actual
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleAssignImageUrl(uploadSelectedProduct, imgUrlInput)}
                          disabled={!uploadSelectedProduct || !imgUrlInput || isAssigningUrl}
                          className="px-6 py-2.5 rounded-[8px] bg-[#000aff] hover:bg-[#0008cc] text-white text-[13px] font-semibold flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 shadow-md"
                        >
                          {isAssigningUrl ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          <span>Guardar y Asignar al Perfume</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Galería Visual de Perfumes del Catálogo */}
                  <div className="p-6 rounded-[12px] border border-[#ecedee] bg-white space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-base font-bold text-[#111111]">Galería de Frascos del Catálogo</h4>
                        <p className="text-[12px] text-[#737780]">
                          Explora el estado visual de cada producto y asigna imágenes con 1 clic.
                        </p>
                      </div>

                      {/* Filtros de la Galería */}
                      <div className="flex items-center gap-1.5 text-[12px] font-mono">
                        <button
                          onClick={() => setImgFilterTab('without_image')}
                          className={`px-3 py-1.5 rounded-[8px] cursor-pointer transition-all ${
                            imgFilterTab === 'without_image' ? 'bg-[#000aff] text-white font-bold' : 'bg-[#ecedee] text-[#444955]'
                          }`}
                        >
                          Sin Foto ({adminProducts.filter(p => !p.image_url).length})
                        </button>
                        <button
                          onClick={() => setImgFilterTab('with_image')}
                          className={`px-3 py-1.5 rounded-[8px] cursor-pointer transition-all ${
                            imgFilterTab === 'with_image' ? 'bg-[#111111] text-white font-bold' : 'bg-[#ecedee] text-[#444955]'
                          }`}
                        >
                          Con Foto ({adminProducts.filter(p => p.image_url).length})
                        </button>
                        <button
                          onClick={() => setImgFilterTab('all')}
                          className={`px-3 py-1.5 rounded-[8px] cursor-pointer transition-all ${
                            imgFilterTab === 'all' ? 'bg-[#111111] text-white font-bold' : 'bg-[#ecedee] text-[#444955]'
                          }`}
                        >
                          Todos ({adminProducts.length})
                        </button>
                      </div>
                    </div>

                    {/* Buscador de la Galería */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-[#737780] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Filtrar por perfume o casa..."
                        value={imgSearchTerm}
                        onChange={(e) => setImgSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-[#ecedee] rounded-[8px] text-[13px] font-mono focus:outline-none focus:ring-1 focus:ring-[#000aff]"
                      />
                    </div>

                    {/* Grid de Frascos */}
                    {(() => {
                      const galleryList = adminProducts
                        .filter(p => {
                          if (imgFilterTab === 'without_image' && p.image_url) return false;
                          if (imgFilterTab === 'with_image' && !p.image_url) return false;
                          if (imgSearchTerm.trim()) {
                            const q = imgSearchTerm.toLowerCase().trim();
                            return (
                              (p.name && p.name.toLowerCase().includes(q)) ||
                              (p.brand && p.brand.toLowerCase().includes(q)) ||
                              (p.id && p.id.toLowerCase().includes(q))
                            );
                          }
                          return true;
                        })
                        .slice(0, 100);

                      if (galleryList.length === 0) {
                        return (
                          <div className="p-8 text-center text-[#737780] text-[13px] bg-[#ecedee]/40 rounded-[8px]">
                            No hay perfumes para mostrar en esta vista.
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[50vh] overflow-y-auto p-1">
                          {galleryList.map(p => {
                            const hasImg = Boolean(p.image_url);
                            const googleQuery = `${p.name} ${p.brand} perfume bottle png`;
                            const googlePngUrl = `https://www.google.com/search?tbm=isch&tbs=ic:trans&q=${encodeURIComponent(googleQuery)}`;

                            return (
                              <div
                                key={p.id}
                                className={`p-3 rounded-[10px] border transition-all flex flex-col justify-between text-left space-y-2 bg-white ${
                                  uploadSelectedProduct === p.id
                                    ? 'border-[#000aff] ring-2 ring-[#000aff]/20 shadow-md'
                                    : 'border-[#ecedee] hover:border-[#d7d7d7] hover:shadow-sm'
                                }`}
                              >
                                <div>
                                  <div className="h-28 bg-[#f8f9fa] rounded-[8px] flex items-center justify-center p-2 relative overflow-hidden mb-2">
                                    {hasImg ? (
                                      <img src={p.image_url} alt="" className="h-full object-contain drop-shadow" />
                                    ) : (
                                      <div className="text-center text-[#737780] space-y-1">
                                        <ImageIcon className="w-6 h-6 mx-auto text-[#d7d7d7]" />
                                        <span className="text-[10px] font-mono block">Sin Foto</span>
                                      </div>
                                    )}
                                  </div>

                                  <span className="text-[10px] font-mono text-[#737780] block truncate">{p.brand}</span>
                                  <h5 className="text-[12px] font-bold text-[#111111] line-clamp-1 leading-snug" title={p.name}>
                                    {p.name}
                                  </h5>
                                </div>

                                <div className="space-y-1.5 pt-1 border-t border-[#ecedee]">
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setUploadSelectedProduct(p.id);
                                        setImgUrlInput(p.image_url || '');
                                      }}
                                      className="flex-1 py-1 rounded bg-[#ecedee] hover:bg-[#d7d7d7] text-[#111111] text-[11px] font-medium text-center cursor-pointer transition-colors"
                                    >
                                      {hasImg ? 'Editar' : 'Asignar'}
                                    </button>

                                    <a
                                      href={googlePngUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Buscar PNG Transparente en Google"
                                      className="p-1 rounded bg-[#e5e7ff] text-[#000aff] hover:bg-[#000aff] hover:text-white transition-colors cursor-pointer"
                                    >
                                      <Search className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}

