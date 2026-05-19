class Solicitud {
  final int id;
  final String fecha;
  final String empleado;
  final String carnet;
  final String departamento;
  final int totalArticulos;
  final String estado;

  Solicitud({
    required this.id,
    required this.fecha,
    required this.empleado,
    required this.carnet,
    required this.departamento,
    required this.totalArticulos,
    required this.estado,
  });

  factory Solicitud.fromJson(Map<String, dynamic> json) {
    return Solicitud(
      id: json['IdSolicitud'] ?? json['idSolicitud'] ?? 0,
      fecha: json['FechaCreacion'] ?? json['fechaCreacion'] ?? json['fechaSolicitud'] ?? '',
      empleado: json['EmpleadoNombre'] ?? json['nombreEmpleado'] ?? 'Desconocido',
      carnet: json['EmpleadoCarnet'] ?? json['carnet'] ?? '',
      departamento: json['Gerencia'] ?? json['departamento'] ?? '',
      totalArticulos: json['totalArticulos'] ?? 0,
      estado: json['Estado'] ?? json['estado'] ?? 'PENDIENTE',
    );
  }
}
