const sql = require('mssql');
const config = {
    server: '190.56.16.85',
    port: 1433,
    user: 'sa',
    password: 'TuPasswordFuerte!2026',
    database: 'Inventario_RRHH',
    options: { encrypt: false, trustServerCertificate: true }
};

async function check() {
    try {
        await sql.connect(config);
        const sols = await sql.query("SELECT * FROM dbo.Solicitudes");
        console.log('--- Solicitudes ---');
        console.table(sols.recordset);

        const dets = await sql.query("SELECT * FROM dbo.SolicitudesDetalle");
        console.log('--- Detalles ---');
        console.table(dets.recordset);
    } catch (e) {
        console.error(e);
    } finally {
        await sql.close();
    }
}
check();
