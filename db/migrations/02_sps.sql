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
    @Pais VARCHAR(2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdAlmacen, Codigo, Nombre, Pais FROM dbo.Almacenes
    WHERE Activo=1 AND (@Pais IS NULL OR @Pais='' OR Pais=@Pais) ORDER BY Nombre;
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
    @Estado VARCHAR(30) = NULL, @Desde DATE = NULL, @Hasta DATE = NULL,
    @Pais VARCHAR(2) = NULL, @CarnetsCsv VARCHAR(MAX) = NULL
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
      AND (@Pais IS NULL OR @Pais='' OR e.pais=@Pais)
      AND (@CarnetsCsv IS NULL OR @CarnetsCsv=''
           OR EXISTS (SELECT 1 FROM STRING_SPLIT(@CarnetsCsv, ',') WHERE value = s.EmpleadoCarnet))
    ORDER BY s.FechaCreacion DESC;
END
GO

CREATE OR ALTER PROCEDURE dbo.Sol_DetalleConStock
    @IdSolicitud BIGINT, @IdAlmacen INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT d.IdDetalle, d.IdArticulo, a.Codigo, a.Nombre, a.Tipo, d.Talla, d.Sexo,
        d.CantidadSolicitada, d.CantidadAprobada, d.CantidadEntregada,
        (d.CantidadAprobada - d.CantidadEntregada) AS Pendiente,
        ISNULL(v.StockActual,0) AS StockVar
    FROM dbo.SolicitudesDetalle d JOIN dbo.Articulos a ON a.IdArticulo=d.IdArticulo
    LEFT JOIN dbo.ArticulosStockVar v ON v.IdAlmacen=@IdAlmacen AND v.IdArticulo=d.IdArticulo AND v.Talla=d.Talla AND v.Sexo=d.Sexo
    WHERE d.IdSolicitud=@IdSolicitud ORDER BY a.Nombre, d.Talla, d.Sexo;
END
GO

CREATE OR ALTER PROCEDURE dbo.Sol_Aprobar
    @IdSolicitud BIGINT, @CarnetAprobador VARCHAR(20)
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
        INSERT INTO dbo.Solicitudes_Historial(IdSolicitud, EstadoNuevo, CarnetUsuario, Comentario) VALUES(@IdSolicitud,'Aprobada',@CarnetAprobador,'Aprobación jefe/bodeguero');
        COMMIT TRAN;
    END TRY
    BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK; THROW; END CATCH
END
GO

CREATE OR ALTER PROCEDURE dbo.Sol_Rechazar
    @IdSolicitud BIGINT, @CarnetRechaza VARCHAR(20), @Motivo VARCHAR(255)
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
        INSERT INTO dbo.Solicitudes_Historial(IdSolicitud, EstadoNuevo, CarnetUsuario, Comentario) VALUES(@IdSolicitud,'Rechazada',@CarnetRechaza,ISNULL(@Motivo,'Rechazo'));
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
    @Pais VARCHAR(2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (500) s.IdSolicitud, s.FechaCreacion, s.EmpleadoCarnet,
        e.nombre_completo AS EmpleadoNombre, e.Gender AS EmpleadoSexo, e.OGERENCIA AS Gerencia, s.Estado
    FROM dbo.Solicitudes s LEFT JOIN dbo.vw_EmpleadosActivos e ON e.carnet=s.EmpleadoCarnet
    WHERE s.Estado IN ('Aprobada','Parcial')
      AND (@Pais IS NULL OR @Pais='' OR e.pais=@Pais)
    ORDER BY s.FechaCreacion ASC;
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

/* ========= Visibilidad Jerárquica ========= */
CREATE OR ALTER PROCEDURE dbo.Inv_Visibilidad_ObtenerCarnets
    @CarnetSolicitante VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Carnet VARCHAR(20) = LTRIM(RTRIM(@CarnetSolicitante));
    IF @Carnet = '' THROW 61001, 'Carnet requerido.', 1;

    CREATE TABLE #Carnets (carnet VARCHAR(20) NOT NULL PRIMARY KEY, fuente VARCHAR(20) NOT NULL, nivel INT NOT NULL);
    CREATE INDEX IX_Tmp_Carnet ON #Carnets(carnet);

    -- 1. El solicitante siempre se ve a sí mismo
    INSERT INTO #Carnets(carnet, fuente, nivel) VALUES(@Carnet, 'MISMO', 0);

    -- 2. Subordinados directos por jerarquía (carnet_jefe1..4)
    INSERT INTO #Carnets(carnet, fuente, nivel)
    SELECT e.carnet, 'JERARQUIA', 1
    FROM dbo.vw_EmpleadosActivos e
    WHERE e.carnet_jefe1 = @Carnet AND e.carnet <> @Carnet
      AND NOT EXISTS (SELECT 1 FROM #Carnets c WHERE c.carnet = e.carnet);

    INSERT INTO #Carnets(carnet, fuente, nivel)
    SELECT e.carnet, 'JERARQUIA', 2
    FROM dbo.vw_EmpleadosActivos e
    WHERE e.carnet_jefe2 = @Carnet AND e.carnet <> @Carnet
      AND NOT EXISTS (SELECT 1 FROM #Carnets c WHERE c.carnet = e.carnet);

    INSERT INTO #Carnets(carnet, fuente, nivel)
    SELECT e.carnet, 'JERARQUIA', 3
    FROM dbo.vw_EmpleadosActivos e
    WHERE e.carnet_jefe3 = @Carnet AND e.carnet <> @Carnet
      AND NOT EXISTS (SELECT 1 FROM #Carnets c WHERE c.carnet = e.carnet);

    INSERT INTO #Carnets(carnet, fuente, nivel)
    SELECT e.carnet, 'JERARQUIA', 4
    FROM dbo.vw_EmpleadosActivos e
    WHERE e.carnet_jefe4 = @Carnet AND e.carnet <> @Carnet
      AND NOT EXISTS (SELECT 1 FROM #Carnets c WHERE c.carnet = e.carnet);

    -- 3. Delegaciones activas (delegado ve equipo del delegante)
    INSERT INTO #Carnets(carnet, fuente, nivel)
    SELECT e.carnet, 'DELEGACION', 1
    FROM dbo.vw_EmpleadosActivos e
    WHERE EXISTS (
        SELECT 1 FROM dbo.InvDelegacionVisibilidad d
        WHERE d.CarnetDelegado = @Carnet AND d.Activo = 1
          AND (d.FechaInicio IS NULL OR d.FechaInicio <= GETDATE())
          AND (d.FechaFin IS NULL OR d.FechaFin >= GETDATE())
          AND (e.carnet_jefe1 = d.CarnetDelegante OR e.carnet_jefe2 = d.CarnetDelegante
               OR e.carnet_jefe3 = d.CarnetDelegante OR e.carnet_jefe4 = d.CarnetDelegante)
    ) AND NOT EXISTS (SELECT 1 FROM #Carnets c WHERE c.carnet = e.carnet);

    -- 4. Permisos ALLOW por empleado
    INSERT INTO #Carnets(carnet, fuente, nivel)
    SELECT p.CarnetObjetivo, 'PERMISO', 0
    FROM dbo.InvPermisoEmpleado p
    WHERE p.CarnetRecibe = @Carnet AND p.Activo = 1 AND p.TipoAcceso = 'ALLOW'
      AND (p.FechaInicio IS NULL OR p.FechaInicio <= GETDATE())
      AND (p.FechaFin IS NULL OR p.FechaFin >= GETDATE())
      AND NOT EXISTS (SELECT 1 FROM #Carnets c WHERE c.carnet = p.CarnetObjetivo);

    -- 5. Aplicar DENY (quita lo que tenga ese carnet)
    DELETE c FROM #Carnets c
    WHERE EXISTS (
        SELECT 1 FROM dbo.InvPermisoEmpleado p
        WHERE p.CarnetRecibe = @Carnet AND p.CarnetObjetivo = c.carnet
          AND p.Activo = 1 AND p.TipoAcceso = 'DENY'
          AND (p.FechaInicio IS NULL OR p.FechaInicio <= GETDATE())
          AND (p.FechaFin IS NULL OR p.FechaFin >= GETDATE())
    );

    -- Resultado
    SELECT carnet, fuente, nivel FROM #Carnets ORDER BY nivel, carnet;
    DROP TABLE #Carnets;
END
GO

CREATE OR ALTER PROCEDURE dbo.Inv_Visibilidad_ObtenerMiEquipo
    @CarnetSolicitante VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT e.carnet, e.nombre_completo, e.correo, e.cargo, e.pais,
        e.OGERENCIA, e.oDEPARTAMENTO, e.oSUBGERENCIA,
        e.carnet_jefe1, e.nom_jefe1, e.carnet_jefe2, e.nom_jefe2,
        v.fuente, v.nivel
    FROM dbo.Inv_Visibilidad_ObtenerCarnets(@CarnetSolicitante) v
    JOIN dbo.vw_EmpleadosActivos e ON e.carnet = v.carnet
    ORDER BY v.nivel, e.nombre_completo;
END
GO

CREATE OR ALTER PROCEDURE dbo.Inv_Visibilidad_PuedeVer
    @CarnetSolicitante VARCHAR(20), @CarnetObjetivo VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Existe INT = (
        SELECT COUNT(1) FROM dbo.Inv_Visibilidad_ObtenerCarnets(@CarnetSolicitante)
        WHERE carnet = @CarnetObjetivo
    );
    SELECT CAST(CASE WHEN @Existe > 0 THEN 1 ELSE 0 END AS BIT) AS PuedeVer;
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

/* ========= Evidencia despacho ========= */
CREATE OR ALTER PROCEDURE dbo.Bod_GuardarEvidencia
    @IdSolicitud BIGINT, @IdDetalle BIGINT = NULL, @NombreArchivo VARCHAR(255),
    @TipoArchivo VARCHAR(50), @ContenidoBase64 VARCHAR(MAX), @CarnetSubio VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.DespachoEvidencias(IdSolicitud, IdDetalle, NombreArchivo, TipoArchivo, ContenidoBase64, CarnetSubio)
    VALUES(@IdSolicitud, @IdDetalle, @NombreArchivo, @TipoArchivo, @ContenidoBase64, @CarnetSubio);
    SELECT SCOPE_IDENTITY() AS IdEvidencia;
END
GO

/* ========= Limpieza de evidencias viejas ========= */
CREATE OR ALTER PROCEDURE dbo.Bod_LimpiarEvidenciasViejas
    @DiasRetencion INT = 14
AS
BEGIN
    SET NOCOUNT ON;
    DELETE e FROM dbo.DespachoEvidencias e
    JOIN dbo.Solicitudes s ON s.IdSolicitud = e.IdSolicitud
    WHERE s.Estado IN ('Atendida', 'Rechazada')
      AND e.FechaSubida < DATEADD(DAY, -@DiasRetencion, GETDATE());
    SELECT @@ROWCOUNT AS Eliminadas;
END
GO

/* ========= Auditoría ========= */
CREATE OR ALTER PROCEDURE dbo.Aud_Registrar
    @Modulo VARCHAR(50), @Accion VARCHAR(50), @CarnetActor VARCHAR(20) = NULL,
    @CarnetObjetivo VARCHAR(20) = NULL, @Entidad VARCHAR(50) = NULL, @IdEntidad VARCHAR(50) = NULL,
    @Antes NVARCHAR(MAX) = NULL, @Despues NVARCHAR(MAX) = NULL,
    @Ip VARCHAR(64) = NULL, @UserAgent VARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.AuditLogs(Modulo, Accion, CarnetActor, CarnetObjetivo, Entidad, IdEntidad, Antes, Despues, Ip, UserAgent)
    VALUES(@Modulo, @Accion, @CarnetActor, @CarnetObjetivo, @Entidad, @IdEntidad, @Antes, @Despues, @Ip, @UserAgent);
END
GO

CREATE OR ALTER PROCEDURE dbo.Aud_Listar
    @Modulo VARCHAR(50) = NULL, @Desde DATE = NULL, @Hasta DATE = NULL,
    @CarnetActor VARCHAR(20) = NULL, @Top INT = 200
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@Top) IdAudit, Fecha, Modulo, Accion, CarnetActor, CarnetObjetivo, Entidad, IdEntidad, Ip
    FROM dbo.AuditLogs
    WHERE (@Modulo IS NULL OR @Modulo='' OR Modulo=@Modulo)
      AND (@Desde IS NULL OR CAST(Fecha AS DATE) >= @Desde)
      AND (@Hasta IS NULL OR CAST(Fecha AS DATE) <= @Hasta)
      AND (@CarnetActor IS NULL OR @CarnetActor='' OR CarnetActor=@CarnetActor)
    ORDER BY Fecha DESC;
END
GO

/* ========= Administración / Catálogos ========= */
CREATE OR ALTER PROCEDURE dbo.Admin_ListarRoles
AS
BEGIN
    SET NOCOUNT ON;
    SELECT r.IdRol, r.Carnet, e.nombre_completo, r.Rol, r.Activo
    FROM dbo.RolesSistema r
    LEFT JOIN dbo.vw_EmpleadosActivos e ON e.carnet = r.Carnet;
END
GO

CREATE OR ALTER PROCEDURE dbo.Admin_AsignarRol
    @Carnet VARCHAR(20), @Rol VARCHAR(30), @Activo BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS(SELECT 1 FROM dbo.RolesSistema WHERE Carnet=@Carnet AND Rol=@Rol)
        INSERT INTO dbo.RolesSistema(Carnet, Rol, Activo) VALUES(@Carnet, @Rol, @Activo);
    ELSE
        UPDATE dbo.RolesSistema SET Activo=@Activo WHERE Carnet=@Carnet AND Rol=@Rol;

    IF NOT EXISTS(SELECT 1 FROM dbo.UsuariosSeguridad WHERE Carnet=@Carnet)
        INSERT INTO dbo.UsuariosSeguridad(Carnet, PasswordHash) VALUES(@Carnet, '$2b$12$ltZYR2VOPSYdZrPaTmx8XOPh338R5npAUTu.ZhtKQAM.ODhG52Fsi');
END
GO

CREATE OR ALTER PROCEDURE dbo.Inv_CrearAlmacen
    @Codigo VARCHAR(20), @Nombre VARCHAR(100), @Pais VARCHAR(2)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Almacenes(Codigo, Nombre, Pais, Activo) VALUES(@Codigo, @Nombre, @Pais, 1);
    SELECT SCOPE_IDENTITY() AS IdAlmacen;
END
GO

CREATE OR ALTER PROCEDURE dbo.Inv_CrearArticulo
    @Codigo VARCHAR(30), @Nombre VARCHAR(150), @Tipo VARCHAR(30), @Unidad VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Articulos(Codigo, Nombre, Tipo, Unidad, Activo) VALUES(@Codigo, @Nombre, @Tipo, @Unidad, 1);
    SELECT SCOPE_IDENTITY() AS IdArticulo;
END
GO

CREATE OR ALTER PROCEDURE dbo.Admin_ActualizarStockMinimo
    @IdAlmacen INT, @IdArticulo INT, @Talla VARCHAR(20), @Sexo VARCHAR(5), @StockMinimo INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.ArticulosStockVar SET StockMinimo = @StockMinimo
    WHERE IdAlmacen = @IdAlmacen AND IdArticulo = @IdArticulo AND Talla = @Talla AND Sexo = @Sexo;
    IF @@ROWCOUNT = 0 THROW 62001, 'Variante no encontrada.', 1;
END
GO

CREATE OR ALTER PROCEDURE dbo.Inv_Mov_Transferencia
    @IdAlmacenOrigen INT, @IdAlmacenDestino INT, @IdArticulo INT,
    @Talla VARCHAR(20), @Sexo VARCHAR(5), @Cantidad INT, @Usuario VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRAN;
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
    END TRY
    BEGIN CATCH IF @@TRANCOUNT > 0 ROLLBACK; THROW; END CATCH
END
GO
