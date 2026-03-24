const sql = require('mssql');
require('dotenv').config();
const config = {
    server: process.env.MSSQL_HOST,
    port: parseInt(process.env.MSSQL_PORT),
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    database: process.env.MSSQL_DATABASE,
    options: { encrypt: process.env.MSSQL_ENCRYPT === 'true', trustServerCertificate: process.env.MSSQL_TRUST_CERT === 'true' }
};

async function run() {
    let pool;
    try {
        pool = await sql.connect(config);

        await pool.request().query("DELETE FROM RolesSistema WHERE Carnet <> '500708'");
        // Only keep gustavo in security table to start fresh
        await pool.request().query("DELETE FROM UsuariosSeguridad WHERE Carnet <> '500708'");

        // Ensure gustavo is admin
        await pool.request().query(`
            IF NOT EXISTS(SELECT 1 FROM dbo.RolesSistema WHERE Carnet='500708' AND Rol='ADMIN')
                INSERT INTO dbo.RolesSistema(Carnet,Rol,Activo) VALUES('500708','ADMIN',1);
        `);

        // Get currently configured roles
        const result = await pool.request().query("SELECT * FROM RolesSistema");
        console.log("Current Roles:", result.recordset);

        console.log('Cleaned test roles/users');
    } catch (err) {
        console.error(err);
    } finally {
        if (pool) await pool.close();
    }
}
run();
