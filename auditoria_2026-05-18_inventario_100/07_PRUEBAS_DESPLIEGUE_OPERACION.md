# Pruebas, despliegue y operacion

Fecha: 2026-05-18

## Validaciones actuales

### Frontend

```bash
cd /opt/apps/inventario-portal/web
npm run lint
npm run build
```

Estado:

- Pasa.
- Warning de bundle grande.

### Backend

```bash
cd /opt/apps/inventario-portal/api-nest
npm test -- --runInBand
```

Estado:

- Pasa.
- 3 suites.
- 10 tests.

### Smoke local

```bash
BASE_URL=http://127.0.0.1:3023/api/v1 USER_CARNET=500708 USER_PAIS=NI ID_ALMACEN=1 node scripts/smoke_inventory.js
```

Estado:

- 10 pasan.

### Flutter

```bash
flutter --version
```

Estado:

- No instalado.

## Problema detectado en smoke publico

Se intento:

```bash
BASE_URL=https://rhclaroni.com/api-portal-inventario/api/v1 USER_CARNET=500708 USER_PAIS=NI ID_ALMACEN=1 node scripts/smoke_inventory.js
```

Resultado final:

- 0 pasaron.
- 10 fallaron.
- Error repetido: `connect ETIMEDOUT 190.56.16.85:443`.

Accion obligatoria:

- Agregar timeout por request al script.
- Validar ruta publica con `curl` local y host correcto.
- Confirmar si la API publica debe ser:
  - `https://rhclaroni.com/api-portal-inventario/api/v1`
  - o `https://www.rhclaroni.com/api-portal-inventario/api/v1`

## Mejora requerida al smoke

Agregar:

```js
req.setTimeout(8000, () => {
  req.destroy(new Error('timeout'));
});
```

Agregar parametros:

```text
TIMEOUT_MS=8000
EXPECT_BODEGA=1
RUN_MUTATION_FLOW=0
```

Checks nuevos:

- `/auth/me` con cookie.
- `/auth/logout`.
- bodega con `EXPECT_BODEGA=1` debe devolver 200.
- payload de `Sol_DetalleConStock` incluye campos esperados.

## Pruebas e2e necesarias

Crear `tests/e2e/inventory-flow.spec.js` o Playwright:

1. Sesion usuario normal.
2. Crear solicitud.
3. Sesion jefe.
4. Aprobar solicitud.
5. Sesion bodega.
6. Despachar parcial.
7. Ver estado `Parcial`.
8. Despachar restante.
9. Ver estado `Atendida`.
10. Ver kardex.

## Pruebas SQL necesarias

1. FEFO:
   - crear 2 lotes con vencimientos distintos;
   - despachar;
   - confirmar que salio primero el mas cercano.

2. Stock negativo:
   - intentar merma mayor al stock;
   - debe fallar.

3. Solicitud sin lineas:
   - debe fallar.

4. Entrega mayor a pendiente:
   - debe fallar.

5. Rechazo en estado atendida:
   - debe fallar.

6. Jerarquia:
   - jefe directo ve subordinado;
   - superior ve descendencia;
   - DENY bloquea.

## Checklist antes de publicar

```bash
cd /opt/apps/inventario-portal
git status --short

cd web
npm ci
npm run lint
npm run build

cd ../api-nest
npm ci
npm test -- --runInBand

cd ..
BASE_URL=http://127.0.0.1:3023/api/v1 USER_CARNET=500708 USER_PAIS=NI ID_ALMACEN=1 node scripts/smoke_inventory.js
```

Si todo pasa:

```bash
/root/iinv.bash update
```

Despues:

```bash
pm2 describe portal-inventario-api
pm2 logs portal-inventario-api --lines 60 --nostream
curl -sS -D - http://127.0.0.1:3023/api/v1/health
curl -sS -D - https://127.0.0.1/portal/inventario/ -H 'Host: rhclaroni.com' -k
```

## Rollback

Documentar ubicaciones reales:

- Frontend publicado: `/var/www/portal-inventario/`
- Backend: `/opt/apps/inventario-portal/api-nest`
- PM2: `portal-inventario-api`

Antes de publicar:

```bash
cp -a /var/www/portal-inventario /var/www/portal-inventario.bak.$(date +%F_%H%M)
git rev-parse HEAD > /tmp/inventario_before_deploy.sha
```

Rollback:

```bash
rm -rf /var/www/portal-inventario
cp -a /var/www/portal-inventario.bak.YYYY-MM-DD_HHMM /var/www/portal-inventario
cd /opt/apps/inventario-portal
git checkout $(cat /tmp/inventario_before_deploy.sha)
pm2 restart portal-inventario-api
nginx -t
systemctl reload nginx
```

No ejecutar rollback destructivo sin confirmar backup.

## Observabilidad

Agregar:

- `GET /api/v1/health` con commit, uptime, DB, build.
- logs estructurados por request.
- contador de errores SQL.
- logs de SSO sin token.
- auditoria DB.

## Criterio operativo 100%

- Local smoke verde.
- Public smoke verde.
- E2E verde.
- PM2 online.
- Nginx 200.
- Logs sin errores nuevos.
- Rollback documentado.
