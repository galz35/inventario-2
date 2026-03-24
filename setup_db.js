const sql = require('mssql');

const config = {
  server: '190.56.16.85',
  port: 1433,
  user: 'sa',
  password: 'TuPasswordFuerte!2026',
  database: 'Inventario_RRHH',
  options: { encrypt: false, trustServerCertificate: true },
  requestTimeout: 60000
};

async function run() {
  let pool;
  try {
    console.log('=== Conectando a Inventario_RRHH ===');
    pool = await sql.connect(config);
    console.log('✅ Conectado');

    // =============================================
    // PASO 1: Tabla EMP2024
    // =============================================
    console.log('\n--- PASO 1: Tabla EMP2024 ---');
    await pool.request().query(`
      IF OBJECT_ID('dbo.EMP2024','U') IS NULL
      BEGIN
        CREATE TABLE dbo.EMP2024 (
          idhcm INT NULL, Idhrms INT NULL, idhcm2 INT NULL, LVL INT NULL, userlvl INT NULL,
          carnet VARCHAR(20) NOT NULL, carnet2 VARCHAR(20) NULL,
          nombre_completo VARCHAR(200) NULL, correo VARCHAR(200) NULL, cargo VARCHAR(200) NULL,
          empresa VARCHAR(200) NULL, cedula VARCHAR(30) NULL,
          Departamento VARCHAR(200) NULL, Direccion VARCHAR(200) NULL, Nombreubicacion VARCHAR(200) NULL,
          datos VARCHAR(500) NULL,
          fechaingreso DATE NULL, fechabaja DATE NULL, fechaasignacion DATE NULL,
          ActionCode VARCHAR(60) NULL, diaprueba INT NULL,
          oDEPARTAMENTO VARCHAR(250) NULL, OGERENCIA VARCHAR(250) NULL, oSUBGERENCIA VARCHAR(250) NULL,
          ManagerLevel VARCHAR(60) NULL,
          telefono VARCHAR(30) NULL, telefonojefe VARCHAR(30) NULL,
          nom_jefe1 VARCHAR(200) NULL, correo_jefe1 VARCHAR(200) NULL, cargo_jefe1 VARCHAR(200) NULL,
          idhcm_jefe1 INT NULL, carnet_jefe1 VARCHAR(20) NULL, o1 VARCHAR(250) NULL,
          nom_jefe2 VARCHAR(200) NULL, correo_jefe2 VARCHAR(200) NULL, cargo_jefe2 VARCHAR(200) NULL,
          idhcm_jefe2 INT NULL, carnet_jefe2 VARCHAR(20) NULL, o2 VARCHAR(250) NULL,
          nom_jefe3 VARCHAR(200) NULL, correo_jefe3 VARCHAR(200) NULL, cargo_jefe3 VARCHAR(200) NULL,
          idhcm_jefe3 INT NULL, carnet_jefe3 VARCHAR(20) NULL, o3 VARCHAR(250) NULL,
          nom_jefe4 VARCHAR(200) NULL, correo_jefe4 VARCHAR(200) NULL, cargo_jefe4 VARCHAR(200) NULL,
          idhcm_jefe4 INT NULL, carnet_jefe4 VARCHAR(20) NULL, o4 VARCHAR(250) NULL,
          SUBGERENTECORREO VARCHAR(200) NULL, SUBGERENTE VARCHAR(200) NULL,
          GERENTECORREO VARCHAR(200) NULL, GERENTE VARCHAR(200) NULL, GERENTECARNET VARCHAR(20) NULL,
          pais VARCHAR(10) NULL, organizacion VARCHAR(250) NULL, jefe VARCHAR(200) NULL,
          userlevel VARCHAR(60) NULL, idorg VARCHAR(60) NULL,
          primernivel VARCHAR(250) NULL, nivel VARCHAR(250) NULL, padre VARCHAR(250) NULL,
          segundo_nivel VARCHAR(250) NULL, tercer_nivel VARCHAR(250) NULL,
          cuarto_nivel VARCHAR(250) NULL, quinto_nivel VARCHAR(250) NULL, sexto_nivel VARCHAR(250) NULL,
          WorkMobilePhoneNumber VARCHAR(30) NULL, Gender VARCHAR(10) NULL, UserNam VARCHAR(200) NULL,
          foto VARCHAR(1000) NULL, o5 VARCHAR(250) NULL, o6 VARCHAR(250) NULL,
          fechanacimiento DATE NULL, IDORG_TRIM VARCHAR(60) NULL,
          CONSTRAINT PK_EMP2024 PRIMARY KEY (carnet)
        );
        PRINT 'EMP2024 creada';
      END
      ELSE PRINT 'EMP2024 ya existe';
    `);
    console.log('✅ EMP2024');

    // Indices EMP2024
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_EMP2024_Nombre')
        CREATE INDEX IX_EMP2024_Nombre ON dbo.EMP2024(nombre_completo) INCLUDE(correo,cargo,pais,fechabaja);
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_EMP2024_Pais')
        CREATE INDEX IX_EMP2024_Pais ON dbo.EMP2024(pais) INCLUDE(carnet,nombre_completo,correo,fechabaja);
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_EMP2024_Jefe1')
        CREATE INDEX IX_EMP2024_Jefe1 ON dbo.EMP2024(carnet_jefe1) INCLUDE(carnet,nombre_completo,correo,cargo);
    `);
    console.log('✅ Indices EMP2024');

    // =============================================
    // PASO 2: Vista Empleados Activos
    // =============================================
    console.log('\n--- PASO 2: Vista vw_EmpleadosActivos ---');
    await pool.request().query(`
      CREATE OR ALTER VIEW dbo.vw_EmpleadosActivos AS
      SELECT * FROM dbo.EMP2024 WHERE (fechabaja IS NULL OR fechabaja < '1900-01-01');
    `);
    console.log('✅ Vista vw_EmpleadosActivos');

    // =============================================
    // PASO 3: Tablas Inventario
    // =============================================
    console.log('\n--- PASO 3: Tablas Inventario ---');

    await pool.request().query(`
      IF OBJECT_ID('dbo.Almacenes','U') IS NULL
      BEGIN
        CREATE TABLE dbo.Almacenes (
          IdAlmacen INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Almacenes PRIMARY KEY,
          Codigo VARCHAR(20) NOT NULL,
          Nombre VARCHAR(100) NOT NULL,
          Pais VARCHAR(2) NOT NULL DEFAULT 'NI',
          Activo BIT NOT NULL CONSTRAINT DF_Almacenes_Activo DEFAULT(1)
        );
        CREATE UNIQUE INDEX UX_Almacenes_Codigo ON dbo.Almacenes(Codigo);
        CREATE INDEX IX_Almacenes_Pais ON dbo.Almacenes(Pais);
      END
    `);
    console.log('✅ Almacenes (con campo Pais)');

    await pool.request().query(`
      IF OBJECT_ID('dbo.Articulos','U') IS NULL
      BEGIN
        CREATE TABLE dbo.Articulos (
          IdArticulo INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Articulos PRIMARY KEY,
          Codigo VARCHAR(30) NOT NULL,
          Nombre VARCHAR(150) NOT NULL,
          Tipo VARCHAR(30) NOT NULL,
          Unidad VARCHAR(10) NOT NULL CONSTRAINT DF_Articulos_Unidad DEFAULT('UN'),
          Activo BIT NOT NULL CONSTRAINT DF_Articulos_Activo DEFAULT(1),
          CONSTRAINT CK_Articulos_Tipo CHECK (Tipo IN ('ROPA','EPP','MEDICAMENTO','EVENTO'))
        );
        CREATE UNIQUE INDEX UX_Articulos_Codigo ON dbo.Articulos(Codigo);
      END
    `);
    console.log('✅ Articulos');

    await pool.request().query(`
      IF OBJECT_ID('dbo.ArticulosStockVar','U') IS NULL
      BEGIN
        CREATE TABLE dbo.ArticulosStockVar (
          IdAlmacen INT NOT NULL,
          IdArticulo INT NOT NULL,
          Talla VARCHAR(20) NOT NULL CONSTRAINT DF_StockVar_Talla DEFAULT('UNI'),
          Sexo VARCHAR(5) NOT NULL CONSTRAINT DF_StockVar_Sexo DEFAULT('N'),
          StockActual INT NOT NULL CONSTRAINT DF_StockVar_Stock DEFAULT(0),
          StockMinimo INT NOT NULL CONSTRAINT DF_StockVar_Min DEFAULT(0),
          PrecioUnitario DECIMAL(18,2) NOT NULL CONSTRAINT DF_StockVar_Precio DEFAULT(0),
          CONSTRAINT PK_ArticulosStockVar PRIMARY KEY (IdAlmacen, IdArticulo, Talla, Sexo),
          CONSTRAINT FK_StockVar_Alm FOREIGN KEY (IdAlmacen) REFERENCES dbo.Almacenes(IdAlmacen),
          CONSTRAINT FK_StockVar_Art FOREIGN KEY (IdArticulo) REFERENCES dbo.Articulos(IdArticulo),
          CONSTRAINT CK_StockVar_NoNeg CHECK (StockActual >= 0 AND StockMinimo >= 0)
        );
        CREATE INDEX IX_StockVar_Articulo ON dbo.ArticulosStockVar(IdArticulo, IdAlmacen) INCLUDE(StockActual,StockMinimo,PrecioUnitario,Talla,Sexo);
      END
    `);
    console.log('✅ ArticulosStockVar');

    await pool.request().query(`
      IF OBJECT_ID('dbo.InvLotes','U') IS NULL
      BEGIN
        CREATE TABLE dbo.InvLotes (
          IdLote INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_InvLotes PRIMARY KEY,
          IdAlmacen INT NOT NULL,
          IdArticulo INT NOT NULL,
          LoteCodigo VARCHAR(50) NOT NULL,
          FechaVencimiento DATE NOT NULL,
          StockActual INT NOT NULL CONSTRAINT DF_InvLotes_Stock DEFAULT(0),
          CONSTRAINT FK_InvLotes_Alm FOREIGN KEY (IdAlmacen) REFERENCES dbo.Almacenes(IdAlmacen),
          CONSTRAINT FK_InvLotes_Art FOREIGN KEY (IdArticulo) REFERENCES dbo.Articulos(IdArticulo),
          CONSTRAINT CK_InvLotes_NoNeg CHECK (StockActual >= 0)
        );
        CREATE UNIQUE INDEX UX_InvLotes_Lote ON dbo.InvLotes(IdAlmacen,IdArticulo,LoteCodigo);
        CREATE INDEX IX_InvLotes_FEFO ON dbo.InvLotes(IdAlmacen,IdArticulo,FechaVencimiento,IdLote) INCLUDE(StockActual,LoteCodigo);
      END
    `);
    console.log('✅ InvLotes');

    // =============================================
    // PASO 4: Tablas Solicitudes
    // =============================================
    console.log('\n--- PASO 4: Tablas Solicitudes ---');

    await pool.request().query(`
      IF OBJECT_ID('dbo.Solicitudes','U') IS NULL
      BEGIN
        CREATE TABLE dbo.Solicitudes (
          IdSolicitud BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Solicitudes PRIMARY KEY,
          FechaCreacion DATETIME NOT NULL CONSTRAINT DF_Solicitudes_Fecha DEFAULT(GETDATE()),
          EmpleadoCarnet VARCHAR(20) NOT NULL,
          JefeCarnet VARCHAR(20) NULL,
          MotivoUsuario VARCHAR(255) NULL,
          Estado VARCHAR(30) NOT NULL CONSTRAINT DF_Solicitudes_Estado DEFAULT('Pendiente'),
          RespuestaRRHH VARCHAR(255) NULL,
          NotaInternaRRHH VARCHAR(255) NULL,
          CONSTRAINT CK_Solicitudes_Estado CHECK (Estado IN ('Pendiente','Aprobada','Parcial','Atendida','Rechazada'))
        );
        CREATE INDEX IX_Solicitudes_Estado ON dbo.Solicitudes(Estado, FechaCreacion DESC);
        CREATE INDEX IX_Solicitudes_Empleado ON dbo.Solicitudes(EmpleadoCarnet, FechaCreacion DESC) INCLUDE(Estado,JefeCarnet);
      END
    `);
    console.log('✅ Solicitudes');

    await pool.request().query(`
      IF OBJECT_ID('dbo.SolicitudesDetalle','U') IS NULL
      BEGIN
        CREATE TABLE dbo.SolicitudesDetalle (
          IdDetalle BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_SolicitudesDetalle PRIMARY KEY,
          IdSolicitud BIGINT NOT NULL,
          IdArticulo INT NOT NULL,
          Talla VARCHAR(20) NOT NULL CONSTRAINT DF_SolDet_Talla DEFAULT('UNI'),
          Sexo VARCHAR(5) NOT NULL CONSTRAINT DF_SolDet_Sexo DEFAULT('N'),
          CantidadSolicitada INT NOT NULL CONSTRAINT DF_SolDet_Sol DEFAULT(0),
          CantidadAprobada INT NOT NULL CONSTRAINT DF_SolDet_Apr DEFAULT(0),
          CantidadEntregada INT NOT NULL CONSTRAINT DF_SolDet_Ent DEFAULT(0),
          CONSTRAINT FK_SolDet_Sol FOREIGN KEY (IdSolicitud) REFERENCES dbo.Solicitudes(IdSolicitud),
          CONSTRAINT FK_SolDet_Art FOREIGN KEY (IdArticulo) REFERENCES dbo.Articulos(IdArticulo),
          CONSTRAINT CK_SolDet_Cant CHECK (
            CantidadSolicitada >= 0 AND CantidadAprobada >= 0 AND CantidadEntregada >= 0
            AND CantidadAprobada <= CantidadSolicitada AND CantidadEntregada <= CantidadAprobada
          )
        );
        CREATE INDEX IX_SolDet_Solicitud ON dbo.SolicitudesDetalle(IdSolicitud) INCLUDE(IdArticulo,Talla,Sexo,CantidadSolicitada,CantidadAprobada,CantidadEntregada);
      END
    `);
    console.log('✅ SolicitudesDetalle');

    await pool.request().query(`
      IF OBJECT_ID('dbo.Solicitudes_Historial','U') IS NULL
      BEGIN
        CREATE TABLE dbo.Solicitudes_Historial (
          IdHistorial BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_SolHist PRIMARY KEY,
          IdSolicitud BIGINT NOT NULL,
          Fecha DATETIME NOT NULL CONSTRAINT DF_SolHist_Fecha DEFAULT(GETDATE()),
          EstadoNuevo VARCHAR(30) NOT NULL,
          CarnetUsuario VARCHAR(20) NOT NULL,
          Comentario VARCHAR(255) NULL
        );
        CREATE INDEX IX_SolHist_Solicitud ON dbo.Solicitudes_Historial(IdSolicitud, Fecha DESC);
      END
    `);
    console.log('✅ Solicitudes_Historial');

    // =============================================
    // PASO 5: Kardex
    // =============================================
    console.log('\n--- PASO 5: Kardex ---');
    await pool.request().query(`
      IF OBJECT_ID('dbo.MovimientosInventario','U') IS NULL
      BEGIN
        CREATE TABLE dbo.MovimientosInventario (
          IdMovimiento BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Mov PRIMARY KEY,
          Fecha DATETIME NOT NULL CONSTRAINT DF_Mov_Fecha DEFAULT(GETDATE()),
          Tipo VARCHAR(20) NOT NULL,
          IdAlmacen INT NOT NULL,
          IdArticulo INT NOT NULL,
          Talla VARCHAR(20) NOT NULL,
          Sexo VARCHAR(5) NOT NULL,
          Cantidad INT NOT NULL,
          LoteCodigo VARCHAR(50) NULL,
          FechaVencimiento DATE NULL,
          IdSolicitud BIGINT NULL,
          IdDetalle BIGINT NULL,
          CarnetDestino VARCHAR(20) NULL,
          CarnetResponsable VARCHAR(20) NOT NULL,
          Comentario VARCHAR(255) NULL,
          CONSTRAINT FK_Mov_Alm FOREIGN KEY (IdAlmacen) REFERENCES dbo.Almacenes(IdAlmacen),
          CONSTRAINT FK_Mov_Art FOREIGN KEY (IdArticulo) REFERENCES dbo.Articulos(IdArticulo),
          CONSTRAINT FK_Mov_Sol FOREIGN KEY (IdSolicitud) REFERENCES dbo.Solicitudes(IdSolicitud),
          CONSTRAINT CK_Mov_Tipo CHECK (Tipo IN ('ENTRADA','SALIDA','MERMA'))
        );
        CREATE INDEX IX_Mov_AlmFecha ON dbo.MovimientosInventario(IdAlmacen, Fecha DESC) INCLUDE(Tipo,IdArticulo,Cantidad,LoteCodigo,FechaVencimiento,IdSolicitud,CarnetDestino);
        CREATE INDEX IX_Mov_Solicitud ON dbo.MovimientosInventario(IdSolicitud) INCLUDE(Fecha,Tipo,IdArticulo,Cantidad,LoteCodigo,FechaVencimiento);
      END
    `);
    console.log('✅ MovimientosInventario');

    // =============================================
    // PASO 6: Roles
    // =============================================
    console.log('\n--- PASO 6: Roles ---');
    await pool.request().query(`
      IF OBJECT_ID('dbo.RolesSistema','U') IS NULL
      BEGIN
        CREATE TABLE dbo.RolesSistema (
          IdRol INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Roles PRIMARY KEY,
          Carnet VARCHAR(20) NOT NULL,
          Rol VARCHAR(30) NOT NULL,
          Activo BIT NOT NULL CONSTRAINT DF_Roles_Activo DEFAULT(1),
          CONSTRAINT CK_Roles_Rol CHECK (Rol IN ('ADMIN','BODEGA','RRHH_APRUEBA'))
        );
        CREATE UNIQUE INDEX UX_Roles_CarnetRol ON dbo.RolesSistema(Carnet,Rol);
      END

      IF OBJECT_ID('dbo.UsuariosSeguridad','U') IS NULL
      BEGIN
        CREATE TABLE dbo.UsuariosSeguridad (
          Carnet VARCHAR(20) NOT NULL CONSTRAINT PK_UsuariosSeguridad PRIMARY KEY,
          PasswordHash VARCHAR(255) NOT NULL,
          UltimoAcceso DATETIME NULL,
          Activo BIT NOT NULL DEFAULT(1)
        );
      END
    `);
    console.log('✅ RolesSistema');

    // =============================================
    // PASO 7: ConfigSistema
    // =============================================
    console.log('\n--- PASO 7: ConfigSistema ---');
    await pool.request().query(`
      IF OBJECT_ID('dbo.ConfigSistema','U') IS NULL
      BEGIN
        CREATE TABLE dbo.ConfigSistema (
          Clave VARCHAR(50) NOT NULL CONSTRAINT PK_ConfigSistema PRIMARY KEY,
          Valor VARCHAR(100) NOT NULL
        );
      END
      IF NOT EXISTS (SELECT 1 FROM dbo.ConfigSistema WHERE Clave='VERSION')
        INSERT INTO dbo.ConfigSistema(Clave,Valor) VALUES ('VERSION','1.0');
    `);
    console.log('✅ ConfigSistema');

    // =============================================
    // PASO 8: Stored Procedures de Empleados
    // =============================================
    console.log('\n--- PASO 8: SPs Empleados ---');
    await pool.request().query(`
      CREATE OR ALTER PROCEDURE dbo.Emp_Buscar @Query VARCHAR(60), @Pais VARCHAR(10) = NULL
      AS BEGIN SET NOCOUNT ON;
        DECLARE @q VARCHAR(60) = LTRIM(RTRIM(ISNULL(@Query,'')));
        SELECT TOP (20) carnet, nombre_completo, correo, cargo, Gender AS sexo, pais,
          carnet_jefe1, nom_jefe1, correo_jefe1
        FROM dbo.vw_EmpleadosActivos
        WHERE (@Pais IS NULL OR @Pais='' OR pais=@Pais)
          AND (@q='' OR carnet LIKE @q + '%' OR nombre_completo LIKE '%' + @q + '%')
        ORDER BY CASE WHEN carnet LIKE @q + '%' THEN 0 ELSE 1 END, nombre_completo;
      END
    `);
    console.log('✅ Emp_Buscar');

    await pool.request().query(`
      CREATE OR ALTER PROCEDURE dbo.Emp_Obtener @Carnet VARCHAR(20)
      AS BEGIN SET NOCOUNT ON;
        SELECT TOP (1) carnet, nombre_completo, correo, cargo, empresa, Gender AS sexo, pais,
          telefono, WorkMobilePhoneNumber, carnet_jefe1, nom_jefe1, correo_jefe1,
          cargo_jefe1, OGERENCIA, oDEPARTAMENTO, oSUBGERENCIA, foto
        FROM dbo.vw_EmpleadosActivos WHERE carnet=@Carnet;
      END
    `);
    console.log('✅ Emp_Obtener');

    // =============================================
    // PASO 9: SPs Inventario (Lectura)
    // =============================================
    console.log('\n--- PASO 9: SPs Inventario Lectura ---');

    await pool.request().query(`
      CREATE OR ALTER PROCEDURE dbo.Inv_ListarAlmacenes @Pais VARCHAR(2) = NULL
      AS BEGIN SET NOCOUNT ON;
        SELECT IdAlmacen, Codigo, Nombre, Pais FROM dbo.Almacenes
        WHERE Activo=1 AND (@Pais IS NULL OR @Pais='' OR Pais=@Pais) ORDER BY Nombre;
      END
    `);
    console.log('✅ Inv_ListarAlmacenes');

    await pool.request().query(`
      CREATE OR ALTER PROCEDURE dbo.Inv_ListarArticulos
      AS BEGIN SET NOCOUNT ON;
        SELECT IdArticulo, Codigo, Nombre, Tipo, Unidad, Activo FROM dbo.Articulos ORDER BY Nombre;
      END
    `);
    console.log('✅ Inv_ListarArticulos');

    await pool.request().query(`
      CREATE OR ALTER PROCEDURE dbo.Inv_ArticuloVariantes @IdAlmacen INT, @IdArticulo INT
      AS BEGIN SET NOCOUNT ON;
        SELECT Talla, Sexo, StockActual, StockMinimo, PrecioUnitario
        FROM dbo.ArticulosStockVar WHERE IdAlmacen=@IdAlmacen AND IdArticulo=@IdArticulo ORDER BY Talla, Sexo;
      END
    `);
    console.log('✅ Inv_ArticuloVariantes');

    await pool.request().query(`
      CREATE OR ALTER PROCEDURE dbo.Inv_InventarioPorAlmacen @IdAlmacen INT
      AS BEGIN SET NOCOUNT ON;
        SELECT a.IdArticulo, a.Codigo, a.Nombre, a.Tipo, v.Talla, v.Sexo,
          v.StockActual, v.StockMinimo, v.PrecioUnitario
        FROM dbo.Articulos a JOIN dbo.ArticulosStockVar v ON v.IdArticulo=a.IdArticulo
        WHERE v.IdAlmacen=@IdAlmacen ORDER BY a.Nombre, v.Talla, v.Sexo;
      END
    `);
    console.log('✅ Inv_InventarioPorAlmacen');

    await pool.request().query(`
      CREATE OR ALTER PROCEDURE dbo.Inv_LotesPorArticulo @IdAlmacen INT, @IdArticulo INT
      AS BEGIN SET NOCOUNT ON;
        SELECT IdLote, LoteCodigo, FechaVencimiento, StockActual FROM dbo.InvLotes
        WHERE IdAlmacen=@IdAlmacen AND IdArticulo=@IdArticulo ORDER BY FechaVencimiento, IdLote;
      END
    `);
    console.log('✅ Inv_LotesPorArticulo');

    await pool.request().query(`
      CREATE OR ALTER PROCEDURE dbo.Inv_AlertasVencimiento @IdAlmacen INT, @Dias INT = 30
      AS BEGIN SET NOCOUNT ON;
        SELECT a.Codigo, a.Nombre, l.LoteCodigo, l.FechaVencimiento, l.StockActual
        FROM dbo.InvLotes l JOIN dbo.Articulos a ON a.IdArticulo=l.IdArticulo
        WHERE l.IdAlmacen=@IdAlmacen AND l.StockActual > 0
          AND l.FechaVencimiento <= DATEADD(DAY, @Dias, CAST(GETDATE() AS DATE))
        ORDER BY l.FechaVencimiento, a.Nombre;
      END
    `);
    console.log('✅ Inv_AlertasVencimiento');

    await pool.request().query(`
      CREATE OR ALTER PROCEDURE dbo.Inv_AlertasStockBajo @IdAlmacen INT
      AS BEGIN SET NOCOUNT ON;
        SELECT a.Codigo, a.Nombre, a.Tipo, v.Talla, v.Sexo, v.StockActual, v.StockMinimo
        FROM dbo.ArticulosStockVar v JOIN dbo.Articulos a ON a.IdArticulo=v.IdArticulo
        WHERE v.IdAlmacen=@IdAlmacen AND v.StockActual <= v.StockMinimo ORDER BY a.Nombre, v.Talla, v.Sexo;
      END
    `);
    console.log('✅ Inv_AlertasStockBajo');

    // =============================================
    // PASO 10: SPs Solicitudes
    // =============================================
    console.log('\n--- PASO 10: SPs Solicitudes ---');

    await pool.request().query(`
      CREATE OR ALTER PROCEDURE dbo.Sol_CrearSolicitud
        @EmpleadoCarnet VARCHAR(20), @Motivo VARCHAR(255), @DetallesJson NVARCHAR(MAX)
      AS BEGIN SET NOCOUNT ON; SET XACT_ABORT ON;
        BEGIN TRY BEGIN TRAN;
          IF ISNULL(LTRIM(RTRIM(@EmpleadoCarnet)),'')='' THROW 60001,'EmpleadoCarnet requerido.',1;
          IF ISNULL(LTRIM(RTRIM(@DetallesJson)),'')='' OR ISJSON(@DetallesJson)<>1 THROW 60002,'DetallesJson inválido.',1;
          DECLARE @JefeCarnet VARCHAR(20)=(SELECT TOP(1) carnet_jefe1 FROM dbo.vw_EmpleadosActivos WHERE carnet=@EmpleadoCarnet);
          INSERT INTO dbo.Solicitudes(EmpleadoCarnet,JefeCarnet,MotivoUsuario) VALUES(@EmpleadoCarnet,@JefeCarnet,@Motivo);
          DECLARE @IdSol BIGINT=SCOPE_IDENTITY();
          ;WITH J AS (SELECT * FROM OPENJSON(@DetallesJson) WITH(idArticulo INT, talla VARCHAR(20), sexo VARCHAR(5), cantidad INT))
          INSERT INTO dbo.SolicitudesDetalle(IdSolicitud,IdArticulo,Talla,Sexo,CantidadSolicitada,CantidadAprobada,CantidadEntregada)
          SELECT @IdSol,j.idArticulo,ISNULL(NULLIF(LTRIM(RTRIM(j.talla)),''),'UNI'),ISNULL(NULLIF(LTRIM(RTRIM(j.sexo)),''),'N'),ISNULL(j.cantidad,0),0,0
          FROM J j WHERE j.idArticulo IS NOT NULL AND ISNULL(j.cantidad,0)>0;
          IF NOT EXISTS(SELECT 1 FROM dbo.SolicitudesDetalle WHERE IdSolicitud=@IdSol) THROW 60003,'No hay detalles válidos.',1;
          INSERT INTO dbo.Solicitudes_Historial(IdSolicitud,EstadoNuevo,CarnetUsuario,Comentario) VALUES(@IdSol,'Pendiente',@EmpleadoCarnet,'Solicitud creada');
          COMMIT TRAN; SELECT @IdSol AS IdSolicitud;
        END TRY BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK; THROW; END CATCH
      END
    `);
    console.log('✅ Sol_CrearSolicitud');

    await pool.request().query(`
      CREATE OR ALTER PROCEDURE dbo.Sol_Listar @Estado VARCHAR(30)=NULL, @Desde DATE=NULL, @Hasta DATE=NULL, @Pais VARCHAR(2)=NULL
      AS BEGIN SET NOCOUNT ON;
        SELECT TOP(500) s.IdSolicitud, s.FechaCreacion, s.EmpleadoCarnet,
          e.nombre_completo AS EmpleadoNombre, e.Gender AS EmpleadoSexo, e.OGERENCIA AS Gerencia,
          s.Estado, s.MotivoUsuario, s.JefeCarnet
        FROM dbo.Solicitudes s LEFT JOIN dbo.vw_EmpleadosActivos e ON e.carnet=s.EmpleadoCarnet
        WHERE (@Estado IS NULL OR @Estado='' OR s.Estado=@Estado)
          AND (@Desde IS NULL OR CAST(s.FechaCreacion AS DATE)>=@Desde)
          AND (@Hasta IS NULL OR CAST(s.FechaCreacion AS DATE)<=@Hasta)
          AND (@Pais IS NULL OR @Pais='' OR e.pais=@Pais)
        ORDER BY s.FechaCreacion DESC;
      END
    `);
    console.log('✅ Sol_Listar');

    await pool.request().query(`
      CREATE OR ALTER PROCEDURE dbo.Sol_DetalleConStock @IdSolicitud BIGINT, @IdAlmacen INT
      AS BEGIN SET NOCOUNT ON;
        SELECT d.IdDetalle, d.IdArticulo, a.Codigo, a.Nombre, a.Tipo, d.Talla, d.Sexo,
          d.CantidadSolicitada, d.CantidadAprobada, d.CantidadEntregada,
          (d.CantidadAprobada-d.CantidadEntregada) AS Pendiente, ISNULL(v.StockActual,0) AS StockVar
        FROM dbo.SolicitudesDetalle d JOIN dbo.Articulos a ON a.IdArticulo=d.IdArticulo
        LEFT JOIN dbo.ArticulosStockVar v ON v.IdAlmacen=@IdAlmacen AND v.IdArticulo=d.IdArticulo AND v.Talla=d.Talla AND v.Sexo=d.Sexo
        WHERE d.IdSolicitud=@IdSolicitud ORDER BY a.Nombre, d.Talla, d.Sexo;
      END
    `);
    console.log('✅ Sol_DetalleConStock');

    await pool.request().query(`
      CREATE OR ALTER PROCEDURE dbo.Sol_Aprobar @IdSolicitud BIGINT, @CarnetAprobador VARCHAR(20)
      AS BEGIN SET NOCOUNT ON; SET XACT_ABORT ON;
        BEGIN TRY BEGIN TRAN;
          DECLARE @Estado VARCHAR(30);
          SELECT @Estado=Estado FROM dbo.Solicitudes WITH(UPDLOCK,HOLDLOCK) WHERE IdSolicitud=@IdSolicitud;
          IF @Estado IS NULL THROW 60101,'Solicitud no existe.',1;
          IF @Estado<>'Pendiente' THROW 60102,'Solo se aprueba si está Pendiente.',1;
          UPDATE dbo.Solicitudes SET Estado='Aprobada' WHERE IdSolicitud=@IdSolicitud;
          UPDATE dbo.SolicitudesDetalle SET CantidadAprobada=CantidadSolicitada WHERE IdSolicitud=@IdSolicitud;
          INSERT INTO dbo.Solicitudes_Historial(IdSolicitud,EstadoNuevo,CarnetUsuario,Comentario) VALUES(@IdSolicitud,'Aprobada',@CarnetAprobador,'Aprobación jefe/bodeguero');
          COMMIT TRAN;
        END TRY BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK; THROW; END CATCH
      END
    `);
    console.log('✅ Sol_Aprobar');

    await pool.request().query(`
      CREATE OR ALTER PROCEDURE dbo.Sol_Rechazar @IdSolicitud BIGINT, @CarnetRechaza VARCHAR(20), @Motivo VARCHAR(255)
      AS BEGIN SET NOCOUNT ON; SET XACT_ABORT ON;
        BEGIN TRY BEGIN TRAN;
          DECLARE @Estado VARCHAR(30);
          SELECT @Estado=Estado FROM dbo.Solicitudes WITH(UPDLOCK,HOLDLOCK) WHERE IdSolicitud=@IdSolicitud;
          IF @Estado IS NULL THROW 60111,'Solicitud no existe.',1;
          IF @Estado NOT IN('Pendiente','Aprobada','Parcial') THROW 60112,'No se puede rechazar en este estado.',1;
          UPDATE dbo.Solicitudes SET Estado='Rechazada',RespuestaRRHH=@Motivo WHERE IdSolicitud=@IdSolicitud;
          INSERT INTO dbo.Solicitudes_Historial(IdSolicitud,EstadoNuevo,CarnetUsuario,Comentario) VALUES(@IdSolicitud,'Rechazada',@CarnetRechaza,ISNULL(@Motivo,'Rechazo'));
          COMMIT TRAN;
        END TRY BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK; THROW; END CATCH
      END
    `);
    console.log('✅ Sol_Rechazar');

    // =============================================
    // PASO 11: SP Entrada/Merma
    // =============================================
    console.log('\n--- PASO 11: SP Inv_Mov_EntradaMerma ---');
    await pool.request().query(`
      CREATE OR ALTER PROCEDURE dbo.Inv_Mov_EntradaMerma
        @IdAlmacen INT, @Tipo VARCHAR(20), @IdArticulo INT, @Talla VARCHAR(20), @Sexo VARCHAR(5),
        @Cantidad INT, @Comentario VARCHAR(255), @Usuario VARCHAR(20),
        @LoteCodigo VARCHAR(50)=NULL, @Vence DATE=NULL
      AS BEGIN SET NOCOUNT ON; SET XACT_ABORT ON;
        BEGIN TRY BEGIN TRAN;
          IF @Tipo NOT IN('ENTRADA','MERMA') THROW 60201,'Tipo inválido.',1;
          IF ISNULL(@Cantidad,0)<=0 THROW 60202,'Cantidad debe ser > 0.',1;
          DECLARE @TipoArt VARCHAR(30)=(SELECT Tipo FROM dbo.Articulos WHERE IdArticulo=@IdArticulo);
          IF @TipoArt IS NULL THROW 60203,'Artículo no existe.',1;
          IF @TipoArt='MEDICAMENTO' BEGIN
            IF ISNULL(NULLIF(LTRIM(RTRIM(@LoteCodigo)),''),'')='' THROW 60204,'LoteCodigo requerido para medicamento.',1;
            IF @Vence IS NULL THROW 60205,'Vence requerido para medicamento.',1;
          END ELSE BEGIN SET @LoteCodigo=NULL; SET @Vence=NULL; END
          DECLARE @CantReal INT=CASE WHEN @Tipo='MERMA' THEN -@Cantidad ELSE @Cantidad END;
          UPDATE dbo.ArticulosStockVar WITH(UPDLOCK,ROWLOCK) SET StockActual=StockActual+@CantReal
          WHERE IdAlmacen=@IdAlmacen AND IdArticulo=@IdArticulo AND Talla=@Talla AND Sexo=@Sexo
            AND(@CantReal>=0 OR StockActual>=ABS(@CantReal));
          IF @@ROWCOUNT=0 BEGIN
            IF @Tipo='MERMA' THROW 60206,'Stock insuficiente o variante no existe para merma.',1;
            INSERT INTO dbo.ArticulosStockVar(IdAlmacen,IdArticulo,Talla,Sexo,StockActual,StockMinimo,PrecioUnitario)
            VALUES(@IdAlmacen,@IdArticulo,@Talla,@Sexo,@CantReal,0,0);
          END
          IF @TipoArt='MEDICAMENTO' BEGIN
            UPDATE dbo.InvLotes WITH(UPDLOCK,ROWLOCK) SET StockActual=StockActual+@CantReal,FechaVencimiento=COALESCE(@Vence,FechaVencimiento)
            WHERE IdAlmacen=@IdAlmacen AND IdArticulo=@IdArticulo AND LoteCodigo=@LoteCodigo AND(@CantReal>=0 OR StockActual>=ABS(@CantReal));
            IF @@ROWCOUNT=0 BEGIN
              IF @Tipo='MERMA' THROW 60207,'Stock insuficiente o lote no existe para merma.',1;
              INSERT INTO dbo.InvLotes(IdAlmacen,IdArticulo,LoteCodigo,FechaVencimiento,StockActual) VALUES(@IdAlmacen,@IdArticulo,@LoteCodigo,@Vence,@CantReal);
            END
          END
          INSERT INTO dbo.MovimientosInventario(Tipo,IdAlmacen,IdArticulo,Talla,Sexo,Cantidad,LoteCodigo,FechaVencimiento,CarnetResponsable,Comentario)
          VALUES(@Tipo,@IdAlmacen,@IdArticulo,@Talla,@Sexo,@CantReal,@LoteCodigo,@Vence,@Usuario,@Comentario);
          COMMIT TRAN;
        END TRY BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK; THROW; END CATCH
      END
    `);
    console.log('✅ Inv_Mov_EntradaMerma');

    // =============================================
    // PASO 12: SPs Bodega
    // =============================================
    console.log('\n--- PASO 12: SPs Bodega ---');
    await pool.request().query(`
      CREATE OR ALTER PROCEDURE dbo.Bod_Pendientes @Pais VARCHAR(2)=NULL
      AS BEGIN SET NOCOUNT ON;
        SELECT TOP(500) s.IdSolicitud, s.FechaCreacion, s.EmpleadoCarnet,
          e.nombre_completo AS EmpleadoNombre, e.Gender AS EmpleadoSexo, e.OGERENCIA AS Gerencia, s.Estado
        FROM dbo.Solicitudes s LEFT JOIN dbo.vw_EmpleadosActivos e ON e.carnet=s.EmpleadoCarnet
        WHERE s.Estado IN('Aprobada','Parcial') 
          AND (@Pais IS NULL OR @Pais='' OR e.pais=@Pais)
        ORDER BY s.FechaCreacion ASC;
      END
    `);
    console.log('✅ Bod_Pendientes');

    await pool.request().query(`
      CREATE OR ALTER PROCEDURE dbo.Bod_Despachar
        @IdAlmacen INT, @IdSolicitud BIGINT, @CarnetBodeguero VARCHAR(20), @DespachoJson NVARCHAR(MAX)
      AS BEGIN SET NOCOUNT ON; SET XACT_ABORT ON;
        BEGIN TRY BEGIN TRAN;
          IF ISNULL(LTRIM(RTRIM(@DespachoJson)),'')='' OR ISJSON(@DespachoJson)<>1 THROW 60301,'DespachoJson inválido.',1;
          DECLARE @Estado VARCHAR(30),@CarnetEmp VARCHAR(20);
          SELECT @Estado=Estado,@CarnetEmp=EmpleadoCarnet FROM dbo.Solicitudes WITH(UPDLOCK,HOLDLOCK) WHERE IdSolicitud=@IdSolicitud;
          IF @Estado IS NULL THROW 60302,'Solicitud no existe.',1;
          IF @Estado NOT IN('Aprobada','Parcial') THROW 60303,'Solo se despacha Aprobada/Parcial.',1;
          CREATE TABLE #Tmp(IdDetalle BIGINT NOT NULL,Entregar INT NOT NULL);
          INSERT INTO #Tmp(IdDetalle,Entregar) SELECT IdDetalle,Entregar FROM OPENJSON(@DespachoJson) WITH(IdDetalle BIGINT,Entregar INT);
          IF EXISTS(SELECT 1 FROM #Tmp WHERE Entregar<=0) THROW 60304,'Entregar debe ser > 0.',1;
          DECLARE @IdDet BIGINT,@Cant INT,@IdArt INT,@Tal VARCHAR(20),@Sex VARCHAR(5),@TipoArt VARCHAR(30),@Pend INT;
          DECLARE cur CURSOR LOCAL FAST_FORWARD FOR SELECT IdDetalle,Entregar FROM #Tmp;
          OPEN cur; FETCH NEXT FROM cur INTO @IdDet,@Cant;
          WHILE @@FETCH_STATUS=0 BEGIN
            SELECT @IdArt=d.IdArticulo,@Tal=d.Talla,@Sex=d.Sexo,@Pend=(d.CantidadAprobada-d.CantidadEntregada),@TipoArt=a.Tipo
            FROM dbo.SolicitudesDetalle d WITH(UPDLOCK,HOLDLOCK) JOIN dbo.Articulos a ON a.IdArticulo=d.IdArticulo
            WHERE d.IdDetalle=@IdDet AND d.IdSolicitud=@IdSolicitud;
            IF @Pend IS NULL THROW 60305,'Detalle inválido.',1;
            IF @Cant>@Pend THROW 60306,'Entregar excede pendiente.',1;
            UPDATE dbo.ArticulosStockVar WITH(UPDLOCK,ROWLOCK) SET StockActual=StockActual-@Cant
            WHERE IdAlmacen=@IdAlmacen AND IdArticulo=@IdArt AND Talla=@Tal AND Sexo=@Sex AND StockActual>=@Cant;
            IF @@ROWCOUNT=0 THROW 60307,'Stock insuficiente en variante.',1;
            IF @TipoArt='MEDICAMENTO' BEGIN
              DECLARE @Rest INT=@Cant;
              WHILE @Rest>0 BEGIN
                DECLARE @IdLote INT,@Lote VARCHAR(50),@VenceLote DATE,@StockLote INT;
                SELECT TOP(1) @IdLote=IdLote,@Lote=LoteCodigo,@VenceLote=FechaVencimiento,@StockLote=StockActual
                FROM dbo.InvLotes WITH(UPDLOCK,HOLDLOCK)
                WHERE IdAlmacen=@IdAlmacen AND IdArticulo=@IdArt AND StockActual>0 ORDER BY FechaVencimiento,IdLote;
                IF @IdLote IS NULL THROW 60308,'No hay lotes disponibles para FEFO.',1;
                DECLARE @Tomar INT=CASE WHEN @Rest<=@StockLote THEN @Rest ELSE @StockLote END;
                UPDATE dbo.InvLotes SET StockActual=StockActual-@Tomar WHERE IdLote=@IdLote AND StockActual>=@Tomar;
                IF @@ROWCOUNT=0 THROW 60309,'Conflicto FEFO.',1;
                INSERT INTO dbo.MovimientosInventario(Tipo,IdAlmacen,IdArticulo,Talla,Sexo,Cantidad,LoteCodigo,FechaVencimiento,IdSolicitud,IdDetalle,CarnetDestino,CarnetResponsable,Comentario)
                VALUES('SALIDA',@IdAlmacen,@IdArt,@Tal,@Sex,-@Tomar,@Lote,@VenceLote,@IdSolicitud,@IdDet,@CarnetEmp,@CarnetBodeguero,'Despacho FEFO');
                SET @Rest-=@Tomar;
              END
            END ELSE BEGIN
              INSERT INTO dbo.MovimientosInventario(Tipo,IdAlmacen,IdArticulo,Talla,Sexo,Cantidad,IdSolicitud,IdDetalle,CarnetDestino,CarnetResponsable,Comentario)
              VALUES('SALIDA',@IdAlmacen,@IdArt,@Tal,@Sex,-@Cant,@IdSolicitud,@IdDet,@CarnetEmp,@CarnetBodeguero,'Despacho solicitud');
            END
            UPDATE dbo.SolicitudesDetalle SET CantidadEntregada=CantidadEntregada+@Cant WHERE IdDetalle=@IdDet;
            FETCH NEXT FROM cur INTO @IdDet,@Cant;
          END
          CLOSE cur; DEALLOCATE cur;
          DECLARE @Faltan INT=(SELECT SUM(CASE WHEN(CantidadAprobada-CantidadEntregada)>0 THEN(CantidadAprobada-CantidadEntregada) ELSE 0 END) FROM dbo.SolicitudesDetalle WHERE IdSolicitud=@IdSolicitud);
          DECLARE @NuevoEstado VARCHAR(30)=CASE WHEN ISNULL(@Faltan,0)=0 THEN 'Atendida' ELSE 'Parcial' END;
          UPDATE dbo.Solicitudes SET Estado=@NuevoEstado WHERE IdSolicitud=@IdSolicitud;
          INSERT INTO dbo.Solicitudes_Historial(IdSolicitud,EstadoNuevo,CarnetUsuario,Comentario) VALUES(@IdSolicitud,@NuevoEstado,@CarnetBodeguero,'Despacho aplicado');
          COMMIT TRAN;
        END TRY BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK; THROW; END CATCH
      END
    `);
    console.log('✅ Bod_Despachar (con FEFO)');

    // =============================================
    // PASO 13: SP Kardex
    // =============================================
    console.log('\n--- PASO 13: SP Kardex ---');
    await pool.request().query(`
      CREATE OR ALTER PROCEDURE dbo.Kdx_Listar
        @IdAlmacen INT, @Desde DATE, @Hasta DATE, @Tipo VARCHAR(20)=NULL, @CarnetDestino VARCHAR(20)=NULL
      AS BEGIN SET NOCOUNT ON;
        SELECT m.IdMovimiento, m.Fecha, m.Tipo, a.Codigo, a.Nombre, a.Tipo AS TipoArticulo,
          m.Talla, m.Sexo, m.Cantidad, m.LoteCodigo, m.FechaVencimiento, m.IdSolicitud, m.IdDetalle,
          m.CarnetDestino, m.CarnetResponsable, m.Comentario
        FROM dbo.MovimientosInventario m JOIN dbo.Articulos a ON a.IdArticulo=m.IdArticulo
        WHERE m.IdAlmacen=@IdAlmacen AND CAST(m.Fecha AS DATE) BETWEEN @Desde AND @Hasta
          AND(@Tipo IS NULL OR @Tipo='' OR m.Tipo=@Tipo)
          AND(@CarnetDestino IS NULL OR @CarnetDestino='' OR m.CarnetDestino=@CarnetDestino)
        ORDER BY m.Fecha DESC, m.IdMovimiento DESC;
      END
    `);
    console.log('✅ Kdx_Listar');

    // =============================================
    // PASO 14: Seed (datos iniciales)
    // =============================================
    console.log('\n--- PASO 14: Datos Iniciales ---');
    await pool.request().query(`
      IF NOT EXISTS(SELECT 1 FROM dbo.Almacenes WHERE Codigo='BOD-01')
        INSERT INTO dbo.Almacenes(Codigo,Nombre,Pais) VALUES('BOD-01','Bodega Principal','NI');
      IF NOT EXISTS(SELECT 1 FROM dbo.EMP2024 WHERE carnet='500708')
        INSERT INTO dbo.EMP2024(carnet, nombre_completo, correo, pais) 
        VALUES('500708', 'GUSTAVO LIRA', 'gustavo.lira@claro.com.ni', 'NI');

      IF NOT EXISTS(SELECT 1 FROM dbo.UsuariosSeguridad WHERE Carnet='500708')
        INSERT INTO dbo.UsuariosSeguridad(Carnet, PasswordHash) 
        VALUES('500708', '$2b$12$ltZYR2VOPSYdZrPaTmx8XOPh338R5npAUTu.ZhtKQAM.ODhG52Fsi'); -- Hash real para Claro2026!

      IF NOT EXISTS(SELECT 1 FROM dbo.RolesSistema WHERE Carnet='500708' AND Rol='ADMIN')
        INSERT INTO dbo.RolesSistema(Carnet,Rol,Activo) VALUES('500708','ADMIN',1);
      IF NOT EXISTS(SELECT 1 FROM dbo.Articulos WHERE Codigo='EPP-001')
        INSERT INTO dbo.Articulos(Codigo,Nombre,Tipo,Unidad) VALUES('EPP-001','Casco de seguridad','EPP','UN');
      IF NOT EXISTS(SELECT 1 FROM dbo.Articulos WHERE Codigo='MED-001')
        INSERT INTO dbo.Articulos(Codigo,Nombre,Tipo,Unidad) VALUES('MED-001','Paracetamol 500mg','MEDICAMENTO','TAB');
    `);

    // Crear variantes de stock
    const almRes = await pool.request().query(`SELECT TOP 1 IdAlmacen FROM dbo.Almacenes WHERE Codigo='BOD-01'`);
    const eppRes = await pool.request().query(`SELECT TOP 1 IdArticulo FROM dbo.Articulos WHERE Codigo='EPP-001'`);
    const medRes = await pool.request().query(`SELECT TOP 1 IdArticulo FROM dbo.Articulos WHERE Codigo='MED-001'`);

    if (almRes.recordset.length && eppRes.recordset.length) {
      const alm = almRes.recordset[0].IdAlmacen;
      const epp = eppRes.recordset[0].IdArticulo;
      const med = medRes.recordset[0].IdArticulo;
      await pool.request().query(`
        IF NOT EXISTS(SELECT 1 FROM dbo.ArticulosStockVar WHERE IdAlmacen=${alm} AND IdArticulo=${epp} AND Talla='UNI' AND Sexo='N')
          INSERT INTO dbo.ArticulosStockVar(IdAlmacen,IdArticulo,Talla,Sexo,StockActual,StockMinimo) VALUES(${alm},${epp},'UNI','N',0,5);
        IF NOT EXISTS(SELECT 1 FROM dbo.ArticulosStockVar WHERE IdAlmacen=${alm} AND IdArticulo=${med} AND Talla='UNI' AND Sexo='N')
          INSERT INTO dbo.ArticulosStockVar(IdAlmacen,IdArticulo,Talla,Sexo,StockActual,StockMinimo) VALUES(${alm},${med},'UNI','N',0,10);
      `);
    }
    console.log('✅ Datos iniciales insertados');

    // =============================================
    // VERIFICACIÓN FINAL
    // =============================================
    console.log('\n=== VERIFICACIÓN FINAL ===');
    const tables = await pool.request().query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME
    `);
    console.log('Tablas:', tables.recordset.map(r => r.TABLE_NAME).join(', '));

    const sps = await pool.request().query(`
      SELECT name FROM sys.procedures ORDER BY name
    `);
    console.log('SPs:', sps.recordset.map(r => r.name).join(', '));

    const views = await pool.request().query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.VIEWS ORDER BY TABLE_NAME
    `);
    console.log('Vistas:', views.recordset.map(r => r.TABLE_NAME).join(', '));

    console.log('\n🎉 === INSTALACIÓN COMPLETA === 🎉');

  } catch (err) {
    console.error('❌ ERROR:', err.message);
    if (err.precedingErrors) err.precedingErrors.forEach(e => console.error('  ↳', e.message));
  } finally {
    if (pool) await pool.close();
  }
}

run();
