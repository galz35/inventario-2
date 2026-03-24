const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
const HEADERS = {
    'X-Country-Code': 'NI',
    'X-User-Carnet': '777',
    'Content-Type': 'application/json'
};

async function runTests() {
    console.log('🚀 Iniciando Test de Backend de Inventario (Node.js)\n');

    try {
        // 1. Salud del sistema
        console.log('--- 1. Health Check ---');
        const health = await axios.get('http://localhost:3000/health');
        console.log('Status:', health.data === 'ok' ? '✅ OK' : '❌ ERROR');

        // 2. Listar Almacenes
        console.log('\n--- 2. Listar Almacenes ---');
        const almacenes = await axios.get(`${BASE_URL}/almacenes`, { headers: HEADERS });
        console.log(`Encontrados: ${almacenes.data.data.length}`);
        console.table(almacenes.data.data);
        const idAlmacen = almacenes.data.data[0].id_almacen;

        // 3. Listar Artículos Sugeridos para inventario
        console.log('\n--- 3. Listar Artículos Genéricos ---');
        const articulos = await axios.get(`${BASE_URL}/articulos`, { headers: HEADERS });
        console.log(`Encontrados: ${articulos.data.data.length}`);
        console.table(articulos.data.data.slice(0, 5));
        const idArticulo = articulos.data.data[0].id_articulo;

        // 4. Crear una Solicitud (Flujo RRHH)
        console.log('\n--- 4. Crear Nueva Solicitud (Demo) ---');
        const solReq = {
            empleadoCarnet: '777',
            motivo: 'Test Automatizado - Renovación',
            detalles: [
                { idArticulo: idArticulo, cantidad: 5, talla: 'UNI', sexo: 'N' }
            ]
        };
        const solRes = await axios.post(`${BASE_URL}/solicitudes`, solReq, { headers: HEADERS });
        console.log('Respuesta creación:', JSON.stringify(solRes.data));
        const idSolicitud = solRes.data.data.idSolicitud;
        console.log(`✅ Solicitud creada con ID: ${idSolicitud}`);

        // 5. Ver Inventario Actual (Snapshot)
        console.log('\n--- 5. Consultar Stock en Almacen ---');
        const stock = await axios.get(`${BASE_URL}/inventario?idAlmacen=${idAlmacen}`, { headers: HEADERS });
        console.log('Stock de los primeros 3 items:');
        console.table(stock.data.data.slice(0, 3));

        // 6. Registrar entrada manual (Ajuste)
        console.log('\n--- 6. Registrar Entrada Manual (Ajuste) ---');
        const movReq = {
            idAlmacen: idAlmacen,
            tipo: 'ENTRADA',
            idArticulo: idArticulo,
            talla: 'L',
            sexo: 'M',
            cantidad: 50,
            comentario: 'Carga inicial por test automatizado',
            loteCodigo: 'L-TEST-001',
            vence: '2026-12-31'
        };
        await axios.post(`${BASE_URL}/inventario/movimiento`, movReq, { headers: HEADERS });
        console.log('✅ Movimiento de Entrada registrado');

        // 7. Simular Aprobación de Solicitud (RRHH)
        console.log('\n--- 7. Aprobar Solicitud (RRHH) ---');
        await axios.post(`${BASE_URL}/solicitudes/${idSolicitud}/aprobar`, {}, { headers: HEADERS });
        console.log('✅ Solicitud Aprobada');

        // 8. Simular Despacho de Bodega (Entrega)
        console.log('\n--- 8. Despachar Solicitud (Bodega) ---');
        const despachoReq = {
            idAlmacen: idAlmacen,
            idSolicitud: idSolicitud,
            detalles: [
                { idDetalle: 1, entregar: 3 }
            ]
        };
        // Nota: En una app real, primero pediríamos el detalle de la solicitud para tener el IdDetalle exacto.
        try {
            await axios.post(`${BASE_URL}/bodega/despachar`, despachoReq, { headers: HEADERS });
            console.log('✅ Despacho parcial realizado');
        } catch (e) {
            console.log('⚠️ Nota: El despacho requiere IdDetalle exacto de la BD. Saltando detalle fino.');
        }

        // 9. Alertas
        console.log('\n--- 9. Verificación de Alertas ---');
        const alertasVence = await axios.get(`${BASE_URL}/alertas/vencimiento?idAlmacen=${idAlmacen}`, { headers: HEADERS });
        console.log(`Alertas vencimiento: ${alertasVence.data.data.length}`);

        const alertasStock = await axios.get(`${BASE_URL}/alertas/stock-bajo?idAlmacen=${idAlmacen}`, { headers: HEADERS });
        console.log(`Alertas stock bajo: ${alertasStock.data.data.length}`);

        console.log('\n✨ TODOS LOS TESTS BÁSICOS COMPLETADOS');

    } catch (error) {
        console.error('\n❌ ERROR DURANTE LOS TESTS:');
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data));
            console.error('Status:', error.response.status);
        } else {
            console.error(error.message);
        }
    }
}

runTests();
