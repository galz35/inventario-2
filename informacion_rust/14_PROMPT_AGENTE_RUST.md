# PROMPT PARA AGENTE RUST (Instrucciones definitivas)

Ya tengo SQL Server listo. NO escribas SQL suelto. Solo llama SPs.

## Tabla EMP2024
Tengo una tabla local `dbo.EMP2024` (migrada por mí) + vista `dbo.vw_EmpleadosActivos` + SPs:
- `dbo.Emp_Buscar(@Query, @Pais)`
- `dbo.Emp_Obtener(@Carnet)`

## Multi-País
El inventario por país está aislado por BD:
`Inventario_NI`, `Inventario_GT`, etc. (mismo schema y mismos SPs).

Cada request trae país:
- Header: `X-Pais: "NI"` | `"GT"` | ...
- La API selecciona el pool/connection string según `X-Pais` → DB `Inventario_{PAIS}`.

## REGLAS
- Medicamento: `lote+vence` **obligatorio** en Entradas/Mermas (SP `Inv_Mov_EntradaMerma`).
- Despacho usa **FEFO** siempre para medicamentos (SP `Bod_Despachar`).
- **Nunca stock negativo:** si SP THROW, responde `ok=false`.

## ENDPOINTS (1 SP por endpoint)
```
GET  /api/v1/almacenes                              → Inv_ListarAlmacenes
GET  /api/v1/articulos                               → Inv_ListarArticulos
GET  /api/v1/inventario?idAlmacen=1                  → Inv_InventarioPorAlmacen
GET  /api/v1/lotes?idAlmacen=1&idArticulo=10         → Inv_LotesPorArticulo
POST /api/v1/inventario/movimiento                   → Inv_Mov_EntradaMerma

GET  /api/v1/empleados?query=...&pais=NI             → Emp_Buscar
GET  /api/v1/empleados/{carnet}                      → Emp_Obtener

GET  /api/v1/solicitudes?estado=...&desde=...&hasta=...  → Sol_Listar
POST /api/v1/solicitudes                                 → Sol_CrearSolicitud
GET  /api/v1/solicitudes/{id}/detalle?idAlmacen=1        → Sol_DetalleConStock
POST /api/v1/solicitudes/{id}/aprobar                    → Sol_Aprobar
POST /api/v1/solicitudes/{id}/rechazar                   → Sol_Rechazar

GET  /api/v1/bodega/pendientes                           → Bod_Pendientes
POST /api/v1/bodega/despachar                            → Bod_Despachar

GET  /api/v1/kardex?idAlmacen=1&desde=...&hasta=...&tipo=...&carnetDestino=...  → Kdx_Listar
GET  /api/v1/alertas/vencimiento?idAlmacen=1&dias=30     → Inv_AlertasVencimiento
GET  /api/v1/alertas/stock-bajo?idAlmacen=1              → Inv_AlertasStockBajo
```

## Formato Respuesta
```json
{ "ok": true, "data": ..., "error": null }
{ "ok": false, "data": null, "error": { "code": "SQL_THROW", "message": "..." } }
```

## Stack Rust
- `axum` + `tiberius` + `bb8` + `serde` + `tracing` + `maud`
- Middleware `X-Pais` + auth (JWT opcional)

## Diseño UI
- **ROJO (#e1251b), BLANCO, NEGRO** — corporativo Claro
- Fuente: Segoe UI / system-ui
- 1 PÁGINA con tabs: Solicitudes | Bodega | Inventario | Kardex
- **Simple, no futurista.** Usuarios no técnicos, entre menos páginas mejor.

## JSON para Flutter (Futuro)

### Crear solicitud
```json
{
  "empleadoCarnet": "500708",
  "motivo": "Necesito insumos",
  "detalles": [
    { "idArticulo": 10, "talla": "UNI", "sexo": "N", "cantidad": 2 },
    { "idArticulo": 25, "talla": "M",   "sexo": "M", "cantidad": 1 }
  ]
}
```

### Entrada medicamento
```json
{
  "idAlmacen": 1, "tipo": "ENTRADA", "idArticulo": 10, "talla": "UNI", "sexo": "N",
  "cantidad": 50, "comentario": "Ingreso compra", "usuario": "500708",
  "loteCodigo": "LOT-2026-03A", "vence": "2026-05-10"
}
```

### Despachar (FEFO automático)
```json
{
  "idAlmacen": 1, "idSolicitud": 123, "carnetBodeguero": "500708",
  "detalles": [
    { "idDetalle": 5551, "entregar": 2 },
    { "idDetalle": 5552, "entregar": 1 }
  ]
}
```
