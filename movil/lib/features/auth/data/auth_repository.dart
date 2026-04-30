import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../../core/network/api_client.dart';
import '../domain/session_user.dart';

class AuthRepository {
  AuthRepository({Dio? dio, FlutterSecureStorage? storage})
      : _dio = dio ?? ApiClient.dio,
        _storage = storage ?? const FlutterSecureStorage();

  final Dio _dio;
  final FlutterSecureStorage _storage;

  static const _keyAccess = 'access_token';
  static const _keyUserId = 'user_id';
  static const _keyUserName = 'user_name';
  static const _keyUserCarnet = 'user_carnet';
  static const _keyUserMail = 'user_mail';
  static const _keyUserRol = 'user_rol';
  static const _keyUserPais = 'user_pais';

  Future<SessionUser> login({required String carnet, required String password}) async {
    final response = await _dio.post('api/v1/auth/login', data: {
      'username': carnet,
      'password': password,
    });

    final data = response.data as Map<String, dynamic>;
    final usuario = (data['data'] ?? data['user'] ?? data) as Map<String, dynamic>;
    final roles = usuario['roles'] is List ? (usuario['roles'] as List) : const [];

    final user = SessionUser(
      id: (usuario['id_usuario'] ?? usuario['id'] ?? 0) as int,
      nombre: (usuario['nombre_completo'] ?? usuario['nombre'] ?? 'Usuario') as String,
      carnet: (usuario['carnet'] ?? carnet) as String,
      correo: (usuario['correo'] ?? '') as String,
      rol: (usuario['rol'] ?? (roles.isNotEmpty ? roles.first : '')) as String,
      pais: (usuario['pais'] ?? '') as String,
    );

    await _storage.delete(key: _keyAccess);
    await _storage.write(key: _keyUserId, value: user.id.toString());
    await _storage.write(key: _keyUserName, value: user.nombre);
    await _storage.write(key: _keyUserCarnet, value: user.carnet);
    await _storage.write(key: _keyUserMail, value: user.correo);
    await _storage.write(key: _keyUserRol, value: user.rol);
    await _storage.write(key: _keyUserPais, value: user.pais);

    _dio.options.headers.remove('Authorization');
    _dio.options.headers['Cookie'] = 'user_carnet=${user.carnet}; user_pais=${user.pais}';
    return user;
  }

  Future<SessionUser?> restoreSession() async {
    final carnet = await _storage.read(key: _keyUserCarnet);
    final userId = await _storage.read(key: _keyUserId);
    if (carnet == null || userId == null) return null;

    final user = SessionUser(
      id: int.tryParse(userId) ?? 0,
      nombre: (await _storage.read(key: _keyUserName)) ?? 'Usuario',
      carnet: carnet,
      correo: (await _storage.read(key: _keyUserMail)) ?? '',
      rol: (await _storage.read(key: _keyUserRol)) ?? '',
      pais: (await _storage.read(key: _keyUserPais)) ?? '',
    );

    _dio.options.headers.remove('Authorization');
    _dio.options.headers['Cookie'] = 'user_carnet=${user.carnet}; user_pais=${user.pais}';
    return user;
  }

  Future<void> logout() async {
    await _storage.deleteAll();
    _dio.options.headers.remove('Authorization');
  }
}
