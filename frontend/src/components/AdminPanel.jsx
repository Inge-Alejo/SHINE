import React, { useState, useEffect } from 'react';
import { 
  X, Lock, ShieldCheck, Database, RefreshCw, Settings, Image as ImageIcon, 
  Plus, Edit, Trash2, CheckCircle2, AlertTriangle, ExternalLink, Sparkles, 
  Upload, Search, FileSpreadsheet, Eye, LogOut 
} from 'lucide-react';
import { 
  adminLogin, fetchDashboard, updateCommercialSettings, createProduct, 
  updateProduct, deleteProduct, getSheetsConfig, saveSheetsConfig, 
  testSheetsConnection, triggerSheetsSync, disconnectSheets, 
  fetchPendingImages, uploadProductImage, approveImageCandidate 
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

  // Tabs del panel: 'dashboard', 'products', 'commercial', 'sheets', 'images'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Datos del Dashboard
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  // Gestión de Productos
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

  // Google Sheets
  const [sheetsConfig, setSheetsConfig] = useState(null);
  const [sheetUrlInput, setSheetUrlInput] = useState('');
  const [sheetTabInput, setSheetTabInput] = useState('Hoja 1');
  const [sheetTestResult, setSheetTestResult] = useState(null);
  const [sheetSyncResult, setSheetSyncResult] = useState(null);
  const [isTestingSheet, setIsTestingSheet] = useState(false);
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [syncHistoryList, setSyncHistoryList] = useState([]);

  // Imágenes
  const [pendingImagesData, setPendingImagesData] = useState({ products_without_image: [], image_candidates: [] });
  const [uploadSelectedProduct, setUploadSelectedProduct] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadNotes, setUploadNotes] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Cargar datos al abrir o loguear
  useEffect(() => {
    if (isOpen && token) {
      loadDashboardData();
      loadSheetsData();
      loadPendingImages();
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

  const loadSheetsData = async () => {
    if (!token) return;
    try {
      const res = await getSheetsConfig(token);
      if (res.success) {
        setSheetsConfig(res.config);
        setSheetUrlInput(res.config?.sheet_url || '');
        setSheetTabInput(res.config?.sheet_tab || 'Hoja 1');
        setSyncHistoryList(res.history || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

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

  // Probar conexión Google Sheets
  const handleTestSheet = async () => {
    setIsTestingSheet(true);
    setSheetTestResult(null);
    try {
      const res = await testSheetsConnection(token, {
        sheet_url: sheetUrlInput,
        sheet_tab: sheetTabInput
      });
      setSheetTestResult(res);
      loadSheetsData();
    } catch (e) {
      setSheetTestResult({ success: false, error: 'Error de conexión' });
    } finally {
      setIsTestingSheet(false);
    }
  };

  // Guardar enlace de Google Sheets
  const handleSaveSheetConfig = async () => {
    try {
      const res = await saveSheetsConfig(token, {
        sheet_url: sheetUrlInput,
        sheet_tab: sheetTabInput
      });
      if (res.success) {
        alert('Enlace de Google Sheets guardado con éxito');
        loadSheetsData();
      }
    } catch (e) {
      alert('Error al guardar configuración');
    }
  };

  // Sincronizar Google Sheets
  const handleTriggerSync = async () => {
    if (!confirm('¿Deseas iniciar la sincronización con Google Sheets? Los cambios manuales e imágenes locales serán respetados.')) return;
    setIsSyncingSheet(true);
    setSheetSyncResult(null);
    try {
      const res = await triggerSheetsSync(token);
      setSheetSyncResult(res);
      loadSheetsData();
      loadDashboardData();
      if (onRefreshCatalog) onRefreshCatalog();
    } catch (e) {
      setSheetSyncResult({ success: false, error: 'Error al sincronizar' });
    } finally {
      setIsSyncingSheet(false);
    }
  };

  // Desconectar Google Sheets
  const handleDisconnectSheet = async () => {
    if (!confirm('¿Seguro que deseas desconectar Google Sheets? El catálogo local se mantendrá intacto.')) return;
    try {
      await disconnectSheets(token);
      setSheetUrlInput('');
      setSheetTestResult(null);
      setSheetSyncResult(null);
      loadSheetsData();
    } catch (e) {
      alert('Error al desconectar');
    }
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
                { id: 'commercial', label: 'Tarifas & WhatsApp', icon: Settings },
                { id: 'sheets', label: 'Google Sheets', icon: FileSpreadsheet },
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

                      {/* Sheets status snapshot */}
                      <div className="p-5 rounded-[10px] border border-[#ecedee] space-y-3 bg-[#ecedee]/40">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-[#000aff]" />
                            <h4 className="text-base font-bold text-[#111111]">Estado de Sincronización Google Sheets</h4>
                          </div>
                          <span className={`text-[12px] font-mono px-3 py-1 rounded-full font-bold ${
                            dashboardData.sheets_status.status === 'Conexión válida' || dashboardData.sheets_status.status === 'Sincronización completada'
                              ? 'bg-green-100 text-green-800'
                              : dashboardData.sheets_status.status === 'Sin configurar'
                                ? 'bg-neutral-200 text-neutral-800'
                                : 'bg-amber-100 text-amber-800'
                          }`}>
                            {dashboardData.sheets_status.status}
                          </span>
                        </div>
                        <p className="text-[13px] text-[#444955]">
                          Última sincronización: <strong>{dashboardData.sheets_status.last_sync_at || 'Nunca'}</strong> • 
                          Detectados: <strong>{dashboardData.sheets_status.total_detected}</strong> • 
                          Agregados: <strong>{dashboardData.sheets_status.total_added}</strong> • 
                          Omitidos: <strong>{dashboardData.sheets_status.total_skipped}</strong>
                        </p>
                      </div>
                    </>
                  )}
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

              {/* TAB 3: GOOGLE SHEETS */}
              {activeTab === 'sheets' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-[#111111] tracking-tight">
                      Configuración del Catálogo y Sincronización
                    </h3>
                    <p className="text-[13px] text-[#737780]">
                      Módulo preparado para conectar Google Sheets. Actualmente el sitio opera 100% sobre la base de datos interna autónoma.
                    </p>
                  </div>

                  {/* Status Banner */}
                  <div className="p-4 rounded-[10px] border border-[#ecedee] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#ecedee]/50">
                    <div>
                      <span className="text-[11px] font-mono text-[#737780] block">Estado de Conexión:</span>
                      <span className="text-lg font-bold text-[#111111]">
                        {sheetsConfig?.connection_status || 'Sin configurar'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleTestSheet}
                        disabled={isTestingSheet || !sheetUrlInput}
                        className="px-4 py-2 rounded-[8px] bg-white border border-[#d7d7d7] hover:bg-[#ecedee] text-[#111111] text-[13px] font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isTestingSheet ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>Probar Conexión & Vista Previa</span>
                      </button>

                      <button
                        onClick={handleTriggerSync}
                        disabled={isSyncingSheet || !sheetUrlInput}
                        className="px-4 py-2 rounded-[8px] bg-[#000aff] hover:bg-[#0008cc] text-white text-[13px] font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isSyncingSheet ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        <span>Sincronizar Ahora</span>
                      </button>
                    </div>
                  </div>

                  {/* Connection Settings Form */}
                  <div className="p-6 rounded-[10px] border border-[#ecedee] space-y-4">
                    <h4 className="text-base font-bold text-[#111111]">Conexión con Google Sheets</h4>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[12px] font-mono text-[#111111] font-semibold block mb-1">
                          Enlace del Documento de Google Sheets:
                        </label>
                        <input
                          type="url"
                          value={sheetUrlInput}
                          onChange={(e) => setSheetUrlInput(e.target.value)}
                          placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                          className="w-full px-3.5 py-2.5 bg-[#ecedee] rounded-[8px] text-[13px] font-mono focus:outline-none focus:ring-1 focus:ring-[#000aff]"
                        />
                        <span className="text-[11px] text-[#737780] block pt-1">
                          Pega la URL completa de tu hoja de cálculo de Google.
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[12px] font-mono text-[#111111] font-semibold block mb-1">
                            Nombre de la Pestaña:
                          </label>
                          <input
                            type="text"
                            value={sheetTabInput}
                            onChange={(e) => setSheetTabInput(e.target.value)}
                            placeholder="Hoja 1"
                            className="w-full px-3 py-2 bg-[#ecedee] rounded-[8px] text-[13px] font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[12px] font-mono text-[#111111] font-semibold block mb-1">
                            Modo de Acceso:
                          </label>
                          <select className="w-full px-3 py-2 bg-[#ecedee] rounded-[8px] text-[13px] font-mono">
                            <option value="csv_or_public">Enlace Compartido / Export CSV Seguro</option>
                            <option value="apps_script">Google Apps Script Webhook</option>
                            <option value="service_account">Google Service Account (Backend)</option>
                          </select>
                        </div>
                      </div>

                      {/* Column mapping preview */}
                      <div className="p-3 bg-[#ecedee]/60 rounded-[8px] space-y-2">
                        <span className="text-[11px] font-mono font-bold text-[#111111] block">
                          Mapeo Predeterminado de Encabezados (Compatible con PRESENTACION 2026.pdf):
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono text-[#444955]">
                          <div>Nombre: <strong>INSPIRACION (M)</strong></div>
                          <div>Casa: <strong>CASA</strong></div>
                          <div>Descripción: <strong>DESCRIPCION</strong></div>
                          <div>Categoría: <strong>CATEGORIA</strong></div>
                          <div>Subcat: <strong>SUBCATEGORIA</strong></div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleSaveSheetConfig}
                          className="px-5 py-2 rounded-[8px] bg-[#111111] text-white text-[13px] font-medium cursor-pointer"
                        >
                          Guardar Enlace
                        </button>
                        {sheetsConfig?.sheet_url && (
                          <button
                            type="button"
                            onClick={handleDisconnectSheet}
                            className="px-4 py-2 rounded-[8px] border border-red-200 text-red-600 hover:bg-red-50 text-[13px] cursor-pointer"
                          >
                            Eliminar Conexión
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Preview Section */}
                  {sheetTestResult && (
                    <div className="p-5 rounded-[10px] border border-[#ecedee] space-y-3">
                      <div className="flex items-center gap-2">
                        {sheetTestResult.success ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                        )}
                        <h4 className="text-base font-bold text-[#111111]">
                          Resultado de Validación de Conexión
                        </h4>
                      </div>

                      <p className="text-[13px] text-[#444955]">
                        {sheetTestResult.message || sheetTestResult.error}
                      </p>

                      {sheetTestResult.headers && (
                        <div className="overflow-x-auto pt-2">
                          <p className="text-[11px] font-mono text-[#737780] mb-1">Columnas detectadas en la hoja:</p>
                          <div className="flex flex-wrap gap-1.5 pb-3">
                            {sheetTestResult.headers.map((h, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-[#ecedee] text-[#111] text-[11px] font-mono font-medium">
                                {h}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {sheetTestResult.preview_rows && sheetTestResult.preview_rows.length > 0 && (
                        <div className="overflow-x-auto border border-[#ecedee] rounded-[8px]">
                          <table className="w-full text-left text-[11px] font-mono">
                            <thead className="bg-[#ecedee]">
                              <tr>
                                {sheetTestResult.headers.map((h, i) => (
                                  <th key={i} className="p-2 border-b border-[#d7d7d7] font-semibold text-[#111111]">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sheetTestResult.preview_rows.map((row, rIdx) => (
                                <tr key={rIdx} className="border-b border-[#ecedee] hover:bg-neutral-50">
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="p-2">{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sync result notification */}
                  {sheetSyncResult && (
                    <div className="p-4 rounded-[10px] bg-green-50 border border-green-200 text-green-900 text-[13px] space-y-1">
                      <p className="font-bold">{sheetSyncResult.message}</p>
                      {sheetSyncResult.summary && (
                        <p className="text-[12px] font-mono">
                          Detectados: {sheetSyncResult.summary.total_detected} | 
                          Agregados: {sheetSyncResult.summary.items_added} | 
                          Actualizados: {sheetSyncResult.summary.items_updated} | 
                          Omitidos por cambios manuales: {sheetSyncResult.summary.items_skipped}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Sync History Table */}
                  <div className="space-y-3">
                    <h4 className="text-base font-bold text-[#111111]">Historial de Sincronizaciones</h4>
                    {syncHistoryList.length === 0 ? (
                      <p className="text-[13px] text-[#737780] italic">No hay sincronizaciones previas registradas.</p>
                    ) : (
                      <div className="border border-[#ecedee] rounded-[10px] overflow-hidden">
                        <table className="w-full text-left text-[12px] font-mono">
                          <thead className="bg-[#ecedee]">
                            <tr>
                              <th className="p-3">Fecha y Hora</th>
                              <th className="p-3">Estado</th>
                              <th className="p-3">Detectados</th>
                              <th className="p-3">Agregados</th>
                              <th className="p-3">Omitidos</th>
                              <th className="p-3">Detalle</th>
                            </tr>
                          </thead>
                          <tbody>
                            {syncHistoryList.map((h) => (
                              <tr key={h.id} className="border-b border-[#ecedee] hover:bg-neutral-50">
                                <td className="p-3">{h.synced_at}</td>
                                <td className="p-3 font-semibold">{h.status}</td>
                                <td className="p-3">{h.items_detected}</td>
                                <td className="p-3 text-green-700 font-bold">+{h.items_added}</td>
                                <td className="p-3 text-[#737780]">{h.items_skipped}</td>
                                <td className="p-3 text-[11px] text-[#444955] truncate max-w-xs">{h.log_details}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: GESTIÓN DE FOTOGRAFÍAS */}
              {activeTab === 'images' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-[#111111] tracking-tight">Gestión y Procedencia de Fotografías</h3>
                    <p className="text-[13px] text-[#737780]">
                      Asigna imágenes reales a perfumes, revisa la procedencia de cada fotografía y aprueba candidatos.
                    </p>
                  </div>

                  {/* Upload new image widget */}
                  <div className="p-6 rounded-[10px] border border-[#ecedee] bg-[#ecedee]/40 space-y-4">
                    <h4 className="text-base font-bold text-[#111111] flex items-center gap-2">
                      <Upload className="w-4 h-4 text-[#000aff]" />
                      <span>Cargar Fotografía Propia para un Perfume</span>
                    </h4>

                    <form onSubmit={handleUploadImageSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[12px] font-mono text-[#111111] font-semibold block mb-1">
                            Seleccionar Perfume:
                          </label>
                          <select
                            value={uploadSelectedProduct}
                            onChange={(e) => setUploadSelectedProduct(e.target.value)}
                            required
                            className="w-full px-3 py-2 bg-white rounded-[8px] border border-[#d7d7d7] text-[13px]"
                          >
                            <option value="">-- Elige un perfume del catálogo --</option>
                            {pendingImagesData.products_without_image.map(p => (
                              <option key={p.id} value={p.id}>
                                [{p.id}] {p.name} - {p.brand} ({p.category})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[12px] font-mono text-[#111111] font-semibold block mb-1">
                            Archivo de Imagen (JPG, PNG o WebP, máx 5MB):
                          </label>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            required
                            onChange={(e) => setUploadFile(e.target.files[0])}
                            className="w-full px-3 py-1.5 bg-white rounded-[8px] border border-[#d7d7d7] text-[12px]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[12px] font-mono text-[#111111] font-semibold block mb-1">
                          Observaciones o Procedencia de la Fotografía:
                        </label>
                        <input
                          type="text"
                          value={uploadNotes}
                          onChange={(e) => setUploadNotes(e.target.value)}
                          placeholder="Ej: Fotografía oficial catálogo Dior tomada sobre fondo blanco"
                          className="w-full px-3 py-2 bg-white rounded-[8px] border border-[#d7d7d7] text-[13px]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isUploadingImage}
                        className="px-5 py-2.5 rounded-[8px] bg-[#111111] hover:bg-[#222222] text-white text-[13px] font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isUploadingImage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        <span>Subir y Asignar Fotografía</span>
                      </button>
                    </form>
                  </div>

                  {/* List of perfumes needing photos */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-[#111111]">
                        Perfumes Pendientes de Fotografía ({pendingImagesData.products_without_image.length})
                      </h4>
                    </div>

                    <div className="max-h-80 overflow-y-auto border border-[#ecedee] rounded-[10px]">
                      <table className="w-full text-left text-[12px] font-mono">
                        <thead className="bg-[#ecedee] sticky top-0">
                          <tr>
                            <th className="p-2.5">ID</th>
                            <th className="p-2.5">Perfume</th>
                            <th className="p-2.5">Casa</th>
                            <th className="p-2.5">Categoría</th>
                            <th className="p-2.5">Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingImagesData.products_without_image.map(p => (
                            <tr key={p.id} className="border-b border-[#ecedee] hover:bg-neutral-50">
                              <td className="p-2.5 text-[#737780]">{p.id}</td>
                              <td className="p-2.5 font-bold text-[#111111]">{p.name}</td>
                              <td className="p-2.5">{p.brand}</td>
                              <td className="p-2.5">{p.category}</td>
                              <td className="p-2.5">
                                <button
                                  onClick={() => setUploadSelectedProduct(p.id)}
                                  className="text-[#000aff] hover:underline font-medium cursor-pointer"
                                >
                                  Cargar Foto
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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

