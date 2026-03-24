# Mejores Prácticas y Patrones de Código en Rust

Este documento muestra la MEJOR forma de hacer las cosas en Rust para el sistema de inventario.

---

## 1. Manejo de Errores (La forma correcta)

### ❌ La forma INCORRECTA (Panic en producción)
```rust
// NUNCA hagas esto en un handler web
let resultado = db.query("SELECT ...").await.unwrap(); // Si falla, el servidor CRASH
```

### ✅ La forma CORRECTA (Errores elegantes)
```rust
// Define tus errores personalizados
#[derive(thiserror::Error, Debug)]
pub enum AppError {
    #[error("Recurso no encontrado")]
    NotFound,
    #[error("No autorizado")]
    Unauthorized,
    #[error("Error de base de datos: {0}")]
    Database(#[from] tiberius::error::Error),
    #[error("Error interno: {0}")]
    Internal(String),
}

// Implementa cómo se convierten en respuestas HTTP
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            AppError::NotFound => (StatusCode::NOT_FOUND, self.to_string()),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, self.to_string()),
            AppError::Database(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Error de base de datos".into()),
            AppError::Internal(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Error interno".into()),
        };
        (status, message).into_response()
    }
}

// Ahora puedes usar ? en tus handlers
async fn obtener_activo(Path(id): Path<Uuid>) -> Result<Html<String>, AppError> {
    let activo = repo.buscar_por_id(id).await?.ok_or(AppError::NotFound)?;
    Ok(Html(render_activo(&activo)))
}
```

---

## 2. Compartir Estado entre Handlers

### El patrón AppState
```rust
// Crea un struct con todo lo que los handlers necesitan
#[derive(Clone)]
pub struct AppState {
    pub db: bb8::Pool<TiberiusConnectionManager>,  // Pool de conexiones
    pub jwt_secret: String,
    pub config: AppConfig,
}

// Pásalo a Axum
let state = AppState {
    db: crear_pool().await?,
    jwt_secret: std::env::var("JWT_SECRET")?,
    config: AppConfig::from_env()?,
};

let app = Router::new()
    .route("/inventario", get(listar_inventario))
    .with_state(state);

// Los handlers lo reciben automáticamente
async fn listar_inventario(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Html<String>, AppError> {
    let conn = state.db.get().await?;
    // usar conn para consultas...
}
```

---

## 3. Middleware de Tenant (País)

```rust
// Extrae el país del usuario autenticado y lo inyecta en cada request
pub async fn tenant_middleware(
    State(state): State<AppState>,
    mut request: Request,
    next: Next,
) -> Result<Response, AppError> {
    // Obtener el JWT del header
    let token = request.headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .ok_or(AppError::Unauthorized)?;

    // Decodificar y extraer el pais_id
    let claims = jsonwebtoken::decode::<Claims>(token, &state.jwt_secret)?;
    let tenant = TenantContext {
        pais_id: claims.pais_id,
        user_id: claims.user_id,
        rol: claims.rol,
    };

    // Inyectar el contexto del tenant en la request
    request.extensions_mut().insert(tenant);
    Ok(next.run(request).await)
}
```

---

## 4. Consultas SQL Seguras con Tiberius

### ❌ NUNCA concatenes strings (SQL Injection)
```rust
// PELIGROSO - Un atacante puede inyectar SQL
let query = format!("SELECT * FROM Activos WHERE nombre = '{}'", user_input);
```

### ✅ SIEMPRE usa parámetros
```rust
let mut query = tiberius::Query::new(
    "SELECT id, nombre, estado FROM Activos WHERE pais_id = @P1 AND estado = @P2"
);
query.bind(pais_id);
query.bind("DISPONIBLE");

let stream = query.query(&mut conn).await?;
let rows = stream.into_first_result().await?;
```

---

## 5. Templates con Maud (El patrón Layout)

```rust
use maud::{html, Markup, PreEscaped, DOCTYPE};

// Layout base que todas las páginas usan
pub fn layout(title: &str, content: Markup) -> Markup {
    html! {
        (DOCTYPE)
        html lang="es" class="dark" {
            head {
                meta charset="utf-8";
                meta name="viewport" content="width=device-width, initial-scale=1";
                title { (title) " - Inventario Claro" }
                link rel="stylesheet" href="/static/css/output.css";
                script src="/static/js/htmx.min.js" defer {}
            }
            body class="bg-slate-900 text-slate-100 min-h-screen flex" {
                // Sidebar
                (sidebar())
                // Contenido principal
                main class="flex-1 p-8" {
                    h1 class="text-2xl font-bold mb-6" { (title) }
                    (content)
                }
            }
        }
    }
}

// Uso en un handler
async fn pagina_inventario(State(state): State<AppState>) -> Markup {
    let activos = obtener_activos(&state.db).await.unwrap_or_default();

    layout("Inventario", html! {
        // Barra de herramientas
        div class="flex justify-between items-center mb-4" {
            input type="search" placeholder="Buscar activo..."
                  class="bg-slate-800 rounded-lg px-4 py-2 text-sm"
                  hx-get="/inventario/buscar"
                  hx-trigger="keyup changed delay:300ms"
                  hx-target="#tabla-body";
            button class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg" {
                "+ Nuevo Activo"
            }
        }
        // Tabla con HTMX
        table class="w-full" {
            thead { /* ... */ }
            tbody id="tabla-body" {
                @for activo in &activos {
                    tr class="border-b border-slate-700 hover:bg-slate-800" {
                        td { (activo.nombre) }
                        td { (activo.numero_serie) }
                        td { (badge_estado(&activo.estado)) }
                    }
                }
            }
        }
    })
}
```

---

## 6. Configuración con dotenvy

```rust
// config/src/settings.rs
#[derive(Clone, Debug)]
pub struct AppConfig {
    pub database_url: String,
    pub jwt_secret: String,
    pub server_port: u16,
    pub log_level: String,
}

impl AppConfig {
    pub fn from_env() -> Result<Self, Box<dyn std::error::Error>> {
        dotenvy::dotenv().ok(); // Carga .env si existe
        Ok(Self {
            database_url: std::env::var("DATABASE_URL")?,
            jwt_secret: std::env::var("JWT_SECRET")?,
            server_port: std::env::var("SERVER_PORT")
                .unwrap_or("3000".to_string())
                .parse()?,
            log_level: std::env::var("LOG_LEVEL")
                .unwrap_or("info".to_string()),
        })
    }
}
```

---

> [!CAUTION]
> **El archivo `.env` NUNCA debe subirse a Git.** Añádelo a `.gitignore`. Los secretos de producción deben manejarse con variables de entorno del sistema operativo o un gestor de secretos.

> [!TIP]
> **Patrón Repository:** Nunca pongas SQL dentro de los handlers. Crea funciones en `db/repository/` que reciban parámetros simples y devuelvan structs de Rust. Esto hace el código testeable y limpio.
