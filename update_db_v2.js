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
    try {
        let pool = await sql.connect(config);
        console.log('Connected');

        const queries = [
            `CREATE OR ALTER PROCEDURE dbo.Admin_ListarRoles
            AS BEGIN SET NOCOUNT ON;
                SELECT r.IdRol, r.Carnet, e.nombre_completo, r.Rol, r.Activo
                FROM dbo.RolesSistema r
                LEFT JOIN dbo.vw_EmpleadosActivos e ON e.carnet = r.Carnet;
            END`,
            `CREATE OR ALTER PROCEDURE dbo.Admin_AsignarRol
                @Carnet VARCHAR(20), @Rol VARCHAR(30), @Activo BIT = 1
            AS BEGIN SET NOCOUNT ON;
                IF NOT EXISTS(SELECT 1 FROM dbo.RolesSistema WHERE Carnet=@Carnet AND Rol=@Rol)
                    INSERT INTO dbo.RolesSistema(Carnet, Rol, Activo) VALUES(@Carnet, @Rol, @Activo);
                ELSE
                    UPDATE dbo.RolesSistema SET Activo=@Activo WHERE Carnet=@Carnet AND Rol=@Rol;
                
                IF NOT EXISTS(SELECT 1 FROM dbo.UsuariosSeguridad WHERE Carnet=@Carnet)
                    INSERT INTO dbo.UsuariosSeguridad(Carnet, PasswordHash) VALUES(@Carnet, '$2b$12$ltZYR2VOPSYdZrPaTmx8XOPh338R5npAUTu.ZhtKQAM.ODhG52Fsi');
            END`,
            `CREATE OR ALTER PROCEDURE dbo.Inv_CrearAlmacen
                @Codigo VARCHAR(20), @Nombre VARCHAR(100), @Pais VARCHAR(2)
            AS BEGIN SET NOCOUNT ON;
                INSERT INTO dbo.Almacenes(Codigo, Nombre, Pais, Activo) VALUES(@Codigo, @Nombre, @Pais, 1);
                SELECT SCOPE_IDENTITY() AS IdAlmacen;
            END`,
            `CREATE OR ALTER PROCEDURE dbo.Inv_CrearArticulo
                @Codigo VARCHAR(30), @Nombre VARCHAR(150), @Tipo VARCHAR(30), @Unidad VARCHAR(10)
            AS BEGIN SET NOCOUNT ON;
                INSERT INTO dbo.Articulos(Codigo, Nombre, Tipo, Unidad, Activo) VALUES(@Codigo, @Nombre, @Tipo, @Unidad, 1);
                SELECT SCOPE_IDENTITY() AS IdArticulo;
            END`,
            `CREATE OR ALTER PROCEDURE dbo.Inv_Mov_Transferencia
                @IdAlmacenOrigen INT, @IdAlmacenDestino INT, @IdArticulo INT,
                @Talla VARCHAR(20), @Sexo VARCHAR(5), @Cantidad INT, @Usuario VARCHAR(20)
            AS BEGIN SET NOCOUNT ON; SET XACT_ABORT ON;
                BEGIN TRY BEGIN TRAN;
                    IF @Cantidad <= 0 THROW 61001, 'Cantidad debe ser mayor a 0', 1;
                    
                    EXEC dbo.Inv_Mov_EntradaMerma 
                        @IdAlmacen=@IdAlmacenOrigen, @Tipo='MERMA', @IdArticulo=@IdArticulo, 
                        @Talla=@Talla, @Sexo=@Sexo, @Cantidad=@Cantidad, 
                        @Comentario='Transferencia a bodega destino', @Usuario=@Usuario;

                    EXEC dbo.Inv_Mov_EntradaMerma 
                        @IdAlmacen=@IdAlmacenDestino, @Tipo='ENTRADA', @IdArticulo=@IdArticulo, 
                        @Talla=@Talla, @Sexo=@Sexo, @Cantidad=@Cantidad, 
                        @Comentario='Transferencia desde bodega origen', @Usuario=@Usuario;
                    
                    COMMIT TRAN;
                END TRY BEGIN CATCH IF @@TRANCOUNT > 0 ROLLBACK; THROW; END CATCH
            END`
        ];

        for (const q of queries) {
            console.log('Running query...');
            await pool.request().query(q);
        }

        console.log('SPs created successfully');
        await pool.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
