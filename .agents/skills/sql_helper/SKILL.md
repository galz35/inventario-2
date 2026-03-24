---
name: sql_helper
description: Skill para ejecutar lógica SQL y pruebas de Backend creando scripts dinámicos en Node.js
---

# SQL Helper Skill (Metodología JS Nativo)

Este skill se enfoca en la validación profunda del sistema creando scripts de Node.js específicos para cada necesidad, evitando herramientas genéricas para garantizar que las pruebas reflejen el comportamiento real del entorno.

## Metodología Obligatoria

1. **Scripts Únicos**: Para cada verificación (ver tablas, probar un flujo, limpiar datos), se debe crear un archivo `.js` independiente (ej: `check_solicitudes.js`).
2. **Uso de Librerías Estándar**:
    - `mssql`: Para consultas directas a la base de datos.
    - `axios`: Para pruebas de caja negra contra la API de Rust.
3. **Verificación Directa**: Si un test de API falla o da resultados inesperados, se debe crear inmediatamente un script de base de datos para comparar los datos "en bruto" contra lo que el Backend está mapeando.

## Configuración de Conexión (Snippet para Scripts)

```javascript
const sql = require('mssql');
const config = {
    server: '190.56.16.85',
    port: 1433,
    user: 'sa',
    password: 'TuPasswordFuerte!2026',
    database: 'Inventario_RRHH',
    options: { encrypt: false, trustServerCertificate: true }
};
```

## Casos de Uso
- **Debug de Mapeo**: Crear un script que use `mssql` para listar las columnas de un Stored Procedure y compararlas con las estructuras `struct` de Rust.
- **Limpieza de Tests**: Scripts que borran registros de prueba antes de iniciar un flujo.
- **Simulación de Carga**: Scripts que insertan 100+ filas para probar paginación o rendimiento.
