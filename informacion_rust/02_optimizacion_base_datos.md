# Optimización de Base de Datos: Rust + SQL Server

El cuello de botella de casi cualquier sistema de inventario es la base de datos. Con Rust y el driver `Tiberius`, podemos exprimir cada milisegundo de SQL Server.

## 1. Gestión de Conexiones (Pooling)
Abrir una conexión a SQL Server es costoso. **NUNCA** abras una conexión nueva por cada petición.
- **Library:** `bb8` o `deadpool`.
- **Configuración:** Mantener un pool de conexiones calientes (mínimo 5-10) listas para ser usadas.

```rust
// Ejemplo conceptual con bb8-tiberius
let manager = TiberiusConnectionManager::new(config);
let pool = bb8::Pool::builder().max_size(20).build(manager).await?;
```

## 2. El truco del "No Delay" (Baja Latencia)
Por defecto, Windows y TCP usan el algoritmo de Nagle para agrupar paquetes pequeños. Esto añade latencia artificial.
- **Solución:** Desactiva Nagle en el socket TCP antes de pasárselo a Tiberius.
```rust
tcp_stream.set_nodelay(true)?; // Reduce latencia instantáneamente
```

## 3. Consultas Preparadas (Performance & Seguridad)
Usa siempre parámetros (`@p1`, `@p2`). Esto permite que SQL Server:
1. Reutilice el plan de ejecución (Query Plan Cache).
2. Evite re-parsear el SQL.
3. Te proteja 100% contra SQL Injection.

## 4. Paginación de Alta Velocidad
Para inventarios grandes, no uses `OFFSET / FETCH` si tienes millones de filas.
- **Lento:** `OFFSET 10000 ROWS FETCH NEXT 50 ROWS ONLY`. (SQL Server tiene que leer 10050 filas).
- **Rápido (Keyset Pagination):** `SELECT TOP 50 ... WHERE ID > @LastID`. (Salta directamente al índice).

## 5. Bulk Inserts
Si vas a importar un inventario desde Excel/CSV:
- No hagas 1000 `INSERT`.
- Usa el comando `BULK INSERT` o la funcionalidad de `Tiberius` para inserciones en bloque. Esto reduce el log de transacciones y acelera el proceso x10.

---
> [!IMPORTANT]
> **Puerto 1433:** Asegúrate de que el firewall permita tráfico rápido en este puerto y que SQL Server esté configurado para usar memoria dinámica para caché de consultas.
