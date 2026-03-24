const XLSX = require('xlsx');
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
    },
    requestTimeout: 120000
};

async function run() {
    let pool;
    try {
        console.log("Reading Excel file...");
        const workbook = XLSX.readFile('d:/inventario rrhh/empleado.xlsx');
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        console.log(`Found ${data.length} rows in Excel.`);

        console.log("Connecting to database...");
        pool = await sql.connect(config);

        console.log("Cleaning database (EMP2024 and test rows)...");
        // Clear EMP2024
        await pool.request().query('DELETE FROM EMP2024');

        // Remove roles for test carnet 500708 if it's the one user referred to as "2 de prueba"
        // Based on setup_db.js, 500708 was inserted as admin. 
        // I will keep it but clean up any other duplicates if they exist.
        // Actually, "elimina 2 de prueba" might refer to the 2 rows found in check_count.js initially.

        console.log("Inserting rows row-by-row with data validation...");
        const columns = [
            'idhcm', 'Idhrms', 'idhcm2', 'LVL', 'userlvl', 'carnet', 'carnet2', 'nombre_completo', 'correo', 'cargo',
            'empresa', 'cedula', 'Departamento', 'Direccion', 'Nombreubicacion', 'datos', 'fechaingreso', 'fechabaja',
            'fechaasignacion', 'ActionCode', 'diaprueba', 'oDEPARTAMENTO', 'OGERENCIA', 'oSUBGERENCIA', 'ManagerLevel',
            'telefono', 'telefonojefe', 'nom_jefe1', 'correo_jefe1', 'cargo_jefe1', 'idhcm_jefe1', 'carnet_jefe1', 'o1',
            'nom_jefe2', 'correo_jefe2', 'cargo_jefe2', 'idhcm_jefe2', 'carnet_jefe2', 'o2', 'nom_jefe3', 'correo_jefe3',
            'cargo_jefe3', 'idhcm_jefe3', 'carnet_jefe3', 'o3', 'nom_jefe4', 'correo_jefe4', 'cargo_jefe4', 'idhcm_jefe4',
            'carnet_jefe4', 'o4', 'SUBGERENTECORREO', 'SUBGERENTE', 'GERENTECORREO', 'GERENTE', 'GERENTECARNET', 'pais',
            'organizacion', 'jefe', 'userlevel', 'idorg', 'primernivel', 'nivel', 'padre', 'segundo_nivel', 'tercer_nivel',
            'cuarto_nivel', 'quinto_nivel', 'sexto_nivel', 'WorkMobilePhoneNumber', 'Gender', 'UserNam', 'foto', 'o5',
            'o6', 'fechanacimiento', 'IDORG_TRIM'
        ];

        const queryBase = `INSERT INTO dbo.EMP2024 (${columns.join(', ')}) VALUES `;

        const seenCarnets = new Set();
        let count = 0;
        let errors = 0;

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const carnet = String(row.carnet || '').trim();
            if (!carnet || seenCarnets.has(carnet)) continue;
            seenCarnets.add(carnet);

            try {
                const request = pool.request();

                // Use helper to parse integers safely
                request.input('idhcm', sql.Int, parseIntSafe(row.idhcm));
                request.input('Idhrms', sql.Int, parseIntSafe(row.Idhrms));
                request.input('idhcm2', sql.Int, parseIntSafe(row.idhcm2));
                request.input('LVL', sql.Int, parseIntSafe(row.LVL));
                request.input('userlvl', sql.Int, parseIntSafe(row.userlvl));

                request.input('carnet', sql.VarChar(20), carnet);
                request.input('carnet2', sql.VarChar(20), clean(row.carnet2, 20));
                request.input('nombre_completo', sql.VarChar(200), clean(row.nombre_completo, 200));
                request.input('correo', sql.VarChar(200), clean(row.correo, 200));
                request.input('cargo', sql.VarChar(200), clean(row.cargo, 200));
                request.input('empresa', sql.VarChar(200), clean(row.empresa || row.organizacion, 200));
                request.input('cedula', sql.VarChar(30), clean(row.cedula, 30));
                request.input('Departamento', sql.VarChar(200), clean(row.Departamento, 200));
                request.input('Direccion', sql.VarChar(200), clean(row.Direccion, 200));
                request.input('Nombreubicacion', sql.VarChar(200), clean(row.Nombreubicacion, 200));
                request.input('datos', sql.VarChar(500), clean(row.datos, 500));

                request.input('fechaingreso', sql.Date, parseDate(row.fechaingreso));
                request.input('fechabaja', sql.Date, parseDate(row.fechabaja));
                request.input('fechaasignacion', sql.Date, parseDate(row.fechaasignacion));

                request.input('ActionCode', sql.VarChar(60), clean(row.ActionCode, 60));
                request.input('diaprueba', sql.Int, parseIntSafe(row.diaprueba));

                request.input('oDEPARTAMENTO', sql.VarChar(250), clean(row.oDEPARTAMENTO, 250));
                request.input('OGERENCIA', sql.VarChar(250), clean(row.OGERENCIA, 250));
                request.input('oSUBGERENCIA', sql.VarChar(250), clean(row.oSUBGERENCIA, 250));
                request.input('ManagerLevel', sql.VarChar(60), clean(row.ManagerLevel, 60));
                request.input('telefono', sql.VarChar(30), clean(row.telefono, 30));
                request.input('telefonojefe', sql.VarChar(30), clean(row.telefonojefe, 30));

                request.input('nom_jefe1', sql.VarChar(200), clean(row.nom_jefe1 || row.nom_jefe, 200));
                request.input('correo_jefe1', sql.VarChar(200), clean(row.correo_jefe1 || row.correo_jefe, 200));
                request.input('cargo_jefe1', sql.VarChar(200), clean(row.cargo_jefe1 || row.cargo_jefe, 200));
                request.input('idhcm_jefe1', sql.Int, parseIntSafe(row.idhcm_jefe1 || row.idhcm_jefe));
                request.input('carnet_jefe1', sql.VarChar(20), clean(row.carnet_jefe1 || row.carnet_jefe, 20));
                request.input('o1', sql.VarChar(250), clean(row.o1, 250));

                request.input('nom_jefe2', sql.VarChar(200), clean(row.nom_jefe2, 200));
                request.input('correo_jefe2', sql.VarChar(200), clean(row.correo_jefe2, 200));
                request.input('cargo_jefe2', sql.VarChar(200), clean(row.cargo_jefe2, 200));
                request.input('idhcm_jefe2', sql.Int, parseIntSafe(row.idhcm_jefe2));
                request.input('carnet_jefe2', sql.VarChar(20), clean(row.carnet_jefe2, 20));
                request.input('o2', sql.VarChar(250), clean(row.o2, 250));

                request.input('nom_jefe3', sql.VarChar(200), clean(row.nom_jefe3, 200));
                request.input('correo_jefe3', sql.VarChar(200), clean(row.correo_jefe3, 200));
                request.input('cargo_jefe3', sql.VarChar(200), clean(row.cargo_jefe3, 200));
                request.input('idhcm_jefe3', sql.Int, parseIntSafe(row.idhcm_jefe3));
                request.input('carnet_jefe3', sql.VarChar(20), clean(row.carnet_jefe3, 20));
                request.input('o3', sql.VarChar(250), clean(row.o3, 250));

                request.input('nom_jefe4', sql.VarChar(200), clean(row.nom_jefe4, 200));
                request.input('correo_jefe4', sql.VarChar(200), clean(row.correo_jefe4, 200));
                request.input('cargo_jefe4', sql.VarChar(200), clean(row.cargo_jefe4, 200));
                request.input('idhcm_jefe4', sql.Int, parseIntSafe(row.idhcm_jefe4));
                request.input('carnet_jefe4', sql.VarChar(20), clean(row.carnet_jefe4, 20));
                request.input('o4', sql.VarChar(250), clean(row.o4, 250));

                request.input('SUBGERENTECORREO', sql.VarChar(200), clean(row.SUBGERENTECORREO, 200));
                request.input('SUBGERENTE', sql.VarChar(200), clean(row.SUBGERENTE, 200));
                request.input('GERENTECORREO', sql.VarChar(200), clean(row.GERENTECORREO, 200));
                request.input('GERENTE', sql.VarChar(200), clean(row.GERENTE, 200));
                request.input('GERENTECARNET', sql.VarChar(20), clean(row.GERENTECARNET, 20));
                request.input('pais', sql.VarChar(10), clean(row.pais, 10));
                request.input('organizacion', sql.VarChar(250), clean(row.organizacion, 250));
                request.input('jefe', sql.VarChar(200), clean(row.jefe, 200));
                request.input('userlevel', sql.VarChar(60), clean(row.userlevel, 60));
                request.input('idorg', sql.VarChar(60), clean(row.idorg, 60));
                request.input('primernivel', sql.VarChar(250), clean(row.primernivel, 250));
                request.input('nivel', sql.VarChar(250), clean(row.nivel, 250));
                request.input('padre', sql.VarChar(250), clean(row.padre, 250));
                request.input('segundo_nivel', sql.VarChar(250), clean(row.segundo_nivel, 250));
                request.input('tercer_nivel', sql.VarChar(250), clean(row.tercer_nivel, 250));
                request.input('cuarto_nivel', sql.VarChar(250), clean(row.cuarto_nivel, 250));
                request.input('quinto_nivel', sql.VarChar(250), clean(row.quinto_nivel, 250));
                request.input('sexto_nivel', sql.VarChar(250), clean(row.sexto_nivel, 250));

                request.input('WorkMobilePhoneNumber', sql.VarChar(30), clean(row.WorkMobilePhoneNumber, 30));
                request.input('Gender', sql.VarChar(10), clean(row.Gender, 10));
                request.input('UserNam', sql.VarChar(200), clean(row.UserNam, 200));
                request.input('foto', sql.VarChar(1000), clean(row.foto, 1000));
                request.input('o5', sql.VarChar(250), clean(row.o5, 250));
                request.input('o6', sql.VarChar(250), clean(row.o6, 250));

                request.input('fechanacimiento', sql.Date, parseDate(row.fechanacimiento));
                request.input('IDORG_TRIM', sql.VarChar(60), clean(row.IDORG_TRIM, 60));

                const valPlaceholders = columns.map(c => `@${c}`).join(', ');
                await request.query(`${queryBase} (${valPlaceholders})`);
                count++;
                if (count % 200 === 0) console.log(`Inserted ${count} rows...`);
            } catch (err) {
                errors++;
                console.error(`Error inserting carnet ${carnet}:`, err.message);
            }
        }

        console.log(`Successfully inserted ${count} rows. Errors: ${errors}.`);

        // Re-insert admin user if missing
        if (!seenCarnets.has('500708')) {
            console.log("Re-inserting admin user 500708...");
            await pool.request().query("INSERT INTO dbo.EMP2024(carnet, nombre_completo, correo, pais) VALUES('500708', 'GUSTAVO LIRA', 'gustavo.lira@claro.com.ni', 'NI')");
        }

    } catch (err) {
        console.error("Critical error:", err.message);
    } finally {
        if (pool) await pool.close();
        console.log("Done.");
    }
}

function parseIntSafe(val) {
    if (val === undefined || val === null || val === '') return null;
    const n = parseInt(val);
    return isNaN(n) ? null : n;
}

function clean(val, maxLen) {
    if (val === undefined || val === null) return null;
    let s = String(val).trim();
    if (s.length > maxLen) return s.substring(0, maxLen);
    return s || null;
}

function parseDate(val) {
    if (!val) return null;
    if (val instanceof Date) return val;
    // Special check for some Excel weirdness
    if (typeof val === 'number') {
        // Excel base date is 1899-12-30
        const d = new Date((val - 25569) * 86400 * 1000);
        return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
}

run();
