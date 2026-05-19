# Auditoria Inventario Portal 100%

Fecha: 2026-05-18  
Proyecto: `/opt/apps/inventario-portal`  
Objetivo: revisar pieza por pieza si el sistema esta completo y dejar una guia ejecutable para que otro agente de IA lo termine sin improvisar.

## Veredicto

El sistema no esta al 100%, pero ya tiene una base funcional importante.

Lo que esta bien encaminado:

- Backend NestJS online y con health funcional.
- Frontend React compila y pasa lint.
- Tests backend pasan.
- Smoke local pasa con usuario `500708`.
- Web tiene una pantalla principal con tabs para monitor, stock, solicitudes, despacho y kardex.
- Se agregaron `logout`, `me`, docs de arquitectura/API y smoke test.
- DB tiene SPs principales para solicitud, aprobacion, despacho FEFO y kardex.

Lo que impide decir "100%":

- Falta modelo formal de empleados/equipo/jerarquia para que un jefe vea solo su equipo y para que bodega/admin vean todo.
- Solicitudes permite mandar `empleadoCarnet` desde el body; debe salir de la sesion salvo rol autorizado.
- Listados no filtran por visibilidad jerarquica; hoy se filtran principalmente por pais/rol.
- App movil sigue incompleta: sin Flutter en servidor, `idAlmacen=1` fijo, parseo de detalle incompatible con API real, refresh token inexistente, evidencia de foto no se guarda.
- Migraciones DB no estan 100% alineadas con el backend actual. `db/migrations/02_sps.sql` tiene SPs sin `@Pais` en partes donde el backend/documentacion esperan pais.
- No hay endpoints de empleados/equipo en Inventario.
- No hay pantalla administrativa de roles, almacenes, articulos, stock minimo, lotes, permisos o delegaciones.
- No hay pruebas e2e reales de crear solicitud/aprobar/despachar/kardex.
- No hay validacion visual Playwright ni pruebas de responsive.
- No hay auditoria operativa completa de login, roles, cambios administrativos y errores.
- El smoke publico contra `https://rhclaroni.com/api-portal-inventario/api/v1` fallo completo con `connect ETIMEDOUT 190.56.16.85:443`; hay que validar ruta publica/nginx/red y agregar timeout explicito al script.

## Documentos de esta carpeta

1. `00_INDICE_Y_RESUMEN_EJECUTIVO.md`
   - Veredicto, estado actual, orden de lectura.

2. `01_AUDITORIA_PIEZA_POR_PIEZA.md`
   - Backend, frontend, movil, DB, seguridad, SSO, pruebas y despliegue.

3. `02_EMPLEADOS_EQUIPO_JERARQUIA_TIPO_EF_PLANER.md`
   - Como debe obtener empleados, equipo del jefe inmediato, jerarquia y visibilidad.

4. `03_FLUJOS_FUNCIONALES_COMPLETOS.md`
   - Flujo por flujo: solicitante, jefe, RRHH, bodega, admin, auditoria.

5. `04_PLAN_BACKEND_DB_PASO_A_PASO.md`
   - Tareas exactas para API, SPs, migraciones, roles, seguridad y auditoria.

6. `05_PLAN_FRONTEND_UNA_PANTALLA_AVANZADA.md`
   - Como convertir la web en una pantalla potente, rapida y facil.

7. `06_PLAN_MOVIL_FLUTTER.md`
   - Como terminar app movil y eliminar datos/IDs falsos.

8. `07_PRUEBAS_DESPLIEGUE_OPERACION.md`
   - Validaciones, smoke, e2e, nginx, PM2, rollback.

9. `08_REFERENCIAS_SISTEMAS_SIMILARES.md`
   - Buenas practicas de sistemas internos de inventario y WMS.

10. `09_PROMPT_EJECUCION_PARA_OTRA_IA.md`
    - Instrucciones concretas para el siguiente agente.

## Validaciones ejecutadas

```bash
cd /opt/apps/inventario-portal/web
npm run lint
npm run build
```

Resultado:

- Lint: pasa.
- Build: pasa.
- Warning: bundle JS grande, `723.73 kB` minificado, gzip `235.95 kB`.

```bash
cd /opt/apps/inventario-portal/api-nest
npm test -- --runInBand
```

Resultado:

- 3 suites pasan.
- 10 tests pasan.

```bash
cd /opt/apps/inventario-portal/movil
flutter --version
```

Resultado:

- Falla: `flutter: command not found`.

```bash
BASE_URL=http://127.0.0.1:3023/api/v1 USER_CARNET=500708 USER_PAIS=NI ID_ALMACEN=1 node scripts/smoke_inventory.js
```

Resultado:

- 10 checks pasan.
- Health, almacenes, articulos, inventario, stats, solicitudes, bodega y kardex responden.

## Prioridad real

Si se quiere terminar el sistema de forma robusta, el orden correcto es:

1. Cerrar modelo de empleados/jerarquia/visibilidad.
2. Blindar seguridad: solicitud usa carnet de sesion, roles con `ADMIN`, filtros por visibilidad.
3. Alinear migraciones DB con backend real.
4. Completar web de una pantalla con acciones faltantes.
5. Completar movil.
6. Agregar pruebas e2e/smoke con timeout.
7. Publicar y documentar rollback.

## Definicion objetiva de "100%"

El sistema estara al 100% cuando:

- Un solicitante crea y ve sus solicitudes.
- Un jefe ve y aprueba/rechaza las solicitudes de su equipo directo y jerarquico.
- RRHH puede aprobar/rechazar segun rol.
- Bodega ve todos los pendientes de su pais/almacen y despacha parcial o total.
- Admin ve todo y administra catalogos, roles, permisos, almacenes, stock minimo y auditoria.
- Kardex y reportes muestran trazabilidad completa.
- Web, API y movil tienen contratos iguales.
- Todas las pruebas automatizadas pasan.
- Produccion queda validada via nginx.
