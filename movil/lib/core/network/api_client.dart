import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/app_config.dart';

class ApiClient {
  ApiClient._();

  static const _storage = FlutterSecureStorage();
  static const _keyUserCarnet = 'user_carnet';
  static const _keyUserPais = 'user_pais';

  static final Dio dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      sendTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ),
  )..interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final carnet = await _storage.read(key: _keyUserCarnet);
          final pais = await _storage.read(key: _keyUserPais);
          final cookieParts = <String>[];
          if (carnet != null && carnet.isNotEmpty) {
            cookieParts.add('user_carnet=$carnet');
          }
          if (pais != null && pais.isNotEmpty) {
            cookieParts.add('user_pais=$pais');
          }
          if (cookieParts.isNotEmpty) {
            options.headers['Cookie'] = cookieParts.join('; ');
          }
          handler.next(options);
        },

        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            await _storage.deleteAll();
          }
          handler.next(error);
        },
      ),
    );
}
