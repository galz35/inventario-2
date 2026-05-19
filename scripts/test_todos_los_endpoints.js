const http = require('http');
const https = require('https');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3023/api/v1';
const USER_CARNET = process.env.USER_CARNET || '500708';
const USER_PAIS = process.env.USER_PAIS || 'NI';
const ID_ALMACEN = parseInt(process.env.ID_ALMACEN || '1');
const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS || '10000');

const cookie = `user_carnet=${USER_CARNET}; user_pais=${USER_PAIS}`;
let passed = 0;
let failed = 0;
let idSolicitudCreada = null;
let idArticuloCreado = null;
let idAlmacenCreado = null;

function request(method, path, opts = {}) {
  const url = BASE_URL + path;
  const lib = url.startsWith('https') ? https : http;
  const u = new URL(url);
  return new Promise((resolve, reject) => {
    const req = lib.request({
      hostname: u.hostname, port: u.port, path: u.pathname + u.search, method,
      timeout: TIMEOUT_MS,
      headers: { 'Cookie': opts.noCookie ? '' : cookie, 'Content-Type': 'application/json', ...(opts.headers || {}) },
      rejectUnauthorized: false,
    }, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        let json;
        try { json = JSON.parse(body); } catch { json = null; }
        resolve({ status: res.statusCode, body: json, raw: body });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error(`timeout ${TIMEOUT_MS}ms`)); });
    if (opts.body) req.write(JSON.stringify(opts.body));
    req.end();
  });
}

async function check(module, label, fn) {
  try {
    await fn();
    console.log(`  ✅ [${module}] ${label}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ [${module}] ${label}: ${e.message}`);
    failed++;
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg || 'Assertion'); }

(async () => {
  console.log('========================================');
  console.log('PRUEBA COMPLETA DE TODOS LOS ENDPOINTS');
  console.log(`Carnet: ${USER_CARNET} | Pais: ${USER_PAIS} | Almacen: ${ID_ALMACEN}`);
  console.log('========================================\n');

  // ============================
  //  HEALTH
  // ============================
  await check('HEALTH', 'GET /health', async () => {
    const r = await request('GET', '/health', { noCookie: true });
    assert(r.status === 200, `status ${r.status}`);
    assert(r.body?.status === 'ok');
    assert(r.body?.db === 'connected');
  });

  // ============================
  //  AUTH
  // ============================
  await check('AUTH', 'GET /auth/me - datos del usuario', async () => {
    const r = await request('GET', '/auth/me');
    assert(r.status === 200, `status ${r.status}`);
    assert(r.body?.data?.carnet === USER_CARNET);
  });

  await check('AUTH', 'GET /auth/me sin cookie da 401', async () => {
    const r = await request('GET', '/auth/me', { noCookie: true });
    assert(r.status === 401, `status ${r.status}`);
  });

  await check('AUTH', 'POST /auth/logout', async () => {
    const r = await request('POST', '/auth/logout');
    assert(r.status === 200 || r.status === 201);
    assert(r.body?.status === 'success');
  });

  // ============================
  //  ALMACENES
  // ============================
  await check('ALMACENES', 'GET /almacenes?pais=NI', async () => {
    const r = await request('GET', `/almacenes?pais=${USER_PAIS}`);
    assert(r.status === 200);
    assert(Array.isArray(r.body?.data));
  });

  await check('ALMACENES', 'GET /almacenes sin pais', async () => {
    const r = await request('GET', '/almacenes');
    assert(r.status === 200);
    assert(Array.isArray(r.body?.data));
  });

  await check('ALMACENES', 'GET /almacenes sin cookie da 401', async () => {
    const r = await request('GET', '/almacenes', { noCookie: true });
    assert(r.status === 401);
  });

  // ============================
  //  ARTICULOS
  // ============================
  await check('ARTICULOS', 'GET /articulos', async () => {
    const r = await request('GET', '/articulos');
    assert(r.status === 200);
    assert(Array.isArray(r.body?.data));
  });

  // ============================
  //  INVENTARIO
  // ============================
  await check('INVENTARIO', `GET /inventario?idAlmacen=${ID_ALMACEN}`, async () => {
    const r = await request('GET', `/inventario?idAlmacen=${ID_ALMACEN}`);
    assert(r.status === 200);
    assert(Array.isArray(r.body?.data));
  });

  await check('INVENTARIO', `GET /inventario/lotes?idAlmacen=${ID_ALMACEN}&idArticulo=1`, async () => {
    const r = await request('GET', `/inventario/lotes?idAlmacen=${ID_ALMACEN}&idArticulo=1`);
    assert(r.status === 200);
    assert(Array.isArray(r.body?.data));
  });

  await check('INVENTARIO', `GET /inventario/alertas/vencimiento?idAlmacen=${ID_ALMACEN}&dias=30`, async () => {
    const r = await request('GET', `/inventario/alertas/vencimiento?idAlmacen=${ID_ALMACEN}&dias=30`);
    assert(r.status === 200);
  });

  await check('INVENTARIO', `GET /inventario/alertas/stock-bajo?idAlmacen=${ID_ALMACEN}`, async () => {
    const r = await request('GET', `/inventario/alertas/stock-bajo?idAlmacen=${ID_ALMACEN}`);
    assert(r.status === 200);
  });

  await check('INVENTARIO', 'POST /inventario/movimiento - ENTRADA', async () => {
    const r = await request('POST', '/inventario/movimiento', {
      body: { idAlmacen: ID_ALMACEN, tipo: 'ENTRADA', idArticulo: 1, talla: 'UNI', sexo: 'N', cantidad: 5, comentario: 'Test' }
    });
    assert(r.status === 200 || r.status === 201);
    assert(r.body?.status === 'success');
  });

  await check('INVENTARIO', 'POST /inventario/movimiento - MERMA', async () => {
    const r = await request('POST', '/inventario/movimiento', {
      body: { idAlmacen: ID_ALMACEN, tipo: 'MERMA', idArticulo: 1, talla: 'UNI', sexo: 'N', cantidad: 1, comentario: 'Test merma' }
    });
    assert(r.status === 200 || r.status === 201);
    assert(r.body?.status === 'success');
  });

  // ============================
  //  SOLICITUDES
  // ============================
  await check('SOLICITUDES', `GET /solicitudes/stats?idAlmacen=${ID_ALMACEN}`, async () => {
    const r = await request('GET', `/solicitudes/stats?idAlmacen=${ID_ALMACEN}`);
    assert(r.status === 200);
    assert(r.body?.data?.pendientesAprobacion !== undefined);
  });

  await check('SOLICITUDES', `GET /solicitudes/recents?idAlmacen=${ID_ALMACEN}`, async () => {
    const r = await request('GET', `/solicitudes/recents?idAlmacen=${ID_ALMACEN}`);
    assert(r.status === 200);
  });

  await check('SOLICITUDES', 'GET /solicitudes (listar con filtros)', async () => {
    const r = await request('GET', `/solicitudes?pais=${USER_PAIS}&estado=Pendiente`);
    assert(r.status === 200);
    assert(Array.isArray(r.body?.data));
  });

  await check('SOLICITUDES', 'POST /solicitudes - crear', async () => {
    const r = await request('POST', '/solicitudes', {
      body: { empleadoCarnet: USER_CARNET, motivo: 'TEST - Todos los endpoints', detalles: [{ idArticulo: 1, talla: 'UNI', sexo: 'N', cantidad: 2 }] }
    });
    assert(r.status === 200 || r.status === 201);
    assert(r.body?.data?.IdSolicitud);
    idSolicitudCreada = r.body.data.IdSolicitud;
  });

  await check('SOLICITUDES', `GET /solicitudes/${idSolicitudCreada}/detalle?idAlmacen=${ID_ALMACEN}`, async () => {
    assert(idSolicitudCreada, 'No hay solicitud creada');
    const r = await request('GET', `/solicitudes/${idSolicitudCreada}/detalle?idAlmacen=${ID_ALMACEN}`);
    assert(r.status === 200);
    assert(Array.isArray(r.body?.data));
  });

  await check('SOLICITUDES', `POST /solicitudes/${idSolicitudCreada}/aprobar`, async () => {
    assert(idSolicitudCreada, 'No hay solicitud creada');
    const r = await request('POST', `/solicitudes/${idSolicitudCreada}/aprobar`, { body: {} });
    assert(r.status === 200 || r.status === 201);
    assert(r.body?.status === 'success');
  });

  // Crear otra solicitud para probar rechazo
  let idSolicitudRechazar;
  await check('SOLICITUDES', 'POST /solicitudes - crear para rechazo', async () => {
    const r = await request('POST', '/solicitudes', {
      body: { empleadoCarnet: USER_CARNET, motivo: 'TEST - Para rechazar', detalles: [{ idArticulo: 1, talla: 'UNI', sexo: 'N', cantidad: 1 }] }
    });
    assert(r.status === 200 || r.status === 201);
    idSolicitudRechazar = r.body.data.IdSolicitud;
  });

  await check('SOLICITUDES', `POST /solicitudes/${idSolicitudRechazar}/rechazar`, async () => {
    const r = await request('POST', `/solicitudes/${idSolicitudRechazar}/rechazar`, { body: { motivo: 'Prueba de rechazo' } });
    assert(r.status === 200 || r.status === 201);
    assert(r.body?.status === 'success');
  });

  // ============================
  //  BODEGA
  // ============================
  await check('BODEGA', `GET /bodega/pendientes?pais=${USER_PAIS}`, async () => {
    const r = await request('GET', `/bodega/pendientes?pais=${USER_PAIS}`);
    assert(r.status === 200);
    assert(Array.isArray(r.body?.data));
  });

  await check('BODEGA', `GET /bodega/solicitudes/${idSolicitudCreada}/pre-despacho?idAlmacen=${ID_ALMACEN}`, async () => {
    assert(idSolicitudCreada, 'No hay solicitud');
    const r = await request('GET', `/bodega/solicitudes/${idSolicitudCreada}/pre-despacho?idAlmacen=${ID_ALMACEN}`);
    assert(r.status === 200);
    assert(Array.isArray(r.body?.data));
  });

  await check('BODEGA', 'POST /bodega/despachar - despacho parcial', async () => {
    assert(idSolicitudCreada, 'No hay solicitud');
    // Obtener IdDetalle del pre-despacho
    const pre = await request('GET', `/bodega/solicitudes/${idSolicitudCreada}/pre-despacho?idAlmacen=${ID_ALMACEN}`);
    assert(pre.status === 200);
    const lineas = (pre.body?.data || []).filter(l => l.Pendiente > 0).map(l => ({ IdDetalle: l.IdDetalle, Entregar: 1 }));
    assert(lineas.length > 0, 'No hay lineas');
    const r = await request('POST', '/bodega/despachar', {
      body: { idAlmacen: ID_ALMACEN, idSolicitud: idSolicitudCreada, lineas }
    });
    assert(r.status === 200 || r.status === 201);
    assert(r.body?.status === 'success');
  });

  // ============================
  //  KARDEX
  // ============================
  await check('KARDEX', 'GET /kardex con filtros', async () => {
    const r = await request('GET', `/kardex?idAlmacen=${ID_ALMACEN}&desde=2024-01-01&hasta=2026-12-31&tipo=SALIDA&carnetDestino=${USER_CARNET}`);
    assert(r.status === 200);
    assert(Array.isArray(r.body?.data));
  });

  await check('KARDEX', 'GET /kardex solo fechas', async () => {
    const r = await request('GET', `/kardex?idAlmacen=${ID_ALMACEN}&desde=2024-01-01&hasta=2026-12-31`);
    assert(r.status === 200);
  });

  // ============================
  //  EMPLEADOS
  // ============================
  await check('EMPLEADOS', 'GET /empleados?q=', async () => {
    const r = await request('GET', `/empleados?q=${USER_CARNET}&pais=${USER_PAIS}`);
    assert(r.status === 200);
    assert(Array.isArray(r.body?.data));
  });

  await check('EMPLEADOS', 'GET /empleados/me', async () => {
    const r = await request('GET', '/empleados/me');
    assert(r.status === 200);
    assert(r.body?.data?.carnet === USER_CARNET);
  });

  await check('EMPLEADOS', 'GET /empleados/me/equipo', async () => {
    const r = await request('GET', '/empleados/me/equipo');
    assert(r.status === 200);
    assert(Array.isArray(r.body?.data));
  });

  await check('EMPLEADOS', `GET /empleados/${USER_CARNET}`, async () => {
    const r = await request('GET', `/empleados/${USER_CARNET}`);
    assert(r.status === 200);
    assert(r.body?.data?.carnet === USER_CARNET);
  });

  await check('EMPLEADOS', `GET /empleados/${USER_CARNET}/equipo (requiere ADMIN/RRHH)`, async () => {
    const r = await request('GET', `/empleados/${USER_CARNET}/equipo`);
    assert(r.status === 200);
    assert(Array.isArray(r.body?.data));
  });

  await check('EMPLEADOS', `GET /empleados/${USER_CARNET}/puede-ver/${USER_CARNET}`, async () => {
    const r = await request('GET', `/empleados/${USER_CARNET}/puede-ver/${USER_CARNET}`);
    assert(r.status === 200);
  });

  // ============================
  //  ADMIN
  // ============================
  await check('ADMIN', 'GET /admin/roles', async () => {
    const r = await request('GET', '/admin/roles');
    assert(r.status === 200);
    assert(Array.isArray(r.body?.data));
  });

  await check('ADMIN', 'POST /admin/roles - asignar rol', async () => {
    const r = await request('POST', '/admin/roles', {
      body: { carnet: USER_CARNET, rol: 'BODEGA', activo: true }
    });
    assert(r.status === 200 || r.status === 201);
    assert(r.body?.status === 'success');
  });

  await check('ADMIN', 'POST /admin/almacenes', async () => {
    const ts = Date.now();
    const r = await request('POST', '/admin/almacenes', {
      body: { codigo: `TEST-${ts}`, nombre: `Almacen Test ${ts}`, pais: USER_PAIS }
    });
    assert(r.status === 200 || r.status === 201, `status ${r.status}`);
    assert(r.body?.data?.IdAlmacen, `Sin IdAlmacen: ${JSON.stringify(r.body)}`);
    idAlmacenCreado = r.body.data.IdAlmacen;
  });

  await check('ADMIN', 'POST /admin/articulos', async () => {
    const ts = Date.now();
    const r = await request('POST', '/admin/articulos', {
      body: { codigo: `TEST-ART-${ts}`, nombre: `Articulo Test ${ts}`, tipo: 'EPP', unidad: 'UN' }
    });
    assert(r.status === 200 || r.status === 201, `status ${r.status}`);
    assert(r.body?.data?.IdArticulo, `Sin IdArticulo: ${JSON.stringify(r.body)}`);
    idArticuloCreado = r.body.data.IdArticulo;
  });

  await check('ADMIN', 'GET /admin/audit', async () => {
    const r = await request('GET', '/admin/audit');
    assert(r.status === 200);
    assert(Array.isArray(r.body?.data));
  });

  await check('ADMIN', 'POST /admin/transferencia', async () => {
    assert(idAlmacenCreado, 'No hay almacen destino');
    const r = await request('POST', '/admin/transferencia', {
      body: { idAlmacenOrigen: ID_ALMACEN, idAlmacenDestino: idAlmacenCreado, idArticulo: 1, talla: 'UNI', sexo: 'N', cantidad: 1 }
    });
    assert(r.status === 200 || r.status === 201);
    assert(r.body?.status === 'success');
  });

  // ============================
  //  EVIDENCIA
  // ============================
  await check('EVIDENCIA', 'POST /bodega/evidencia', async () => {
    const r = await request('POST', '/bodega/evidencia', {
      body: { idSolicitud: idSolicitudCreada, nombreArchivo: 'test.jpg', tipoArchivo: 'image/jpeg', contenidoBase64: 'dGVzdA==' }
    });
    assert(r.status === 200 || r.status === 201);
  });

  // ============================
  //  RESUMEN
  // ============================
  console.log('\n========================================');
  console.log(`RESULTADO: ${passed} pasaron, ${failed} fallaron`);
  console.log('========================================');
  process.exit(failed > 0 ? 1 : 0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
