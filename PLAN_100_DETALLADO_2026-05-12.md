# Plan detallado para llevar Inventario Portal al 100%

Fecha de revision: 2026-05-12  
Proyecto: `/opt/apps/inventario-portal`  
Objetivo: dejar una guia completa, accionable y verificable para que cualquier IA o desarrollador pueda terminar el sistema sin depender de memoria externa.

## 1. Resumen ejecutivo

El proyecto activo es un portal de inventario RRHH publicado en:

- Web: `https://rhclaroni.com/portal/inventario/`
- API publica esperada: `https://rhclaroni.com/api-portal-inventario/`
- API local NestJS: `http://127.0.0.1:3023/api/v1`
- Proceso PM2: `portal-inventario-api`
- Backend activo: `/opt/apps/inventario-portal/api-nest`
- Frontend activo: `/opt/apps/inventario-portal/web`
- Movil activo: `/opt/apps/inventario-portal/movil`
- Documentacion historica y SQL: `/opt/apps/inventario-portal/informacion_rust`
- Script operativo mencionado previamente: `/root/iinv.bash`

Estado general al 2026-05-12:

- Backend NestJS esta online en PM2 y el health local responde `200`.
- Base de datos responde como conectada desde `GET /api/v1/health`.
- Rutas de bodega ya estan mapeadas en logs PM2 y responden `401` sin cookie, no `404`.
- Frontend `npm run build` pasa, pero `npm run lint` falla.
- Tests backend fallan por spec desactualizado de `AppController`.
- App Flutter no se puede validar en este servidor porque `flutter` no esta instalado.
- La documentacion historica mezcla una arquitectura Rust/HTMX con la implementacion real NestJS/React/Flutter. Antes de continuar hay que declarar NestJS + React como fuente actual, o abrir una decision formal para migrar a Rust.

## 2. Estructura real del repositorio

```text
/opt/apps/inventario-portal
├── api-nest/              Backend NestJS en JavaScript
├── web/                   Frontend React + Vite
├── movil/                 App Flutter
├── informacion_rust/      Documentacion historica, SQL y propuesta Rust
├── setup_db.js            Script principal de schema/SP/seed SQL Server
├── update_db_v2.js        Script de SP administrativos/almacen/articulo/transferencia
├── test_backend.js        Script de prueba manual desactualizado
├── test_solicitud_flow.js Script de flujo desactualizado
└── PLAN_TRABAJO_100_2026-05-06.md
```

Fuente de verdad actual:

- Backend productivo: `api-nest`, no Rust.
- Frontend productivo: `web`, no HTMX/Maud.
- DB: SQL Server con SPs.
- Movil: Flutter, parcialmente conectado a API NestJS.

## 3. Verificaciones hechas el 2026-05-12

### 3.1 Backend PM2

Comando:

```bash
pm2 status
pm2 describe portal-inventario-api
pm2 logs portal-inventario-api --lines 40 --nostream
```

Resultado importante:

- `portal-inventario-api` online.
- Script path: `/opt/apps/inventario-portal/api-nest/index.js`.
- CWD: `/opt/apps/inventario-portal/api-nest`.
- Puerto: `3023`.
- Node: `20.20.1`.
- Uptime al momento de revisar: 5 dias.
- Logs muestran rutas mapeadas, incluyendo:
  - `/api/v1/health`
  - `/api/v1/bodega/pendientes`
  - `/api/v1/bodega/despachar`

### 3.2 Health backend local

Comando:

```bash
curl -sS -D - http://127.0.0.1:3023/api/v1/health
```

Resultado:

```json
{
  "status": "ok",
  "app": "inventario-portal",
  "version": "0.0.1",
  "db": "connected"
}
```

### 3.3 Endpoints protegidos

Comandos:

```bash
curl -sS -D - http://127.0.0.1:3023/api/v1/almacenes?pais=NI
curl -sS -D - http://127.0.0.1:3023/api/v1/bodega/pendientes?pais=NI
```

Resultado esperado y verificado sin cookie:

```json
{
  "message": "No autenticado. Falta cookie de sesion.",
  "error": "Unauthorized",
  "statusCode": 401
}
```

Esto confirma que las rutas existen y estan protegidas. Ya no aparece el problema anterior de `404` en bodega.

### 3.4 Nginx local

Comando:

```bash
curl -sS -D - https://127.0.0.1/portal/inventario/ -H 'Host: rhclaroni.com' -k
```

Resultado:

- `HTTP/2 200`
- HTML publicado referencia:
  - `/portal/inventario/assets/index-BbO4wMNd.js`
  - `/portal/inventario/assets/index-BPKwcCHt.css`

Con `Host: www.rhclaroni.com` hay `308` hacia `https://rhclaroni.com/portal/inventario/`. Esto debe quedar documentado como dominio canonico actual, o corregirse si el canonico deseado es `www.rhclaroni.com`.

### 3.5 Frontend build

Comando:

```bash
cd /opt/apps/inventario-portal/web
npm run build
```

Resultado:

- Build pasa.
- Warning: chunk JS mayor a 500 kB.

Salida relevante:

```text
dist/index.html
dist/assets/index-BPKwcCHt.css
dist/assets/index-BbO4wMNd.js
(!) Some chunks are larger than 500 kB after minification.
```

### 3.6 Frontend lint

Comando:

```bash
cd /opt/apps/inventario-portal/web
npm run lint
```

Resultado:

```text
web/src/pages/Dashboard.jsx
3:10 error 'motion' is defined but never used
113:37 warning React Hook useEffect has a missing dependency: 'fetchInit'
114:52 warning React Hook useEffect has a missing dependency: 'refresh'
```

Ademas, por lectura directa del codigo, `LoginPage.jsx` y `SSOHandler.jsx` usan `<motion.div>` pero no importan `motion` desde `framer-motion`. Esto puede provocar error en runtime aunque el build pase.

### 3.7 Backend tests

Comando:

```bash
cd /opt/apps/inventario-portal/api-nest
npm test -- --runInBand
```

Resultado:

- `src/auth/auth.service.spec.js` pasa.
- `src/app.controller.spec.js` falla.

Causa:

`AppController` ahora depende de `DatabaseService`, pero el spec solo provee `AppService`.

Archivo afectado:

- `/opt/apps/inventario-portal/api-nest/src/app.controller.spec.js`

Debe agregarse mock de `DatabaseService` con metodo `query`.

### 3.8 Flutter

Comando:

```bash
cd /opt/apps/inventario-portal/movil
flutter --version
```

Resultado:

```text
flutter: command not found
```

No se puede afirmar que la app movil compile o pase `flutter analyze` desde este VPS.

## 4. Endpoints backend reales

Todos estos endpoints estan bajo `api-nest/src`.

### 4.1 Health

Archivo: `api-nest/src/app.controller.js`

- `GET /`
- `GET /api/v1/health`

### 4.2 Auth

Archivo: `api-nest/src/auth/auth.controller.js`

- `POST /api/v1/auth/sso-login`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/portal-session`
- `POST /api/v1/auth/sso-sync-user`

Falta:

- `POST /api/v1/auth/logout`
- Endpoint de sesion actual tipo `GET /api/v1/auth/me`
- Contrato formal de error para SSO/login.

### 4.3 Inventario

Archivo: `api-nest/src/inventory/inventory.controller.js`

- `GET /api/v1/almacenes`
- `GET /api/v1/articulos`
- `GET /api/v1/inventario`
- `POST /api/v1/inventario/movimiento`
- `GET /api/v1/kardex`
- `GET /api/v1/bodega/pendientes`
- `POST /api/v1/bodega/despachar`

Roles:

- Todo el controller usa `AuthGuard` y `RolesGuard`.
- `inventario/movimiento` requiere `BODEGA`.
- `bodega/pendientes` requiere `BODEGA`.
- `bodega/despachar` requiere `BODEGA`.
- Lecturas de almacenes/articulos/inventario/kardex solo requieren login.

### 4.4 Solicitudes

Archivo: `api-nest/src/solicitudes/solicitudes.controller.js`

- `GET /api/v1/solicitudes/stats`
- `GET /api/v1/solicitudes/recents`
- `GET /api/v1/solicitudes`
- `POST /api/v1/solicitudes`
- `GET /api/v1/solicitudes/:id/detalle`
- `POST /api/v1/solicitudes/:id/aprobar`
- `POST /api/v1/solicitudes/:id/rechazar`

Falta:

- Validar que `POST /solicitudes` no pueda crear solicitudes para otro carnet arbitrario.
- Roles/metadatos explicitos para aprobar/rechazar, aunque el service ya valida jefe o `RRHH_APRUEBA`.
- Filtro por pais/carnet en listados segun rol.

## 5. Procedimientos SQL usados por el backend

Backend NestJS llama estos SPs:

- `dbo.Inv_ListarAlmacenes`
- `dbo.Inv_ListarArticulos`
- `dbo.Inv_InventarioPorAlmacen`
- `dbo.Inv_Mov_EntradaMerma`
- `dbo.Kdx_Listar`
- `dbo.Bod_Pendientes`
- `dbo.Bod_Despachar`
- `dbo.Sol_Listar`
- `dbo.Sol_CrearSolicitud`
- `dbo.Sol_DetalleConStock`
- `dbo.Sol_Aprobar`
- `dbo.Sol_Rechazar`

Scripts donde aparecen:

- `setup_db.js`
- `informacion_rust/sql_scripts/01_schema.sql`
- `informacion_rust/sql_scripts/02_sps.sql`
- `informacion_rust/sql_scripts/03_seed.sql`
- `update_db_v2.js`

Riesgo actual:

- Hay dos fuentes de migracion: scripts JS y scripts SQL dentro de `informacion_rust`.
- La documentacion Rust menciona contratos viejos con headers `X-Pais`, multi-BD y payload `detalles` para despacho.
- El NestJS actual usa cookies `user_carnet/user_pais`, una BD y payload `lineas` para despacho.

Decision necesaria:

- Declarar `setup_db.js` + `update_db_v2.js` como fuente operativa actual y dejar `informacion_rust/sql_scripts` como referencia historica, o unificar todo en una carpeta `db/migrations`.

## 6. Problemas criticos por resolver

### 6.1 Lint web falla

Archivos:

- `web/src/pages/Dashboard.jsx`
- `web/src/pages/LoginPage.jsx`
- `web/src/pages/SSOHandler.jsx`

Acciones:

1. En `Dashboard.jsx`, verificar si `motion` realmente se usa. Actualmente aparece usado en JSX, pero ESLint marca `motion` no usado por la forma en que se evalua el JSX. Si el problema persiste, separar componentes o revisar config.
2. Convertir `fetchInit` y `refresh` a `useCallback`.
3. Agregar dependencias correctas a `useEffect`.
4. Importar `motion` en `LoginPage.jsx`.
5. Importar `motion` en `SSOHandler.jsx`.
6. Ejecutar `npm run lint` hasta verde.

Criterio de salida:

```bash
cd /opt/apps/inventario-portal/web
npm run lint
npm run build
```

Ambos deben terminar con codigo `0`.

### 6.2 Tests backend fallan

Archivo:

- `api-nest/src/app.controller.spec.js`

Accion:

Agregar provider mock:

```js
{
  provide: DatabaseService,
  useValue: {
    query: jest.fn().mockResolvedValue({ recordset: [{ ok: 1 }] }),
  },
}
```

Y agregar prueba para `health()`:

- Caso DB conectada: `db: "connected"`.
- Caso DB falla: `db: "disconnected"`.

Criterio de salida:

```bash
cd /opt/apps/inventario-portal/api-nest
npm test -- --runInBand
```

Debe pasar completo.

### 6.3 Login web depende de SSO y puede romper por runtime

Archivos:

- `web/src/pages/LoginPage.jsx`
- `web/src/pages/SSOHandler.jsx`
- `web/src/App.jsx`
- `web/src/runtime.js`

Hallazgos:

- `LoginPage.jsx` redirige automaticamente al Portal Central.
- `SSOHandler.jsx` procesa `token` y llama `/auth/sso-login`.
- Logs PM2 muestran errores repetidos:
  - `invalid signature`
  - `jwt expired`
  - `Error validating portal session in Inventario: connect ETIMEDOUT 190.56.16.85:443`
- `.env` contiene secretos y URLs sensibles. No se deben copiar a documentacion ni repositorio publico.

Acciones:

1. Confirmar secreto SSO con Portal Central.
2. Confirmar algoritmo y claims del JWT esperado:
   - `type`
   - `carnet`
   - `username`
   - expiracion
3. Asegurar que `PORTAL_API_URL` en produccion apunte a una ruta local estable si Portal corre en el mismo VPS.
4. Reducir timeout y loguear causa sin exponer token.
5. Agregar `POST /auth/logout`.
6. Agregar `GET /auth/me` para rehidratar sesion sin confiar solo en `localStorage`.

Criterio de salida:

- Login desde Portal entra sin `invalid signature`.
- Refresh de navegador mantiene sesion.
- Logout limpia localStorage y cookies.
- Usuario sin cookie recibe `401`.
- Usuario sin rol recibe `403`.

### 6.4 Seguridad de cookies incompleta

Archivos:

- `api-nest/src/auth/auth.controller.js`
- `api-nest/src/main.js`

Hallazgos:

- Cookies `user_carnet` y `user_pais` tienen `httpOnly`, `sameSite: lax`, `path` y `maxAge`.
- No se configura `secure` segun `NODE_ENV`.
- No existe `logout`.
- No hay firma/HMAC de cookies.

Acciones:

1. Crear helper central `buildSessionCookieOptions(configService)`.
2. En produccion usar `secure: true`.
3. Definir si las cookies deben estar firmadas o si basta con validacion DB por `user_carnet`.
4. Implementar `POST /api/v1/auth/logout`.
5. Agregar prueba de cookies en auth.

Criterio de salida:

- Cookies seguras en HTTPS.
- Logout borra `user_carnet` y `user_pais`.
- No se acepta usuario inactivo.

### 6.5 Roles y permisos no estan formalizados

Archivos:

- `api-nest/src/auth/roles.guard.js`
- `api-nest/src/inventory/inventory.controller.js`
- `api-nest/src/solicitudes/solicitudes.controller.js`
- `api-nest/src/solicitudes/solicitudes.service.js`

Roles detectados o esperados:

- `ADMIN`
- `BODEGA`
- `RRHH_APRUEBA`
- `SOLICITANTE`

Acciones:

1. Crear matriz de permisos en documentacion y, si aplica, en codigo.
2. Definir si `ADMIN` debe pasar cualquier `RequireRole`.
3. Permitir aprobar/rechazar solo a jefe directo o `RRHH_APRUEBA`.
4. Evitar que un solicitante vea solicitudes de otros salvo rol autorizado.
5. Agregar tests unitarios o de service para permisos.

Criterio de salida:

- Endpoint sensible tiene permiso documentado.
- `ADMIN` tiene comportamiento definido.
- No hay acciones visibles en UI si el usuario no tiene rol.

### 6.6 Frontend tiene UX operativa incompleta

Archivo principal:

- `web/src/pages/Dashboard.jsx`

Riesgos:

- Usa `alert()` para errores y confirmaciones.
- No hay manejo uniforme de loading por accion.
- Si la API falla, varios errores solo van a `console.error`.
- Export Excel depende de `xlsx`, build pasa pero falta prueba manual.
- Hay potencial de botones visibles para usuarios sin rol.
- Bundle grande.

Acciones:

1. Crear componente de toast/error no intrusivo.
2. Reemplazar `alert()` en aprobar/rechazar/despachar/crear.
3. Agregar estados `loadingCrear`, `loadingAprobar`, `loadingRechazar`, `loadingDespachar`, `loadingExport`.
4. Ocultar o deshabilitar acciones por rol.
5. Validar campos antes de enviar:
   - `motivo`
   - `detalles`
   - `idArticulo`
   - `cantidad > 0`
   - `selectedAlm`
6. Revisar responsive en 375px, 768px, 1366px.
7. Considerar dynamic import para `xlsx`:
   - cargar solo cuando el usuario exporta.

Criterio de salida:

- Crear solicitud funciona.
- Aprobar funciona.
- Rechazar funciona con motivo.
- Despachar funciona.
- Kardex carga con filtros.
- Excel exporta.
- UI no queda en blanco con errores.

### 6.7 App movil apunta a configuracion y flujos incompletos

Archivos:

- `movil/lib/core/config/app_config.dart`
- `movil/lib/core/config/api_environment.dart`
- `movil/lib/core/network/api_client.dart`
- `movil/lib/features/auth/data/auth_repository.dart`
- `movil/lib/features/inventario/data/inventario_repository.dart`
- `movil/lib/features/inventario/presentation/inventario_home_screen.dart`
- `movil/lib/features/inventario/presentation/pantalla_detalle_despacho.dart`

Hallazgos:

- `AppConfig.apiBaseUrl` por defecto es `http://10.0.2.2:3003/`, pero backend real local usa `3023` y produccion usa `/api-portal-inventario/`.
- `api_environment.dart` conserva referencias de Portal Planer Rust y token tecnico que no corresponde al inventario.
- `getPendientes()` acepta `pais`, pero `InventarioHomeScreen` lo llama sin pais.
- `PantallaDetalleDespacho` usa `idAlmacen = 1` fijo.
- `getDetalle()` espera un mapa con `lineas`, pero el backend NestJS devuelve directamente un array en `data`.
- Evidencia/foto se captura localmente, pero no se envia al backend.
- Interceptor intenta refresh token en `/auth/refresh`, endpoint que no existe en este backend.

Acciones:

1. Definir URL por ambiente:
   - dev Android emulator: `http://10.0.2.2:3023/`
   - prod: `https://rhclaroni.com/api-portal-inventario/` o `https://www.rhclaroni.com/api-portal-inventario/` segun nginx.
2. Eliminar o aislar `api_environment.dart` si pertenece a otro proyecto.
3. Guardar `pais` del usuario y pasarlo a `getPendientes(pais: user.pais)`.
4. Obtener `idAlmacen` real desde seleccion de bodega o endpoint de almacenes.
5. Ajustar parseo de detalle:
   - si `response.data.data` es `List`, usarlo directamente.
   - si en futuro se envuelve como `{ lineas: [] }`, soportar ambos.
6. Quitar refresh token o implementar endpoint real.
7. Definir evidencia:
   - Opcion A: crear endpoint `POST /api/v1/bodega/despacho-evidencia` con multipart.
   - Opcion B: ocultar foto hasta tener backend.
8. Instalar Flutter en ambiente de validacion.
9. Ejecutar:

```bash
cd /opt/apps/inventario-portal/movil
flutter pub get
flutter analyze
flutter test
flutter build apk --release --dart-define=API_BASE_URL=https://rhclaroni.com/api-portal-inventario/
```

Criterio de salida:

- Login movil funciona contra NestJS.
- Lista pendientes reales por pais.
- Detalle muestra lineas reales.
- Despacho usa `idAlmacen` real.
- App no muestra evidencia si no se guarda.
- `flutter analyze` verde.
- APK release generado.

### 6.8 Scripts de prueba manual estan desactualizados

Archivos:

- `test_backend.js`
- `test_solicitud_flow.js`
- `debug_sol_listar.js`
- `check_*.js`

Riesgos:

- Algunos scripts apuntan a puertos viejos.
- Algunos contratos usan headers viejos (`X-Country-Code`, `X-User-Carnet`) en lugar de cookies.
- Hay referencias a endpoints no expuestos.

Acciones:

1. Crear `scripts/smoke_inventory.js`.
2. El script debe aceptar:
   - `BASE_URL`
   - `USER_CARNET`
   - `USER_PAIS`
   - `ID_ALMACEN`
3. Debe probar:
   - health
   - almacenes con cookie
   - articulos
   - inventario
   - solicitudes
   - bodega pendientes con rol adecuado
   - kardex
4. Debe fallar con exit code distinto de 0 si algo no responde.
5. Marcar scripts viejos como deprecated o actualizarlos.

Criterio de salida:

```bash
BASE_URL=http://127.0.0.1:3023/api/v1 USER_CARNET=500708 USER_PAIS=NI ID_ALMACEN=1 node scripts/smoke_inventory.js
```

Debe terminar verde.

### 6.9 Documentacion contradictoria

Archivos:

- `informacion_rust/13_resumen_y_estado_proyecto.md`
- `informacion_rust/PLAN_MAESTRO_IMPLEMENTACION.md`
- `informacion_rust/14_PROMPT_AGENTE_RUST.md`
- `PLAN_TRABAJO_100_2026-05-06.md`

Problema:

La documentacion Rust dice que el sistema esta al 100% en Rust/HTMX o que debe implementarse en Rust. La realidad publicada es NestJS/React/Flutter.

Acciones:

1. Crear `README_OPERATIVO.md` en raiz.
2. Crear `docs/ARQUITECTURA_ACTUAL.md`.
3. Mover o marcar `informacion_rust` como:
   - `referencia historica`
   - `propuesta futura`
   - `no usar como fuente de verdad para produccion actual`
4. Documentar contrato API real NestJS.
5. Documentar variables `.env` sin secretos.

Criterio de salida:

- Una IA nueva sabe que debe trabajar en `api-nest`, `web` y `movil`.
- No confunde el proyecto con Portal Planer o Rust.

### 6.10 Secretos expuestos en archivos locales

Archivos sensibles:

- `api-nest/.env`
- `movil/lib/core/config/api_environment.dart`

Acciones:

1. Confirmar si estos archivos estan versionados o solo locales.
2. Asegurar `.gitignore`.
3. Crear `.env.example` sin valores reales.
4. Rotar secretos si el repositorio fue compartido o subido.
5. Mover tokens tecnicos fuera del codigo Flutter.

Criterio de salida:

- No hay secretos reales en codigo versionado.
- Produccion usa variables seguras.

## 7. Plan de trabajo recomendado

### Fase 0: Congelar decisiones y proteger produccion

Objetivo: evitar que otra IA cambie tecnologia o rompa lo publicado.

Pasos:

1. Confirmar que el stack actual a terminar es NestJS + React + Flutter + SQL Server.
2. Confirmar dominio canonico:
   - `rhclaroni.com`
   - o `www.rhclaroni.com`
3. Confirmar si `/root/iinv.bash update` es el unico comando permitido para publicar.
4. Hacer backup antes de tocar produccion:

```bash
pm2 describe portal-inventario-api
cp -a /var/www/portal-inventario /var/www/portal-inventario.bak.$(date +%F_%H%M)
cp -a /opt/apps/inventario-portal /opt/apps/inventario-portal.bak.$(date +%F_%H%M)
```

Nota: solo ejecutar backups con permiso si el entorno lo requiere.

Criterio de salida:

- Decision de stack documentada.
- Dominio canonico documentado.
- Backup disponible.

### Fase 1: Dejar calidad basica verde

Objetivo: que la base tecnica no falle antes de tocar funcionalidad.

Pasos:

1. Corregir `web/src/pages/LoginPage.jsx` y `SSOHandler.jsx` importando `motion`.
2. Corregir lint de `Dashboard.jsx`.
3. Corregir hooks de `Dashboard.jsx` con `useCallback`.
4. Corregir `api-nest/src/app.controller.spec.js`.
5. Ejecutar:

```bash
cd /opt/apps/inventario-portal/web && npm run lint && npm run build
cd /opt/apps/inventario-portal/api-nest && npm test -- --runInBand
```

Criterio de salida:

- Lint web verde.
- Build web verde.
- Tests backend verdes.

### Fase 2: Contrato API y pruebas smoke

Objetivo: poder validar produccion en minutos.

Pasos:

1. Crear documentacion `docs/API_CONTRATO.md`.
2. Documentar por endpoint:
   - metodo
   - path
   - auth requerida
   - rol requerido
   - query/body
   - respuesta success
   - respuesta error
3. Crear `scripts/smoke_inventory.js`.
4. Probar contra API local y contra nginx:

```bash
BASE_URL=http://127.0.0.1:3023/api/v1 node scripts/smoke_inventory.js
BASE_URL=https://rhclaroni.com/api-portal-inventario/api/v1 node scripts/smoke_inventory.js
```

Criterio de salida:

- Smoke local verde.
- Smoke nginx verde.
- Contrato API refleja el codigo real.

### Fase 3: SSO, sesion y logout

Objetivo: cerrar autenticacion con Portal Central.

Pasos:

1. Validar token real emitido por Portal contra `validateSSOToken`.
2. Confirmar secret compartido.
3. Confirmar `type === "SSO_PORTAL"`.
4. Confirmar introspect:
   - URL local `http://127.0.0.1:3120/api/auth/introspect`
   - cookies `portal_sid`
5. Implementar `POST /api/v1/auth/logout`.
6. Implementar `GET /api/v1/auth/me`.
7. Cambiar `App.jsx` para rehidratar contra `/auth/me` cuando tenga cookie.
8. Limpiar localStorage si `/auth/me` responde 401.

Criterio de salida:

- Login via Portal.
- Refresh de pagina.
- Logout.
- Sesion expirada vuelve a login.

### Fase 4: Cerrar modulo web funcional

Objetivo: que la web cubra el flujo operativo completo.

Pasos:

1. Revisar pestaña Dashboard:
   - KPIs
   - ultimos movimientos
   - stock bajo
2. Revisar Solicitudes:
   - listar
   - crear
   - detalle
   - aprobar
   - rechazar
3. Revisar Inventario:
   - almacenes
   - stock por almacen
   - entradas/mermas si existe UI
4. Revisar Kardex:
   - fecha desde/hasta
   - tipo
   - carnet destino
5. Revisar Despacho:
   - pendientes
   - detalle
   - despacho parcial/total
6. Reemplazar `alert()` por UI consistente.
7. Agregar permisos visuales por rol.
8. Validar en desktop y movil.

Criterio de salida:

- Usuario `BODEGA` puede despachar.
- Usuario jefe/RRHH puede aprobar/rechazar.
- Solicitante no ve acciones no autorizadas.
- Export Excel funciona.
- No hay pantalla en blanco ante errores.

### Fase 5: Cerrar app movil

Objetivo: que Flutter deje de ser parcial.

Pasos:

1. Instalar Flutter o validar en una maquina con Flutter.
2. Corregir base URL.
3. Eliminar referencias a Portal Planer Rust.
4. Eliminar refresh token inexistente o implementar endpoint.
5. Pasar `pais` en pendientes.
6. Pasar `idAlmacen` real.
7. Parsear correctamente detalle como array.
8. Definir evidencia/foto.
9. Ejecutar `flutter analyze`, `flutter test`, `flutter build apk`.

Criterio de salida:

- APK release.
- Despacho real probado desde app.
- No hay datos simulados ni IDs fijos.

### Fase 6: Seguridad, roles y auditoria

Objetivo: no dejar accesos ambiguos.

Pasos:

1. Formalizar matriz:

| Endpoint | Login | Rol | Observacion |
| --- | --- | --- | --- |
| `GET /almacenes` | Si | cualquiera | Filtrar por pais |
| `GET /articulos` | Si | cualquiera | Catalogo |
| `GET /inventario` | Si | `BODEGA` o consulta autorizada | Definir si solicitante puede ver |
| `POST /inventario/movimiento` | Si | `BODEGA` | Entrada/merma |
| `GET /kardex` | Si | `BODEGA`/`ADMIN`/`RRHH_APRUEBA` | Evitar fuga de datos |
| `GET /bodega/pendientes` | Si | `BODEGA` | Ya aplicado |
| `POST /bodega/despachar` | Si | `BODEGA` | Ya aplicado |
| `POST /solicitudes` | Si | cualquiera | Debe usar carnet de sesion |
| `POST /solicitudes/:id/aprobar` | Si | jefe o `RRHH_APRUEBA` | Validado en service |
| `POST /solicitudes/:id/rechazar` | Si | jefe o `RRHH_APRUEBA` | Validado en service |

2. Definir comportamiento de `ADMIN`.
3. Agregar auditoria para:
   - login
   - aprobacion
   - rechazo
   - despacho
   - entrada
   - merma
4. Revisar logs para no exponer secretos.

Criterio de salida:

- Matriz aprobada.
- Tests de roles.
- Auditoria en DB.

### Fase 7: DB y migraciones

Objetivo: evitar drift entre scripts y produccion.

Pasos:

1. Crear carpeta `db/migrations`.
2. Mover version final de schema/SP/seed.
3. Documentar orden:
   - crear BD si no existe
   - EMP2024/vista
   - schema inventario
   - SPs
   - seed
   - roles admin
4. Agregar script de verificacion:

```sql
SELECT OBJECT_ID('dbo.Inv_ListarAlmacenes') AS Inv_ListarAlmacenes;
SELECT OBJECT_ID('dbo.Bod_Despachar') AS Bod_Despachar;
SELECT OBJECT_ID('dbo.Sol_CrearSolicitud') AS Sol_CrearSolicitud;
```

5. Probar reglas:
   - FEFO medicamentos
   - stock negativo bloqueado
   - solicitud parcial
   - historial de solicitud
   - kardex.

Criterio de salida:

- Una fuente de migracion.
- SPs coinciden con payloads NestJS.
- Pruebas SQL documentadas.

### Fase 8: Operacion y despliegue

Objetivo: publicar y revertir sin improvisar.

Pasos:

1. Documentar `/root/iinv.bash`.
2. Confirmar exactamente que hace `update`.
3. Crear checklist:

```bash
cd /opt/apps/inventario-portal/web
npm ci
npm run lint
npm run build

cd /opt/apps/inventario-portal/api-nest
npm ci
npm test -- --runInBand

/root/iinv.bash update
pm2 describe portal-inventario-api
curl -sS -D - http://127.0.0.1:3023/api/v1/health
curl -sS -D - https://127.0.0.1/portal/inventario/ -H 'Host: rhclaroni.com' -k
```

4. Documentar rollback:
   - restaurar `/var/www/portal-inventario` desde backup
   - volver commit anterior
   - `pm2 restart portal-inventario-api`
   - `nginx -t && systemctl reload nginx`

Criterio de salida:

- Un comando publica.
- Un comando valida.
- Rollback probado o documentado.

## 8. Orden exacto sugerido para la proxima IA

1. Leer este archivo completo.
2. No usar `informacion_rust` como fuente de verdad del codigo actual.
3. Ejecutar:

```bash
cd /opt/apps/inventario-portal
git status --short
```

4. Corregir lint web.
5. Corregir tests backend.
6. Ejecutar build/tests.
7. Crear smoke test.
8. Corregir SSO/logout.
9. Cerrar UI web.
10. Cerrar app movil.
11. Consolidar documentacion.
12. Publicar con `/root/iinv.bash update`.
13. Ejecutar smoke post-deploy.

## 9. Definicion final de "100%"

El proyecto estara al 100% solo cuando todo esto se cumpla:

- `npm run lint` verde en `web`.
- `npm run build` verde en `web`.
- `npm test -- --runInBand` verde en `api-nest`.
- `GET /api/v1/health` responde `db: connected`.
- SSO desde Portal funciona sin `invalid signature`.
- Logout existe y borra cookies.
- Roles impiden acciones no autorizadas.
- Flujo web completo probado:
  - login
  - listar almacenes
  - listar articulos
  - consultar inventario
  - crear solicitud
  - aprobar
  - rechazar
  - listar pendientes de bodega
  - despachar
  - consultar kardex
  - exportar Excel
- App movil probado:
  - login
  - listar pendientes reales por pais
  - ver detalle real
  - despachar con almacen real
  - no usar datos simulados ni endpoints inexistentes
- DB tiene una fuente de migracion clara.
- Smoke test local y nginx verde.
- Documentacion actualizada:
  - arquitectura actual
  - contrato API
  - despliegue
  - rollback
  - variables de entorno sin secretos
- Produccion publicada en dominio canonico definido.

## 10. Bloque inicial recomendado

Este es el primer bloque que conviene ejecutar antes de tocar funcionalidades grandes:

```bash
cd /opt/apps/inventario-portal/web
npm run lint
npm run build

cd /opt/apps/inventario-portal/api-nest
npm test -- --runInBand
```

Despues corregir:

1. `web/src/pages/LoginPage.jsx`: importar `motion`.
2. `web/src/pages/SSOHandler.jsx`: importar `motion`.
3. `web/src/pages/Dashboard.jsx`: resolver lint hooks.
4. `api-nest/src/app.controller.spec.js`: mockear `DatabaseService`.

Commit sugerido:

```bash
git add web/src/pages/LoginPage.jsx web/src/pages/SSOHandler.jsx web/src/pages/Dashboard.jsx api-nest/src/app.controller.spec.js PLAN_100_DETALLADO_2026-05-12.md
git commit -m "docs: detail inventory portal completion plan"
```

No publicar hasta que lint, build y tests esten verdes.
