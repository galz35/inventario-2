# Arquitectura Multi-País: Sistema Regional para Claro

Un sistema para una empresa multinacional como Claro requiere una infraestructura de **Multi-Tenancy** (Múltiples Inquilinos). En este caso, cada "Inquilino" es un país (ej. Claro Nicaragua, Claro Honduras, etc.).

## 1. Estrategia de Aislamiento de Datos
Para maximizar la velocidad y facilitar reportes regionales, usaremos **Shared Database, Shared Schema** con **Row-Level Security (RLS)**.

-   **Funcionamiento:** Todas las tablas tienen una columna `pais_id`.
-   **Seguridad:** Rust, a través del middleware de Axum, inyecta el `pais_id` del usuario autenticado en cada consulta. Un bodeguero de un país nunca podrá ver, ni por error, el inventario de otro.

## 2. Jerarquía del Sistema
Definiremos una estructura de datos que soporte la operación local pero con visibilidad regional:

| Entidad | Descripción |
| :--- | :--- |
| **País (Tenant)** | El nivel superior (Nicaragua, México, etc.). |
| **Almacén/Bodega** | Múltiples bodegas por país (Bodega Central, Regional Norte, etc.). |
| **Solicitud** | Flujo de aprobación entre Empleado -> Almacén -> Bodeguero. |
| **Activos** | El inventario físico con trazabilidad de series y estados. |

## 3. Enrutamiento Inteligente (Routing)
Para que el sistema sea rápido y ordenado, usaremos subdominios o headers para identificar el país:
- `ni.inventario.claro.com` -> Carga contexto de Nicaragua.
- `mx.inventario.claro.com` -> Carga contexto de México.

En Rust, esto se maneja con un **Middleware de Extracción de Inquilino** que valida el acceso antes de llegar a la base de datos.

## 4. Esquema de Base de Datos (Muestra)
```sql
CREATE TABLE Inventario (
    id UUID PRIMARY KEY,
    pais_id INT NOT NULL,  -- El filtro maestro
    almacen_id UUID,
    nombre_item VARCHAR(255),
    stock INT,
    FOREIGN KEY (pais_id) REFERENCES Paises(id)
);
```

---
> [!IMPORTANT]
> **Consistencia Regional:** Aunque los datos estén aislados, el código fuente es el mismo para todos los países. Esto permite desplegar actualizaciones de rendimiento o seguridad para toda la región en segundos.

> [!TIP]
> **Dashboard Regional:** Esta arquitectura permite que un Gerente Regional pueda ver un consolidado de todos los países con una sola consulta SQL optimizada, algo imposible si las bases de datos estuvieran separadas.
