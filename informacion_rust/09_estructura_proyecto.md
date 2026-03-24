# Estructura del Proyecto: Cargo Workspace Modular

La estructura de carpetas es CRÍTICA para que el proyecto sea mantenible a largo plazo. Usaremos un **Cargo Workspace** que separa el código en módulos independientes.

---

## 1. Estructura de Carpetas Completa

```
inventario-rrhh/
├── Cargo.toml                  ← Workspace raíz
├── .env                        ← Variables de entorno (secretos)
├── .gitignore
│
├── crates/
│   ├── server/                 ← Binario principal (punto de entrada)
│   │   ├── Cargo.toml
│   │   └── src/
│   │       └── main.rs         ← Arranca Axum, configura rutas
│   │
│   ├── web/                    ← Todo lo relacionado con HTTP
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── lib.rs
│   │       ├── routes/         ← Definición de rutas
│   │       │   ├── mod.rs
│   │       │   ├── inventario.rs
│   │       │   ├── empleados.rs
│   │       │   ├── solicitudes.rs
│   │       │   ├── almacenes.rs
│   │       │   └── auth.rs
│   │       ├── handlers/       ← Lógica de cada endpoint
│   │       │   ├── mod.rs
│   │       │   ├── inventario.rs
│   │       │   ├── empleados.rs
│   │       │   ├── solicitudes.rs
│   │       │   ├── almacenes.rs
│   │       │   └── auth.rs
│   │       ├── middleware/     ← Autenticación, tenant, logging
│   │       │   ├── mod.rs
│   │       │   ├── auth.rs
│   │       │   ├── tenant.rs   ← Extrae el país del usuario
│   │       │   └── logging.rs
│   │       └── templates/      ← Maud HTML templates
│   │           ├── mod.rs
│   │           ├── layout.rs   ← Layout base (sidebar, header)
│   │           ├── dashboard.rs
│   │           ├── inventario.rs
│   │           ├── empleados.rs
│   │           └── solicitudes.rs
│   │
│   ├── domain/                 ← Lógica de negocio pura
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── lib.rs
│   │       ├── models/         ← Structs de datos
│   │       │   ├── mod.rs
│   │       │   ├── empleado.rs
│   │       │   ├── activo.rs
│   │       │   ├── solicitud.rs
│   │       │   ├── almacen.rs
│   │       │   └── usuario.rs
│   │       ├── services/       ← Reglas de negocio
│   │       │   ├── mod.rs
│   │       │   ├── inventario_service.rs
│   │       │   ├── solicitud_service.rs
│   │       │   └── auth_service.rs
│   │       └── errors.rs       ← Errores personalizados
│   │
│   ├── db/                     ← Capa de base de datos
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── lib.rs
│   │       ├── pool.rs         ← Configuración bb8 + Tiberius
│   │       ├── repository/     ← Queries SQL
│   │       │   ├── mod.rs
│   │       │   ├── inventario_repo.rs
│   │       │   ├── empleado_repo.rs
│   │       │   ├── solicitud_repo.rs
│   │       │   └── almacen_repo.rs
│   │       └── migrations/     ← Scripts SQL para crear tablas
│   │           ├── 001_create_paises.sql
│   │           ├── 002_create_almacenes.sql
│   │           ├── 003_create_empleados.sql
│   │           ├── 004_create_activos.sql
│   │           └── 005_create_solicitudes.sql
│   │
│   └── config/                 ← Configuración centralizada
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs
│           └── settings.rs     ← Lee .env y crea structs de config
│
├── static/                     ← Archivos estáticos (CSS, JS, imágenes)
│   ├── css/
│   │   └── output.css          ← Tailwind CSS compilado
│   ├── js/
│   │   └── htmx.min.js        ← HTMX (14 KB)
│   └── img/
│       └── logo-claro.svg
│
├── tailwind.config.js          ← Config de Tailwind
└── input.css                   ← Archivo fuente de Tailwind
```

---

## 2. Cargo.toml del Workspace (Raíz)

```toml
[workspace]
resolver = "2"
members = [
    "crates/server",
    "crates/web",
    "crates/domain",
    "crates/db",
    "crates/config",
]

[workspace.dependencies]
# Todas las dependencias se definen aquí para consistencia
axum = "0.8"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tiberius = { version = "0.12", features = ["tds73", "chrono"] }
bb8 = "0.8"
bb8-tiberius = "0.15"
maud = { version = "0.26", features = ["axum"] }
tower-http = { version = "0.6", features = ["fs", "cors", "compression-br"] }
tracing = "0.1"
tracing-subscriber = "0.3"
jsonwebtoken = "9"
argon2 = "0.5"
dotenvy = "0.15"
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1", features = ["v4", "serde"] }
validator = { version = "0.18", features = ["derive"] }
thiserror = "2"
```

---

## 3. Por qué esta estructura es la mejor

| Beneficio | Explicación |
| :--- | :--- |
| **Compilación rápida** | Si cambias solo un template HTML, solo se recompila `web/`, no todo |
| **Testeable** | Puedes probar `domain/` sin necesidad de base de datos ni servidor |
| **Equipos** | Un desarrollador puede trabajar en `db/` y otro en `web/` sin conflictos |
| **Seguridad** | `domain/` no puede acceder directamente a la DB. Fuerza buenas prácticas |
| **Escalable** | Si necesitas una API JSON para Flutter, agregas `crates/api/` y listo |

---

> [!IMPORTANT]
> **Regla de dependencia:** `server` → depende de `web` y `config`. `web` → depende de `domain` y `db`. `domain` → NO depende de nada externo. `db` → depende de `domain` (para los modelos).

> [!TIP]
> **Flujo de datos:** HTTP Request → `web/middleware` → `web/handlers` → `domain/services` → `db/repository` → SQL Server → Respuesta
