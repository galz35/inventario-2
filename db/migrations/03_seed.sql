/* 03_seed.sql (en cada BD) */
-- Almacén base
IF NOT EXISTS (SELECT 1 FROM dbo.Almacenes WHERE Codigo='BOD-01')
    INSERT INTO dbo.Almacenes(Codigo,Nombre) VALUES ('BOD-01','Bodega Principal');

-- Roles ejemplo
IF NOT EXISTS (SELECT 1 FROM dbo.RolesSistema WHERE Carnet='500708' AND Rol='ADMIN')
    INSERT INTO dbo.RolesSistema(Carnet,Rol,Activo) VALUES ('500708','ADMIN',1);

-- Artículos ejemplo
IF NOT EXISTS (SELECT 1 FROM dbo.Articulos WHERE Codigo='EPP-001')
    INSERT INTO dbo.Articulos(Codigo,Nombre,Tipo,Unidad) VALUES ('EPP-001','Casco de seguridad','EPP','UN');

IF NOT EXISTS (SELECT 1 FROM dbo.Articulos WHERE Codigo='MED-001')
    INSERT INTO dbo.Articulos(Codigo,Nombre,Tipo,Unidad) VALUES ('MED-001','Paracetamol 500mg','MEDICAMENTO','TAB');

-- Crear variante UNI/N si no existe
DECLARE @Alm INT = (SELECT TOP 1 IdAlmacen FROM dbo.Almacenes WHERE Codigo='BOD-01');
DECLARE @Epp INT = (SELECT TOP 1 IdArticulo FROM dbo.Articulos WHERE Codigo='EPP-001');
DECLARE @Med INT = (SELECT TOP 1 IdArticulo FROM dbo.Articulos WHERE Codigo='MED-001');

IF NOT EXISTS (SELECT 1 FROM dbo.ArticulosStockVar WHERE IdAlmacen=@Alm AND IdArticulo=@Epp AND Talla='UNI' AND Sexo='N')
    INSERT INTO dbo.ArticulosStockVar(IdAlmacen,IdArticulo,Talla,Sexo,StockActual,StockMinimo) VALUES (@Alm,@Epp,'UNI','N',0,5);

IF NOT EXISTS (SELECT 1 FROM dbo.ArticulosStockVar WHERE IdAlmacen=@Alm AND IdArticulo=@Med AND Talla='UNI' AND Sexo='N')
    INSERT INTO dbo.ArticulosStockVar(IdAlmacen,IdArticulo,Talla,Sexo,StockActual,StockMinimo) VALUES (@Alm,@Med,'UNI','N',0,10);
GO
