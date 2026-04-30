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
    final response = await _dio.post('auth/login', data: {
      'carnet': carnet,
      'password': password,
    });

    final data = response.data as Map<String, dynamic>;
    // Inventario usa 'token'
    final accessToken = (data['token'] ?? data['access_token'] ?? '') as String;
    final usuario = (data['user'] ?? {}) as Map<String, dynamic>;

    final user = SessionUser(
      id: (usuario['id_usuario'] ?? usuario['id'] ?? 0) as int,
      nombre: (usuario['nombre_completo'] ?? usuario['nombre'] ?? 'Usuario') as String,
      carnet: (usuario['carnet'] ?? carnet) as String,
      correo: (usuario['correo'] ?? '') as String,
      // Inventario puede devolver 'roles' como array
      rol: (usuario['rol'] ?? (usuario['roles'] is List ? (usuario['roles'] as List).first : '')) as String,
      pais: (usuario['pais'] ?? '') as String,
    );

    await _storage.write(key: _keyAccess, value: accessToken);
    await _storage.write(key: _keyUserId, value: user.id.toString());
    await _storage.write(key: _keyUserName, value: user.nombre);
    await _storage.write(key: _keyUserCarnet, value: user.carnet);
    await _storage.write(key: _keyUserMail, value: user.correo);
    await _storage.write(key: _keyUserRol, value: user.rol);
    await _storage.write(key: _keyUserPais, value: user.pais);

    _dio.options.headers['Authorization'] = 'Bearer $accessToken';
    return user;
  }

  Future<SessionUser?> restoreSession() async {
    final accessToken = await _storage.read(key: _keyAccess);
    final userId = await _storage.read(key: _keyUserId);
    if (accessToken == null || userId == null) return null;

    final user = SessionUser(
      id: int.tryParse(userId) ?? 0,
      nombre: (await _storage.read(key: _keyUserName)) ?? 'Usuario',
      carnet: (await _storage.read(key: _keyUserCarnet)) ?? '',
      correo: (await _storage.read(key: _keyUserMail)) ?? '',
      rol: (await _storage.read(key: _keyUserRol)) ?? '',
      pais: (await _storage.read(key: _keyUserPais)) ?? '',
    );

    _dio.options.headers['Authorization'] = 'Bearer $accessToken';
    return user;
  }

  Future<void> logout() async {
    await _storage.deleteAll();
    _dio.options.headers.remove('Authorization');
  }
}
