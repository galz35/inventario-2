/* 01_schema.sql  (ejecutar dentro de Inventario_NI / Inventario_GT / etc.) */
SET NOCOUNT ON;

DECLARE @PAIS VARCHAR(2) = 'NI'; -- <-- CAMBIAR por DB

/* ========================= ConfigSistema ========================= */
IF OBJECT_ID('dbo.ConfigSistema','U') IS NULL
BEGIN
    CREATE TABLE dbo.ConfigSistema(
        Clave VARCHAR(50) NOT NULL CONSTRAINT PK_ConfigSistema PRIMARY KEY,
        Valor VARCHAR(100) NOT NULL
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.ConfigSistema WHERE Clave='PAIS')
    INSERT INTO dbo.ConfigSistema(Clave, Valor) VALUES ('PAIS', @PAIS);
ELSE
    UPDATE dbo.ConfigSistema SET Valor=@PAIS WHERE Clave='PAIS';

/* ========================= Vista empleados activos ========================= */
GO
CREATE OR ALTER VIEW dbo.vw_EmpleadosActivos
AS
SELECT *
FROM dbo.EMP2024
WHERE (fechabaja IS NULL OR fechabaja < '1900-01-01');
GO

/* ========================= Tablas Inventario ========================= */
IF OBJECT_ID('dbo.Almacenes','U') IS NULL
BEGIN
    CREATE TABLE dbo.Almacenes (
        IdAlmacen INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Almacenes PRIMARY KEY,
        Codigo VARCHAR(20) NOT NULL,
        Nombre VARCHAR(100) NOT NULL,
        Activo BIT NOT NULL CONSTRAINT DF_Almacenes_Activo DEFAULT(1)
    );
    CREATE UNIQUE INDEX UX_Almacenes_Codigo ON dbo.Almacenes(Codigo);
END

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

/* ========================= Solicitudes + Historial ========================= */
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
            AND CantidadAprobada <= CantidadSolicitada
            AND CantidadEntregada <= CantidadAprobada
        )
    );
    CREATE INDEX IX_SolDet_Solicitud ON dbo.SolicitudesDetalle(IdSolicitud) INCLUDE(IdArticulo,Talla,Sexo,CantidadSolicitada,CantidadAprobada,CantidadEntregada);
END

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

/* ========================= Kardex ========================= */
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

/* ========================= Roles ========================= */
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
GO
