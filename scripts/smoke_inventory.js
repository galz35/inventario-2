const http = require('http');
const https = require('https');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3023/api/v1';
const USER_CARNET = process.env.USER_CARNET;
const USER_PAIS = process.env.USER_PAIS || 'NI';
const ID_ALMACEN = process.env.ID_ALMACEN || '1';
const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS || '8000');
const EXPECT_BODEGA = process.env.EXPECT_BODEGA === '1';
const RUN_MUTATION_FLOW = process.env.RUN_MUTATION_FLOW === '1';

if (!USER_CARNET) {
  console.error('ERROR: Debe definir USER_CARNET');
  process.exit(1);
}

const cookie = `user_carnet=${USER_CARNET}; user_pais=${USER_PAIS}`;

let passed = 0;
let failed = 0;

async function request(method, path, opts = {}) {
  const url = BASE_URL + path;
  const isHttps = url.startsWith('https');
  const lib = isHttps ? https : http;
  const u = new URL(url);

  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method,
        timeout: TIMEOUT_MS,
        headers: {
          'Cookie': opts.noCookie ? '' : cookie,
          'Content-Type': 'application/json',
          ...(opts.headers || {}),
        },
        rejectUnauthorized: false,
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          let json;
          try { json = JSON.parse(body); } catch { json = null; }
          resolve({ status: res.statusCode, headers: res.headers, body: json, raw: body });
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error(`timeout de ${TIMEOUT_MS}ms`)); });
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
  console.log(`Smoke Test: Inventario Portal API`);
  console.log(`URL base: ${BASE_URL}`);
  console.log(`Carnet: ${USER_CARNET} | Pais: ${USER_PAIS} | Almacen: ${ID_ALMACEN}`);
  console.log('');

  // 1. Health
  await check('GET /health responde 200', async () => {
    const r = await request('GET', '/health');
    assert(r.status === 200, `esperado 200, recibido ${r.status}`);
    assert(r.body?.status === 'ok', `status no ok: ${JSON.stringify(r.body)}`);
    assert(r.body?.app === 'inventario-portal', `app name mismatch`);
  });

  // 2. Health sin auth (debe funcionar, no requiere cookie)
  await check('GET /health sin cookie responde 200', async () => {
    const r = await request('GET', '/health', { noCookie: true });
    assert(r.status === 200, `esperado 200, recibido ${r.status}`);
  });

  // 3. Almacenes con cookie
  await check('GET /almacenes?pais=NI responde 200 con datos', async () => {
    const r = await request('GET', `/almacenes?pais=${USER_PAIS}`);
    assert(r.status === 200, `esperado 200, recibido ${r.status}`);
    assert(r.body?.status === 'success', `status no success`);
    assert(Array.isArray(r.body?.data), `data no es array`);
  });

  // 4. Almacenes sin cookie (debe dar 401)
  await check('GET /almacenes sin cookie da 401', async () => {
    const r = await request('GET', `/almacenes?pais=${USER_PAIS}`, { noCookie: true });
    assert(r.status === 401, `esperado 401, recibido ${r.status}`);
  });

  // 5. Articulos
  await check('GET /articulos responde 200 con datos', async () => {
    const r = await request('GET', '/articulos');
    assert(r.status === 200, `esperado 200, recibido ${r.status}`);
    assert(r.body?.status === 'success', `status no success`);
    assert(Array.isArray(r.body?.data), `data no es array`);
  });

  // 6. Inventario por almacen
  await check(`GET /inventario?idAlmacen=${ID_ALMACEN} responde 200`, async () => {
    const r = await request('GET', `/inventario?idAlmacen=${ID_ALMACEN}`);
    assert(r.status === 200, `esperado 200, recibido ${r.status}`);
    assert(r.body?.status === 'success', `status no success`);
  });

  // 7. Solicitudes stats
  await check(`GET /solicitudes/stats?idAlmacen=${ID_ALMACEN} responde 200`, async () => {
    const r = await request('GET', `/solicitudes/stats?idAlmacen=${ID_ALMACEN}`);
    assert(r.status === 200, `esperado 200, recibido ${r.status}`);
    assert(r.body?.status === 'success', `status no success`);
  });

  // 8. Solicitudes list
  await check('GET /solicitudes?pais=NI responde 200', async () => {
    const r = await request('GET', `/solicitudes?pais=${USER_PAIS}`);
    assert(r.status === 200, `esperado 200, recibido ${r.status}`);
    assert(r.body?.status === 'success', `status no success`);
  });

  // 9. Bodega pendientes
  await check(`GET /bodega/pendientes?pais=${USER_PAIS} ${EXPECT_BODEGA ? '(debe ser 200)' : '(200 o 403)'}`, async () => {
    const r = await request('GET', `/bodega/pendientes?pais=${USER_PAIS}`);
    if (EXPECT_BODEGA) {
      assert(r.status === 200, `esperado 200, recibido ${r.status}`);
    } else {
      assert([200, 403].includes(r.status), `esperado 200 o 403, recibido ${r.status} - ${r.raw}`);
    }
  });

  // 10. Kardex
  await check(`GET /kardex?idAlmacen=${ID_ALMACEN}&desde=2024-01-01&hasta=2026-12-31 responde 200`, async () => {
    const r = await request('GET', `/kardex?idAlmacen=${ID_ALMACEN}&desde=2024-01-01&hasta=2026-12-31`);
    assert(r.status === 200, `esperado 200, recibido ${r.status}`);
    assert(r.body?.status === 'success', `status no success`);
  });

  // 11. Auth me
  await check('GET /auth/me responde 200 con datos del usuario', async () => {
    const r = await request('GET', '/auth/me');
    assert(r.status === 200, `esperado 200, recibido ${r.status}`);
    assert(r.body?.data?.carnet === USER_CARNET, `carnet mismatch`);
  });

  console.log('');
  console.log(`Resultado: ${passed} pasaron, ${failed} fallaron`);
  process.exit(failed > 0 ? 1 : 0);
})().catch(e => {
  console.error('Error fatal:', e.message);
  process.exit(1);
});
