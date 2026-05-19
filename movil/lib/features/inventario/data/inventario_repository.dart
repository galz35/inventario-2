import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../domain/solicitud.dart';

class InventarioRepository {
  final Dio _dio = ApiClient.dio;

  Future<List<Solicitud>> getPendientes({String? pais}) async {
    try {
      final params = <String, dynamic>{};
      if (pais != null) params['pais'] = pais;
      final response = await _dio.get('api/v1/bodega/pendientes', queryParameters: params);
      final List<dynamic> data = response.data['data'] ?? [];
      return data.map((json) => Solicitud.fromJson(json)).toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<List<Map<String, dynamic>>> getDetalle(int idSolicitud, int idAlmacen) async {
    try {
      final response = await _dio.get(
        'api/v1/solicitudes/$idSolicitud/detalle',
        queryParameters: {'idAlmacen': idAlmacen},
      );
      final raw = response.data['data'];
      if (raw is List) return raw.cast<Map<String, dynamic>>();
      if (raw is Map && raw['lineas'] is List) return List<Map<String, dynamic>>.from(raw['lineas']);
      return [];
    } catch (e) {
      rethrow;
    }
  }

  Future<void> despachar(int idSolicitud, int idAlmacen, List<Map<String, dynamic>> lineas) async {
    try {
      await _dio.post('api/v1/bodega/despachar', data: {
        'idSolicitud': idSolicitud,
        'idAlmacen': idAlmacen,
        'lineas': lineas,
      });
    } catch (e) {
      rethrow;
    }
  }
}
