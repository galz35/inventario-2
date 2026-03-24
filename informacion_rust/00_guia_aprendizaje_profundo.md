# Guía de Aprendizaje Profundo: Domina Rust para la Web

Para construir el sistema de inventario más rápido, necesitas entender cómo Rust gestiona la realidad debajo de la superficie. Esta guía te orienta en el camino para pasar de "curioso" a "experto".

## 1. Los Pilares del Conocimiento

Para que Rust "haga click", debes dominar estos tres conceptos en orden:

1.  **Ownership (Propiedad):** Quién es el dueño de la memoria. Esto elimina el Garbage Collector.
2.  **Borrowing & Lifetimes (Préstamos y Ciclos de Vida):** Cómo compartir datos sin copiarlos (velocidad extrema) de forma segura.
3.  **Concurrency (Concurrencia):** Cómo usar todos los núcleos de tu CPU sin miedo a errores de datos (Data Races).

## 2. Recursos Recomendados (De menor a mayor profundidad)

### Nivel 1: La Base
- **[The Rust Book (El Libro)](https://doc.rust-lang.org/book/):** Es la biblia. Léelo al menos una vez.
- **[Rust by Example](https://doc.rust-lang.org/stable/rust-by-example/):** Para aprender escribiendo código pequeño.

### Nivel 2: Desarrollo Web
- **[Axum Documentation](https://docs.rs/axum/latest/axum/):** Entiende los "Extractors" y el sistema de "Handlers".
- **[Tokio Tutorial](https://tokio.rs/tokio/tutorial):** Fundamental para entender cómo Rust maneja miles de tareas al mismo tiempo.

### Nivel 3: El "Corazón" de la Velocidad
- **[The Rust Performance Book](https://nnethercote.github.io/perf-book/):** Aquí aprenderás sobre inlining, monomorfización y cómo evitar el heap.
- **[Jon Gjengset (YouTube)](https://www.youtube.com/@JonGjengset):** Vídeos de 3-4 horas analizando profundamente el código de Rust. Es el nivel más avanzado disponible.

## 3. Práctica Sugerida para el Inventario

1.  **Día 1-3:** Escribe un pequeño programa que se conecte a SQL Server y traiga un solo dato. Entiende `async` y `await`.
2.  **Día 4-7:** Crea una página web que muestre un botón y que, al pulsarlo, cambie un texto usando HTMX.
3.  **Día 8+:** Empieza a estructurar tus modelos de datos de RRHH usando `Structs` y `Enums`.

## 4. Filosofía Rust: "Zero-Cost Abstractions"
Recuerda siempre: En Rust, las herramientas de alto nivel (como los iteradores) compilan al mismo código de bajo nivel que un `for` manual. No tengas miedo de usar código elegante; el compilador se encargará de que sea rápido.

---
> [!TIP]
> **Mentalidad:** En otros lenguajes programas "contra" el compilador. En Rust, el compilador es tu **socio senior** que te impide subir errores a producción. Si compila, probablemente funciona perfectamente.
