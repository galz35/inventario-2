const sql = require('mssql');
const config = {
    server: '190.56.16.85',
    port: 1433,
    user: 'sa',
    password: 'TuPasswordFuerte!2026',
    database: 'Inventario_RRHH',
    options: { encrypt: false, trustServerCertificate: true }
};

async function debugListar() {
    try {
        await sql.connect(config);
        console.log('--- Ejecutando EXEC dbo.Sol_Listar @Estado=\'Pendiente\' ---');
        const result = await sql.query("EXEC dbo.Sol_Listar @Estado='Pendiente'");

        if (result.recordset.length > 0) {
            console.log('Columnas devueltas:', Object.keys(result.recordset[0]));
            console.log('Muestra de datos (primera fila):', result.recordset[0]);
        } else {
            console.log('El SP no devolvió filas para el estado Pendiente.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await sql.close();
    }
}
debugListar();
