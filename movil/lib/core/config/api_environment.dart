class ApiEnvironment {
  /// Base URL para el backend Rust de Portal Planer.
  /// Se puede sobrescribir con --dart-define=API_BASE_URL=...
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://rhclaroni.com/api-portal-planer-rust',
  );

  /// Token técnico para la API de integración (Emp2024).
  /// Solo debe usarse en el IntegrationApiClient.
  static const String integrationToken = String.fromEnvironment(
    'INTEGRATION_API_TOKEN',
    defaultValue: '34549d2a54ed17eb5d3841d313e9e28ef713099de442bd48',
  );

  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 15);
}
