import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../data/inventario_repository.dart';
import '../domain/solicitud.dart';

class PantallaDetalleDespacho extends StatefulWidget {
  final Solicitud solicitud;
  final int idAlmacen;
  const PantallaDetalleDespacho({super.key, required this.solicitud, this.idAlmacen = 1});

  @override
  State<PantallaDetalleDespacho> createState() => _PantallaDetalleDespachoState();
}

class _PantallaDetalleDespachoState extends State<PantallaDetalleDespacho> {
  final _repository = InventarioRepository();
  bool _loading = false;
  bool _cargandoDetalle = true;
  String? _rutaFoto;
  List<Map<String, dynamic>> _articulos = [];

  @override
  void initState() {
    super.initState();
    _cargarDetalle();
  }

  Future<void> _cargarDetalle() async {
    try {
      final lineas = await _repository.getDetalle(widget.solicitud.id, widget.idAlmacen);
      setState(() {
        _articulos = lineas.map((l) => {
          'idDetalle': l['IdDetalle'] ?? 0,
          'nombre': '${l['Nombre'] ?? l['Codigo'] ?? ''}',
          'talla': l['Talla'] ?? '',
          'sexo': l['Sexo'] ?? '',
          'pendiente': l['Pendiente'] ?? 0,
          'cantidad': l['Pendiente'] ?? 0,
          'stockVar': l['StockVar'] ?? 0,
          'entregado': false,
        }).toList();
        _cargandoDetalle = false;
      });
    } catch (e) {
      setState(() => _cargandoDetalle = false);
    }
  }

  Future<void> _tomarFoto() async {
    final picker = ImagePicker();
    final imagen = await picker.pickImage(source: ImageSource.camera, imageQuality: 70);
    if (imagen != null) {
      setState(() => _rutaFoto = imagen.path);
    }
  }

  Future<void> _confirmarDespacho() async {
    final lineas = _articulos
      .where((a) => (a['cantidad'] as int) > 0)
      .map((a) => {'IdDetalle': a['idDetalle'], 'Entregar': a['cantidad']})
      .toList();
    if (lineas.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Debe despachar al menos un artículo'), backgroundColor: Colors.orange),
      );
      return;
    }

    setState(() => _loading = true);
    try {
      await _repository.despachar(widget.solicitud.id, widget.idAlmacen, lineas);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('¡Despacho registrado con éxito!'), backgroundColor: Colors.green),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Despacho #${widget.solicitud.id}'),
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: _cargandoDetalle
        ? const Center(child: CircularProgressIndicator())
        : ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildInfoCard(),
          const SizedBox(height: 24),
          const Text('LISTA DE ARTÍCULOS', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF64748B), fontSize: 12)),
          const SizedBox(height: 12),
          ..._articulos.map((a) => _buildItemTile(a)),
          const SizedBox(height: 24),
          const Text('EVIDENCIA DE ENTREGA', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF64748B), fontSize: 12)),
          const SizedBox(height: 12),
          _buildFotoSelector(),
          const SizedBox(height: 32),
          SizedBox(
            height: 54,
            child: ElevatedButton.icon(
              onPressed: _loading ? null : _confirmarDespacho,
              icon: _loading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Icon(Icons.check_circle),
              label: Text(_loading ? 'Registrando...' : 'Confirmar Entrega'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildInfoCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                backgroundColor: Colors.orange.withValues(alpha: 0.1),
                child: const Icon(Icons.person, color: Colors.orange),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(widget.solicitud.empleado, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    Text(widget.solicitud.departamento, style: const TextStyle(color: Color(0xFF64748B), fontSize: 14)),
                  ],
                ),
              ),
            ],
          ),
          const Divider(height: 32),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Carnet:', style: TextStyle(color: Color(0xFF94A3B8))),
              Text(widget.solicitud.carnet, style: const TextStyle(fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Almacén ID:', style: TextStyle(color: Color(0xFF94A3B8))),
              Text('${widget.idAlmacen}', style: const TextStyle(fontWeight: FontWeight.w600)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildItemTile(Map<String, dynamic> item) {
    bool checked = item['entregado'];
    int pendiente = item['pendiente'] as int;
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: checked ? Colors.orange.withValues(alpha: 0.3) : const Color(0xFFE2E8F0), width: checked ? 2 : 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Checkbox(
                  value: checked,
                  onChanged: (v) {
                    setState(() {
                      item['entregado'] = v ?? false;
                      if (v == false) item['cantidad'] = pendiente;
                    });
                  },
                  activeColor: Colors.orange,
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item['nombre'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      if (item['talla'] != '') Text('Talla: ${item['talla']} Sexo: ${item['sexo']}', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                    ],
                  ),
                ),
              ],
            ),
            if (checked)
              Padding(
                padding: const EdgeInsets.only(left: 48, top: 8),
                child: Row(
                  children: [
                    const Text('Cantidad: ', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                    SizedBox(
                      width: 70,
                      child: TextField(
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          isDense: true,
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        ),
                        controller: TextEditingController(text: '${item['cantidad']}'),
                        onChanged: (v) => item['cantidad'] = int.tryParse(v) ?? pendiente,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text('máx $pendiente', style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildFotoSelector() {
    if (_rutaFoto != null) {
      return Stack(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Image.file(File(_rutaFoto!), height: 200, width: double.infinity, fit: BoxFit.cover),
          ),
          Positioned(
            top: 10,
            right: 10,
            child: IconButton(
              icon: const CircleAvatar(backgroundColor: Colors.red, child: Icon(Icons.close, color: Colors.white, size: 18)),
              onPressed: () => setState(() => _rutaFoto = null),
            ),
          ),
        ],
      );
    }

    return OutlinedButton.icon(
      onPressed: _tomarFoto,
      icon: const Icon(Icons.camera_alt),
      label: const Text('Tomar foto de los artículos'),
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(double.infinity, 80),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }
}
