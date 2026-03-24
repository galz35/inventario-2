# Dependencias Completas (Cargo.toml) con Explicación

Cada librería (crate) que usaremos en el proyecto, con su propósito y por qué fue elegida.

---

## Lista Maestra de Dependencias

| Crate | Versión | Propósito | ¿Por qué esta y no otra? |
| :--- | :--- | :--- | :--- |
| `axum` | 0.8 | Framework HTTP | Más rápido+ergonómico que Actix. Ecosistema Tokio nativo |
| `tokio` | 1.x | Runtime asíncrono | Estándar absoluto. Sin alternativa real |
| `serde` | 1.x | Serialización/Deserialización | Sin competencia. Lo usa todo el ecosistema |
| `serde_json` | 1.x | JSON parsing | Complemento natural de serde |
| `tiberius` | 0.12 | Driver SQL Server | Único driver puro-Rust gratuito para MSSQL |
| `bb8` | 0.8 | Pool de conexiones | Async nativo, ligero, probado en producción |
| `bb8-tiberius` | 0.15 | Adaptador bb8 → Tiberius | Conecta el pool con el driver |
| `maud` | 0.26 | HTML templating | Compilación en tiempo de build. 0 overhead runtime |
| `tower-http` | 0.6 | Middleware HTTP | CORS, compresión Brotli, archivos estáticos |
| `tracing` | 0.1 | Logging estructurado | Superior a `log`. Soporta spans y contexto |
| `tracing-subscriber` | 0.3 | Configurar tracing | Formateadores para consola y archivos |
| `jsonwebtoken` | 9.x | JWT auth | Maduro, rápido, soporta múltiples algoritmos |
| `argon2` | 0.5 | Hash de contraseñas | Ganador de PHC. Más seguro que bcrypt |
| `dotenvy` | 0.15 | Variables .env | Sucesor moderno de `dotenv` |
| `chrono` | 0.4 | Fechas y horas | Estándar. Compatible con SQL Server DATETIME2 |
| `uuid` | 1.x | IDs únicos | UUID v4 para claves primarias |
| `validator` | 0.18 | Validación de datos | Validates structs con derive macros |
| `thiserror` | 2.x | Errores custom | Genera From impls automáticamente |
| `tower` | 0.5 | Middleware framework | Base de tower-http. Retry, timeout, rate-limit |

---

## Dependencias Opcionales (Cuando las necesites)

| Crate | Propósito | Cuándo agregarla |
| :--- | :--- | :--- |
| `casbin` | RBAC avanzado | Cuando implementes permisos por rol |
| `rust-embed` | Embeber archivos estáticos | Para el binario de producción (0 archivos sueltos) |
| `mimalloc` | Allocator rápido | Cuando quieras exprimir aún más la RAM |
| `reqwest` | HTTP client | Si necesitas llamar APIs externas |
| `lettre` | Envío de emails | Para notificaciones por correo |
| `csv` | Parseo de CSV | Para importación masiva de inventario |
| `openpgp` / `ring` | Criptografía | Si necesitas encriptar archivos adjuntos |

---

## Configuración de Features

Algunas crates tienen "features" que habilitan funcionalidades extras:

```toml
# Solo habilita lo que necesitas para compilar más rápido
tokio = { version = "1", features = ["rt-multi-thread", "macros", "net", "signal"] }
tiberius = { version = "0.12", features = ["tds73", "chrono", "rust_decimal"] }
uuid = { version = "1", features = ["v4", "serde", "fast-rng"] }
tower-http = { version = "0.6", features = ["fs", "cors", "compression-br", "trace"] }
```

---

> [!NOTE]
> **Filosofía:** Cada dependencia que agreges es código que _alguien más_ controla. Mantén la lista corta. Si algo se puede resolver con la librería estándar de Rust, hazlo así. Ejecuta `cargo audit` semanalmente para verificar vulnerabilidades.
