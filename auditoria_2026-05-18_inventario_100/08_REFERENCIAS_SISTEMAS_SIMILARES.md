# Referencias de sistemas similares y buenas practicas

Fecha: 2026-05-18

## Fuentes consultadas

Se investigaron referencias generales sobre sistemas internos de inventario, WMS y control de stock. Puntos usados como guia:

- IBM explica que la gestion de inventario debe dar seguimiento al inventario desde compra hasta venta/uso y mantener visibilidad de stock para saber que hay, donde esta y cuando reponer.
- Oracle NetSuite describe componentes de control como conteos, tracking, ordenamiento y control de niveles de inventario.
- Microsoft Dynamics 365 Supply Chain documenta conteo ciclico, escaneo de ubicacion/item y validacion del trabajo de conteo.
- SAP Business One resalta conteo de inventario, transacciones de stock, listas de picking/packing y reportes.
- Odoo Inventory/Warehouse documenta trazabilidad por lote/serial, reglas de reabastecimiento, codigos de barra y operaciones de almacen.

Fuentes:

- IBM Inventory Management: https://www.ibm.com/topics/inventory-management
- Oracle NetSuite Inventory Control: https://www.netsuite.com/portal/resource/articles/inventory-management/inventory-control.shtml
- Microsoft Dynamics 365 Warehouse cycle counting: https://learn.microsoft.com/en-us/dynamics365/supply-chain/warehousing/cycle-counting
- SAP Business One Inventory: https://help.sap.com/docs/SAP_BUSINESS_ONE
- Odoo Inventory: https://www.odoo.com/app/inventory

## Buenas practicas aplicables a Inventario Portal

### 1. Visibilidad clara del stock

Debe responder rapido:

- que articulo existe;
- donde esta;
- cuanto hay;
- cuanto esta reservado/aprobado;
- cuanto esta disponible;
- que lote vence primero.

Faltante actual:

- No hay cantidad reservada/aprobada separada de stock.
- No hay vista de lotes en web.

### 2. Trazabilidad completa

Cada movimiento debe guardar:

- fecha;
- tipo;
- articulo;
- cantidad;
- almacen;
- lote;
- solicitud;
- responsable;
- destinatario;
- comentario;
- origen de accion.

Actual:

- `MovimientosInventario` cubre gran parte.
- Falta auditoria general y evidencia.

### 3. FEFO/lotes para medicamentos

Correcto para medicamentos:

- entrada exige lote y vencimiento;
- salida usa FEFO;
- alerta vencimiento.

Actual:

- SP tiene FEFO.
- UI no muestra lotes ni vencimientos.

### 4. Stock minimo y reposicion

Debe existir:

- stock minimo por articulo/variante/almacen;
- alerta de bajo stock;
- reporte de reposicion;
- exportacion.

Actual:

- DB tiene `StockMinimo`.
- UI muestra estado bajo/normal.
- Falta pantalla para configurar minimo y reporte de reposicion.

### 5. Conteos fisicos/ciclicos

Sistema avanzado debe tener:

- conteo por almacen;
- conteo por ubicacion;
- diferencia teorico vs fisico;
- ajuste aprobado;
- historial.

Actual:

- No existe modulo de conteo fisico.

### 6. Codigos de barra

Debe soportar:

- busqueda por codigo;
- escaneo movil;
- validacion articulo correcto;
- opcional QR para solicitud/despacho.

Actual:

- Movil tiene scanner, pero no valida contra backend.
- Web no tiene modo scanner.

### 7. Separacion de funciones

Roles recomendados:

- Solicitante.
- Jefe aprobador.
- RRHH aprobador.
- Bodega.
- Admin.
- Auditor solo lectura.

Actual:

- Roles basicos existen.
- Falta `AUDITOR`.
- Falta scope jerarquico.

### 8. Operacion de almacen

Debe cubrir:

- entrada;
- merma;
- despacho;
- transferencia;
- devolucion;
- conteo;
- ajuste.

Actual:

- Entrada/merma en backend.
- Despacho en backend/web.
- Transferencia en script pero no API/UI.
- No devolucion/conteo/ajuste formal.

## Recomendacion de alcance por fases

### MVP 100 interno

- Solicitud.
- Aprobacion jerarquica.
- Despacho parcial/total.
- Stock/kardex.
- Entradas/mermas.
- Roles.
- Reportes basicos.
- Movil bodega.

### Version avanzada

- Transferencias.
- Conteo ciclico.
- Evidencia.
- Codigos de barra completos.
- Reposicion.
- Reportes gerenciales.
- Auditoria avanzada.

### Version premium

- Prediccion de consumo.
- Recomendacion de compra.
- Alertas automaticas.
- Dashboard por pais.
- Integracion con compras/ERP.
