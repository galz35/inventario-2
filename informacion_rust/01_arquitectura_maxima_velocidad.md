# Arquitectura de Máxima Velocidad: SSR + HTMX vs Leptos

Para que una aplicación de inventario sea "la más rápida del mundo", debemos minimizar dos cosas: **Latencia de Red** (round-trips) y **Tiempo de Ejecución en el Cliente**.

## 1. El Ganador para Inventarios: Axum + HTMX + Maud

Aunque los frameworks de WebAssembly (WASM) como Leptos son increíbles, para un sistema de gestión (tablas, formularios, listados) la arquitectura de **Fragmentos HTML sobre la Marcha** es superior en velocidad percibida.

### Por qué esta combinación es imbatible:
- **Axum (Backend):** Es una fina capa sobre `hyper` y `tokio`. No añade overhead innecesario.
- **HTMX (Frontend):** En lugar de cargar megabytes de JavaScript (como React/Angular), HTMX pesa <15KB. Solo actualiza la parte de la pantalla que cambia.
- **Maud (Templates):** Los HTML se generan en tiempo de compilación. Cuando el servidor responde, no está "creando" el HTML, está simplemente escribiendo bytes pre-calculados al socket.

## 2. Comparativa de Rendimiento

| Característica | Axum + HTMX | Leptos (WASM) | SPA Tradicional (React/Node) |
| :--- | :--- | :--- | :--- |
| **Primer Pintado (FCP)** | Instantáneo (SSR) | Rápido (Hydration) | Lento (Descarga JS) |
| **Interactividad** | Alta (AJAX ligero) | Máxima (Nativo) | Media (Main thread JS) |
| **Uso de CPU Cliente** | Mínimo | Medio (WASM) | Alto |
| **Consumo RAM Servidor** | Muy Bajo (~10-50MB) | Medio (~50-100MB) | Alto (>200MB) |

## 3. Estrategia de "Zero-JS"
Para velocidad extrema, evitamos bibliotecas de JS pesadas.
- **Gráficos:** Usar SVGs generados directamente en Rust.
- **Tablas:** Paginación en el lado del servidor enviando solo las filas necesarias.

## 4. Percepción de Velocidad (Optimistic UI)
Con HTMX, podemos usar `hx-indicator` para mostrar retroalimentación instantánea mientras el servidor procesa. Al ser Rust, el procesamiento suele ser < 1ms, por lo que la respuesta parece local.

---
> [!TIP]
> **Conclusión para Renovación RRHH:** La ruta de **Axum + HTMX** te permitirá tener un sistema que vuela incluso en dispositivos móviles con conexiones lentas, ya que el servidor Rust hace todo el trabajo pesado y el cliente solo renderiza HTML puro.
