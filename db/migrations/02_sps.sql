/* 02_sps.sql - Todos los Stored Procedures */
SET NOCOUNT ON;
GO

/* ========= Empleados ========= */
CREATE OR ALTER PROCEDURE dbo.Emp_Buscar
    @Query VARCHAR(60),
    @Pais VARCHAR(10) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @q VARCHAR(60) = LTRIM(RTRIM(ISNULL(@Query,'')));
    SELECT TOP (20)
        carnet, nombre_completo, correo, cargo, Gender AS sexo, pais,
        carnet_jefe1, nom_jefe1, correo_jefe1
    FROM dbo.vw_EmpleadosActivos
    WHERE (@Pais IS NULL OR @Pais='' OR pais=@Pais)
      AND (@q='' OR carnet LIKE @q + '%' OR nombre_completo LIKE '%' + @q + '%')
    ORDER BY CASE WHEN carnet LIKE @q + '%' THEN 0 ELSE 1 END, nombre_completo;
END
GO

CREATE OR ALTER PROCEDURE dbo.Emp_Obtener
    @Carnet VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (1)
        carnet, nombre_completo, correo, cargo, empresa, Gender AS sexo, pais,
        telefono, WorkMobilePhoneNumber, carnet_jefe1, nom_jefe1, correo_jefe1,
        cargo_jefe1, OGERENCIA, oDEPARTAMENTO, oSUBGERENCIA, foto
    FROM dbo.vw_EmpleadosActivos
    WHERE carnet=@Carnet;
END
GO

/* ========= Lecturas Inventario ========= */
CREATE OR ALTER PROCEDURE dbo.Inv_ListarAlmacenes
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdAlmacen, Codigo, Nombre FROM dbo.Almacenes WHERE Activo = 1 ORDER BY Nombre;
END
GO

CREATE OR ALTER PROCEDURE dbo.Inv_ListarArticulos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdArticulo, Codigo, Nombre, Tipo, Unidad, Activo FROM dbo.Articulos ORDER BY Nombre;
END
GO

CREATE OR ALTER PROCEDURE dbo.Inv_ArticuloVariantes
    @IdAlmacen INT, @IdArticulo INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Talla, Sexo, StockActual, StockMinimo, PrecioUnitario
    FROM dbo.ArticulosStockVar WHERE IdAlmacen=@IdAlmacen AND IdArticulo=@IdArticulo
    ORDER BY Talla, Sexo;
END
GO

CREATE OR ALTER PROCEDURE dbo.Inv_InventarioPorAlmacen
    @IdAlmacen INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT a.IdArticulo, a.Codigo, a.Nombre, a.Tipo, v.Talla, v.Sexo,
           v.StockActual, v.StockMinimo, v.PrecioUnitario
    FROM dbo.Articulos a
    JOIN dbo.ArticulosStockVar v ON v.IdArticulo=a.IdArticulo
    WHERE v.IdAlmacen=@IdAlmacen ORDER BY a.Nombre, v.Talla, v.Sexo;
END
GO

CREATE OR ALTER PROCEDURE dbo.Inv_LotesPorArticulo
    @IdAlmacen INT, @IdArticulo INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdLote, LoteCodigo, FechaVencimiento, StockActual
    FROM dbo.InvLotes WHERE IdAlmacen=@IdAlmacen AND IdArticulo=@IdArticulo
    ORDER BY FechaVencimiento, IdLote;
END
GO

CREATE OR ALTER PROCEDURE dbo.Inv_AlertasVencimiento
    @IdAlmacen INT, @Dias INT = 30
AS
BEGIN
    SET NOCOUNT ON;
    SELECT a.Codigo, a.Nombre, l.LoteCodigo, l.FechaVencimiento, l.StockActual
    FROM dbo.InvLotes l JOIN dbo.Articulos a ON a.IdArticulo=l.IdArticulo
    WHERE l.IdAlmacen=@IdAlmacen AND l.StockActual > 0
      AND l.FechaVencimiento <= DATEADD(DAY, @Dias, CAST(GETDATE() AS DATE))
    ORDER BY l.FechaVencimiento, a.Nombre;
END
GO

CREATE OR ALTER PROCEDURE dbo.Inv_AlertasStockBajo
    @IdAlmacen INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT a.Codigo, a.Nombre, a.Tipo, v.Talla, v.Sexo, v.StockActual, v.StockMinimo
    FROM dbo.ArticulosStockVar v JOIN dbo.Articulos a ON a.IdArticulo=v.IdArticulo
    WHERE v.IdAlmacen=@IdAlmacen AND v.StockActual <= v.StockMinimo
    ORDER BY a.Nombre, v.Talla, v.Sexo;
END
GO

/* ========= Solicitudes ========= */
CREATE OR ALTER PROCEDURE dbo.Sol_CrearSolicitud
    @EmpleadoCarnet VARCHAR(20), @Motivo VARCHAR(255), @DetallesJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRAN;
        IF ISNULL(LTRIM(RTRIM(@EmpleadoCarnet)), '')='' THROW 60001, 'EmpleadoCarnet requerido.', 1;
        IF ISNULL(LTRIM(RTRIM(@DetallesJson)), '')='' OR ISJSON(@DetallesJson)<>1 THROW 60002, 'DetallesJson inválido.', 1;

        DECLARE @JefeCarnet VARCHAR(20) = (SELECT TOP (1) carnet_jefe1 FROM dbo.vw_EmpleadosActivos WHERE carnet = @EmpleadoCarnet);
        INSERT INTO dbo.Solicitudes(EmpleadoCarnet, JefeCarnet, MotivoUsuario) VALUES(@EmpleadoCarnet, @JefeCarnet, @Motivo);
        DECLARE @IdSol BIGINT = SCOPE_IDENTITY();

        ;WITH J AS (
            SELECT * FROM OPENJSON(@DetallesJson) WITH (IdArticulo INT, Talla VARCHAR(20), Sexo VARCHAR(5), Cantidad INT)
        )
        INSERT INTO dbo.SolicitudesDetalle (IdSolicitud, IdArticulo, Talla, Sexo, CantidadSolicitada, CantidadAprobada, CantidadEntregada)
        SELECT @IdSol, j.IdArticulo, ISNULL(NULLIF(LTRIM(RTRIM(j.Talla)),''),'UNI'), ISNULL(NULLIF(LTRIM(RTRIM(j.Sexo)),''),'N'), ISNULL(j.Cantidad,0), 0, 0
        FROM J j WHERE j.IdArticulo IS NOT NULL AND ISNULL(j.Cantidad,0) > 0;

        IF NOT EXISTS (SELECT 1 FROM dbo.SolicitudesDetalle WHERE IdSolicitud=@IdSol) THROW 60003, 'No hay detalles válidos.', 1;

        INSERT INTO dbo.Solicitudes_Historial(IdSolicitud, EstadoNuevo, CarnetUsuario, Comentario) VALUES(@IdSol,'Pendiente',@EmpleadoCarnet,'Solicitud creada');
        COMMIT TRAN;
        SELECT @IdSol AS IdSolicitud;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT>0 ROLLBACK; THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE dbo.Sol_Listar
    @Estado VARCHAR(30) = NULL, @Desde DATE = NULL, @Hasta DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (500) s.IdSolicitud, s.FechaCreacion, s.EmpleadoCarnet,
        e.nombre_completo AS EmpleadoNombre, e.Gender AS EmpleadoSexo, e.OGERENCIA AS Gerencia,
        s.Estado, s.MotivoUsuario, s.JefeCarnet
    FROM dbo.Solicitudes s LEFT JOIN dbo.vw_EmpleadosActivos e ON e.carnet=s.EmpleadoCarnet
    WHERE (@Estado IS NULL OR @Estado='' OR s.Estado=@Estado)
      AND (@Desde IS NULL OR CAST(s.FechaCreacion AS DATE) >= @Desde)
      AND (@Hasta IS NULL OR CAST(s.FechaCreacion AS DATE) <= @Hasta)
    ORDER BY s.FechaCreacion DESC;
END
GO

CREATE OR ALTER PROCEDURE dbo.Sol_DetalleConStock
    @IdSolicitud BIGINT, @IdAlmacen INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT d.IdDetalle, d.IdArticulo, a.Codigo, a.Nombre, a.Tipo, d.Talla, d.Sexo,
        d.CantidadAprobada, d.CantidadEntregada, (d.CantidadAprobada - d.CantidadEntregada) AS Pendiente,
        ISNULL(v.StockActual,0) AS StockVar
    FROM dbo.SolicitudesDetalle d JOIN dbo.Articulos a ON a.IdArticulo=d.IdArticulo
    LEFT JOIN dbo.ArticulosStockVar v ON v.IdAlmacen=@IdAlmacen AND v.IdArticulo=d.IdArticulo AND v.Talla=d.Talla AND v.Sexo=d.Sexo
    WHERE d.IdSolicitud=@IdSolicitud ORDER BY a.Nombre, d.Talla, d.Sexo;
END
GO

CREATE OR ALTER PROCEDURE dbo.Sol_Aprobar
    @IdSolicitud BIGINT, @CarnetRRHH VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRAN;
        DECLARE @Estado VARCHAR(30);
        SELECT @Estado=Estado FROM dbo.Solicitudes WITH (UPDLOCK,HOLDLOCK) WHERE IdSolicitud=@IdSolicitud;
        IF @Estado IS NULL THROW 60101, 'Solicitud no existe.', 1;
        IF @Estado <> 'Pendiente' THROW 60102, 'Solo se aprueba si está Pendiente.', 1;
        UPDATE dbo.Solicitudes SET Estado='Aprobada' WHERE IdSolicitud=@IdSolicitud;
        UPDATE dbo.SolicitudesDetalle SET CantidadAprobada = CantidadSolicitada WHERE IdSolicitud=@IdSolicitud;
        INSERT INTO dbo.Solicitudes_Historial(IdSolicitud, EstadoNuevo, CarnetUsuario, Comentario) VALUES(@IdSolicitud,'Aprobada',@CarnetRRHH,'Aprobación RRHH');
        COMMIT TRAN;
    END TRY
    BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK; THROW; END CATCH
END
GO

CREATE OR ALTER PROCEDURE dbo.Sol_Rechazar
    @IdSolicitud BIGINT, @CarnetRRHH VARCHAR(20), @Motivo VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRAN;
        DECLARE @Estado VARCHAR(30);
        SELECT @Estado=Estado FROM dbo.Solicitudes WITH (UPDLOCK,HOLDLOCK) WHERE IdSolicitud=@IdSolicitud;
        IF @Estado IS NULL THROW 60111, 'Solicitud no existe.', 1;
        IF @Estado NOT IN ('Pendiente','Aprobada','Parcial') THROW 60112, 'No se puede rechazar en este estado.', 1;
        UPDATE dbo.Solicitudes SET Estado='Rechazada', RespuestaRRHH=@Motivo WHERE IdSolicitud=@IdSolicitud;
        INSERT INTO dbo.Solicitudes_Historial(IdSolicitud, EstadoNuevo, CarnetUsuario, Comentario) VALUES(@IdSolicitud,'Rechazada',@CarnetRRHH,ISNULL(@Motivo,'Rechazo'));
        COMMIT TRAN;
    END TRY
    BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK; THROW; END CATCH
END
GO

/* ========= Movimiento ENTRADA / MERMA ========= */
CREATE OR ALTER PROCEDURE dbo.Inv_Mov_EntradaMerma
    @IdAlmacen INT, @Tipo VARCHAR(20), @IdArticulo INT, @Talla VARCHAR(20), @Sexo VARCHAR(5),
    @Cantidad INT, @Comentario VARCHAR(255), @Usuario VARCHAR(20),
    @LoteCodigo VARCHAR(50) = NULL, @Vence DATE = NULL
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRAN;
        IF @Tipo NOT IN ('ENTRADA','MERMA') THROW 60201, 'Tipo inválido.', 1;
        IF ISNULL(@Cantidad,0) <= 0 THROW 60202, 'Cantidad debe ser > 0.', 1;

        DECLARE @TipoArt VARCHAR(30) = (SELECT Tipo FROM dbo.Articulos WHERE IdArticulo=@IdArticulo);
        IF @TipoArt IS NULL THROW 60203, 'Artículo no existe.', 1;

        IF @TipoArt='MEDICAMENTO'
        BEGIN
            IF ISNULL(NULLIF(LTRIM(RTRIM(@LoteCodigo)),''),'')='' THROW 60204, 'LoteCodigo requerido para medicamento.', 1;
            IF @Vence IS NULL THROW 60205, 'Vence requerido para medicamento.', 1;
        END ELSE BEGIN SET @LoteCodigo=NULL; SET @Vence=NULL; END

        DECLARE @CantReal INT = CASE WHEN @Tipo='MERMA' THEN -@Cantidad ELSE @Cantidad END;

        UPDATE dbo.ArticulosStockVar WITH (UPDLOCK,ROWLOCK) SET StockActual = StockActual + @CantReal
        WHERE IdAlmacen=@IdAlmacen AND IdArticulo=@IdArticulo AND Talla=@Talla AND Sexo=@Sexo
          AND (@CantReal >= 0 OR StockActual >= ABS(@CantReal));

        IF @@ROWCOUNT=0
        BEGIN
            IF @Tipo='MERMA' THROW 60206, 'Stock insuficiente o variante no existe para merma.', 1;
            INSERT INTO dbo.ArticulosStockVar(IdAlmacen,IdArticulo,Talla,Sexo,StockActual,StockMinimo,PrecioUnitario)
            VALUES(@IdAlmacen,@IdArticulo,@Talla,@Sexo,@CantReal,0,0);
        END

        IF @TipoArt='MEDICAMENTO'
        BEGIN
            UPDATE dbo.InvLotes WITH (UPDLOCK,ROWLOCK) SET StockActual = StockActual + @CantReal, FechaVencimiento = COALESCE(@Vence, FechaVencimiento)
            WHERE IdAlmacen=@IdAlmacen AND IdArticulo=@IdArticulo AND LoteCodigo=@LoteCodigo AND (@CantReal >= 0 OR StockActual >= ABS(@CantReal));
            IF @@ROWCOUNT=0
            BEGIN
                IF @Tipo='MERMA' THROW 60207, 'Stock insuficiente o lote no existe para merma.', 1;
                INSERT INTO dbo.InvLotes(IdAlmacen,IdArticulo,LoteCodigo,FechaVencimiento,StockActual) VALUES(@IdAlmacen,@IdArticulo,@LoteCodigo,@Vence,@CantReal);
            END
        END

        INSERT INTO dbo.MovimientosInventario(Tipo,IdAlmacen,IdArticulo,Talla,Sexo,Cantidad,LoteCodigo,FechaVencimiento,CarnetResponsable,Comentario)
        VALUES(@Tipo,@IdAlmacen,@IdArticulo,@Talla,@Sexo,@CantReal,@LoteCodigo,@Vence,@Usuario,@Comentario);
        COMMIT TRAN;
    END TRY
    BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK; THROW; END CATCH
END
GO

/* ========= Bodega ========= */
CREATE OR ALTER PROCEDURE dbo.Bod_Pendientes
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (500) s.IdSolicitud, s.FechaCreacion, s.EmpleadoCarnet,
        e.nombre_completo AS EmpleadoNombre, e.Gender AS EmpleadoSexo, e.OGERENCIA AS Gerencia, s.Estado
    FROM dbo.Solicitudes s LEFT JOIN dbo.vw_EmpleadosActivos e ON e.carnet=s.EmpleadoCarnet
    WHERE s.Estado IN ('Aprobada','Parcial') ORDER BY s.FechaCreacion ASC;
END
GO

CREATE OR ALTER PROCEDURE dbo.Bod_Despachar
    @IdAlmacen INT, @IdSolicitud BIGINT, @CarnetBodeguero VARCHAR(20), @DespachoJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRAN;
        IF ISNULL(LTRIM(RTRIM(@DespachoJson)), '')='' OR ISJSON(@DespachoJson)<>1 THROW 60301, 'DespachoJson inválido.', 1;

        DECLARE @Estado VARCHAR(30), @CarnetEmp VARCHAR(20);
        SELECT @Estado=Estado, @CarnetEmp=EmpleadoCarnet FROM dbo.Solicitudes WITH (UPDLOCK,HOLDLOCK) WHERE IdSolicitud=@IdSolicitud;
        IF @Estado IS NULL THROW 60302, 'Solicitud no existe.', 1;
        IF @Estado NOT IN ('Aprobada','Parcial') THROW 60303, 'Solo se despacha Aprobada/Parcial.', 1;

        CREATE TABLE #Tmp (IdDetalle BIGINT NOT NULL, Entregar INT NOT NULL);
        INSERT INTO #Tmp(IdDetalle,Entregar) SELECT IdDetalle,Entregar FROM OPENJSON(@DespachoJson) WITH (IdDetalle BIGINT, Entregar INT);
        IF EXISTS (SELECT 1 FROM #Tmp WHERE Entregar <= 0) THROW 60304, 'Entregar debe ser > 0.', 1;

        DECLARE @IdDet BIGINT, @Cant INT, @IdArt INT, @Tal VARCHAR(20), @Sex VARCHAR(5), @TipoArt VARCHAR(30), @Pend INT;
        DECLARE cur CURSOR LOCAL FAST_FORWARD FOR SELECT IdDetalle,Entregar FROM #Tmp;
        OPEN cur; FETCH NEXT FROM cur INTO @IdDet,@Cant;

        WHILE @@FETCH_STATUS=0
        BEGIN
            SELECT @IdArt=d.IdArticulo, @Tal=d.Talla, @Sex=d.Sexo, @Pend=(d.CantidadAprobada-d.CantidadEntregada), @TipoArt=a.Tipo
            FROM dbo.SolicitudesDetalle d WITH (UPDLOCK,HOLDLOCK) JOIN dbo.Articulos a ON a.IdArticulo=d.IdArticulo
            WHERE d.IdDetalle=@IdDet AND d.IdSolicitud=@IdSolicitud;

            IF @Pend IS NULL THROW 60305, 'Detalle inválido.', 1;
            IF @Cant > @Pend THROW 60306, 'Entregar excede pendiente.', 1;

            UPDATE dbo.ArticulosStockVar WITH (UPDLOCK,ROWLOCK) SET StockActual = StockActual - @Cant
            WHERE IdAlmacen=@IdAlmacen AND IdArticulo=@IdArt AND Talla=@Tal AND Sexo=@Sex AND StockActual >= @Cant;
            IF @@ROWCOUNT=0 THROW 60307, 'Stock insuficiente en variante.', 1;

            IF @TipoArt='MEDICAMENTO'
            BEGIN
                DECLARE @Rest INT = @Cant;
                WHILE @Rest > 0
                BEGIN
                    DECLARE @IdLote INT, @Lote VARCHAR(50), @Vence DATE, @StockLote INT;
                    SELECT TOP (1) @IdLote=IdLote, @Lote=LoteCodigo, @Vence=FechaVencimiento, @StockLote=StockActual
                    FROM dbo.InvLotes WITH (UPDLOCK,HOLDLOCK)
                    WHERE IdAlmacen=@IdAlmacen AND IdArticulo=@IdArt AND StockActual > 0
                    ORDER BY FechaVencimiento, IdLote;
                    IF @IdLote IS NULL THROW 60308, 'No hay lotes disponibles para FEFO.', 1;
                    DECLARE @Tomar INT = CASE WHEN @Rest <= @StockLote THEN @Rest ELSE @StockLote END;
                    UPDATE dbo.InvLotes SET StockActual = StockActual - @Tomar WHERE IdLote=@IdLote AND StockActual >= @Tomar;
                    IF @@ROWCOUNT=0 THROW 60309, 'Conflicto FEFO.', 1;
                    INSERT INTO dbo.MovimientosInventario(Tipo,IdAlmacen,IdArticulo,Talla,Sexo,Cantidad,LoteCodigo,FechaVencimiento,IdSolicitud,IdDetalle,CarnetDestino,CarnetResponsable,Comentario)
                    VALUES('SALIDA',@IdAlmacen,@IdArt,@Tal,@Sex,-@Tomar,@Lote,@Vence,@IdSolicitud,@IdDet,@CarnetEmp,@CarnetBodeguero,'Despacho FEFO');
                    SET @Rest -= @Tomar;
                END
            END
            ELSE
            BEGIN
                INSERT INTO dbo.MovimientosInventario(Tipo,IdAlmacen,IdArticulo,Talla,Sexo,Cantidad,IdSolicitud,IdDetalle,CarnetDestino,CarnetResponsable,Comentario)
                VALUES('SALIDA',@IdAlmacen,@IdArt,@Tal,@Sex,-@Cant,@IdSolicitud,@IdDet,@CarnetEmp,@CarnetBodeguero,'Despacho solicitud');
            END

            UPDATE dbo.SolicitudesDetalle SET CantidadEntregada = CantidadEntregada + @Cant WHERE IdDetalle=@IdDet;
            FETCH NEXT FROM cur INTO @IdDet,@Cant;
        END
        CLOSE cur; DEALLOCATE cur;

        DECLARE @Faltan INT = (SELECT SUM(CASE WHEN (CantidadAprobada-CantidadEntregada)>0 THEN (CantidadAprobada-CantidadEntregada) ELSE 0 END) FROM dbo.SolicitudesDetalle WHERE IdSolicitud=@IdSolicitud);
        DECLARE @NuevoEstado VARCHAR(30) = CASE WHEN ISNULL(@Faltan,0)=0 THEN 'Atendida' ELSE 'Parcial' END;
        UPDATE dbo.Solicitudes SET Estado=@NuevoEstado WHERE IdSolicitud=@IdSolicitud;
        INSERT INTO dbo.Solicitudes_Historial(IdSolicitud,EstadoNuevo,CarnetUsuario,Comentario) VALUES(@IdSolicitud,@NuevoEstado,@CarnetBodeguero,'Despacho aplicado');
        COMMIT TRAN;
    END TRY
    BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK; THROW; END CATCH
END
GO

/* ========= Kardex ========= */
CREATE OR ALTER PROCEDURE dbo.Kdx_Listar
    @IdAlmacen INT, @Desde DATE, @Hasta DATE, @Tipo VARCHAR(20) = NULL, @CarnetDestino VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT m.IdMovimiento, m.Fecha, m.Tipo, a.Codigo, a.Nombre, a.Tipo AS TipoArticulo,
        m.Talla, m.Sexo, m.Cantidad, m.LoteCodigo, m.FechaVencimiento, m.IdSolicitud, m.IdDetalle,
        m.CarnetDestino, m.CarnetResponsable, m.Comentario
    FROM dbo.MovimientosInventario m JOIN dbo.Articulos a ON a.IdArticulo=m.IdArticulo
    WHERE m.IdAlmacen=@IdAlmacen AND CAST(m.Fecha AS DATE) BETWEEN @Desde AND @Hasta
      AND (@Tipo IS NULL OR @Tipo='' OR m.Tipo=@Tipo)
      AND (@CarnetDestino IS NULL OR @CarnetDestino='' OR m.CarnetDestino=@CarnetDestino)
    ORDER BY m.Fecha DESC, m.IdMovimiento DESC;
END
GO
