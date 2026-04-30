class SessionUser {
  final int id;
  final String nombre;
  final String carnet;
  final String correo;
  final String rol;
  final String pais;

  SessionUser({
    required this.id,
    required this.nombre,
    required this.carnet,
    required this.correo,
    required this.rol,
    required this.pais,
  });
}
