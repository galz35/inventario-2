# Errores Comunes en Rust y Cómo Solucionarlos

Este documento es tu "botiquín de emergencias" para cuando el compilador de Rust te arroje errores. Cada error tiene su explicación sencilla y su solución directa.

---

## 1. ERRORES DE COMPILACIÓN (Los más frecuentes)

### Error E0382: "Use of moved value"
**¿Qué significa?** Intentaste usar un dato que ya le "regalaste" a otra variable o función.

```rust
// ❌ Error: nombre fue "movido" a saludo
let nombre = String::from("Claro Nicaragua");
let saludo = nombre;      // nombre se mueve a saludo
println!("{}", nombre);   // ¡ERROR! nombre ya no existe

// ✅ Solución 1: Clona el dato
let nombre = String::from("Claro Nicaragua");
let saludo = nombre.clone();  // Se crea una copia
println!("{}", nombre);       // Funciona

// ✅ Solución 2: Usa una referencia (más rápido, sin copiar)
let nombre = String::from("Claro Nicaragua");
let saludo = &nombre;         // Solo "mira" el dato, no lo toma
println!("{}", nombre);       // Funciona
```

---

### Error E0502: "Cannot borrow as mutable because it is also borrowed as immutable"
**¿Qué significa?** Estás intentando leer Y modificar el mismo dato al mismo tiempo.

```rust
// ❌ Error
let mut inventario = vec!["Laptop", "Mouse"];
let primer_item = &inventario[0];   // Préstamo inmutable (lectura)
inventario.push("Teclado");         // ¡ERROR! Préstamo mutable (escritura)
println!("{}", primer_item);

// ✅ Solución: Termina de usar la referencia antes de modificar
let mut inventario = vec!["Laptop", "Mouse"];
let primer_item = inventario[0].to_string(); // Copia el valor
inventario.push("Teclado");                  // Ahora sí funciona
println!("{}", primer_item);
```

---

### Error E0277: "The trait bound is not satisfied"
**¿Qué significa?** Rust espera que tu tipo tenga ciertas capacidades y no las tiene.

```rust
// ❌ Error: MiStruct no implementa Serialize
struct Empleado { nombre: String }
axum::Json(empleado) // ¡ERROR! Json necesita que Empleado implemente Serialize

// ✅ Solución: Añade los derives necesarios
#[derive(serde::Serialize, serde::Deserialize)]
struct Empleado { nombre: String }
axum::Json(empleado) // Ahora funciona
```

---

### Error E0597: "Does not live long enough"
**¿Qué significa?** Estás creando una referencia a un dato que va a desaparecer antes de que termines de usarla.

```rust
// ❌ Error
fn obtener_nombre() -> &str {
    let nombre = String::from("Bodeguero");
    &nombre  // ¡ERROR! nombre se destruye al salir de la función
}

// ✅ Solución: Devuelve el dato completo (owned), no una referencia
fn obtener_nombre() -> String {
    let nombre = String::from("Bodeguero");
    nombre  // Se transfiere la propiedad al que llamó
}
```

---

## 2. ERRORES EN AXUM (Framework Web)

### "Handler is not Send"
**¿Qué significa?** Tu función async tiene un dato que no puede enviarse entre hilos de forma segura.

```rust
// ❌ Error: Mutex estándar no es Send en async
use std::sync::Mutex;
async fn handler(state: Mutex<Data>) { /* ... */ }

// ✅ Solución: Usa tokio::sync::Mutex
use tokio::sync::Mutex;
async fn handler(state: Arc<Mutex<Data>>) { /* ... */ }
```

### Truco mágico: `#[axum::debug_handler]`
Cuando el error de un handler es incomprensible, añade esta anotación y el mensaje se vuelve claro:
```rust
#[axum::debug_handler]  // ← Añade esto
async fn crear_solicitud(Json(body): Json<Solicitud>) -> impl IntoResponse {
    // ...
}
```

---

## 3. ERRORES DE BASE DE DATOS (Tiberius + SQL Server)

### "Connection refused" o "Timeout"
**Causas más comunes:**
1. SQL Server no tiene habilitado TCP/IP → Ir a SQL Server Configuration Manager.
2. El firewall bloquea el puerto 1433.
3. La contraseña o el usuario son incorrectos.

### "TLS error" o "Certificate error"
```rust
// ✅ Solución para desarrollo:
let mut config = tiberius::Config::new();
config.trust_cert(); // Acepta certificados autofirmados (SOLO desarrollo)
```

### "Deadlock" en consultas
**Causa:** Dos consultas intentan bloquear las mismas filas en orden diferente.
**Solución:** Siempre accede a las tablas en el mismo orden en todas tus consultas.

---

## 4. ERRORES DE CARGO (Gestor de paquetes)

### "Failed to resolve patches"
**Solución:** Ejecuta `cargo update` para refrescar las versiones de las dependencias.

### "error[E0463]: can't find crate"
**Solución:** Asegúrate de que el crate está en tu `Cargo.toml`:
```toml
[dependencies]
axum = "0.8"  # Verifica que la versión exista
```

### Compilación lenta
**Soluciones:**
1. Usa `cargo build` sin `--release` durante desarrollo (es 5x más rápido).
2. Instala `sccache` para cachear compilaciones entre builds.
3. En Windows, usa el linker `lld` que es mucho más rápido que el de MSVC.

---

> [!WARNING]
> **Regla de Oro:** Si el compilador de Rust dice que algo está mal, el 99% de las veces tiene razón. No intentes "engañarlo" con `unsafe`. Lee el mensaje con calma y ajusta tu código.

> [!TIP]
> **Herramienta clave:** Ejecuta `cargo clippy` regularmente. Es un "linter" que te sugiere mejoras de rendimiento y seguridad en tu código.
