import '../../home/presentation/home_shell.dart';
import '../data/inventario_repository.dart';
import '../domain/solicitud.dart';
import 'pantalla_detalle_despacho.dart';

class InventarioHomeScreen extends StatefulWidget {
  const InventarioHomeScreen({super.key});

  @override
  State<InventarioHomeScreen> createState() => _InventarioHomeScreenState();
}

class _InventarioHomeScreenState extends State<InventarioHomeScreen> {
  final _repository = InventarioRepository();
  List<Solicitud>? _solicitudes;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await _repository.getPendientes();
      setState(() {
        _solicitudes = data;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'No se pudieron cargar los pendientes';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: const MomentusAppBar(title: 'Despachos Pendientes'),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.warning_amber_rounded, size: 64, color: Colors.orange),
            const SizedBox(height: 16),
            Text(_error!, style: const TextStyle(fontSize: 16, color: Color(0xFF64748B))),
            TextButton(onPressed: _loadData, child: const Text('Reintentar')),
          ],
        ),
      );
    }

    if (_solicitudes == null || _solicitudes!.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inventory_2_outlined, size: 80, color: Color(0xFFCBD5E1)),
            SizedBox(height: 16),
            Text('Todo al día. No hay pendientes.', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 16)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _solicitudes!.length,
      itemBuilder: (context, index) => _buildSolicitudCard(_solicitudes![index]),
    );
  }

  Widget _buildSolicitudCard(Solicitud sol) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      child: InkWell(
        onTap: () async {
          final res = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => PantallaDetalleDespacho(solicitud: sol),
            ),
          );
          if (res == true) _loadData();
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      'SOL #${sol.id}',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF475569)),
                    ),
                  ),
                  Text(
                    sol.fecha,
                    style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                sol.empleado,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1E293B)),
              ),
              Text(
                '${sol.departamento} • ${sol.carnet}',
                style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Divider(height: 1),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.shopping_bag_outlined, size: 18, color: Colors.orange),
                      const SizedBox(width: 8),
                      Text(
                        '${sol.totalArticulos} artículos',
                        style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF475569)),
                      ),
                    ],
                  ),
                  const Text(
                    'Ver detalle →',
                    style: TextStyle(color: Colors.orange, fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
