# Plan movil Flutter

Fecha: 2026-05-18

## Estado

No se pudo validar porque `flutter` no esta instalado en el VPS.

Comando probado:

```bash
flutter --version
```

Resultado:

```text
flutter: command not found
```

## Problemas encontrados

### 1. Base URL incorrecta

Archivo: `movil/lib/core/config/app_config.dart`

Actual:

```dart
defaultValue: 'http://10.0.2.2:3003/'
```

Debe ser:

```dart
defaultValue: 'http://10.0.2.2:3023/'
```

Produccion:

```bash
--dart-define=API_BASE_URL=https://rhclaroni.com/api-portal-inventario/
```

### 2. Archivo contaminado de Planer

Archivo: `movil/lib/core/config/api_environment.dart`

Problemas:

- Dice "backend Rust de Portal Planer".
- Apunta a `api-portal-planer-rust`.
- Contiene token tecnico.

Accion:

- Eliminar si no se usa.
- Si se usa, renombrar y limpiar secretos.

### 3. Refresh token inexistente

Archivo: `movil/lib/core/network/api_client.dart`

Problema:

- Interceptor llama `auth/refresh`.
- Backend Inventario no tiene `auth/refresh`.

Accion:

- Quitar flujo refresh.
- Ante 401, emitir logout.
- O implementar refresh real en backend.

### 4. Pais no enviado en pendientes

Archivo: `movil/lib/features/inventario/presentation/inventario_home_screen.dart`

Actual:

```dart
final data = await _repository.getPendientes();
```

Debe usar usuario autenticado:

```dart
final data = await _repository.getPendientes(pais: auth.user?.pais);
```

### 5. `idAlmacen=1` fijo

Archivo: `pantalla_detalle_despacho.dart`

Actual:

```dart
_repository.getDetalle(widget.solicitud.id, 1)
_repository.despachar(widget.solicitud.id, 1, lineas)
```

Debe:

- cargar almacenes del pais;
- permitir seleccionar almacen;
- o recibir `idAlmacen` desde pantalla anterior.

### 6. Parseo de detalle incorrecto

Backend devuelve:

```json
{ "status": "success", "data": [ ...lineas ] }
```

Movil espera:

```dart
final detalle = await _repository.getDetalle(...);
final lineas = detalle['lineas'] as List<dynamic>? ?? [];
```

Debe cambiar repositorio:

```dart
Future<List<Map<String, dynamic>>> getDetalle(...)
```

Y soportar:

```dart
final raw = response.data['data'];
if (raw is List) return raw.cast<Map<String, dynamic>>();
if (raw is Map && raw['lineas'] is List) return ...
```

### 7. Evidencia no se guarda

La app toma foto, pero no existe endpoint.

Opciones:

- Fase A: ocultar evidencia.
- Fase B: implementar backend:

```text
POST /api/v1/bodega/despachos/:id/evidencia
```

con multipart y tabla `DespachoEvidencias`.

## Flujo movil final esperado

1. Login.
2. Restaurar sesion desde storage.
3. Cargar almacenes del pais.
4. Seleccionar almacen.
5. Listar pendientes por pais/almacen.
6. Abrir solicitud.
7. Ver lineas reales.
8. Marcar cantidades.
9. Escanear codigo opcional.
10. Confirmar despacho.
11. Mostrar resultado.
12. Refrescar pendientes.

## Validaciones en maquina con Flutter

```bash
cd /opt/apps/inventario-portal/movil
flutter pub get
flutter analyze
flutter test
flutter build apk --release --dart-define=API_BASE_URL=https://rhclaroni.com/api-portal-inventario/
```

## Pruebas manuales

1. Login con carnet valido.
2. Login con credencial invalida.
3. Sin rol bodega debe ver acceso denegado.
4. Con rol bodega lista pendientes.
5. Detalle muestra lineas.
6. Despacho parcial funciona.
7. Stock/kardex cambian.
8. App maneja 401 cerrando sesion.

## Orden de implementacion

1. Corregir base URL.
2. Quitar archivo/token de Planer.
3. Quitar refresh inexistente.
4. Pasar pais.
5. Cargar/seleccionar almacen.
6. Corregir parseo detalle.
7. Despacho parcial real.
8. Definir evidencia.
9. Instalar Flutter y validar.
