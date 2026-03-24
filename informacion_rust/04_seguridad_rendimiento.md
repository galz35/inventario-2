# Seguridad y Rendimiento: El Equilibrio Perfecto

En un sistema de RRHH, la seguridad no es negociable. Sin embargo, una seguridad mal implementada puede ralentizar el sistema.

## 1. Hashing de Contraseñas
- **Recomendación:** `Argon2id`.
- **Rendimiento:** Argon2 es deliberadamente lento para evitar ataques de fuerza bruta.
- **Truco Rust:** Realiza el hashing en un hilo separado con `tokio::task::spawn_blocking` para no congelar el servidor mientras se calcula el hash.

## 2. JWT (JSON Web Tokens)
- **Rendimiento:** Los JWT permiten autenticación "sin estado" (stateless). El servidor no tiene que consultar la base de datos para saber quién eres en cada click.
- **Seguridad:** Usa algoritmos modernos como `Ed25519` (basado en curvas elípticas) que es más rápido y seguro que RSA.

## 3. Validación de Datos (Zero-Cost Validation)
Usa crates como `validator`. En Rust, puedes hacer que la validación ocurra en el momento que los datos entran al sistema.
- **Beneficio:** Si los datos están mal, el servidor los rechaza en microsegundos sin siquiera tocar la lógica de negocio o la base de datos.

## 4. HTTPS / TLS
- **Rendimiento:** Usa `rustls` en lugar de `OpenSSL`. Es más moderno, está escrito 100% en Rust y es generalmente más rápido en el establecimiento de la conexión (handshake).
- **HTTP/2 o HTTP/3:** Axum soporta HTTP/2 por defecto. Esto permite que el navegador cargue todos tus estilos y scripts en una sola conexión multiplexada.

## 5. Prevención de Denial of Service (DoS)
Incluso la app más rápida puede caer si alguien la ataca.
- **Tower-HTTP Limit:** Usa middleware para limitar el tamaño de las peticiones (ej. nadie debería subir un JSON de 100MB al inventario).
- **Rate Limiting:** Limita cuántas peticiones puede hacer un usuario por segundo.

---
> [!CAUTION]
> **Privacidad:** Asegúrate de que los logs de `tracing` no guarden información sensible como contraseñas o datos personales de empleados en texto plano.
