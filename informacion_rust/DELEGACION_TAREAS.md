# DELEGACIÓN DE TAREAS: Claude vs Gemini
# Sistema Inventario RRHH — Claro

## CRITERIO DE DIVISIÓN
- **CLAUDE (este agente):** Tareas CRÍTICAS, lógica compleja, arquitectura Rust, decisiones.
- **GEMINI:** Tareas repetitivas, documentación simple, CSS, archivos estáticos, ajustes menores.

---

## ✅ YA COMPLETADO (por Claude)
- [x] Investigación completa de Rust (14 documentos técnicos)
- [x] Plan Maestro de Implementación
- [x] Todos los scripts SQL (tablas + 16 SPs + seed)
- [x] BD Inventario_RRHH creada y poblada en 190.56.16.85
- [x] Decisiones arquitectónicas finales

---

## 🔴 PARA CLAUDE (Crítico / Complejo)

### C1. Inicializar proyecto Rust + conexión a SQL Server
- cargo init, Cargo.toml, dependencias
- Pool bb8 + Tiberius conectando a Inventario_RRHH
- AppState, configuración, error handling
- **¿Por qué Claude?** Es la base del sistema. Un error aquí rompe todo.

### C2. Implementar endpoints API (16 endpoints)
- Cada endpoint llama 1 SP y devuelve JSON
- Mapeo de filas SQL → structs Rust con Serde
- Error handling: capturar THROW de SPs → ok=false
- **¿Por qué Claude?** Lógica de negocio crítica, manejo de errores async.

### C3. Página principal con Maud + HTMX
- Layout base (hero, KPIs, tabs, selector almacén)
- Fragmentos HTML para HTMX (tablas dinámicas)
- Modales (crear solicitud, despachar, entrada/merma)
- **¿Por qué Claude?** Integración Rust + HTML + lógica de negocio.

### C4. Middleware de País
- Extraer país de cookie/header
- Filtrar datos en SPs por país
- Selector de país en la UI

### C5. Autenticación (cuando se necesite)
- Login por carnet
- JWT/sesión
- Proteger rutas por rol

---

## 🟡 PARA GEMINI (Medio / Repetitivo)

### G1. Crear archivo CSS corporativo completo
**Instrucciones para Gemini:**
```
Crea un archivo CSS para un sistema de inventario corporativo.
Colores: rojo #e1251b, blanco #fff, negro para texto, gris #f4f7f6 fondo.
Fuente: 'Segoe UI', system-ui, sans-serif.
Componentes necesarios:
- .hero: banner superior con fondo oscuro (#1a252f), texto blanco, bordes redondeados
- .kpi: tarjetas de indicadores dentro del hero
- .shell: contenedor blanco con sombra suave y bordes redondeados
- .nav-tabs / .nav-link: tabs de navegación, tab activo en rojo
- table: tablas con hover, headers en gris claro uppercase
- .chip: filtros tipo pastilla con bordes
- .btn-danger: botón rojo principal
- .btn-dark: botón oscuro secundario
- .modal: modales con esquinas redondeadas
- .fab: botón flotante rojo en esquina inferior derecha
- .ac-wrap / .ac-list: autocomplete dropdown
- Responsive básico
NO usar dark mode. NO usar glassmorphism. Estilo SIMPLE y corporativo.
```

### G2. Descargar HTMX y preparar archivos estáticos
**Instrucciones para Gemini:**
```
1. Descarga htmx.min.js versión 2.x desde unpkg.com o cdn
2. Guárdalo en d:\inventario rrhh\static\js\htmx.min.js
3. Crea la estructura de carpetas:
   static/css/ (para el CSS)
   static/js/  (para HTMX)
   static/img/ (para imágenes)
```

### G3. Crear archivo .env
**Instrucciones para Gemini:**
```
Crea d:\inventario rrhh\.env con:
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

### G4. Crear .gitignore
**Instrucciones para Gemini:**
```
Crea d:\inventario rrhh\.gitignore con:
target/
.env
node_modules/
*.exe
```

### G5. Documentar los SPs existentes
**Instrucciones para Gemini:**
```
Lee los archivos en d:\inventario rrhh\informacion_rust\sql_scripts\
y crea un documento markdown resumiendo cada SP:
- Nombre
- Parámetros (con tipos)
- Qué hace (1 línea)
- Ejemplo de uso
```

### G6. Actualizar documentos obsoletos
**Instrucciones para Gemini:**
```
Los siguientes archivos en d:\inventario rrhh\informacion_rust\ necesitan actualización:
- 05_arquitectura_multi_pais.md → Cambiar de multi-BD a 1 BD con campo pais
- 09_estructura_proyecto.md → Cambiar de workspace multi-crate a 1 solo crate
- 10_diseno_ui_premium.md → Cambiar dark mode/glassmorphism a ROJO/BLANCO/NEGRO corporativo
- 11_esquema_base_datos.md → Reemplazar con referencia a sql_scripts/
- 14_PROMPT_AGENTE_RUST.md → Actualizar: 1 BD, aprobador es jefe1/bodeguero
```

---

## ORDEN DE EJECUCIÓN RECOMENDADO

```
GEMINI primero (prepara terreno):
  G2 → G3 → G4 → G1 (en paralelo con Claude)

CLAUDE después (construye sistema):
  C1 → C2 → C3 → C4 → C5

GEMINI después (documenta):
  G5 → G6
```

---

## RESUMEN

| Agente | Tareas | Tipo de trabajo |
| :--- | :--- | :--- |
| **Claude** | 5 tareas | Rust, lógica, arquitectura, endpoints, HTML |
| **Gemini** | 6 tareas | CSS, archivos, .env, .gitignore, docs |
