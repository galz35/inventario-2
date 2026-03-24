const sql = require('mssql');

const config = {
    server: '190.56.16.85',
    port: 1433,
    user: 'sa',
    password: 'TuPasswordFuerte!2026',
    database: 'Inventario_RRHH',
    options: { encrypt: false, trustServerCertificate: true }
};

async function execute() {
    const query = process.argv[2];
    if (!query) {
        console.error('Error: Provee una consulta SQL como argumento.');
        process.exit(1);
    }

    try {
        await sql.connect(config);
        const result = await sql.query(query);
        console.log(JSON.stringify(result.recordset, null, 2));
    } catch (err) {
        console.error('Error SQL:', err.message);
        process.exit(1);
    } finally {
        await sql.close();
    }
}

execute();
