/* 00_crear_bds.sql  (ejecutar en master) */
DECLARE @Paises TABLE (Pais VARCHAR(2) NOT NULL);
INSERT INTO @Paises(Pais) VALUES ('NI'),('GT'); -- agrega los que quieras

DECLARE @Pais VARCHAR(2), @Db SYSNAME, @sql NVARCHAR(MAX);

DECLARE cur CURSOR LOCAL FAST_FORWARD FOR SELECT Pais FROM @Paises;
OPEN cur; FETCH NEXT FROM cur INTO @Pais;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @Db = CONCAT('Inventario_', @Pais);

    IF DB_ID(@Db) IS NULL
    BEGIN
        SET @sql = N'CREATE DATABASE ' + QUOTENAME(@Db) + N';';
        EXEC(@sql);
    END

    PRINT 'OK DB: ' + @Db;

    FETCH NEXT FROM cur INTO @Pais;
END
CLOSE cur; DEALLOCATE cur;
GO
