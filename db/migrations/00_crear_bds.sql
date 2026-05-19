/* 00_crear_bds.sql  (ejecutar en master) */
-- Base de datos única Inventario_RRHH con columna Pais en cada tabla
IF DB_ID('Inventario_RRHH') IS NULL
BEGIN
    CREATE DATABASE [Inventario_RRHH];
    PRINT 'OK DB: Inventario_RRHH';
END
ELSE
    PRINT 'DB Inventario_RRHH ya existe';
GO
