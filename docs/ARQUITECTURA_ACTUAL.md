# Arquitectura Actual - Inventario Portal

## Stack tecnológico

| Capa | Tecnología | Ubicación |
|------|-----------|-----------|
| Frontend Web | React 19 + Vite 8 | `web/` |
| Backend API | NestJS (JavaScript) | `api-nest/` |
| App Móvil | Flutter | `movil/` |
| Base de Datos | SQL Server | Servidor remoto |
| Proxy/SSL | Nginx | Mismo VPS |
| Gestor Procesos | PM2 | `portal-inventario-api` |

## Dominio canónico

- Producción: `https://rhclaroni.com/portal/inventario/`
- API pública: `https://rhclaroni.com/api-portal-inventario/`
- API local: `http://127.0.0.1:3023/api/v1`

## Estructura del repositorio

```
/opt/apps/inventario-portal/
├── api-nest/              Backend NestJS
├── web/                   Frontend React
├── movil/                 App Flutter
├── db/migrations/         Scripts SQL (fuente canónica de DB)
├── scripts/               Scripts de prueba (smoke)
├── docs/                  Documentación técnica
├── informacion_rust/      Referencia histórica (NO usar como fuente actual)
├── setup_db.js            Script operativo de DB
└── update_db_v2.js        Script operativo de DB
```

## Flujo de autenticación

1. Usuario visita `https://rhclaroni.com/portal/inventario/`
2. Sin sesión, redirige al Portal Central `https://rhclaroni.com/login-empleado`
3. Portal Central redirige de vuelta con JWT en query param `token`
4. Frontend envía token a `POST /api/v1/auth/sso-login`
5. Backend valida JWT (secret compartido), busca empleado en DB, obtiene roles
6. Backend setea cookies `user_carnet` y `user_pais` (httpOnly, sameSite=lax)
7. Frontend redirige al dashboard

## Seguridad

- Cookies httpOnly + sameSite=lax
- `AuthGuard`: valida cookie contra `dbo.UsuariosSeguridad.Activo`
- `RolesGuard`: valida rol contra `dbo.RolesSistema`
- `@RequireRole('BODEGA')` en endpoints de despacho
- Logout: `POST /api/v1/auth/logout` borra cookies

## Pruebas

- Backend: Jest (10 tests: 7 unitarios, 3 de controller)
- Frontend: ESLint + Vite build (sin tests de componentes aún)
- Smoke: `node scripts/smoke_inventory.js`

## Despliegue

Ver `scripts/iinv.bash` en `/root/iinv.bash` o seguir checklist en Fase 8 del plan detallado.
