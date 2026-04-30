import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../services/auth_event_bus.dart'; // Crearemos esto para notificar logout global

class AuthInterceptor extends Interceptor {
  AuthInterceptor({
    required this.dio,
    this.storage = const FlutterSecureStorage(),
  });

  final Dio dio;
  final FlutterSecureStorage storage;

  static const _keyAccess = 'momentus_access_token';
  static const _keyRefresh = 'momentus_refresh_token';

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    // No inyectar token en login o refresh
    if (options.path.contains('auth/login') || options.path.contains('auth/refresh')) {
      return handler.next(options);
    }

    final token = await storage.read(key: _keyAccess);
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    // Si no es 401, ignorar
    if (err.response?.statusCode != 401) {
      return handler.next(err);
    }

    final request = err.requestOptions;

    // Si el error ocurrió en un intento de refresh, forzar logout
    if (request.path.contains('auth/refresh')) {
      _forceLogout();
      return handler.next(err);
    }

    // Intentar refresh token
    final refreshToken = await storage.read(key: _keyRefresh);
    if (refreshToken == null || refreshToken.isEmpty) {
      _forceLogout();
      return handler.next(err);
    }

    try {
      // Usamos una instancia limpia de Dio para evitar loops de interceptores
      final refreshDio = Dio(BaseOptions(baseUrl: request.baseUrl));
      final response = await refreshDio.post('auth/refresh', data: {
        'refreshToken': refreshToken,
      });

      final data = response.data as Map<String, dynamic>;
      final payload = (data['data'] ?? data) as Map<String, dynamic>;
      
      final newAccess = (payload['access_token'] ?? payload['accessToken'] ?? payload['token'] ?? '') as String;
      final newRefresh = (payload['refresh_token'] ?? payload['refreshToken'] ?? refreshToken) as String;

      if (newAccess.isEmpty) {
        _forceLogout();
        return handler.next(err);
      }

      // Guardar nuevos tokens
      await storage.write(key: _keyAccess, value: newAccess);
      await storage.write(key: _keyRefresh, value: newRefresh);

      // Reintentar request original
      request.headers['Authorization'] = 'Bearer $newAccess';
      final retryResponse = await dio.fetch(request);
      return handler.resolve(retryResponse);
      
    } catch (e) {
      // Si el refresh falla (ej: refresh token expirado), logout
      _forceLogout();
      return handler.next(err);
    }
  }

  void _forceLogout() {
    // Limpiar almacenamiento
    storage.deleteAll();
    // Notificar al resto de la app (vía EventBus o Stream)
    AuthEventBus.instance.emitLogout();
  }
}
