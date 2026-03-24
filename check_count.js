const sql = require('mssql');
require('dotenv').config();

const config = {
    server: process.env.MSSQL_HOST,
    port: parseInt(process.env.MSSQL_PORT),
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    database: process.env.MSSQL_DATABASE,
    options: {
        encrypt: process.env.MSSQL_ENCRYPT === 'true',
        trustServerCertificate: process.env.MSSQL_TRUST_CERT === 'true'
    }
};

async function check() {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query('SELECT COUNT(*) as count FROM EMP2024');
        console.log("Current rows in EMP2024:", result.recordset[0].count);
        await pool.close();
    } catch (err) {
        console.error(err);
    }
}
check();
