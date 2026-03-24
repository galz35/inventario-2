# Diseño UI Premium: Dashboard de Inventario Claro

Este documento define el sistema de diseño visual para que el inventario se vea profesional, moderno y sea extremadamente fácil de usar para todos los roles (Bodeguero, Empleado, Gerente).

---

## 1. Filosofía de Diseño

### Principios clave:
1. **Claridad sobre complejidad:** Un bodeguero debe ver lo que necesita en < 2 segundos.
2. **Dark Mode por defecto:** Reduce fatiga visual en jornadas largas de work.
3. **Glassmorphism sutil:** Paneles con fondo semitransparente y blur para dar profundidad.
4. **Microinteracciones:** Feedback instantáneo en cada click (animaciones < 200ms).
5. **Responsive:** Funciona en el monitor del almacén Y en el celular del gerente.

---

## 2. Paleta de Colores (Basada en Claro)

```css
:root {
  /* Colores Primarios */
  --claro-red: #E30613;        /* Rojo Claro (acentos, botones principales) */
  --claro-red-dark: #B71C1C;   /* Rojo oscuro (hover) */

  /* Fondos (Dark Mode) */
  --bg-primary: #0F172A;       /* Fondo principal (slate-900) */
  --bg-secondary: #1E293B;     /* Paneles (slate-800) */
  --bg-card: rgba(30, 41, 59, 0.7); /* Cards con glassmorphism */

  /* Texto */
  --text-primary: #F1F5F9;     /* Texto principal (slate-100) */
  --text-secondary: #94A3B8;   /* Texto secundario (slate-400) */
  --text-muted: #64748B;       /* Labels (slate-500) */

  /* Estados */
  --success: #22C55E;          /* Verde (stock ok, aprobado) */
  --warning: #F59E0B;          /* Amarillo (stock bajo) */
  --danger: #EF4444;           /* Rojo (sin stock, rechazado) */
  --info: #3B82F6;             /* Azul (información, pendiente) */
}
```

---

## 3. Tipografía

```css
/* Google Fonts - Cargar en el HTML */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 14px;
  line-height: 1.6;
}
```

| Elemento | Peso | Tamaño | Uso |
| :--- | :--- | :--- | :--- |
| Títulos (H1) | 700 (Bold) | 24px | Nombre de página |
| Subtítulos (H2) | 600 (Semi) | 18px | Secciones |
| Texto normal | 400 (Regular) | 14px | Contenido, tablas |
| Labels | 500 (Medium) | 12px | Etiquetas de formulario |
| Números grandes | 700 (Bold) | 32px | Contadores del dashboard |

---

## 4. Componentes UI con Tailwind CSS

### 4.1 Card con Glassmorphism
```html
<div class="backdrop-blur-lg bg-white/10 border border-white/20
            rounded-2xl shadow-xl p-6 transition-all duration-300
            hover:bg-white/15 hover:shadow-2xl">
  <h3 class="text-lg font-semibold text-slate-100">Stock Total</h3>
  <p class="text-3xl font-bold text-white mt-2">1,247</p>
  <span class="text-sm text-green-400">↑ 12% este mes</span>
</div>
```

### 4.2 Tabla de Inventario
```html
<table class="w-full text-sm text-left">
  <thead class="text-xs uppercase text-slate-400 bg-slate-800/50">
    <tr>
      <th class="px-4 py-3">Activo</th>
      <th class="px-4 py-3">Serie</th>
      <th class="px-4 py-3">Estado</th>
      <th class="px-4 py-3">Asignado a</th>
    </tr>
  </thead>
  <tbody>
    <tr class="border-b border-slate-700 hover:bg-slate-700/50
              transition-colors duration-150">
      <td class="px-4 py-3 text-slate-200">Laptop Dell XPS</td>
      <td class="px-4 py-3 text-slate-400 font-mono">SN-2024-001</td>
      <td class="px-4 py-3">
        <span class="px-2 py-1 text-xs rounded-full bg-green-500/20
                     text-green-400">Activo</span>
      </td>
      <td class="px-4 py-3 text-slate-300">Juan Pérez</td>
    </tr>
  </tbody>
</table>
```

### 4.3 Sidebar de Navegación
```html
<aside class="w-64 h-screen bg-slate-900 border-r border-slate-700
              flex flex-col">
  <!-- Logo -->
  <div class="p-6 border-b border-slate-700">
    <img src="/static/img/logo-claro.svg" class="h-8">
    <p class="text-xs text-slate-500 mt-1">Inventario Regional</p>
  </div>

  <!-- Menú -->
  <nav class="flex-1 p-4 space-y-1">
    <a href="/dashboard"
       class="flex items-center gap-3 px-4 py-2.5 rounded-lg
              text-slate-300 hover:bg-slate-800 hover:text-white
              transition-all duration-200">
      📊 Dashboard
    </a>
    <a href="/inventario"
       class="flex items-center gap-3 px-4 py-2.5 rounded-lg
              bg-claro-red/10 text-red-400 border-l-2 border-red-500">
      📦 Inventario
    </a>
    <a href="/solicitudes" class="...">📋 Solicitudes</a>
    <a href="/empleados" class="...">👥 Empleados</a>
    <a href="/almacenes" class="...">🏭 Almacenes</a>
  </nav>

  <!-- Selector de País -->
  <div class="p-4 border-t border-slate-700">
    <select class="w-full bg-slate-800 text-slate-300 rounded-lg
                   px-3 py-2 text-sm border border-slate-600">
      <option>🇳🇮 Nicaragua</option>
      <option>🇭🇳 Honduras</option>
      <option>🇬🇹 Guatemala</option>
      <option>🇸🇻 El Salvador</option>
      <option>🇨🇷 Costa Rica</option>
    </select>
  </div>
</aside>
```

### 4.4 Botón de Acción Principal
```html
<button class="bg-red-600 hover:bg-red-700 text-white font-medium
               px-6 py-2.5 rounded-lg shadow-lg shadow-red-600/25
               transition-all duration-200 active:scale-95">
  + Nueva Solicitud
</button>
```

### 4.5 Badge de Estado
```html
<!-- Aprobado -->
<span class="px-2.5 py-1 text-xs font-medium rounded-full
             bg-green-500/20 text-green-400">Aprobado</span>

<!-- Pendiente -->
<span class="px-2.5 py-1 text-xs font-medium rounded-full
             bg-yellow-500/20 text-yellow-400">Pendiente</span>

<!-- Rechazado -->
<span class="px-2.5 py-1 text-xs font-medium rounded-full
             bg-red-500/20 text-red-400">Rechazado</span>
```

---

## 5. Layout de las Páginas Principales

### 5.1 Dashboard (Pantalla principal)
```
┌────────────┬──────────────────────────────────────────┐
│            │  Header: "Dashboard" + País + Usuario    │
│  Sidebar   ├──────────────────────────────────────────┤
│            │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  📊 Dash   │  │Stock │ │Solic.│ │Emple.│ │Almac.│   │
│  📦 Inv    │  │Total │ │Pend. │ │Activ.│ │Disp. │   │
│  📋 Solic  │  │1,247 │ │ 23   │ │ 450  │ │  5   │   │
│  👥 Empl   │  └──────┘ └──────┘ └──────┘ └──────┘   │
│  🏭 Almac  ├──────────────────────────────────────────┤
│            │  Últimas Solicitudes (tabla)              │
│  ─────     │  ┌───────────────────────────────────┐   │
│  🇳🇮 País  │  │ Bodeguero1 | Laptop | Pendiente  │   │
│            │  │ Empl.002   | Mouse  | Aprobado   │   │
│            │  └───────────────────────────────────┘   │
└────────────┴──────────────────────────────────────────┘
```

### 5.2 Inventario (Listado con filtros)
```
┌────────────┬───────────────────────────────────────────┐
│            │  [Buscar...🔍]  [Filtro: Estado ▾] [+Nuevo]│
│  Sidebar   ├───────────────────────────────────────────┤
│            │  Activo       │ Serie      │ Estado │ Acc. │
│            │  ─────────────┼────────────┼────────┼───── │
│            │  Laptop Dell  │ SN-001     │ ✅     │ 👁️✏️ │
│            │  Mouse Log.   │ SN-002     │ ✅     │ 👁️✏️ │
│            │  Monitor HP   │ SN-003     │ ⚠️     │ 👁️✏️ │
│            ├───────────────────────────────────────────┤
│            │  Pág: ◀ 1 2 3 ... 50 ▶  (50 items/pág)  │
└────────────┴───────────────────────────────────────────┘
```

### 5.3 Solicitud (Formulario)
```
┌────────────┬───────────────────────────────────────────┐
│            │  Nueva Solicitud                           │
│  Sidebar   ├───────────────────────────────────────────┤
│            │  Empleado:    [Buscar empleado...  ]      │
│            │  Tipo Activo: [Laptop           ▾ ]       │
│            │  Almacén:     [Bodega Central    ▾ ]       │
│            │  Motivo:      [________________________]  │
│            │               [________________________]  │
│            │                                           │
│            │  [Cancelar]              [Enviar Solicitud]│
└────────────┴───────────────────────────────────────────┘
```

---

## 6. Experiencia de Usuario (UX)

### 6.1 Interacciones con HTMX
| Acción del Usuario | Comportamiento |
| :--- | :--- |
| Click en fila de tabla | Se expande un panel lateral con detalle (sin recargar) |
| Enviar formulario | El botón muestra spinner, la tabla se actualiza automáticamente |
| Cambiar filtro | La tabla se recarga con los nuevos resultados al instante |
| Cambiar de país | Todo el dashboard se actualiza al contexto del nuevo país |

### 6.2 Patrones de Velocidad Percibida
1. **Optimistic UI:** Cuando el bodeguero aprueba una solicitud, el badge cambia a "Aprobado" inmediatamente, antes de que el servidor confirme.
2. **Skeleton Loading:** Mientras cargan datos pesados, se muestran rectángulos animados grises en lugar de un spinner genérico.
3. **Paginación infinita:** Para el inventario, las filas se cargan conforme el usuario hace scroll (lazy loading con HTMX `hx-trigger="revealed"`).

### 6.3 Accesibilidad
- Todos los botones tienen `aria-label` descriptivo.
- Los colores de estado tienen un ícono además del color (para daltónicos).
- Navegación completa por teclado (Tab, Enter, Escape).

---

> [!TIP]
> **Regla de UX:** Si un bodeguero necesita más de 3 clicks para despachar un activo, el diseño tiene un problema. El flujo ideal es: Ver solicitud → Click "Aprobar" → Listo.

> [!IMPORTANT]
> **Sobre Tailwind CSS:** Instálalo como herramienta CLI independiente. No necesitas Node.js. Existe un binario standalone de Tailwind que Rust puede invocar directamente durante el build.
