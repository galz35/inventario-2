# Plan frontend: una pantalla avanzada, facil y rapida

Fecha: 2026-05-18

## Objetivo UX

El usuario quiere una pantalla que pueda hacer mucho sin sentirse pesada. La solucion recomendada es mantener una pagina principal con tabs y agregar:

- busqueda global;
- filtros por alcance;
- tabla central densa;
- panel lateral de detalle;
- acciones contextuales;
- permisos visuales por rol.

## Estado actual

Archivo principal: `web/src/pages/Dashboard.jsx`

Ya existe:

- Monitor central.
- Gestion de stock.
- Solicitudes.
- Despacho para `BODEGA`/`ADMIN`.
- Kardex.
- Modal crear solicitud.
- Modal detalle.
- Toasts.
- Logout.

Validacion:

- Lint pasa.
- Build pasa.

## Problemas UX actuales

1. Demasiado flujo esta en modales simples.
2. Despacho solo ofrece "Despachar Todo".
3. No hay vista de equipo.
4. No hay admin.
5. No hay entrada/merma/transferencia.
6. No hay lotes/vencimientos.
7. No hay filtros suficientes.
8. No hay permisos visuales finos.
9. No hay carga progresiva/dynamic import para Excel.

## Diseño recomendado

### Layout

Mantener:

- Sidebar izquierda.
- Header superior.
- Area principal.

Agregar:

- `ScopeSelector`: Mis datos / Mi equipo / Pais / Todo.
- `GlobalSearch`: busca solicitud, empleado, articulo, codigo.
- `ContextDrawer`: panel derecho para detalle y acciones.
- `CommandBar`: acciones rapidas segun tab.

### Tabs finales

1. Monitor
2. Solicitudes
3. Bodega
4. Inventario
5. Kardex
6. Reportes
7. Admin

Mostrar tabs segun rol.

## Monitor

Debe mostrar:

- Pendientes de mi aprobacion.
- Pendientes de bodega.
- Stock bajo.
- Vencimientos proximos.
- Movimientos de hoy.
- Mis solicitudes recientes.
- Alertas criticas.

Acciones rapidas:

- Nueva solicitud.
- Registrar entrada.
- Ir a despacho.
- Exportar reporte.

## Solicitudes

Filtros:

- Estado.
- Fecha desde/hasta.
- Alcance.
- Empleado.
- Gerencia/departamento.
- Articulo.

Tabla:

- ID.
- Fecha.
- Solicitante.
- Jefe.
- Motivo.
- Estado.
- Total lineas.
- Acciones.

Drawer detalle:

- Datos empleado.
- Jefe/jerarquia.
- Lineas.
- Stock disponible.
- Historial.
- Botones aprobar/rechazar si aplica.

Crear solicitud:

- Selector empleado solo si rol autorizado.
- Busqueda de articulo.
- Validacion talla/sexo segun tipo.
- Confirmacion antes de enviar.

## Bodega

Vista:

- Pendientes aprobados/parciales.
- Agrupar por antiguedad, empleado, gerencia.
- Indicador si hay stock completo/parcial/sin stock.

Drawer pre-despacho:

- Lineas.
- Cantidad aprobada.
- Cantidad pendiente.
- Stock disponible.
- Cantidad a despachar editable.
- Lotes sugeridos FEFO.
- Confirmacion.

No usar solo "Despachar Todo".

## Inventario

Subvistas dentro del tab:

- Stock actual.
- Entradas.
- Mermas.
- Transferencias.
- Lotes.
- Stock minimo.

Acciones:

- Registrar entrada.
- Registrar merma.
- Transferir.
- Ajustar minimo.
- Exportar.

Para medicamento:

- lote obligatorio;
- fecha vencimiento obligatoria;
- alerta FEFO/vencimiento.

## Kardex

Filtros:

- Almacen.
- Fecha desde/hasta.
- Tipo.
- Articulo.
- Carnet destino.
- Solicitud.
- Responsable.
- Lote.

Tabla:

- Fecha.
- Tipo.
- Articulo.
- Cantidad.
- Lote.
- Solicitud.
- Destino.
- Responsable.
- Comentario.

Export:

- Excel.
- CSV.

## Reportes

Reportes minimos:

- Stock bajo.
- Vencimientos.
- Consumo por gerencia.
- Consumo por empleado.
- Despachos por periodo.
- Solicitudes rechazadas.
- Top articulos consumidos.
- Movimientos por responsable.

## Admin

Solo `ADMIN`.

Secciones:

- Usuarios/roles.
- Almacenes.
- Articulos.
- Permisos/delegaciones.
- Explorador de visibilidad.
- Auditoria.
- Estado sistema.

Explorador de visibilidad tipo EF:

- Buscar carnet.
- Ver empleados visibles.
- Ver actores efectivos.
- Probar "puede ver a".
- Mostrar fuente.

## Performance

Cambios:

1. Quitar import estatico:

```js
import * as XLSX from 'xlsx';
```

2. Usar:

```js
const XLSX = await import('xlsx');
```

3. Dividir componentes:

```text
components/
  Layout.jsx
  ScopeSelector.jsx
  DataTable.jsx
  ContextDrawer.jsx
  SolicitudesTab.jsx
  BodegaTab.jsx
  InventarioTab.jsx
  KardexTab.jsx
  AdminTab.jsx
```

4. Paginacion/virtualizacion para tablas grandes.

## Accesibilidad y facilidad

- Botones con icono y texto para acciones principales.
- Tooltips para iconos.
- Estados vacios claros.
- Confirmaciones para acciones irreversibles.
- No esconder errores en consola.
- Atajos opcionales, pero no depender de ellos.

## Pruebas frontend

Agregar Playwright:

1. Login mock/session cookie.
2. Cargar dashboard.
3. Crear solicitud.
4. Aprobar.
5. Rechazar.
6. Despachar parcial.
7. Exportar.
8. Responsive 375/768/1366.

Criterio:

- Sin solapes de texto.
- Sin botones rotos.
- Sin tablas fuera de pantalla.
- Sin errores JS en consola.

## Orden de implementacion

1. Separar Dashboard en componentes.
2. Agregar ScopeSelector.
3. Implementar Solicitudes con drawer.
4. Implementar Bodega parcial.
5. Implementar Inventario entradas/mermas/transferencias.
6. Implementar Kardex avanzado.
7. Implementar Admin.
8. Dynamic import Excel.
9. Playwright.
