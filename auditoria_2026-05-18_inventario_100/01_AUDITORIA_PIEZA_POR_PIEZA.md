# Auditoria pieza por pieza

Fecha: 2026-05-18

## 1. Backend NestJS

Ubicacion: `api-nest/`

### Estado

Backend actual esta basado en NestJS con JavaScript y SQL Server. Usa:

- `AuthController`
- `InventoryController`
- `SolicitudesController`
- `DatabaseService`
- `AuthGuard`
- `RolesGuard`

Validacion actual:

- `npm test -- --runInBand` pasa.
- Health local conectado a DB.
- Smoke local pasa.

### Endpoints existentes

Auth:

- `POST /api/v1/auth/sso-login`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/portal-session`
- `POST /api/v1/auth/sso-sync-user`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

Inventario:

- `GET /api/v1/almacenes`
- `GET /api/v1/articulos`
- `GET /api/v1/inventario`
- `POST /api/v1/inventario/movimiento`
- `GET /api/v1/kardex`
- `GET /api/v1/bodega/pendientes`
- `POST /api/v1/bodega/despachar`

Solicitudes:

- `GET /api/v1/solicitudes/stats`
- `GET /api/v1/solicitudes/recents`
- `GET /api/v1/solicitudes`
- `POST /api/v1/solicitudes`
- `GET /api/v1/solicitudes/:id/detalle`
- `POST /api/v1/solicitudes/:id/aprobar`
- `POST /api/v1/solicitudes/:id/rechazar`

### Faltantes criticos backend

1. Endpoints de empleados:
   - `GET /api/v1/empleados?q=&pais=`
   - `GET /api/v1/empleados/:carnet`
   - `GET /api/v1/empleados/me`
   - `GET /api/v1/empleados/me/equipo`
   - `GET /api/v1/empleados/:carnet/equipo` solo admin/RRHH.

2. Visibilidad tipo EF/Planer:
   - jefe ve equipo jerarquico;
   - delegado ve lo del jefe delegado;
   - permisos por empleado y por area;
   - `DENY` gana sobre `ALLOW`;
   - admin/bodega pueden ver todo segun contexto.

3. Seguridad en solicitudes:
   - `POST /solicitudes` no debe aceptar cualquier `empleadoCarnet` del body para usuarios normales.
   - Debe usar `req.user.carnet`.
   - Solo `ADMIN` o `RRHH_APRUEBA` debe poder crear en nombre de otro empleado.

4. Filtros de listados:
   - `SolicitudesService.listar()` no recibe usuario actual.
   - Debe filtrar segun rol:
     - solicitante: propias;
     - jefe: equipo visible;
     - RRHH: pais o areas autorizadas;
     - bodega: aprobadas/parciales de pais/almacen;
     - admin: todo.

5. `RolesGuard` no contempla `ADMIN` como superrol:
   - Ahora si un endpoint requiere `BODEGA`, un `ADMIN` sin rol `BODEGA` puede fallar.
   - Debe definirse si `ADMIN` salta todos los `RequireRole`.

6. Validacion de payload:
   - No hay DTOs ni pipes de validacion.
   - Faltan validaciones de tipos, cantidades, fechas, arrays y campos requeridos.

7. Manejo de errores SQL:
   - Errores `THROW` de SQL llegan como 500 si no se mapean.
   - Se debe mapear errores de negocio a 400/409/422.

8. Auditoria:
   - Hay `Solicitudes_Historial` y `MovimientosInventario`, pero falta `AuditLogs` general.
   - Debe auditar login, logout, cambios de roles, cambios de catalogos, cambios de stock minimo, permisos y delegaciones.

## 2. Frontend Web

Ubicacion: `web/`

### Estado

Validaciones:

- `npm run lint`: pasa.
- `npm run build`: pasa.

Pantalla principal:

- Sidebar con tabs.
- Monitor Central.
- Gestion de Stock.
- Solicitudes.
- Despacho si rol `BODEGA` o `ADMIN`.
- Kardex.
- Modal crear solicitud.
- Modal detalle/aprobar/rechazar.
- Toasts basicos.

### Faltantes web

1. No hay modulo de empleados/equipo:
   - El jefe no tiene selector de equipo.
   - No hay vista "Mi equipo".
   - No hay buscador de empleado autorizado.

2. Solicitudes incompletas:
   - No hay filtros por estado/fecha/equipo.
   - No hay vista "mis solicitudes".
   - No hay vista "pendientes de mi aprobacion".
   - No muestra nombre completo de solicitante de forma consistente.
   - No muestra historial de solicitud.

3. Inventario incompleto:
   - No hay crear/editar articulo.
   - No hay entrada/merma desde UI.
   - No hay transferencias.
   - No hay lotes ni vencimientos.
   - No hay stock minimo configurable.
   - No hay alertas de vencimiento visibles.

4. Despacho incompleto:
   - Boton actual "Despachar Todo" no permite despacho parcial o ajuste por linea.
   - No exige confirmacion con detalle.
   - No captura evidencia real.
   - No muestra FEFO/lotes usados.

5. Kardex/reportes incompletos:
   - Faltan filtros por tipo, articulo, carnet destino, solicitud.
   - Faltan exportaciones PDF/Excel por reporte.
   - Faltan reportes de stock bajo, vencimiento, consumo por gerencia, consumo por empleado.

6. UX:
   - Una pantalla puede hacer mucho, pero necesita panel derecho contextual o drawer para detalle.
   - Faltan skeletons/loading globales.
   - Faltan empty states por tabla.
   - Faltan permisos visuales finos.

7. Performance:
   - Bundle grande por `xlsx` importado al inicio.
   - Debe cargarse `xlsx` con dynamic import solo al exportar.

## 3. App movil Flutter

Ubicacion: `movil/`

### Estado

No validado porque Flutter no esta instalado en el VPS.

Problemas leidos en codigo:

- `AppConfig.apiBaseUrl` default apunta a `http://10.0.2.2:3003/`, pero API real local es `3023`.
- `api_environment.dart` menciona Portal Planer Rust y contiene token tecnico que no pertenece al inventario.
- `ApiClient` intenta `auth/refresh`, endpoint inexistente.
- `InventarioHomeScreen` llama `getPendientes()` sin pais.
- `PantallaDetalleDespacho` usa `idAlmacen=1` fijo.
- `getDetalle()` retorna `Map<String,dynamic>`, pero backend devuelve `data` como array.
- Foto de evidencia solo queda local, no se envia.

Conclusion:

- Movil no esta listo para produccion.

## 4. Base de datos

Ubicacion: `db/migrations/`, `setup_db.js`, `update_db_v2.js`

### Estado

Hay migraciones SQL y scripts JS. El sistema vivo responde, pero las migraciones no estan totalmente alineadas:

- `db/migrations/02_sps.sql` define `Inv_ListarAlmacenes` sin `@Pais`, pero backend llama el SP con parametro `Pais`.
- `db/migrations/02_sps.sql` define `Bod_Pendientes` sin `@Pais`, pero backend llama el SP con parametro `Pais`.
- `db/migrations/02_sps.sql` define `Sol_Listar` sin `@Pais`, pero backend llama con `Pais`.
- `setup_db.js` si contiene versiones con `@Pais`.
- Esto significa que ejecutar `db/migrations` limpio podria romper el backend.

### Faltantes DB

- SP de visibilidad jerarquica.
- Tablas de permisos/delegaciones.
- Tablas de auditoria general.
- Tablas para evidencia de despacho.
- Tablas para configuracion de roles por pais/almacen.
- Indices para consultas por pais, jefe, estado y fecha.
- Migracion idempotente unica.

## 5. SSO y sesion

Estado:

- SSO por JWT existe.
- Portal session existe.
- `me` y `logout` existen.

Faltantes:

- Cookies no usan `secure: true` en produccion.
- No hay firma de cookies.
- No hay CSRF token para POST con cookies.
- Logs SSO pueden ser demasiado verbosos con intentos de firma.
- Falta prueba real con token del Portal.

## 6. Despliegue/operacion

Estado:

- PM2 levanta `portal-inventario-api`.
- Nginx publica web.
- Smoke local pasa.

Faltantes:

- Smoke publico por nginx debe tener timeout.
- Documentar `iinv.bash`.
- Documentar rollback probado.
- Agregar health extendido con commit/version.
- Monitoreo de errores SQL/SSO.

## 7. Conclusion

El sistema esta en estado funcional parcial. Para usuarios internos reales todavia falta cerrar autorizacion por jerarquia, administracion, movil, migraciones y pruebas end-to-end.
