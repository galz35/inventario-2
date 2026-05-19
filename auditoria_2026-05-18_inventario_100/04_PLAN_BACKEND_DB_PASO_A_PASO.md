# Plan backend y base de datos paso a paso

Fecha: 2026-05-18

## Fase 1: Alinear migraciones con backend real

Problema:

- `db/migrations/02_sps.sql` no coincide con lo que llama NestJS en algunos SPs.

Acciones:

1. Comparar `setup_db.js` contra `db/migrations/02_sps.sql`.
2. Actualizar `db/migrations/02_sps.sql` para que estos SPs acepten los parametros usados por backend:

```sql
Inv_ListarAlmacenes @Pais VARCHAR(2)=NULL
Sol_Listar @Estado VARCHAR(30)=NULL, @Desde DATE=NULL, @Hasta DATE=NULL, @Pais VARCHAR(2)=NULL
Bod_Pendientes @Pais VARCHAR(2)=NULL
```

3. Confirmar que `Almacenes` tenga `Pais`. En `db/migrations/01_schema.sql` actual no aparece `Pais`, pero `setup_db.js` si lo crea.
4. Definir una sola estrategia:
   - O una BD unica `Inventario_RRHH` con columna `Pais`.
   - O una BD por pais `Inventario_NI`, `Inventario_GT`.
5. Recomendacion: usar una BD unica `Inventario_RRHH` con columna `Pais`, porque el backend actual usa `MSSQL_DATABASE=Inventario_RRHH`.
6. Actualizar `00_crear_bds.sql`, porque hoy sugiere `Inventario_NI/GT`, lo cual contradice la API actual.

Criterio:

- Un entorno vacio puede levantarse con `db/migrations` y la API funciona sin cambios.

## Fase 2: Crear modulo empleados/visibilidad

Archivos nuevos:

```text
api-nest/src/empleados/empleados.module.js
api-nest/src/empleados/empleados.controller.js
api-nest/src/empleados/empleados.service.js
api-nest/src/empleados/visibilidad.service.js
```

SPs nuevos:

```sql
Emp_Buscar
Emp_Obtener
Inv_Visibilidad_ObtenerCarnets
Inv_Visibilidad_ObtenerMiEquipo
Inv_Visibilidad_PuedeVer
```

Pasos:

1. Agregar `EmpleadosModule` a `AppModule`.
2. Implementar busqueda de empleados autenticada.
3. Implementar `me`.
4. Implementar `me/equipo`.
5. Implementar `puedeVer`.
6. Agregar cache TTL 5 minutos.
7. Agregar tests.

Criterio:

- Jefe ve equipo.
- Admin ve todos.
- Bodega no depende de equipo para despacho.

## Fase 3: Cambiar solicitudes a scope seguro

Archivos:

- `api-nest/src/solicitudes/solicitudes.controller.js`
- `api-nest/src/solicitudes/solicitudes.service.js`

Cambios:

1. `crear(body, req)`:
   - Usuario normal: `empleadoCarnet = req.user.carnet`.
   - Admin/RRHH: puede usar `body.empleadoCarnet`.

2. `listar(query, req)`:
   - construir scope segun roles.

3. `aprobar/rechazar`:
   - usar visibilidad jerarquica, no solo `JefeCarnet`.

4. SP nuevo o actualizado:

```sql
Sol_ListarScoped
    @Estado,
    @Desde,
    @Hasta,
    @Pais,
    @CarnetsCsv,
    @ModoScope
```

Modos:

- `PROPIAS`
- `EQUIPO`
- `PAIS`
- `TODO`

Criterio:

- Usuario sin permiso no ve ni aprueba solicitudes ajenas.

## Fase 4: Admin y catalogos

Backend faltante:

```text
GET/POST/PUT /api/v1/admin/roles
GET/POST/PUT /api/v1/admin/almacenes
GET/POST/PUT /api/v1/admin/articulos
GET/POST/PUT /api/v1/admin/stock-minimo
GET/POST/PUT /api/v1/admin/permisos
GET/POST/PUT /api/v1/admin/delegaciones
GET /api/v1/admin/audit
```

Reusar SPs de `update_db_v2.js`, pero cablearlos en controllers.

Criterio:

- Admin puede administrar sin tocar SQL manualmente.

## Fase 5: Bodega avanzada

Backend faltante:

```text
GET /api/v1/bodega/solicitudes/:id/pre-despacho?idAlmacen=
POST /api/v1/bodega/despachar-parcial
POST /api/v1/bodega/evidencia
POST /api/v1/inventario/transferencia
GET /api/v1/inventario/lotes
GET /api/v1/inventario/alertas/vencimiento
GET /api/v1/inventario/alertas/stock-bajo
```

Pasos:

1. Pre-despacho devuelve lineas, stock, lotes disponibles y sugerencia FEFO.
2. Despacho parcial permite cantidad por linea.
3. Evidencia usa multipart o base64 con tabla separada.
4. Transferencia mueve entre almacenes con kardex de salida/entrada.

Criterio:

- Bodega no depende de "Despachar todo".

## Fase 6: Seguridad transversal

Cambios:

1. `RolesGuard`: `ADMIN` como superrol.
2. Cookies:
   - `secure: NODE_ENV === 'production'`.
   - considerar cookies firmadas.
3. CSRF:
   - si se usan cookies, agregar token CSRF para POST/PUT/DELETE o validar origen estrictamente.
4. DTOs:
   - usar pipes o validacion manual central.
5. Rate limit:
   - login y SSO.
6. Logs:
   - no exponer token ni secretos.

Criterio:

- Pruebas de 401/403/CSRF/roles pasan.

## Fase 7: Auditoria

Crear tabla:

```sql
CREATE TABLE dbo.AuditLogs (
    IdAudit BIGINT IDENTITY PRIMARY KEY,
    Fecha DATETIME NOT NULL DEFAULT GETDATE(),
    Modulo VARCHAR(50) NOT NULL,
    Accion VARCHAR(50) NOT NULL,
    CarnetActor VARCHAR(20) NULL,
    CarnetObjetivo VARCHAR(20) NULL,
    Entidad VARCHAR(50) NULL,
    IdEntidad VARCHAR(50) NULL,
    Antes NVARCHAR(MAX) NULL,
    Despues NVARCHAR(MAX) NULL,
    Ip VARCHAR(64) NULL,
    UserAgent VARCHAR(255) NULL
);
```

Auditar:

- login/logout;
- SSO fallido;
- crear solicitud;
- aprobar/rechazar;
- despacho;
- entrada/merma/transferencia;
- roles;
- permisos/delegaciones;
- catalogos.

## Fase 8: Tests backend

Agregar tests:

- AuthController: logout/me.
- RolesGuard: admin superrol.
- SolicitudesService: scope.
- VisibilidadService: puedeVer.
- InventoryService: payload `lineas`.
- Errores SQL mapeados.

Comando:

```bash
cd /opt/apps/inventario-portal/api-nest
npm test -- --runInBand
```

## Fase 9: Smoke

Actualizar `scripts/smoke_inventory.js`:

- Agregar timeout por request.
- Agregar modo `--public`.
- Validar que bodega con usuario admin/bodega devuelva `200`, no solo `200 o 403`.
- Agregar flujo real opcional:
  - crear solicitud;
  - aprobar;
  - despachar;
  - validar kardex.

## Orden recomendado de implementacion

1. Migraciones alineadas.
2. Modulo empleados/visibilidad.
3. Solicitudes scoped.
4. Roles/admin superrol.
5. Bodega parcial/pre-despacho.
6. Admin catalogos.
7. Auditoria.
8. Tests/smoke.
