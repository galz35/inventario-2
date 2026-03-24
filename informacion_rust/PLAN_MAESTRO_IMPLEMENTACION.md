# ═══════════════════════════════════════════════════════════════
# PLAN MAESTRO DE IMPLEMENTACIÓN
# Sistema de Inventario RRHH — Claro Regional
# ═══════════════════════════════════════════════════════════════
# Fecha: 2026-03-05
# Autor: Equipo de Desarrollo
# Versión: 1.0
# ═══════════════════════════════════════════════════════════════

---

# ÍNDICE
1. Resumen Ejecutivo
2. Decisiones Arquitectónicas Confirmadas
3. FASE 1 — CRÍTICO (Sin esto no hay sistema)
4. FASE 2 — MEDIO (Funcionalidad completa)
5. FASE 3 — BAJO (Mejoras y optimización)
6. Detalle de cada Tarea
7. Scripts SQL Disponibles
8. Documentación Técnica Disponible
9. Notas Importantes y Cambios de Última Hora

---

# ═══════════════════════════════════════════════════════════════
# 1. RESUMEN EJECUTIVO
# ═══════════════════════════════════════════════════════════════

Sistema web de inventario para RRHH de Claro (multi-país).
- Gestionar: Artículos (Ropa, EPP, Medicamentos, Eventos), Almacenes, Solicitudes, Despachos.
- Usuarios: Bodegueros, RRHH, Administradores. NO técnicos. Necesitan algo SIMPLE.
- Backend: Rust (Axum) — velocmáximo, mínimo CPU/RAM.
- Frontend: Maud (HTML en Rust) + HTMX — 1 sola página con tabs.
- Base de Datos: SQL Server (190.56.16.85) — 1 sola BD con campo pais.
- Toda lógica de negocio vive en Stored Procedures. Rust SOLO llama SPs.
- Diseño: ROJO (#e1251b) / BLANCO / NEGRO. Corporativo, simple, limpio.
- Fuente: Segoe UI / system-ui (sin Google Fonts externo).
- Empleados: Tabla EMP2024 migrada manualmente. Vista vw_EmpleadosActivos.

---

# ═══════════════════════════════════════════════════════════════
# 2. DECISIONES ARQUITECTÓNICAS CONFIRMADAS
# ═══════════════════════════════════════════════════════════════

## 2.1 Base de Datos
- DECISIÓN FINAL: **1 sola BD** llamada `Inventario_RRHH` (pendiente confirmar nombre)
  en servidor 190.56.16.85:1433.
- Las tablas que necesiten aislamiento por país tendrán columna `Pais VARCHAR(2)`.
- SPs reciben `@Pais` donde sea necesario para filtrar.
- CAMBIO vs diseño original: Se descartó el enfoque multi-BD (Inventario_NI, Inventario_GT).
  Razón: usuario prefiere simplicidad con 1 sola BD.

## 2.2 Conexión SQL Server
```
Host:     190.56.16.85
Puerto:   1433
Usuario:  sa
Password: TuPasswordFuerte!2026
BD:       Inventario_RRHH ya esta creado.
Encrypt:  false
TrustCert: true
```
- NOTA: El servidor ya tiene BD `Bdplaner` y `Bdplaner_Test` para otros proyectos.
  NO tocar esas bases de datos.

## 2.3 Tabla EMP2024
- Se crea localmente en la misma BD del inventario.
- El usuario migrará datos manualmente (posiblemente desde SIGHO1).
- Campos clave: carnet (PK), nombre_completo, correo, cargo, empresa, pais,
  Gender, telefono, fechabaja, carnet_jefe1, nom_jefe1, OGERENCIA, oDEPARTAMENTO, foto.
- Vista `dbo.vw_EmpleadosActivos`: filtra empleados con fechabaja IS NULL o < 1900-01-01.
- SPs: Emp_Buscar(@Query, @Pais), Emp_Obtener(@Carnet).

## 2.4 Diseño UI
- NO futurista. NO glassmorphism. NO dark mode.
- ROJO corporativo Claro (#e1251b), BLANCO fondo, texto NEGRO.
- Fuente: Segoe UI, system-ui, sans-serif.
- 1 SOLA PÁGINA con tabs estilo el diseño viejo que ya tienen (cshtml):
  Tab 1: Solicitudes
  Tab 2: Monitor Despachos (Bodega)
  Tab 3: Inventario Físico
  Tab 4: Kardex
- Lo más simple posible. Usuarios no técnicos. Si 1 página resuelve todo, genial.
- Referencia de diseño: El usuario proporcionó un cshtml existente con estilo similar
  (hero banner, KPI cards, tabs sticky, chips de filtro, FAB button, modales).

## 2.5 Artículos: 4 Tipos
- ROPA: Talla + Sexo obligatorios. Sin lote.
- EPP: Talla + Sexo opcionales. Sin lote.
- MEDICAMENTO: Lote + Fecha Vencimiento OBLIGATORIOS. Despacho FEFO automático.
- EVENTO: Sin talla, sin lote. Items para eventos especiales.

## 2.6 Flujo de Solicitud
```
Empleado crea solicitud → Estado: PENDIENTE
     ↓
jefe1 o el bodeguero aprueba → Estado: APROBADA (CantidadAprobada = CantidadSolicitada)
     ↓
Bodeguero despacha → Estado: ATENDIDA (si todo) o PARCIAL (si faltan items)
     ↓
RRHH puede rechazar en cualquier punto antes de atendida → Estado: RECHAZADA
```

## 2.7 Stock: Reglas Críticas
- NUNCA stock negativo (CHECK constraint + validación en SP).
- FEFO (First Expired, First Out) para medicamentos = se despacha primero el lote
  con fecha de vencimiento más próxima.
- Merma: Resta stock. Requiere lote si es medicamento.
- Entrada: Suma stock. Crea variante si no existe. Requiere lote si es medicamento.

---

# ═══════════════════════════════════════════════════════════════
# 3. FASE 1 — CRÍTICO ⚡ (Sin esto no hay sistema)
# ═══════════════════════════════════════════════════════════════
# Objetivo: Tener el sistema funcionando end-to-end con las funciones básicas.
# Estimado: 3-5 días de desarrollo.

## TAREA 1.1: Crear Base de Datos y Tablas [SQL Server]
- Prioridad: ⚡ CRÍTICO
- Tipo: Base de datos
- Estado: SCRIPTS LISTOS (en sql_scripts/)
- Acción:
  1. Conectar a 190.56.16.85 con sa
  2. Inventario_RRHH ya existe usalo esta vacio
  3. Ejecutar 00_EMP2024_LOCAL.sql (tabla + índices + vista + SPs empleados)
  4. Ejecutar 01_schema.sql (AJUSTAR: agregar columna Pais a tablas que lo necesiten)
  5. Ejecutar 02_sps.sql (AJUSTAR: agregar @Pais a SPs que lo necesiten)
  6. Ejecutar 03_seed.sql (datos iniciales: almacén, artículos ejemplo, roles)
- CAMBIO NECESARIO:
  Agregar `Pais VARCHAR(2) NOT NULL DEFAULT 'NI'` a:
    - Almacenes
    - Solicitudes (ya tiene referencia via EmpleadoCarnet → EMP2024.pais)
    - MovimientosInventario (hereda de la solicitud o del usuario)
  Los SPs que listen datos deben recibir @Pais y filtrar.
  DECISIÓN: ¿Filtrar Almacenes por país o son compartidos?
  → Probablemente por país (cada país tiene sus propias bodegas).
- Validación: Ejecutar 04_tests.sql para verificar FEFO y no-negativos.
- Dependencias: Ninguna.

## TAREA 1.2: Inicializar Proyecto Rust [Cargo]
- Prioridad: ⚡ CRÍTICO
- Tipo: Código Rust
- Estado: POR HACER
- Acción:
  1. `cargo init` en `d:\inventario rrhh\` (o subdirectorio)
  2. Configurar Cargo.toml con workspace (ver 09_estructura_proyecto.md)
  3. Agregar dependencias principales (ver 13_catalogo_dependencias.md):
     axum, tokio, tiberius, bb8, bb8-tiberius, maud, serde, serde_json,
     tower-http, tracing, tracing-subscriber, dotenvy, thiserror, chrono
  4. Crear archivo .env con la conexión a SQL Server
  5. Crear .gitignore (target/, .env)
  6. Verificar `cargo build` compila sin errores
- Dependencias: Ninguna.

## TAREA 1.3: Conexión a SQL Server (Pool) [Rust]
- Prioridad: ⚡ CRÍTICO
- Tipo: Código Rust
- Estado: POR HACER
- Acción:
  1. Crear módulo db/pool.rs con bb8 + Tiberius
  2. Leer config desde .env (dotenvy)
  3. Implementar pool de conexiones con retry
  4. Test: conectar y ejecutar `SELECT 1` para verificar
- Código clave:
  ```rust
  let config = tiberius::Config::from_ado_string(&connection_string)?;
  let mgr = bb8_tiberius::ConnectionManager::new(config);
  let pool = bb8::Pool::builder().max_size(10).build(mgr).await?;
  ```
- Dependencias: Tarea 1.1 (BD creada)

## TAREA 1.4: Servidor Axum Básico [Rust]
- Prioridad: ⚡ CRÍTICO
- Tipo: Código Rust
- Estado: POR HACER
- Acción:
  1. Crear main.rs con Axum + Tokio
  2. Definir AppState (pool de BD)
  3. Configurar logging (tracing)
  4. Ruta de health check: GET /health → "ok"
  5. Servir archivos estáticos (CSS, JS) desde /static/
  6. Verificar que arranca en puerto 3000
- Dependencias: Tarea 1.3

## TAREA 1.5: Endpoints API — Lectura [Rust]
- Prioridad: ⚡ CRÍTICO
- Tipo: Código Rust
- Estado: POR HACER
- Acción: Implementar los endpoints de LECTURA (solo llaman SPs con query):
  1. GET /api/v1/almacenes → EXEC Inv_ListarAlmacenes
  2. GET /api/v1/articulos → EXEC Inv_ListarArticulos
  3. GET /api/v1/inventario?idAlmacen=X → EXEC Inv_InventarioPorAlmacen @IdAlmacen=X
  4. GET /api/v1/lotes?idAlmacen=X&idArticulo=Y → EXEC Inv_LotesPorArticulo
  5. GET /api/v1/empleados?query=X → EXEC Emp_Buscar @Query=X
  6. GET /api/v1/empleados/{carnet} → EXEC Emp_Obtener @Carnet=X
  7. GET /api/v1/solicitudes?estado=X → EXEC Sol_Listar
  8. GET /api/v1/bodega/pendientes → EXEC Bod_Pendientes
  9. GET /api/v1/kardex?... → EXEC Kdx_Listar
  10. GET /api/v1/alertas/vencimiento → EXEC Inv_AlertasVencimiento
  11. GET /api/v1/alertas/stock-bajo → EXEC Inv_AlertasStockBajo
- Formato respuesta: { "ok": true, "data": [...], "error": null }
- Cada endpoint es una función que:
  1. Recibe parámetros de query string
  2. Obtiene conexión del pool
  3. Ejecuta SP con parámetros
  4. Mapea filas a structs con serde
  5. Devuelve JSON
- Dependencias: Tarea 1.4

## TAREA 1.6: Endpoints API — Escritura [Rust]
- Prioridad: ⚡ CRÍTICO
- Tipo: Código Rust
- Estado: POR HACER
- Acción: Implementar endpoints de ESCRITURA (llaman SPs con body JSON):
  1. POST /api/v1/solicitudes → Sol_CrearSolicitud (body: carnet, motivo, detallesJson)
  2. POST /api/v1/solicitudes/{id}/aprobar → Sol_Aprobar (body: carnetRRHH)
  3. POST /api/v1/solicitudes/{id}/rechazar → Sol_Rechazar (body: carnetRRHH, motivo)
  4. POST /api/v1/inventario/movimiento → Inv_Mov_EntradaMerma (body: idAlmacen, tipo, etc.)
  5. POST /api/v1/bodega/despachar → Bod_Despachar (body: idAlmacen, idSolicitud, etc.)
- Manejo de errores: Si SP hace THROW, capturar y devolver ok=false con mensaje.
- Dependencias: Tarea 1.5

## TAREA 1.7: Página Principal HTML (Maud + HTMX) [Rust/Frontend]
- Prioridad: ⚡ CRÍTICO
- Tipo: Código Rust + HTML
- Estado: POR HACER
- Acción:
  1. Crear layout base con Maud: HTML, head (CSS), body
  2. Header/Hero con KPIs (Pendientes, Por Atender)
  3. Selector de Almacén (dropdown)
  4. 4 Tabs: Solicitudes | Bodega | Inventario | Kardex
  5. Cada tab carga su contenido via HTMX (hx-get, hx-target)
  6. Estilo: ROJO, BLANCO, NEGRO. Segoe UI. Corporativo.
- HTMX endpoints (devuelven fragmentos HTML, no JSON):
  GET /fragments/solicitudes → tabla de solicitudes
  GET /fragments/bodega → tabla pendientes bodega
  GET /fragments/inventario?idAlmacen=X → tabla inventario
  GET /fragments/kardex?... → tabla kardex
- Dependencias: Tarea 1.4

## TAREA 1.8: CSS Estilo Corporativo [Frontend]
- Prioridad: ⚡ CRÍTICO
- Tipo: CSS
- Estado: POR HACER
- Acción:
  1. Crear archivo static/css/styles.css
  2. Variables: --rojo: #e1251b, --primario: #1a252f, --blanco: #fff, --gris: #f4f7f6
  3. Estilos para: hero, kpi cards, tabs, tablas, botones, modales, chips, FAB
  4. Responsive básico
  5. DECISIÓN: ¿Usar Tailwind CSS standalone o CSS puro?
     → Recomendación: CSS PURO para este proyecto.
       Es más simple, no necesita build tool, y el diseño es corporativo sencillo.
       El cshtml de referencia ya tiene CSS puro y funciona bien.
- Dependencias: Ninguna

---

# ═══════════════════════════════════════════════════════════════
# 4. FASE 2 — MEDIO 🔧 (Funcionalidad completa)
# ═══════════════════════════════════════════════════════════════
# Objetivo: Todas las funcionalidades implementadas y usables.
# Estimado: 3-5 días adicionales.

## TAREA 2.1: Modal Crear Solicitud [Frontend + API]
- Prioridad: 🔧 MEDIO
- Tipo: Código Rust + HTML
- Acción:
  1. Modal con campos: Carnet empleado (autocomplete), Motivo
  2. Buscador de artículos con autocomplete
  3. Selector de Talla y Sexo (carga variantes del artículo)
  4. Tabla temporal de items a solicitar
  5. Botón Guardar → POST /api/v1/solicitudes
  6. Al guardar: cerrar modal, refrescar tabla solicitudes y KPIs
- Autocomplete empleados: Input que al escribir llama GET /api/v1/empleados?query=X
- Autocomplete artículos: Input que filtra la lista de artículos cargada al inicio
- Dependencias: Tarea 1.5, 1.6, 1.7

## TAREA 2.2: Acciones de Solicitud (Aprobar/Rechazar/Ver Detalle) [Frontend + API]
- Prioridad: 🔧 MEDIO
- Tipo: Código Rust + HTML
- Acción:
  1. Botón "Aprobar" en solicitudes Pendientes → POST aprobar
  2. Botón "Rechazar" con campo motivo → POST rechazar
  3. Botón "Ver Detalle" → Modal con tabla de items solicitados
  4. Chips de filtro por estado (Todas, Pendientes, Aprobadas, etc.)
  5. Filtro por rango de fechas
- Dependencias: Tarea 2.1

## TAREA 2.3: Monitor de Bodega / Despacho [Frontend + API]
- Prioridad: 🔧 MEDIO
- Tipo: Código Rust + HTML
- Acción:
  1. Tab Bodega muestra solicitudes Aprobadas/Parciales
  2. Botón "Atender" abre modal con detalle de la solicitud
  3. Modal muestra: artículo, cantidad aprobada, entregada, pendiente, stock disponible
  4. Inputs para cantidad a entregar por cada item
  5. Botón "Despachar" → POST /api/v1/bodega/despachar
  6. Al despachar: cerrar modal, refrescar tabla y KPIs
  7. El SP maneja FEFO automáticamente para medicamentos
- Dependencias: Tarea 1.5, 1.6, 1.7

## TAREA 2.4: Gestión de Inventario (Entradas/Mermas) [Frontend + API]
- Prioridad: 🔧 MEDIO
- Tipo: Código Rust + HTML
- Acción:
  1. Tab Inventario muestra stock por almacén (tabla con artículo, talla, sexo, stock)
  2. Chips filtro por tipo (Todos, Ropa, EPP, Medicamentos, Evento)
  3. Botón "Ingreso" → Modal para entrada de stock
  4. Botón "Merma" → Modal para merma de stock
  5. Si artículo es MEDICAMENTO: mostrar campos Lote y Fecha Vencimiento (obligatorios)
  6. Si NO es medicamento: ocultar campos de lote
  7. POST /api/v1/inventario/movimiento
- Dependencias: Tarea 1.5, 1.6, 1.7

## TAREA 2.5: Kardex (Historial de Movimientos) [Frontend + API]
- Prioridad: 🔧 MEDIO
- Tipo: Código Rust + HTML
- Acción:
  1. Tab Kardex con filtros: Fecha Desde, Fecha Hasta, Tipo (Entrada/Salida/Merma)
  2. Botón "Buscar" → GET /api/v1/kardex
  3. Tabla con: Fecha, Tipo, Artículo, Talla, Sexo, Cantidad, Lote, Vencimiento,
     Destino, Responsable, Comentario
  4. Colores: Entrada = verde, Salida = rojo, Merma = naranja
- Dependencias: Tarea 1.5, 1.7

## TAREA 2.6: Gestión de Artículos (CRUD) [Frontend + API]
- Prioridad: 🔧 MEDIO
- Tipo: SQL + Rust + HTML
- Acción:
  1. NECESITA SP NUEVO: Art_Crear(@Codigo, @Nombre, @Tipo, @Unidad)
  2. NECESITA SP NUEVO: Art_Editar(@IdArticulo, @Nombre, @Tipo, @Unidad, @Activo)
  3. Botón "Nuevo Artículo" en tab Inventario → Modal
  4. Campos: Código, Nombre, Tipo (dropdown: ROPA/EPP/MEDICAMENTO/EVENTO), Unidad
  5. Editar artículo existente (click en fila?)
- NOTA: Los SPs originales no incluyen CRUD de artículos. Hay que crearlos.
- Dependencias: Tarea 1.1

## TAREA 2.7: Gestión de Almacenes (CRUD) [Frontend + API]
- Prioridad: 🔧 MEDIO
- Tipo: SQL + Rust + HTML
- Acción:
  1. NECESITA SP NUEVO: Alm_Crear(@Codigo, @Nombre, @Pais)
  2. NECESITA SP NUEVO: Alm_Editar(@IdAlmacen, @Nombre, @Activo)
  3. Puede ser una sección en la misma página o un modal desde el selector de almacén
- Dependencias: Tarea 1.1

## TAREA 2.8: Alertas (Vencimiento y Stock Bajo) [Frontend]
- Prioridad: 🔧 MEDIO
- Tipo: Código Rust + HTML
- Acción:
  1. En el Hero/KPI area, mostrar indicadores de alertas
  2. Click en alerta → Modal o sección mostrando artículos con stock bajo
  3. Click en alerta vencimiento → Medicamentos próximos a vencer
  4. Colores de alerta: amarillo (atención), rojo (urgente)
- Dependencias: Tarea 1.5, 1.7

---

# ═══════════════════════════════════════════════════════════════
# 5. FASE 3 — BAJO 📋 (Mejoras y optimización)
# ═══════════════════════════════════════════════════════════════
# Objetivo: Pulir el sistema, seguridad, reportes.
# Estimado: 2-4 días adicionales.

## TAREA 3.1: Autenticación (Login) [Rust + SQL]
- Prioridad: 📋 BAJO (puede funcionar sin login al inicio)
- Tipo: SQL + Rust + HTML
- Acción:
  1. Página de login con carnet + contraseña (o solo carnet para v1)
  2. Verificar carnet contra EMP2024 + RolesSistema
  3. JWT o cookie de sesión
  4. Middleware que protege todas las rutas
  5. Mostrar nombre del usuario logueado en el header
  6. Filtrar funcionalidad por rol:
     ADMIN: todo
     RRHH_APRUEBA: puede aprobar/rechazar solicitudes
     BODEGA: puede despachar, hacer entradas/mermas
- NOTA: Para v1 puede funcionar sin auth, con el carnet en un campo visible.
  La auth se agrega después para producción.
- Dependencias: Tarea 1.4

## TAREA 3.2: Middleware de País [Rust]
- Prioridad: 📋 BAJO
- Tipo: Código Rust
- Acción:
  1. Selector de país en la UI (dropdown con banderas: 🇳🇮 NI, 🇬🇹 GT, etc.)
  2. El pais seleccionado se envía como cookie o header X-Pais
  3. Middleware Axum extrae el pais y lo inyecta como Extension
  4. Los handlers lo pasan a los SPs como @Pais
- NOTA: En 1 sola BD esto simplemente filtra. No cambia la conexión.
- Dependencias: Tarea 1.4

## TAREA 3.3: Optimización de Compilación [Rust]
- Prioridad: 📋 BAJO
- Tipo: Configuración
- Acción:
  1. Configurar release profile en Cargo.toml (ver 03_optimizacion_compilacion.md):
     opt-level = 3, lto = true, codegen-units = 1, panic = "abort", strip = true
  2. Instalar mimalloc como allocator global
  3. Habilitar compresión Brotli con tower-http::CompressionLayer
  4. Medir RAM/CPU en producción vs desarrollo
  5. Comparar con el sistema C# actual (si es posible)
- Dependencias: Todo lo anterior

## TAREA 3.4: Seguridad Avanzada [Rust]
- Prioridad: 📋 BAJO
- Tipo: Código Rust
- Acción:
  1. Rate limiting con tower
  2. CORS configurado correctamente
  3. Límite de tamaño de request body
  4. Logging de auditoría (tracing → archivo)
  5. Headers de seguridad (X-Frame-Options, CSP, etc.)
  6. Contraseñas con Argon2 (si se implementa auth con password)
- Dependencias: Tarea 3.1

## TAREA 3.5: Reportes y Exportación [Rust + Frontend]
- Prioridad: 📋 BAJO
- Tipo: Código Rust + HTML
- Acción:
  1. Exportar tablas a CSV/Excel
  2. Reporte consolidado por país
  3. Reporte de artículos más solicitados
  4. Reporte de movimientos por empleado
- Dependencias: Todo lo anterior

## TAREA 3.6: API JSON para Flutter [Rust]
- Prioridad: 📋 BAJO (explícitamente opcional por el usuario)
- Tipo: Código Rust
- Acción:
  1. Los endpoints /api/v1/* ya devuelven JSON
  2. Solo falta: documentar con OpenAPI (utoipa)
  3. Agregar CORS para permitir llamadas desde Flutter
  4. Autenticación JWT para la API móvil
- NOTA: El usuario dijo que Flutter es "opcional y futuro".
- Dependencias: Todo lo anterior

## TAREA 3.7: Docker / Despliegue [Infraestructura]
- Prioridad: 📋 BAJO
- Tipo: Infraestructura
- Acción:
  1. Dockerfile multi-stage para compilar Rust
  2. O simplemente: compilar en release y copiar el .exe al servidor
  3. Configurar como servicio de Windows (si el servidor es Windows)
  4. Reverse proxy con IIS o Nginx
- Dependencias: Todo lo anterior

---

# ═══════════════════════════════════════════════════════════════
# 6. DETALLE TÉCNICO POR COMPONENTE
# ═══════════════════════════════════════════════════════════════

## 6.1 Estructura del Proyecto Rust (Simplificada)
Dado que el usuario quiere simplicidad, usaremos un SOLO crate en vez de workspace:

```
inventario-rrhh/
├── Cargo.toml
├── .env                    ← Conexión a SQL Server
├── .gitignore
├── src/
│   ├── main.rs             ← Arranca Axum + Tokio
│   ├── config.rs           ← Lee .env, struct AppConfig
│   ├── db.rs               ← Pool bb8 + helpers para llamar SPs
│   ├── error.rs            ← AppError + IntoResponse
│   ├── models/
│   │   ├── mod.rs
│   │   ├── empleado.rs     ← Structs Empleado, EmpleadoBusqueda
│   │   ├── articulo.rs     ← Struct Articulo, ArticuloVariante
│   │   ├── solicitud.rs    ← Struct Solicitud, SolicitudDetalle
│   │   ├── inventario.rs   ← Struct StockItem, Lote, Movimiento
│   │   └── almacen.rs      ← Struct Almacen
│   ├── handlers/
│   │   ├── mod.rs
│   │   ├── empleados.rs    ← GET /api/v1/empleados
│   │   ├── articulos.rs    ← GET /api/v1/articulos
│   │   ├── inventario.rs   ← GET+POST /api/v1/inventario
│   │   ├── solicitudes.rs  ← GET+POST /api/v1/solicitudes
│   │   ├── bodega.rs       ← GET+POST /api/v1/bodega
│   │   ├── kardex.rs       ← GET /api/v1/kardex
│   │   └── alertas.rs      ← GET /api/v1/alertas
│   ├── pages/
│   │   ├── mod.rs
│   │   ├── layout.rs       ← Layout base Maud (head, hero, tabs)
│   │   ├── home.rs         ← Página principal con las 4 tabs
│   │   └── fragments.rs    ← Fragmentos HTML para HTMX
│   └── middleware.rs       ← País, Auth (futuro)
├── static/
│   ├── css/
│   │   └── styles.css      ← Estilos corporativos
│   ├── js/
│   │   └── htmx.min.js     ← HTMX (14 KB, descargado)
│   └── img/
│       └── logo-claro.svg  ← Logo (si aplica)
└── informacion_rust/       ← Toda la documentación (ya existe)
```

## 6.2 Archivo .env
```env
MSSQL_HOST=190.56.16.85
MSSQL_PORT=1433
MSSQL_USER=sa
MSSQL_PASSWORD=TuPasswordFuerte!2026
MSSQL_DATABASE=Inventario_RRHH
MSSQL_ENCRYPT=false
MSSQL_TRUST_CERT=true
SERVER_PORT=3000
LOG_LEVEL=info
```

## 6.3 Patrón de cada Handler (ejemplo)
```rust
// handlers/inventario.rs
pub async fn listar_inventario(
    State(state): State<AppState>,
    Query(params): Query<InvParams>,
) -> Result<Json<ApiResponse<Vec<StockItem>>>, AppError> {
    let mut conn = state.db.get().await?;

    let stream = conn.query(
        "EXEC dbo.Inv_InventarioPorAlmacen @IdAlmacen=@P1",
        &[&params.id_almacen],
    ).await?;

    let rows = stream.into_first_result().await?;
    let items: Vec<StockItem> = rows.iter().map(|r| StockItem::from_row(r)).collect();

    Ok(Json(ApiResponse::ok(items)))
}
```

## 6.4 Formato ApiResponse
```rust
#[derive(Serialize)]
pub struct ApiResponse<T: Serialize> {
    pub ok: bool,
    pub data: Option<T>,
    pub error: Option<ApiError>,
}

#[derive(Serialize)]
pub struct ApiError {
    pub code: String,
    pub message: String,
}
```

## 6.5 Diseño Existente (Referencia)
El usuario ya tiene un cshtml funcional con jQuery + DataTables. Elementos clave a replicar:
- Hero banner oscuro con KPIs (Pendientes por Aprobar, Pendientes Bodega)
- Selector de almacén en el hero
- Tabs sticky con navegación tabs al estilo nav-tabs
- Chips de filtro por estado
- Tablas con DataTables (búsqueda, paginación)
- Modales para crear solicitud, detalle, atender despacho, movimiento
- Autocomplete para empleados y artículos
- FAB button (botón flotante rojo)
- NOTA: En Rust con Maud+HTMX replicaremos esto sin jQuery/DataTables.
  Usaremos HTMX para interactividad y tablas HTML nativas con paginación server-side.

---

# ═══════════════════════════════════════════════════════════════
# 7. SCRIPTS SQL DISPONIBLES
# ═══════════════════════════════════════════════════════════════

| Archivo | Descripción | Estado |
| :--- | :--- | :--- |
| sql_scripts/00_crear_bds.sql | Crear BDs por país | DESCARTADO (1 sola BD) |
| sql_scripts/00_EMP2024_LOCAL.sql | Tabla EMP2024 + índices + vista + SPs empleados | LISTO |
| sql_scripts/01_schema.sql | Tablas inventario (Almacenes, Articulos, Stock, Solicitudes, Kardex, Roles) | NECESITA AJUSTE (agregar Pais) |
| sql_scripts/02_sps.sql | Todos los Stored Procedures | NECESITA AJUSTE (agregar @Pais) |
| sql_scripts/03_seed.sql | Datos iniciales de prueba | LISTO |

NOTA: Ajustar 01_schema.sql y 02_sps.sql para soportar 1 BD con campo pais
antes de ejecutar en el servidor.

---

# ═══════════════════════════════════════════════════════════════
# 8. DOCUMENTACIÓN TÉCNICA DISPONIBLE
# ═══════════════════════════════════════════════════════════════

| # | Archivo | Contenido |
| :--- | :--- | :--- |
| 00 | guia_aprendizaje_profundo.md | Conceptos core de Rust |
| 01 | arquitectura_maxima_velocidad.md | SSR + HTMX + Maud |
| 02 | optimizacion_base_datos.md | Pool de conexiones, Keyset Pagination |
| 03 | optimizacion_compilacion.md | Cargo.toml release profile, LTO, mimalloc |
| 04 | seguridad_rendimiento.md | Argon2, JWT, TLS, rate limiting |
| 05 | arquitectura_multi_pais.md | Multi-tenancy (AJUSTAR: ahora es 1 BD) |
| 06 | roles_y_permisos_casbin.md | RBAC por rol y país |
| 07 | VEREDICTO_FINAL_STACK.md | Benchmarks y justificación del stack |
| 08 | errores_comunes_y_soluciones.md | E0382, E0502, E0277, errores Axum/Tiberius |
| 09 | estructura_proyecto.md | Cargo workspace (SIMPLIFICAR: 1 crate) |
| 10 | diseno_ui_premium.md | ACTUALIZAR: cambiar a ROJO/BLANCO/NEGRO |
| 11 | esquema_base_datos.md | REEMPLAZADO por sql_scripts/ |
| 12 | mejores_practicas_codigo.md | Error handling, AppState, middleware, Maud |
| 13 | catalogo_dependencias.md | Lista de crates con justificación |
| 14 | PROMPT_AGENTE_RUST.md | Instrucciones para el agente de IA |

---

# ═══════════════════════════════════════════════════════════════
# 9. NOTAS IMPORTANTES Y CAMBIOS DE ÚLTIMA HORA
# ═══════════════════════════════════════════════════════════════

## 9.1 CAMBIOS RESPECTO AL DISEÑO ORIGINAL
1. ❌ Multi-BD por país → ✅ 1 sola BD con campo pais
2. ❌ Dark mode / Glassmorphism → ✅ ROJO/BLANCO/NEGRO corporativo
3. ❌ Tailwind CSS → ✅ CSS puro (más simple, sin build tools)
4. ❌ Cargo workspace multi-crate → ✅ 1 solo crate (más simple para empezar)
5. ❌ Google Fonts (Inter) → ✅ Segoe UI / system-ui (sin dependencia externa)
6. ❌ Casbin-rs RBAC → ✅ Roles simples en tabla RolesSistema (ADMIN/BODEGA/RRHH_APRUEBA)

## 9.2 PENDIENTES DE CONFIRMAR CON USUARIO
1. ¿Nombre de la BD? Sugerido: Inventario_RRHH
2. ¿Almacenes son por país o compartidos? (Afecta si Almacenes necesita campo Pais)
3. ¿La tabla EMP2024 ya está migrada o se crea vacía y luego se llena?
4. ¿Carnet '500708' es el admin principal?
5. ¿Lista de países? (NI, GT, ¿cuáles más?)
6. ¿Git se usa para versionar? ¿Hay un repositorio?

## 9.3 RIESGOS IDENTIFICADOS
1. **Tiberius + bb8**: El crate bb8-tiberius puede tener versiones incompatibles.
   Verificar compatibilidad antes de empezar.
2. **HTMX sin DataTables**: El sistema actual usa jQuery DataTables para búsqueda/paginación.
   Con HTMX puro necesitamos implementar paginación server-side y búsqueda en los SPs.
3. **Rendimiento de SPs**: Los SPs usan TOP(500). Para tablas grandes considerar
   paginación con OFFSET/FETCH o keyset.
4. **Certificado SSL**: Conexión a SQL Server con Encrypt=false y TrustCert=true.
   Esto es aceptable en red interna pero NO para internet.

## 9.4 ORDEN DE EJECUCIÓN RECOMENDADO
```
DÍA 1:
  → 1.1 Crear BD y ejecutar scripts SQL (ajustados)
  → 1.2 Inicializar proyecto Rust
  → 1.3 Conexión al pool
  → 1.8 CSS corporativo

DÍA 2:
  → 1.4 Servidor Axum básico
  → 1.5 Endpoints de lectura
  → 1.7 Página principal (layout + tabs)

DÍA 3:
  → 1.6 Endpoints de escritura
  → 2.1 Modal crear solicitud
  → 2.2 Aprobar/Rechazar

DÍA 4:
  → 2.3 Monitor bodega / Despacho
  → 2.4 Gestión inventario (entradas/mermas)

DÍA 5:
  → 2.5 Kardex
  → 2.6 CRUD Artículos
  → 2.7 CRUD Almacenes
  → 2.8 Alertas

DÍA 6+:
  → Fase 3 según necesidad
```

---

# FIN DEL PLAN MAESTRO
# ═══════════════════════════════════════════════════════════════
