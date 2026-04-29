import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  user: process.env.MSSQL_USER || 'sa',
  password: process.env.MSSQL_PASSWORD || 'S0m3Str0ngP@ssw0rd',
  server: process.env.MSSQL_HOST || '190.56.16.85',
  database: process.env.MSSQL_DATABASE || 'Inventario_RRHH',
  port: parseInt(process.env.MSSQL_PORT || '1433'),
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function seed() {
  try {
    const pool = await sql.connect(config);
    console.log('✅ Conectado a SQL Server');

    // 3.1 Catálogo real
    await pool.query(`
      IF NOT EXISTS (SELECT * FROM Articulos WHERE Codigo='UNI-CAM-M')
      INSERT INTO Articulos (Codigo, Nombre, Tipo, Unidad) VALUES 
      ('UNI-CAM-M', 'Camisa Uniforme Claro', 'ROPA', 'UN'),
      ('UNI-PAN-M', 'Pantalón Uniforme Claro', 'ROPA', 'UN'),
      ('EPP-BOT-01', 'Botas de Seguridad Dielectricas', 'EPP', 'PAR'),
      ('MED-PAR-500', 'Paracetamol 500mg', 'MEDICAMENTO', 'CAJ')
    `);
    console.log('✅ Catálogo de artículos insertado');

    // 3.2 Almacenes reales
    await pool.query(`
      IF NOT EXISTS (SELECT * FROM Almacenes WHERE Codigo='BOD-MGA')
      INSERT INTO Almacenes (Codigo, Nombre, Pais) VALUES 
      ('BOD-MGA', 'Bodega Central Managua', 'NI'),
      ('BOD-GUA', 'Bodega Central Guatemala', 'GT')
    `);
    console.log('✅ Almacenes configurados');

    // 3.3 Roles para pruebas
    // Usamos 'admin' o un carnet de prueba para asegurarnos de tener todos los accesos en el frontend
    await pool.query(`
      IF NOT EXISTS (SELECT * FROM RolesSistema WHERE Carnet='admin' AND Rol='ADMIN')
      INSERT INTO RolesSistema (Carnet, Rol) VALUES 
      ('admin', 'ADMIN'),
      ('admin', 'BODEGA'),
      ('admin', 'RRHH_APRUEBA')
    `);
    console.log('✅ Roles asignados');

    await pool.close();
    console.log('🌱 Seed completo para Portal Inventario (Fase 3)!');
  } catch (err) {
    console.error('❌ Error en Seed:', err);
  }
}
seed();
