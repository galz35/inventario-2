const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
const HEADERS = {
    'X-Country-Code': 'NI',
    'X-User-Carnet': '777',
    'Content-Type': 'application/json'
};

async function testFlow() {
    console.log('🧪 Probando flujo de solicitud con el SP actualizado...');

    try {
        // Obtenemos los artículos para usar un ID válido
        const articulosRes = await axios.get(`${BASE_URL}/articulos`, { headers: HEADERS });
        const idArticulo = articulosRes.data.data[0].id_articulo;
        console.log(`📦 Usando Artículo ID: ${idArticulo}`);

        // Intentamos crear la solicitud
        const solReq = {
            empleadoCarnet: '777',
            motivo: 'Test de Integración Final',
            detalles: [
                { idArticulo: idArticulo, cantidad: 10, talla: 'UNI', sexo: 'N' }
            ]
        };

        const res = await axios.post(`${BASE_URL}/solicitudes`, solReq, { headers: HEADERS });

        if (res.data.ok) {
            console.log('✅ Solicitud creada exitosamente!');
            console.log('Respuesta:', JSON.stringify(res.data.data));

            const idSolicitud = res.data.data.idSolicitud;

            // Verificamos que aparezca en la lista de pendientes
            const lista = await axios.get(`${BASE_URL}/solicitudes?estado=Pendiente`, { headers: HEADERS });
            console.log(`📋 Total en lista: ${lista.data.data.length}`);
            console.log('IDs encontrados:', lista.data.data.map(s => s.id_solicitud));

            const encontrada = lista.data.data.find(s => s.id_solicitud == idSolicitud);

            if (encontrada) {
                console.log('✅ Solicitud verificada en la lista de pendientes.');
            } else {
                console.error('❌ La solicitud no aparece en la lista.');
            }
        } else {
            console.error('❌ Error en el backend:', res.data.error);
        }

    } catch (e) {
        console.error('❌ Error fatal en el test:', e.message);
        if (e.response) console.error('Detalle:', JSON.stringify(e.response.data));
    }
}

testFlow();
