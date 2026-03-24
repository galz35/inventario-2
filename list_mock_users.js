const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'TuPasswordFuerte!2026',
    server: '190.56.16.85',
    database: 'Inventario_RRHH',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function run() {
    let pool;
    try {
        pool = await sql.connect(config);
        const res = await pool.request().query('SELECT TOP 5 carnet, nombre_completo, correo, pais FROM dbo.vw_EmpleadosActivos');
        console.table(res.recordset);
    } catch (err) {
        console.error(err);
    } finally {
        if (pool) await pool.close();
    }
}
run();
