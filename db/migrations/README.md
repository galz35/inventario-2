# Migraciones de Base de Datos - Inventario Portal

## Orden de ejecución

```bash
# 1. Crear base de datos Inventario_RRHH (opcional, si no existe)
sqlcmd -S server -U sa -i 00_crear_bds.sql

# 2. Crear/actualizar tabla EMP2024 (empleados)
sqlcmd -S server -U sa -d Inventario_RRHH -i 00_EMP2024_LOCAL.sql

# 3. Schema de inventario (tablas, vistas, columnas)
sqlcmd -S server -U sa -d Inventario_RRHH -i 01_schema.sql

# 4. Stored Procedures
sqlcmd -S server -U sa -d Inventario_RRHH -i 02_sps.sql

# 5. Datos semilla (roles, usuarios, almacenes)
sqlcmd -S server -U sa -d Inventario_RRHH -i 03_seed.sql
```

También se pueden ejecutar via los scripts Node.js:
- `node setup_db.js` - Schema + SPs + seed
- `node update_db_v2.js` - SPs administrativos/almacen/articulo/transferencia

## Verificación

```sql
SELECT OBJECT_ID('dbo.Inv_ListarAlmacenes') AS Inv_ListarAlmacenes;
SELECT OBJECT_ID('dbo.Bod_Despachar') AS Bod_Despachar;
SELECT OBJECT_ID('dbo.Sol_CrearSolicitud') AS Sol_CrearSolicitud;
SELECT OBJECT_ID('dbo.Inv_Mov_EntradaMerma') AS Inv_Mov_EntradaMerma;
SELECT OBJECT_ID('dbo.Sol_Aprobar') AS Sol_Aprobar;
SELECT OBJECT_ID('dbo.Sol_Rechazar') AS Sol_Rechazar;
SELECT OBJECT_ID('dbo.Kdx_Listar') AS Kdx_Listar;
SELECT OBJECT_ID('dbo.Bod_Pendientes') AS Bod_Pendientes;
```

## SPs usados por NestJS

| SP | Controller | Propósito |
|----|-----------|-----------|
| `Inv_ListarAlmacenes` | inventory | Lista almacenes (con parámetro @Pais) |
| `Inv_ListarArticulos` | inventory | Catálogo de artículos |
| `Inv_InventarioPorAlmacen` | inventory | Stock por almacén |
| `Inv_Mov_EntradaMerma` | inventory | Registrar movimiento |
| `Kdx_Listar` | inventory | Historial kardex |
| `Bod_Pendientes` | inventory | Pendientes de despacho |
| `Bod_Despachar` | inventory | Despachar solicitud |
| `Sol_Listar` | solicitudes | Listar solicitudes |
| `Sol_CrearSolicitud` | solicitudes | Crear solicitud |
| `Sol_DetalleConStock` | solicitudes | Detalle con stock disponible |
| `Sol_Aprobar` | solicitudes | Aprobar solicitud |
| `Sol_Rechazar` | solicitudes | Rechazar solicitud |
