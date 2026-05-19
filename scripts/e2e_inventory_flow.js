const http = require('http');
const https = require('https');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3023/api/v1';
const USER_CARNET = process.env.USER_CARNET;
const USER_PAIS = process.env.USER_PAIS || 'NI';
const ID_ALMACEN = parseInt(process.env.ID_ALMACEN || '1');
const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS || '10000');

if (!USER_CARNET) {
  console.error('ERROR: Debe definir USER_CARNET');
  process.exit(1);
}

const cookie = `user_carnet=${USER_CARNET}; user_pais=${USER_PAIS}`;
let passed = 0;
let failed = 0;

function request(method, path, opts = {}) {
  const url = BASE_URL + path;
  const isHttps = url.startsWith('https');
  const lib = isHttps ? https : http;
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

async function check(label, fn) {
  try {
    await fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${label}: ${e.message}`);
    failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

(async () => {
  console.log('E2E Flow: Inventario Portal');
  console.log(`URL: ${BASE_URL} | Carnet: ${USER_CARNET} | Almacen: ${ID_ALMACEN}`);
  console.log('');

  // =========================================================
  // 1. Crear solicitud
  // =========================================================
  let idSolicitud;
  await check('POST /solicitudes - Crear solicitud', async () => {
    const res = await request('POST', '/solicitudes', {
      body: {
        empleadoCarnet: USER_CARNET,
        motivo: 'TEST E2E - Solicitud automática',
        detalles: [{ idArticulo: 1, talla: 'UNI', sexo: 'N', cantidad: 1 }],
      },
    });
    assert(res.status === 201 || res.status === 200, `Esperado 200/201, recibido ${res.status}: ${res.raw}`);
    assert(res.body?.status === 'success', `status no success: ${JSON.stringify(res.body)}`);
    idSolicitud = res.body?.data?.IdSolicitud;
    assert(idSolicitud, `No se obtuvo IdSolicitud: ${JSON.stringify(res.body)}`);
  });

  // =========================================================
  // 2. Ver solicitud creada
  // =========================================================
  await check('GET /solicitudes - Listar incluye la nueva', async () => {
    const res = await request('GET', `/solicitudes?pais=${USER_PAIS}`);
    assert(res.status === 200, `Esperado 200, recibido ${res.status}`);
    const ids = (res.body?.data || []).map(s => s.IdSolicitud);
    assert(ids.includes(idSolicitud), `Solicitud #${idSolicitud} no aparece en el listado`);
  });

  // =========================================================
  // 3. Aprobar solicitud
  // =========================================================
  await check(`POST /solicitudes/${idSolicitud}/aprobar`, async () => {
    const res = await request('POST', `/solicitudes/${idSolicitud}/aprobar`, { body: {} });
    assert(res.status === 200 || res.status === 201, `Esperado 200/201, recibido ${res.status}: ${res.raw}`);
    assert(res.body?.status === 'success', `status no success`);
  });

  // =========================================================
  // 4. Verificar estado Aprobada
  // =========================================================
  await check(`GET /solicitudes/${idSolicitud}/detalle?idAlmacen=${ID_ALMACEN} - Estado Aprobada`, async () => {
    const res = await request('GET', `/solicitudes/${idSolicitud}/detalle?idAlmacen=${ID_ALMACEN}`);
    assert(res.status === 200, `Esperado 200, recibido ${res.status}`);
    // Verificar que las lineas tienen CantidadAprobada > 0
    const lineas = res.body?.data || [];
    assert(lineas.length > 0, 'Sin lineas en detalle');
    assert(lineas[0].CantidadAprobada > 0, `CantidadAprobada no se actualizó: ${JSON.stringify(lineas[0])}`);
  });

  // =========================================================
  // 5. Aparece en bodega pendientes
  // =========================================================
  await check('GET /bodega/pendientes - Solicitud está pendiente', async () => {
    const res = await request('GET', `/bodega/pendientes?pais=${USER_PAIS}`);
    assert(res.status === 200, `Esperado 200, recibido ${res.status}`);
    const ids = (res.body?.data || []).map(s => s.IdSolicitud);
    assert(ids.includes(idSolicitud), `Solicitud #${idSolicitud} no aparece en pendientes`);
  });

  // =========================================================
  // 6. Despachar (parcial)
  // =========================================================
  let lineasDespachar;
  await check('GET pre-despacho', async () => {
    const res = await request('GET', `/bodega/solicitudes/${idSolicitud}/pre-despacho?idAlmacen=${ID_ALMACEN}`);
    assert(res.status === 200, `Esperado 200, recibido ${res.status}`);
    const lineas = res.body?.data || [];
    assert(lineas.length > 0, 'Sin lineas en pre-despacho');
    lineasDespachar = lineas.filter(l => l.Pendiente > 0).map(l => ({ IdDetalle: l.IdDetalle, Entregar: l.Pendiente }));
    assert(lineasDespachar.length > 0, 'No hay lineas pendientes para despachar');
  });

  await check('POST /bodega/despachar - Despacho parcial', async () => {
    const res = await request('POST', '/bodega/despachar', {
      body: { idAlmacen: ID_ALMACEN, idSolicitud: idSolicitud, lineas: lineasDespachar },
    });
    assert(res.status === 200 || res.status === 201, `Esperado 200/201, recibido ${res.status}: ${res.raw}`);
    assert(res.body?.status === 'success', `status no success`);
  });

  // =========================================================
  // 7. Verificar kardex
  // =========================================================
  await check('GET /kardex - Movimiento registrado', async () => {
    const desde = '2024-01-01';
    const hasta = new Date().toISOString().split('T')[0];
    const res = await request('GET', `/kardex?idAlmacen=${ID_ALMACEN}&desde=${desde}&hasta=${hasta}`);
    assert(res.status === 200, `Esperado 200, recibido ${res.status}`);
    const movs = (res.body?.data || []).filter(m => m.IdSolicitud === idSolicitud);
    assert(movs.length > 0, `No hay movimientos de kardex para solicitud #${idSolicitud}`);
    assert(movs.some(m => m.Tipo === 'SALIDA'), 'No hay movimiento tipo SALIDA en kardex');
  });

  // =========================================================
  // Resultado
  // =========================================================
  console.log('');
  console.log(`E2E Resultado: ${passed} pasaron, ${failed} fallaron`);
  process.exit(failed > 0 ? 1 : 0);
})().catch(e => {
  console.error('Error fatal:', e.message);
  process.exit(1);
});
