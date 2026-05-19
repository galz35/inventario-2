const http = require('http');
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3023/api/v1';
const USER = process.env.USER_CARNET || '500708';
const PAIS = process.env.USER_PAIS || 'NI';
const ALMACEN = parseInt(process.env.ID_ALMACEN || '1');
const COOKIE = `user_carnet=${USER}; user_pais=${PAIS}`;

function req(method, path, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(BASE_URL + path);
    const r = http.request({
      hostname: u.hostname, port: u.port, path: u.pathname + u.search, method,
      headers: { 'Cookie': opts.noCookie ? '' : COOKIE, 'Content-Type': 'application/json' },
    }, (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        let j;
        try { j = JSON.parse(b); } catch { j = null; }
        resolve({ status: res.statusCode, body: j, raw: b });
      });
    });
    r.on('error', reject);
    if (opts.body) r.write(JSON.stringify(opts.body));
    r.end();
  });
}

function assert(cond, msg) { if (!cond) throw new Error(msg || 'Assertion'); }

(async () => {
  console.log('═══════════════════════════════════════');
  console.log('  FLUJO VIDA REAL - INVENTARIO PORTAL');
  console.log('═══════════════════════════════════════');
  let paso = 0;
  let ok = 0;
  let fail = 0;

  const P = async (desc, fn) => {
    paso++;
    try {
      await fn();
      console.log(`  ✅ Paso ${paso}: ${desc}`);
      ok++;
    } catch (e) {
      console.log(`  ❌ Paso ${paso}: ${desc}`);
      console.log(`     ${e.message}`);
      fail++;
    }
  };

  // ================================================================
  // CONTEXTO: Verificar stock inicial
  // ================================================================
  let stockInicial;
  await P('Verificar stock inicial de la variante UNI/N', async () => {
    const r = await req('GET', `/inventario?idAlmacen=${ALMACEN}`);
    assert(r.status === 200);
    const art = (r.body?.data || []).find(a => a.IdArticulo === 1 && a.Talla === 'UNI' && a.Sexo === 'N');
    assert(art, 'Variante UNI/N del artículo 1 no encontrada');
    stockInicial = art.StockActual;
    console.log(`     Stock variante UNI/N: ${stockInicial}`);
  });

  // ================================================================
  // PASO 1: Empleado crea una solicitud
  // ================================================================
  let idSol;
  await P('Empleado crea solicitud de 3 unidades', async () => {
    const r = await req('POST', '/solicitudes', {
      body: { empleadoCarnet: USER, motivo: 'Dotación uniforme operativa - Mayo 2026', detalles: [{ idArticulo: 1, talla: 'UNI', sexo: 'N', cantidad: 3 }] }
    });
    assert(r.status === 200 || r.status === 201);
    idSol = r.body?.data?.IdSolicitud;
    assert(idSol, `No se generó IdSolicitud: ${JSON.stringify(r.body)}`);
    console.log(`     Solicitud #${idSol} creada como "Pendiente"`);
  });

  // ================================================================
  // PASO 2: Verificar estado Pendiente
  // ================================================================
  await P('Solicitud aparece como Pendiente en el listado', async () => {
    const r = await req('GET', `/solicitudes?pais=${PAIS}`);
    assert(r.status === 200);
    const sol = (r.body?.data || []).find(s => s.IdSolicitud === idSol);
    assert(sol, 'No aparece en el listado');
    assert(sol.Estado === 'Pendiente', `Estado esperado "Pendiente", obtenido "${sol.Estado}"`);
  });

  // ================================================================
  // PASO 3: Aprobar solicitud (jefe/RRHH)
  // ================================================================
  await P('Jefe/RRHH aprueba la solicitud', async () => {
    const r = await req('POST', `/solicitudes/${idSol}/aprobar`, { body: {} });
    assert(r.status === 200 || r.status === 201, `status ${r.status}`);
    assert(r.body?.status === 'success');
    console.log(`     Solicitud #${idSol} → "Aprobada"`);
  });

  // ================================================================
  // PASO 4: Verificar estado Aprobada
  // ================================================================
  await P('Solicitud aparece como Aprobada en el listado', async () => {
    const r = await req('GET', `/solicitudes?pais=${PAIS}&estado=Aprobada`);
    assert(r.status === 200);
    const sol = (r.body?.data || []).find(s => s.IdSolicitud === idSol);
    assert(sol, 'No aparece como Aprobada');
    assert(sol.Estado === 'Aprobada', `Estado "${sol.Estado}"`);
  });

  // ================================================================
  // PASO 5: Ver detalle con stock disponible
  // ================================================================
  let idDetalle;
  await P('Detalle muestra líneas con stock disponible', async () => {
    const r = await req('GET', `/solicitudes/${idSol}/detalle?idAlmacen=${ALMACEN}`);
    assert(r.status === 200);
    const lineas = r.body?.data || [];
    assert(lineas.length > 0, 'Sin líneas en detalle');
    const ln = lineas[0];
    assert(ln.CantidadSolicitada === 3, `Solicitado 3, es ${ln.CantidadSolicitada}`);
    assert(ln.CantidadAprobada === 3, `Aprobado 3, es ${ln.CantidadAprobada}`);
    assert(ln.Pendiente === 3, `Pendiente 3, es ${ln.Pendiente}`);
    assert(ln.StockVar >= 3, `Stock ${ln.StockVar} < 3`);
    idDetalle = ln.IdDetalle;
    console.log(`     Stock disponible: ${ln.StockVar}, Pendiente: ${ln.Pendiente}`);
  });

  // ================================================================
  // PASO 6: Bodega ve pendiente en su bandeja
  // ================================================================
  await P('Bodega ve la solicitud en pendientes de despacho', async () => {
    const r = await req('GET', `/bodega/pendientes?pais=${PAIS}`);
    assert(r.status === 200);
    const sol = (r.body?.data || []).find(s => s.IdSolicitud === idSol);
    assert(sol, 'No aparece en pendientes de bodega');
    assert(sol.Estado === 'Aprobada');
  });

  // ================================================================
  // PASO 7: Pre-despacho muestra líneas + lotes
  // ================================================================
  await P('Pre-despacho devuelve líneas con lotes FEFO', async () => {
    const r = await req('GET', `/bodega/solicitudes/${idSol}/pre-despacho?idAlmacen=${ALMACEN}`);
    assert(r.status === 200);
    const lineas = r.body?.data || [];
    assert(lineas.length > 0);
    const ln = lineas[0];
    assert(ln.IdDetalle, 'Sin IdDetalle');
    assert(ln.lotesDisponibles !== undefined, 'Sin lotesDisponibles');
  });

  // ================================================================
  // PASO 8: Despachar 2 unidades (parcial, deja 1 pendiente)
  // ================================================================
  await P('Bodega despacha 2 unidades (despacho parcial)', async () => {
    const r = await req('POST', '/bodega/despachar', {
      body: { idAlmacen: ALMACEN, idSolicitud: idSol, lineas: [{ IdDetalle: idDetalle, Entregar: 2 }] }
    });
    assert(r.status === 200 || r.status === 201);
    assert(r.body?.status === 'success');
    console.log(`     Despachadas 2 unidades, debe quedar 1 pendiente`);
  });

  // ================================================================
  // PASO 9: Verificar estado "Parcial"
  // ================================================================
  await P('Solicitud queda como "Parcial" después del despacho parcial', async () => {
    const r = await req('GET', `/solicitudes?pais=${PAIS}`);
    assert(r.status === 200);
    const sol = (r.body?.data || []).find(s => s.IdSolicitud === idSol);
    assert(sol, 'No aparece');
    assert(sol.Estado === 'Parcial', `Estado esperado "Parcial", obtenido "${sol.Estado}"`);
  });

  // ================================================================
  // PASO 10: Verificar stock descontado
  // ================================================================
  await P('Stock se redujo en 2 unidades', async () => {
    const r = await req('GET', `/inventario?idAlmacen=${ALMACEN}`);
    assert(r.status === 200);
    const art = (r.body?.data || []).find(a => a.IdArticulo === 1 && a.Talla === 'UNI' && a.Sexo === 'N');
    assert(art, 'Variante UNI/N no encontrada');
    const esperado = stockInicial - 2;
    assert(art.StockActual === esperado, `Stock esperado ${esperado}, obtenido ${art.StockActual}`);
    console.log(`     Stock: ${stockInicial} → ${art.StockActual} (diferencia: -2)`);
  });

  // ================================================================
  // PASO 11: Despachar la unidad restante
  // ================================================================
  await P('Bodega despacha la unidad restante (completa)', async () => {
    const r = await req('POST', '/bodega/despachar', {
      body: { idAlmacen: ALMACEN, idSolicitud: idSol, lineas: [{ IdDetalle: idDetalle, Entregar: 1 }] }
    });
    assert(r.status === 200 || r.status === 201);
    assert(r.body?.status === 'success');
    console.log(`     Despachada 1 unidad restante`);
  });

  // ================================================================
  // PASO 12: Verificar estado "Atendida"
  // ================================================================
  await P('Solicitud queda como "Atendida" (todo entregado)', async () => {
    const r = await req('GET', `/solicitudes?pais=${PAIS}`);
    assert(r.status === 200);
    const sol = (r.body?.data || []).find(s => s.IdSolicitud === idSol);
    assert(sol, 'No aparece');
    assert(sol.Estado === 'Atendida', `Estado esperado "Atendida", obtenido "${sol.Estado}"`);
  });

  // ================================================================
  // PASO 13: Verificar kardex (2 movimientos SALIDA)
  // ================================================================
  await P('Kardex registra 2 movimientos SALIDA para la solicitud', async () => {
    const r = await req('GET', `/kardex?idAlmacen=${ALMACEN}&desde=2024-01-01&hasta=2026-12-31`);
    assert(r.status === 200);
    const movs = (r.body?.data || []).filter(m => m.IdSolicitud === idSol && m.Tipo === 'SALIDA');
    assert(movs.length === 2, `Esperado 2 movimientos SALIDA, encontrados ${movs.length}`);
    console.log(`     Kardex: 2 movimientos SALIDA registrados`);
    const total = movs.reduce((s, m) => s + Math.abs(m.Cantidad), 0);
    assert(total === 3, `Cantidad total despachada debería ser 3, es ${total}`);
  });

  // ================================================================
  // PASO 14: Verificar historial de la solicitud
  // ================================================================
  await P('Solicitud tiene historial completo (creación, aprobación, despachos)', async () => {
    // Ver a través del detalle que contiene CantidadEntregada final
    const r = await req('GET', `/solicitudes/${idSol}/detalle?idAlmacen=${ALMACEN}`);
    assert(r.status === 200);
    const lineas = r.body?.data || [];
    assert(lineas.length > 0);
    const ln = lineas[0];
    assert(ln.CantidadEntregada === 3, `Entregado total 3, es ${ln.CantidadEntregada}`);
    assert(ln.Pendiente === 0, `Pendiente 0, es ${ln.Pendiente}`);
    console.log(`     Línea: Solicitado=${ln.CantidadSolicitada}, Aprobado=${ln.CantidadAprobada}, Entregado=${ln.CantidadEntregada}`);
  });

  // ================================================================
  // RESUMEN
  // ================================================================
  console.log('\n═══════════════════════════════════════');
  console.log(`  RESULTADO: ${ok} pasos OK, ${fail} fallaron`);
  console.log('═══════════════════════════════════════');
  if (ok === 14) console.log('  🎯 FLUJO COMPLETO: SOLICITANTE → JEFE → BODEGA');
  process.exit(fail > 0 ? 1 : 0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
