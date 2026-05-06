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

  Future<Map<String, dynamic>> getDetalle(int idSolicitud, int idAlmacen) async {
    try {
      final response = await _dio.get('api/v1/solicitudes/$idSolicitud/detalle', queryParameters: {'idAlmacen': idAlmacen});
      return response.data['data'] ?? {};
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
