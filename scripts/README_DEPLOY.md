# Despliegue y Operación - Inventario Portal

## Pre-flight checklist

```bash
# 1. Backend tests
cd /opt/apps/inventario-portal/api-nest
npm ci && npm test -- --runInBand

# 2. Frontend build
cd /opt/apps/inventario-portal/web
npm ci && npm run lint && npm run build

# 3. Smoke local
cd /opt/apps/inventario-portal
BASE_URL=http://127.0.0.1:3023/api/v1 USER_CARNET=500708 USER_PAIS=NI ID_ALMACEN=1 node scripts/smoke_inventory.js

# 4. E2E flow completo
BASE_URL=http://127.0.0.1:3023/api/v1 USER_CARNET=500708 USER_PAIS=NI ID_ALMACEN=1 node scripts/e2e_inventory_flow.js
```

## Publicar

```bash
# Backup
cp -a /var/www/portal-inventario /var/www/portal-inventario.bak.$(date +%F_%H%M)
git rev-parse HEAD > /tmp/inventario_before_deploy.sha

# Publicar frontend
cp -r /opt/apps/inventario-portal/web/dist/* /var/www/portal-inventario/

# Publicar backend (PM2 lo recarga automático si se usa iinv.bash)
# Usar script de actualización
/root/iinv.bash update

# Verificar
pm2 describe portal-inventario-api
pm2 logs portal-inventario-api --lines 30 --nostream
```

## Verificación post-despliegue

```bash
# Smoke local
BASE_URL=http://127.0.0.1:3023/api/v1 USER_CARNET=500708 USER_PAIS=NI ID_ALMACEN=1 node scripts/smoke_inventory.js

# Smoke público (si aplica)
BASE_URL=https://rhclaroni.com/api-portal-inventario/api/v1 USER_CARNET=500708 USER_PAIS=NI ID_ALMACEN=1 TIMEOUT_MS=10000 node scripts/smoke_inventory.js
```

## Rollback

```bash
# Frontend
rm -rf /var/www/portal-inventario
cp -a /var/www/portal-inventario.bak.YYYY-MM-DD_HHMM /var/www/portal-inventario

# Backend
cd /opt/apps/inventario-portal
git checkout $(cat /tmp/inventario_before_deploy.sha)
pm2 restart portal-inventario-api
nginx -t && systemctl reload nginx
```

## Monitoreo

```bash
# Logs
pm2 logs portal-inventario-api --lines 60 --nostream

# Health extendido
curl -sS http://127.0.0.1:3023/api/v1/health

# Nginx
curl -sS -D - https://rhclaroni.com/api-portal-inventario/ -k
```

## Limpieza de evidencias (programar en SQL Agent)

```sql
EXEC dbo.Bod_LimpiarEvidenciasViejas @DiasRetencion = 14;
```
