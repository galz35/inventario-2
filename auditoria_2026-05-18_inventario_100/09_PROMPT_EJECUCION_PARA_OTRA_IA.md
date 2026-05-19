# Prompt de ejecucion para otra IA

Fecha: 2026-05-18

## Rol

Eres una IA desarrolladora trabajando en `/opt/apps/inventario-portal`. Tu objetivo es llevar Inventario Portal al 100% sin cambiar de stack.

Stack actual:

- Backend: NestJS JavaScript en `api-nest/`
- Frontend: React/Vite en `web/`
- Movil: Flutter en `movil/`
- DB: SQL Server con SPs
- Produccion: PM2 `portal-inventario-api` + Nginx

No uses `informacion_rust` como fuente de verdad del sistema actual. Es referencia historica.

## Antes de tocar codigo

Ejecuta:

```bash
cd /opt/apps/inventario-portal
git status --short
```

No reviertas cambios no tuyos.

Lee en orden:

1. `auditoria_2026-05-18_inventario_100/00_INDICE_Y_RESUMEN_EJECUTIVO.md`
2. `auditoria_2026-05-18_inventario_100/01_AUDITORIA_PIEZA_POR_PIEZA.md`
3. `auditoria_2026-05-18_inventario_100/02_EMPLEADOS_EQUIPO_JERARQUIA_TIPO_EF_PLANER.md`
4. `auditoria_2026-05-18_inventario_100/04_PLAN_BACKEND_DB_PASO_A_PASO.md`

## Trabajo 1: cerrar DB y backend

1. Alinear `db/migrations` con `setup_db.js`.
2. Crear modulo `empleados`.
3. Crear SPs de visibilidad.
4. Cambiar solicitudes para usar carnet de sesion.
5. Filtrar listados por scope.
6. Hacer `ADMIN` superrol.
7. Agregar tests.

Comando requerido:

```bash
cd /opt/apps/inventario-portal/api-nest
npm test -- --runInBand
```

## Trabajo 2: cerrar frontend

1. Separar `Dashboard.jsx` en componentes.
2. Agregar alcance: mis solicitudes, mi equipo, pais, todo.
3. Agregar drawer de detalle.
4. Implementar despacho parcial.
5. Implementar entrada/merma/transferencia.
6. Implementar admin.
7. Dynamic import de `xlsx`.

Comandos:

```bash
cd /opt/apps/inventario-portal/web
npm run lint
npm run build
```

## Trabajo 3: cerrar movil

1. Corregir base URL.
2. Quitar referencias Planer.
3. Quitar refresh inexistente.
4. Pasar pais.
5. Usar almacen real.
6. Corregir parseo detalle.
7. Validar con Flutter.

Comandos:

```bash
cd /opt/apps/inventario-portal/movil
flutter pub get
flutter analyze
flutter test
flutter build apk --release --dart-define=API_BASE_URL=https://rhclaroni.com/api-portal-inventario/
```

Si Flutter no existe, documentalo y no marques movil como terminado.

## Trabajo 4: pruebas y despliegue

1. Agregar timeout a smoke.
2. Agregar smoke publico.
3. Agregar e2e flujo completo.
4. Validar nginx.
5. Publicar solo si todo pasa.

Comandos:

```bash
BASE_URL=http://127.0.0.1:3023/api/v1 USER_CARNET=500708 USER_PAIS=NI ID_ALMACEN=1 node scripts/smoke_inventory.js
```

Publicacion:

```bash
/root/iinv.bash update
```

## No aceptar como terminado si falta

- Jerarquia.
- Solicitudes scoped.
- Movil validado.
- Migraciones alineadas.
- Despacho parcial.
- Admin.
- Pruebas e2e.
- Smoke publico.

## Commit sugerido por bloque

Backend/DB:

```bash
git add api-nest db docs
git commit -m "feat: add inventory employee visibility and scoped requests"
```

Frontend:

```bash
git add web
git commit -m "feat: complete inventory portal single-screen workflows"
```

Movil:

```bash
git add movil
git commit -m "feat: complete inventory mobile dispatch flow"
```

Pruebas:

```bash
git add scripts tests docs
git commit -m "test: add inventory smoke and end-to-end coverage"
```
