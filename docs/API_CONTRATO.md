# API Contract - Inventario Portal

Base URL: `/api/v1`

## Health

| Metodo | Path | Auth | Rol |
|--------|------|------|-----|
| GET | `/api/v1/health` | No | - |

Response:
```json
{ "status": "ok", "app": "inventario-portal", "version": "0.0.1", "db": "connected" }
```

## Auth

### POST /api/v1/auth/sso-login

SSO login con token JWT del Portal Central.

- Body: `{ "token": "jwt..." }`
- Response success (200): Setea cookies `user_carnet`, `user_pais`
```json
{ "status": "success", "data": { "carnet": "123", "pais": "NI", "nombre": "...", "roles": [...] } }
```
- Response error (400): `{ "status": "error", "message": "Token es requerido" }`
- Response error (401): `{ "status": "error", "message": "Token invalido o expirado" }`

### POST /api/v1/auth/login

Login directo con username/password.

- Body: `{ "username": "...", "password": "..." }`
- Response success (200): Setea cookies `user_carnet`, `user_pais`
```json
{ "status": "success", "data": { "carnet": "123", "pais": "NI", "roles": [...] } }
```

### POST /api/v1/auth/portal-session

Valida sesion de Portal Central via cookie `portal_sid`.

- Cookies requeridas: `portal_sid`
- Response success (200): Setea cookies `user_carnet`, `user_pais`
- Response error (401): Sesion invalida o caducada

### POST /api/v1/auth/sso-sync-user

Sincroniza usuario desde Portal Central.

- Body: `{ "carnet": "...", ... }`
- Response: `{ "success": true }`

## Inventory

Todas las rutas requieren AuthGuard (cookie `user_carnet` valida + usuario activo).

### GET /api/v1/almacenes

Lista almacenes por pais.

- Query: `?pais=NI`
- Rol: cualquiera autenticado
```json
{ "status": "success", "data": [{ "IdAlmacen": 1, "Nombre": "Almacen Central", "Pais": "NI" }] }
```

### GET /api/v1/articulos

Catalogo de articulos.

- Rol: cualquiera autenticado
```json
{ "status": "success", "data": [{ "IdArticulo": 1, "Codigo": "...", "Nombre": "...", "Talla": "...", "Sexo": "..." }] }
```

### GET /api/v1/inventario

Stock por almacen.

- Query: `?idAlmacen=1`
- Rol: cualquiera autenticado
```json
{ "status": "success", "data": [{ "Codigo": "...", "Nombre": "...", "Talla": "...", "Sexo": "...", "StockActual": 10, "StockMinimo": 5 }] }
```

### POST /api/v1/inventario/movimiento

Registra entrada o merma.

- Rol: BODEGA
- Body: `{ "idAlmacen": 1, "tipo": "Entrada", "idArticulo": 1, "cantidad": 10, "observacion": "..." }`
- Response error (403): Sin rol BODEGA

### GET /api/v1/kardex

Historial de movimientos.

- Query: `?idAlmacen=1&desde=2024-01-01&hasta=2024-12-31&tipo=&carnetDestino=`
- Rol: cualquiera autenticado
```json
{ "status": "success", "data": [{ "Fecha": "...", "Tipo": "Entrada", "ArticuloNombre": "...", "Cantidad": 10, "Usuario": "..." }] }
```

### GET /api/v1/bodega/pendientes

Solicitudes pendientes de despacho.

- Query: `?pais=NI`
- Rol: BODEGA
```json
{ "status": "success", "data": [{ "IdSolicitud": 1, "Motivo": "...", "EmpleadoCarnet": "...", "Estado": "APROBADA" }] }
```
- Response error (403): Sin rol BODEGA

### POST /api/v1/bodega/despachar

Despacha lineas de una solicitud.

- Rol: BODEGA
- Body: `{ "idAlmacen": 1, "idSolicitud": 1, "lineas": [{ "IdDetalle": 1, "CantidadDespachar": 5 }] }`

## Solicitudes

Todas las rutas requieren AuthGuard.

### GET /api/v1/solicitudes/stats

KPIs del dashboard.

- Query: `?idAlmacen=1`
```json
{ "status": "success", "data": { "pendientesAprobacion": 0, "pendientesDespacho": 0, "stockBajo": 0, "movimientosHoy": 0 } }
```

### GET /api/v1/solicitudes/recents

Ultimos movimientos.

- Query: `?idAlmacen=1`

### GET /api/v1/solicitudes

Lista solicitudes.

- Query: `?estado=&desde=&hasta=&pais=NI`
```json
{ "status": "success", "data": [{ "IdSolicitud": 1, "Motivo": "...", "FechaSolicitud": "...", "Estado": "PENDIENTE" }] }
```

### POST /api/v1/solicitudes

Crea solicitud.

- Body: `{ "empleadoCarnet": "123", "motivo": "...", "detalles": [{ "idArticulo": 1, "talla": "...", "sexo": "...", "cantidad": 1 }] }`

### GET /api/v1/solicitudes/:id/detalle

Detalle con stock disponible.

- Query: `?idAlmacen=1`
```json
{ "status": "success", "data": [{ "IdDetalle": 1, "ArticuloNombre": "...", "Talla": "...", "Sexo": "...", "CantidadSolicitada": 10, "CantidadAprobada": 5, "Pendiente": 5, "StockDisponible": 20 }] }
```

### POST /api/v1/solicitudes/:id/aprobar

Aprueba solicitud. Valida jefe directo o rol RRHH_APRUEBA.

- Rol: jefe del solicitante o RRHH_APRUEBA

### POST /api/v1/solicitudes/:id/rechazar

Rechaza solicitud con motivo.

- Rol: jefe del solicitante o RRHH_APRUEBA
- Body: `{ "motivo": "..." }`

## Errores comunes

| Status | Significado |
|--------|-------------|
| 401 | No autenticado. Falta cookie `user_carnet` o usuario inactivo |
| 403 | Acceso denegado. Falta el rol requerido |
| 404 | Endpoint no encontrado |
| 500 | Error interno del servidor |

## Autenticacion

- Las rutas protegidas requieren cookies `user_carnet` y `user_pais`.
- Las cookies se obtienen via `/api/v1/auth/sso-login`, `/api/v1/auth/login` o `/api/v1/auth/portal-session`.
- `AuthGuard` verifica que el usuario exista y este activo en `dbo.UsuariosSeguridad`.
- `RolesGuard` verifica que el usuario tenga el rol requerido en `dbo.RolesSistema`.
