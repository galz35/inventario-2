# Empleados, equipo y jerarquia tipo EF/Planer

Fecha: 2026-05-18

## 1. Por que esto es critico

El sistema de inventario no puede limitarse a roles planos. Necesita saber quien puede ver o aprobar solicitudes de quien.

Regla solicitada:

- Jefe inmediato o jerarquia: ve su equipo y aprueba lo que corresponda.
- Bodeguero: ve todo lo pendiente para despacho segun pais/almacen.
- Administrador: ve todo.
- RRHH: ve y gestiona segun pais/area/rol.

## 2. Patron revisado en EF/Planer

Referencia local leida:

- `/opt/apps/EF/VISIBILIDAD_JERARQUIA.md`
- `/opt/apps/EF/ddl_export/Procedures/dbo.sp_Visibilidad_ObtenerMiEquipo.sql`
- `/opt/apps/porta-planer/v2backend/src/acceso/visibilidad.service.ts`
- `/opt/apps/porta-planer/v2backend/src/acceso/procedures_acceso.sql`
- `/opt/apps/porta-planer/backendrust/src/handlers/equipo.rs`

Planer usa un servicio maestro `VisibilidadService` que:

- limpia carnet;
- calcula carnets visibles;
- cachea resultados;
- permite `puedeVer(solicitante, objetivo)`;
- obtiene detalles de empleados visibles;
- obtiene actores efectivos por delegacion.

El SQL de EF/Planer contempla:

- jerarquia de mando por `jefeCarnet` y `carnet_jefe2..4`;
- permisos por empleado `ALLOW`;
- permisos por area/subarbol;
- delegaciones;
- `DENY` con prioridad absoluta;
- admin ve todos los activos.

## 3. Modelo recomendado para Inventario

### 3.1 Empleados

Usar `dbo.EMP2024` y `dbo.vw_EmpleadosActivos`.

Campos clave:

- `carnet`
- `nombre_completo`
- `correo`
- `cargo`
- `pais`
- `OGERENCIA`
- `oDEPARTAMENTO`
- `oSUBGERENCIA`
- `carnet_jefe1`
- `carnet_jefe2`
- `carnet_jefe3`
- `carnet_jefe4`
- `nom_jefe1`
- `correo_jefe1`

Crear endpoints:

```text
GET /api/v1/empleados?q=&pais=
GET /api/v1/empleados/:carnet
GET /api/v1/empleados/me
GET /api/v1/empleados/me/equipo
GET /api/v1/empleados/:carnet/equipo       ADMIN/RRHH
GET /api/v1/empleados/:carnet/puede-ver/:objetivo
```

### 3.2 Roles

Roles minimos:

- `ADMIN`: todo.
- `BODEGA`: despacho, inventario, entradas/mermas, kardex operativo.
- `RRHH_APRUEBA`: aprobar/rechazar, reportes RRHH.
- `JEFE`: puede ser rol calculado si tiene subordinados; no necesariamente tabla.
- `SOLICITANTE`: todo usuario autenticado.

Regla especial:

- `ADMIN` debe pasar cualquier `RequireRole`.
- `BODEGA` ve todos los pendientes de su pais/almacen, no solo su equipo.
- `RRHH_APRUEBA` ve por pais/area autorizada.

### 3.3 Tablas nuevas recomendadas

```sql
CREATE TABLE dbo.InvPermisoEmpleado (
    IdPermiso INT IDENTITY PRIMARY KEY,
    CarnetRecibe VARCHAR(20) NOT NULL,
    CarnetObjetivo VARCHAR(20) NOT NULL,
    TipoAcceso VARCHAR(10) NOT NULL DEFAULT 'ALLOW',
    Activo BIT NOT NULL DEFAULT 1,
    FechaInicio DATETIME NULL,
    FechaFin DATETIME NULL,
    CreadoPor VARCHAR(20) NOT NULL,
    CreadoEn DATETIME NOT NULL DEFAULT GETDATE()
);
```

```sql
CREATE TABLE dbo.InvDelegacionVisibilidad (
    IdDelegacion INT IDENTITY PRIMARY KEY,
    CarnetDelegante VARCHAR(20) NOT NULL,
    CarnetDelegado VARCHAR(20) NOT NULL,
    Activo BIT NOT NULL DEFAULT 1,
    FechaInicio DATETIME NULL,
    FechaFin DATETIME NULL,
    Motivo VARCHAR(255) NULL,
    CreadoPor VARCHAR(20) NOT NULL,
    CreadoEn DATETIME NOT NULL DEFAULT GETDATE()
);
```

```sql
CREATE TABLE dbo.InvPermisoArea (
    IdPermisoArea INT IDENTITY PRIMARY KEY,
    CarnetRecibe VARCHAR(20) NOT NULL,
    Pais VARCHAR(2) NULL,
    Gerencia VARCHAR(200) NULL,
    Departamento VARCHAR(200) NULL,
    Subgerencia VARCHAR(200) NULL,
    Alcance VARCHAR(20) NOT NULL DEFAULT 'SUBARBOL',
    Activo BIT NOT NULL DEFAULT 1,
    CreadoPor VARCHAR(20) NOT NULL,
    CreadoEn DATETIME NOT NULL DEFAULT GETDATE()
);
```

Si no se quiere crear permisos por area en fase inicial, dejar solo jerarquia + roles + delegaciones.

## 4. SP recomendado: `Inv_Visibilidad_ObtenerCarnets`

Entrada:

```sql
@CarnetSolicitante VARCHAR(20)
```

Salida:

```text
carnet
fuente
nivel
```

Logica:

1. Normalizar carnet.
2. Si usuario tiene rol `ADMIN`, devolver todos los activos.
3. Crear actores efectivos:
   - solicitante;
   - delegantes activos donde el solicitante es delegado.
4. Incluir subordinados:
   - `carnet_jefe1 = actor` nivel 1;
   - `carnet_jefe2 = actor` nivel 2;
   - `carnet_jefe3 = actor` nivel 3;
   - `carnet_jefe4 = actor` nivel 4.
5. Incluir permisos empleado `ALLOW`.
6. Incluir permisos area.
7. Aplicar `DENY`.
8. Devolver deduplicado.

Importante:

- Usar tablas temporales con indices como EF para rendimiento.
- Evitar `OR` en la jerarquia; usar `UNION ALL`.
- El solicitante siempre se ve a si mismo.

## 5. Servicio NestJS recomendado

Crear modulo:

```text
api-nest/src/empleados/
├── empleados.module.js
├── empleados.controller.js
├── empleados.service.js
└── visibilidad.service.js
```

Metodos:

```js
async obtenerCarnetsVisibles(carnet)
async obtenerEmpleadosVisibles(carnet)
async puedeVer(carnetSolicitante, carnetObjetivo)
async obtenerActoresEfectivos(carnet)
async buscarEmpleados(query, pais, carnetSolicitante, roles)
```

Cache:

- Inicialmente cache en memoria TTL 5 minutos.
- Mejor fase 2: Redis o cache-manager si ya existe en Portal.
- Limpiar cache al cambiar roles, permisos o delegaciones.

## 6. Aplicacion en solicitudes

### Crear solicitud

Regla:

- Usuario normal crea para si mismo.
- Jefe/RRHH/Admin puede crear para alguien visible si la operacion se habilita.

Backend:

```js
const carnetSesion = req.user.carnet;
const empleadoCarnet = puedeCrearParaOtro ? body.empleadoCarnet : carnetSesion;
```

### Listar solicitudes

Reglas:

- `ADMIN`: todas.
- `BODEGA`: aprobadas/parciales por pais/almacen.
- `RRHH_APRUEBA`: pais/area autorizada.
- Jefe: solicitudes de carnets visibles.
- Solicitante: propias.

Implementacion recomendada:

- `SolicitudesController.listar()` debe recibir `Req`.
- `SolicitudesService.listar(filtros, usuario)` decide scope.
- Para jefe, obtener carnets visibles y pasar TVP/CSV al SP.

### Aprobar/rechazar

Regla:

- Puede aprobar si:
  - es `ADMIN`;
  - tiene `RRHH_APRUEBA`;
  - `puedeVer(carnetAprobador, empleadoCarnetSolicitud)` y la politica permite aprobacion jerarquica.

No basta comparar solo `JefeCarnet === carnetAprobador`, porque el usuario pidio jerarquia.

## 7. UI recomendada para empleados/equipo

Dentro de la pantalla unica:

- Agregar filtro superior "Alcance":
  - Mis solicitudes
  - Mi equipo
  - Pais
  - Todos
- Para jefe:
  - contador "Pendientes de mi equipo";
  - tabla de miembros;
  - buscador por nombre/carnet dentro de visibles.
- Para admin:
  - explorador de visibilidad tipo EF:
    - buscar carnet;
    - ver a quien puede ver;
    - probar si puede ver a otro carnet;
    - ver fuente: jerarquia, delegacion, permiso.

## 8. Pruebas obligatorias

Casos:

1. Solicitante A no ve solicitud de B.
2. Jefe J ve A si `A.carnet_jefe1 = J`.
3. Gerente G ve A si `A.carnet_jefe2 = G`.
4. Delegado D ve equipo de J si J delega en D.
5. `DENY` bloquea aunque haya jerarquia.
6. Bodega ve pendientes aprobadas del pais.
7. Admin ve todo.
8. RRHH ve por pais/area autorizada.

## 9. Criterio de salida

Este modulo queda listo cuando:

- `GET /empleados/me/equipo` devuelve equipo correcto.
- Solicitudes se filtran por scope.
- Aprobar/rechazar respeta jerarquia.
- UI muestra el alcance correcto.
- Tests unitarios y smoke cubren los casos principales.
