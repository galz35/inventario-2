/// Configuración central de la aplicación.
///
/// Todos los valores son configurables en compile-time mediante `--dart-define`:
///
/// Desarrollo local:
///   flutter run
///
/// Producción:
///   flutter build apk --dart-define=API_BASE_URL=https://www.rhclaroni.com/api-portal-inventario/
class AppConfig {
  static const String appName = 'Inventario Móvil';

  /// Dominio de producción.
  static const String productionDomain = 'www.rhclaroni.com';

  /// Base URL del API REST (Backend NestJS / Dio).
  /// flutter run --dart-define=API_BASE_URL=https://www.rhclaroni.com/api-portal-inventario/
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3023/',
  );

  /// Indica si la app corre en modo producción (HTTPS).
  /// Se detecta automáticamente por la URL base del API.
  static bool get isProduction => apiBaseUrl.startsWith('https://');

  /// Ventana de debounce para auto-sync (segundos).
  /// flutter run --dart-define=SYNC_WINDOW_SECONDS=10
  static const int _syncWindowSeconds = int.fromEnvironment(
    'SYNC_WINDOW_SECONDS',
    defaultValue: 10,
  );

  /// Intervalo sugerido para sincronizar en segundo plano al abrir la app.
  static Duration get syncWindow => const Duration(seconds: _syncWindowSeconds);
}
