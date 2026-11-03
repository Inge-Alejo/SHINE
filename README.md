# SHINE FRAGANCIAS — PLATAFORMA CLOUD 100% EN LÍNEA

**SHINE Fragancias** es una plataforma web moderna, elegante, minimalista y administrable para la exhibición y comercialización de fragancias de alta gama, inspiraciones exclusivas, perfumes árabes, perfumería nicho y piezas bajo encargo.

Está arquitecturada para operar **100% en la nube**, con despliegue en **Vercel**, base de datos serverless en tiempo real (**Vercel Postgres / Neon**), funciones serverless (`/api/*`), integración con la **API de Google Gemini** y panel de administración en tiempo real.

---

## 💎 1. IDENTIDAD VISUAL Y DIRECTRICES DE DISEÑO

El diseño implementa rigurosamente los principios de `DESIGN.md`:
* **Estética**: Atelier editorial y galería de esculturas olfativas sobre superficies neutras (*Plaster* `#ecedee`).
* **Paleta Cromática**:
  - `Electric Cobalt` (`#000aff`): Señal cromática única para badges activos (*New In*, Colección 2026), píldoras de navegación y botones de compra.
  - `Pale Iris` (`#e5e7ff`): Tintes sutiles y estados secundarios.
  - `Ink Black` (`#111111`): Texto principal, tipografía de alta jerarquía, botones de encargo y footer profundo.
  - `Plaster` (`#ecedee`): Superficie elevada de las tarjetas de producto sin sombras pesadas.
  - `Slate` / `Fog` (`#a1a4aa` / `#d7d7d7`): Líneas de división y bordes precisos.
* **Fotografía de Frascos**: Frascos de perfumes aislados con **fondo 100% transparente (canal alfa PNG/WebP)** para flotar naturalmente sobre el mármol y las tarjetas Plaster.
* **Tipografías**:
  - Sans principal geométrica con tracking editorial (`-0.04em`).
  - Monospace técnica (`Space Mono`) para precios en COP, metadatos y créditos de casa (*By {casa}*).
* **Radios**: `10px` para tarjetas, botones e inputs; `30px` (pills) para badges de estado.

---

## 🏛️ 2. ESTRUCTURA COMERCIAL Y REGLAS DE NEGOCIO

El catálogo está estrictamente segmentado en tres categorías con comportamientos comerciales diferenciados:

| Categoría | Modalidad Comercial | Precios Visibles | Presentaciones ml | Carrito de Compras | Acción Comercial en Web |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Inspiraciones** | Venta directa con catálogo | ✅ Sí ($17k, $24k, $37k) | ✅ 30, 60 y 100 ml | ✅ Habilitado | Agregar al carrito / Pedido por WhatsApp |
| **Originales** | Piezas originales bajo encargo | ❌ No | ❌ No | ❌ Deshabilitado | Consultar disponibilidad vía WhatsApp |
| **Perfumería 1.1** | Alta fidelidad bajo encargo | ❌ No | ❌ No | ❌ Deshabilitado | Consultar disponibilidad vía WhatsApp |

### Subcategorías de Inspiraciones
1. **Árabes**: Lattafa, Armaf, Afnan, Al Haramain, Orientica, Rasasi, Bharara, Korbaj, Jo Milano, French Avenue.
2. **Nicho**: Creed, Parfums de Marly, Maison Francis Kurkdjian, Xerjoff, Montale, Initio, Le Labo, Tiziana Terenzi, Mancera.
3. **Diseñador**: Dior, Chanel, Carolina Herrera, Paco Rabanne, Versace, Giorgio Armani, Yves Saint Laurent, Tom Ford, Hugo Boss, Dolce & Gabbana, Jean Paul Gaultier, Lacoste, etc.

### Tabla Oficial de Tarifas (Inspiraciones)
* **30 ml**: `$17.000 COP`
* **60 ml**: `$24.000 COP`
* **100 ml**: `$37.000 COP`

> **Sincronización en Tiempo Real**: Estos valores están centralizados en la tabla `settings` de la base de datos Postgres. Si el administrador modifica las tarifas en el panel, se reflejan instantáneamente en cualquier celular, tablet o computador sin retrasos ni cachés estáticas.

---

## 📱 3. PEDIDOS Y CONTACTO VÍA WHATSAPP

* **Número Oficial**: `+57 310 5964755` (formato internacional: `573105964755`)
* **Enlace base**: `https://wa.me/573105964755?text=` (codificado con `encodeURIComponent`)
* **Políticas de transparencia**: En ninguna pantalla se afirma que el pedido está pagado o cerrado por el simple hecho de abrir WhatsApp. La confirmación final, disponibilidad de entrega y medios de pago se acuerdan en el chat.

---

## ☁️ 4. ARQUITECTURA DE PRODUCCIÓN (VERCEL + POSTGRES)

```
SHINE Fragancias (Vercel Cloud Native)
├── /frontend               -> React 19 + Vite + TailwindCSS v4
│   ├── /public/uploads     -> Frascos PNG sin fondo servidos vía Vercel Global CDN
│   └── /src/services/api.js-> Conexión en tiempo real con directivas no-cache
├── /api                    -> Vercel Serverless Functions (Node.js ESM)
│   ├── db.js               -> Conector a Vercel Postgres / Neon
│   ├── products.js         -> Catálogo en tiempo real, filtros y CRUD
│   ├── settings.js         -> Tarifas comerciales y WhatsApp en vivo
│   ├── auth.js             -> Login seguro y verificación JWT
│   ├── dashboard.js        -> Métricas y KPIs en vivo
│   ├── sheets-sync.js      -> Integración con Google Sheets
│   ├── image-manager.js    -> Gestión de fotografías
│   └── gemini.js           -> Enriquecimiento olfativo y búsqueda IA
├── /scripts
│   ├── init_vercel_postgres.mjs -> Inicializador automático de base de datos
│   └── sync_gemini_images.mjs   -> Pipeline de scrapeo y frascos con Gemini
└── vercel.json             -> Enrutamiento y cabeceras anti-caché
```

---

## 🚀 5. GUÍA DE DESPLIEGUE PASO A PASO EN VERCEL

### Paso 1: Conectar el Repositorio de GitHub
1. Ingresa a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub (`Inge-Alejo`).
2. Haz clic en **"Add New..."** > **"Project"**.
3. Selecciona el repositorio: `Inge-Alejo/SHINE`.
4. En la configuración del proyecto:
   - **Framework Preset**: `Vite` (o `Other`).
   - **Root Directory**: `./` (la raíz del repositorio).
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist`

### Paso 2: Crear la Base de Datos Vercel Postgres (Neon)
1. En el dashboard de tu proyecto en Vercel, ve a la pestaña **Storage**.
2. Haz clic en **"Create Database"** y elige **Postgres (Neon)**.
3. Acepta los términos del plan gratuito *Hobby*.
4. Selecciona la región más cercana (ej. `us-east-1` Washington D.C. o la recomendada).
5. Haz clic en **"Create & Connect"**. Vercel inyectará automáticamente `POSTGRES_URL` en las variables de entorno de tu proyecto.

### Paso 3: Inicializar las Tablas y el Catálogo en Postgres
Desde tu terminal o consola local, ejecuta el script de inicialización con la URL de tu base de datos de Vercel:
```bash
node scripts/init_vercel_postgres.mjs "postgres://default:xxx@ep-xxx.us-east-1.postgres.vercel-storage.com/verceldb?sslmode=require"
```
Este script:
1. Crea todas las tablas (`products`, `settings`, `admin_users`, `sheets_config`, etc.).
2. Inserta automáticamente los **394 perfumes** extraídos de la `PRESENTACION 2026 (1).pdf` con sus categorías (Árabes, Nicho, Diseñador).
3. Configura las tarifas de $17k, $24k y $37k COP y el número oficial de WhatsApp.
4. Crea el usuario administrador con contraseña encriptada.

### Paso 4: Configurar Variables de Entorno en Vercel
En **Project Settings > Environment Variables**, agrega:
* `ADMIN_USERNAME`: `admin` (o tu usuario de preferencia).
* `ADMIN_PASSWORD`: `shine2026!` (o tu clave de preferencia).
* `JWT_SECRET`: Una clave criptográfica aleatoria segura.
* `GEMINI_API_KEY`: Tu clave de la API de Google Gemini (obtenida gratis en [aistudio.google.com](https://aistudio.google.com)).

---

## 🤖 6. AUTOMATIZACIÓN DE CATÁLOGO CON GEMINI API

El proyecto incluye scripts nativos para enriquecer perfumes y homogeneizar el estilo visual:
* **Script**: `node scripts/sync_gemini_images.mjs`
* **Capacidades**:
  - Consulta la ficha técnica oficial del perfume con `gemini-2.5-flash`.
  - Extrae notas de salida, corazón y fondo.
  - Describe la geometría del frasco y busca la referencia oficial para corte sin fondo.
  - Alimenta la base de datos de forma automática o para aprobación del administrador.

---

## 🔐 7. PANEL ADMINISTRATIVO Y SEGURIDAD

* **Acceso**: Icono de escudo en el Header o pie de página.
* **Seguridad visual**: El formulario de acceso es limpio y no expone contraseñas ni nombres de usuario predeterminados.
* **Módulos Disponibles**:
  1. **Dashboard**: Indicadores KPI en tiempo real actualizados directamente desde Postgres.
  2. **Tarifas & WhatsApp**: Cambio de tarifas y números de WhatsApp en vivo.
  3. **Google Sheets**: Módulo de sincronización opcional con hojas de cálculo.
  4. **Gestión de Fotografías**: Carga manual de fotografías y validación de siluetas.

---

## 📦 8. REPOSITORIO GITHUB OFICIAL

* **Repositorio**: `Inge-Alejo/SHINE`
* **Rama Principal**: `main`
* **Licencia**: Propietaria — SHINE Fragancias 2026.
