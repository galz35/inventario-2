# Esquema de Base de Datos: SQL Server para Inventario Regional

Este documento define todas las tablas necesarias para el sistema de inventario multi-país de Claro.

---

## 1. Diagrama de Relaciones (ER)

```
┌───────────┐     ┌─────────────┐     ┌──────────────┐
│  Paises   │────<│  Almacenes  │────<│   Activos    │
└───────────┘     └─────────────┘     └──────────────┘
      │                 │                     │
      │           ┌─────────────┐             │
      └──────────<│ Empleados   │>────────────┘
                  └─────────────┘      (asignación)
                        │
                  ┌─────────────┐
                  │ Solicitudes │
                  └─────────────┘
                        │
                  ┌─────────────┐
                  │   Usuarios  │
                  └─────────────┘
```

---

## 2. Tablas Principales

### 2.1 Paises (Tenants)
```sql
CREATE TABLE Paises (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    codigo      VARCHAR(3) NOT NULL UNIQUE,    -- 'NI', 'HN', 'GT'
    nombre      NVARCHAR(100) NOT NULL,
    moneda      VARCHAR(3) DEFAULT 'USD',
    activo      BIT DEFAULT 1,
    created_at  DATETIME2 DEFAULT GETUTCDATE(),
    updated_at  DATETIME2 DEFAULT GETUTCDATE()
);
```

### 2.2 Almacenes
```sql
CREATE TABLE Almacenes (
    id          UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    pais_id     INT NOT NULL,
    nombre      NVARCHAR(200) NOT NULL,
    direccion   NVARCHAR(500),
    tipo        VARCHAR(50) NOT NULL,          -- 'CENTRAL', 'REGIONAL', 'TEMPORAL'
    responsable NVARCHAR(200),
    activo      BIT DEFAULT 1,
    created_at  DATETIME2 DEFAULT GETUTCDATE(),
    updated_at  DATETIME2 DEFAULT GETUTCDATE(),

    FOREIGN KEY (pais_id) REFERENCES Paises(id)
);

CREATE INDEX IX_Almacenes_PaisId ON Almacenes(pais_id);
```

### 2.3 Categorias de Activos
```sql
CREATE TABLE Categorias (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    nombre      NVARCHAR(100) NOT NULL,        -- 'Laptops', 'Monitores', 'Mobiliario'
    descripcion NVARCHAR(500),
    activo      BIT DEFAULT 1
);
```

### 2.4 Activos (Inventario)
```sql
CREATE TABLE Activos (
    id              UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    pais_id         INT NOT NULL,
    almacen_id      UNIQUEIDENTIFIER NOT NULL,
    categoria_id    INT NOT NULL,
    codigo_interno  VARCHAR(50) NOT NULL,       -- 'LAP-NI-001'
    nombre          NVARCHAR(200) NOT NULL,
    marca           NVARCHAR(100),
    modelo          NVARCHAR(100),
    numero_serie    VARCHAR(100) UNIQUE,
    estado          VARCHAR(30) NOT NULL,       -- 'DISPONIBLE','ASIGNADO','MANTENIMIENTO','BAJA'
    condicion       VARCHAR(30) DEFAULT 'NUEVO',-- 'NUEVO','BUENO','REGULAR','MALO'
    valor_compra    DECIMAL(12,2),
    fecha_compra    DATE,
    fecha_garantia  DATE,
    notas           NVARCHAR(1000),
    empleado_id     UNIQUEIDENTIFIER NULL,      -- A quién está asignado (NULL = en bodega)
    created_at      DATETIME2 DEFAULT GETUTCDATE(),
    updated_at      DATETIME2 DEFAULT GETUTCDATE(),

    FOREIGN KEY (pais_id) REFERENCES Paises(id),
    FOREIGN KEY (almacen_id) REFERENCES Almacenes(id),
    FOREIGN KEY (categoria_id) REFERENCES Categorias(id),
    FOREIGN KEY (empleado_id) REFERENCES Empleados(id)
);

CREATE INDEX IX_Activos_PaisId ON Activos(pais_id);
CREATE INDEX IX_Activos_AlmacenId ON Activos(almacen_id);
CREATE INDEX IX_Activos_Estado ON Activos(estado);
CREATE INDEX IX_Activos_EmpleadoId ON Activos(empleado_id);
```

### 2.5 Empleados
```sql
CREATE TABLE Empleados (
    id              UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    pais_id         INT NOT NULL,
    codigo_empleado VARCHAR(50) NOT NULL,       -- 'EMP-NI-001'
    nombre          NVARCHAR(100) NOT NULL,
    apellido        NVARCHAR(100) NOT NULL,
    email           VARCHAR(200),
    departamento    NVARCHAR(100),
    cargo           NVARCHAR(100),
    telefono        VARCHAR(30),
    activo          BIT DEFAULT 1,
    created_at      DATETIME2 DEFAULT GETUTCDATE(),
    updated_at      DATETIME2 DEFAULT GETUTCDATE(),

    FOREIGN KEY (pais_id) REFERENCES Paises(id)
);

CREATE INDEX IX_Empleados_PaisId ON Empleados(pais_id);
CREATE UNIQUE INDEX IX_Empleados_Codigo ON Empleados(pais_id, codigo_empleado);
```

### 2.6 Solicitudes
```sql
CREATE TABLE Solicitudes (
    id              UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    pais_id         INT NOT NULL,
    empleado_id     UNIQUEIDENTIFIER NOT NULL,  -- Quién solicita
    almacen_id      UNIQUEIDENTIFIER NOT NULL,  -- De qué bodega
    categoria_id    INT NOT NULL,               -- Qué tipo de activo
    cantidad        INT DEFAULT 1,
    motivo          NVARCHAR(1000),
    estado          VARCHAR(30) NOT NULL,       -- 'PENDIENTE','APROBADA','RECHAZADA','ENTREGADA'
    aprobado_por    UNIQUEIDENTIFIER NULL,      -- Bodeguero/Gerente que aprobó
    activo_id       UNIQUEIDENTIFIER NULL,      -- El activo entregado
    fecha_solicitud DATETIME2 DEFAULT GETUTCDATE(),
    fecha_respuesta DATETIME2 NULL,
    fecha_entrega   DATETIME2 NULL,
    notas_respuesta NVARCHAR(1000),

    FOREIGN KEY (pais_id) REFERENCES Paises(id),
    FOREIGN KEY (empleado_id) REFERENCES Empleados(id),
    FOREIGN KEY (almacen_id) REFERENCES Almacenes(id),
    FOREIGN KEY (categoria_id) REFERENCES Categorias(id),
    FOREIGN KEY (activo_id) REFERENCES Activos(id)
);

CREATE INDEX IX_Solicitudes_PaisId ON Solicitudes(pais_id);
CREATE INDEX IX_Solicitudes_Estado ON Solicitudes(estado);
```

### 2.7 Usuarios (Acceso al sistema)
```sql
CREATE TABLE Usuarios (
    id              UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    pais_id         INT NOT NULL,
    empleado_id     UNIQUEIDENTIFIER NULL,
    username        VARCHAR(100) NOT NULL UNIQUE,
    password_hash   VARCHAR(500) NOT NULL,      -- Hash Argon2
    rol             VARCHAR(30) NOT NULL,       -- 'BODEGUERO','EMPLEADO','GERENTE','AUDITOR','ADMIN'
    ultimo_login    DATETIME2 NULL,
    activo          BIT DEFAULT 1,
    created_at      DATETIME2 DEFAULT GETUTCDATE(),

    FOREIGN KEY (pais_id) REFERENCES Paises(id),
    FOREIGN KEY (empleado_id) REFERENCES Empleados(id)
);
```

### 2.8 Logs de Auditoría
```sql
CREATE TABLE AuditLogs (
    id          BIGINT IDENTITY(1,1) PRIMARY KEY,
    pais_id     INT NOT NULL,
    usuario_id  UNIQUEIDENTIFIER NOT NULL,
    accion      VARCHAR(50) NOT NULL,          -- 'CREAR','EDITAR','ELIMINAR','APROBAR','DESPACHAR'
    entidad     VARCHAR(50) NOT NULL,          -- 'ACTIVO','SOLICITUD','EMPLEADO'
    entidad_id  UNIQUEIDENTIFIER,
    detalle     NVARCHAR(2000),
    ip_address  VARCHAR(45),
    created_at  DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX IX_AuditLogs_PaisId ON AuditLogs(pais_id);
CREATE INDEX IX_AuditLogs_Fecha ON AuditLogs(created_at);
```

---

## 3. Datos Iniciales
```sql
INSERT INTO Paises (codigo, nombre) VALUES
('NI', 'Nicaragua'),
('HN', 'Honduras'),
('GT', 'Guatemala'),
('SV', 'El Salvador'),
('CR', 'Costa Rica'),
('PA', 'Panamá'),
('MX', 'México');

INSERT INTO Categorias (nombre) VALUES
('Laptops'), ('Monitores'), ('Teclados'), ('Mouse'),
('Headsets'), ('Sillas'), ('Escritorios'), ('Teléfonos'),
('Tablets'), ('Impresoras'), ('UPS'), ('Cables y Accesorios');
```

---

> [!WARNING]
> **Row-Level Security:** Después de crear las tablas, implementa RLS para que cada usuario solo vea los datos de SU país. Esto se configura con políticas de SQL Server usando el `pais_id`.

> [!TIP]
> **Performance:** Los índices en `pais_id` son críticos. Toda consulta filtrará por país, así que el índice hará que las búsquedas sean instantáneas incluso con millones de registros.
