import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:simple_barcode_scanner/simple_barcode_scanner.dart';
import '../data/inventario_repository.dart';
import '../domain/solicitud.dart';

class PantallaDetalleDespacho extends StatefulWidget {
  final Solicitud solicitud;
  const PantallaDetalleDespacho({super.key, required this.solicitud});

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
      final detalle = await _repository.getDetalle(widget.solicitud.id, 1);
      final lineas = detalle['lineas'] as List<dynamic>? ?? [];
      setState(() {
        _articulos = lineas.map((l) => {
          'idDetalle': l['IdDetalle'] ?? 0,
          'nombre': '${l['Codigo'] ?? ''} ${l['ArticuloNombre'] ?? ''}',
          'talla': l['Talla'] ?? '',
          'sexo': l['Sexo'] ?? '',
          'cantidad': l['Pendiente'] ?? 1,
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

  Future<void> _escanear() async {
    String? res = await Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const SimpleBarcodeScannerPage()),
    );
    if (res != null && res != '-1') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Artículo escaneado: $res')),
      );
    }
  }

  Future<void> _confirmarDespacho() async {
    if (_articulos.any((a) => !a['entregado'])) {
      final confirm = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Ítems pendientes'),
          content: const Text('Aún tienes artículos sin marcar. ¿Deseas despachar de todas formas?'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('No')),
            ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Sí, Despachar')),
          ],
        ),
      );
      if (confirm != true) return;
    }

    setState(() => _loading = true);
    try {
      final lineas = _articulos
        .where((a) => a['entregado'] == true)
        .map((a) => {'IdDetalle': a['idDetalle'], 'CantidadDespachar': a['cantidad']})
        .toList();
      if (lineas.isEmpty) {
        setState(() => _loading = false);
        return;
      }
      await _repository.despachar(widget.solicitud.id, 1, lineas);
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
        actions: [
          IconButton(icon: const Icon(Icons.qr_code_scanner), onPressed: _escanear),
        ],
      ),
      body: _cargandoDetalle
        ? const Center(child: CircularProgressIndicator())
        : ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Info del solicitante
          _buildInfoCard(),
          const SizedBox(height: 24),

          const Text('LISTA DE ARTÍCULOS', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF64748B), fontSize: 12)),
          const SizedBox(height: 12),

          // Lista de ítems con Checkbox
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
              const Text('Fecha Solicitud:', style: TextStyle(color: Color(0xFF94A3B8))),
              Text(widget.solicitud.fecha, style: const TextStyle(fontWeight: FontWeight.w600)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildItemTile(Map<String, dynamic> item) {
    bool checked = item['entregado'];
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: checked ? Colors.orange.withValues(alpha: 0.3) : const Color(0xFFE2E8F0), width: checked ? 2 : 1),
      ),
      child: CheckboxListTile(
        value: checked,
        onChanged: (v) => setState(() => item['entregado'] = v),
        title: Text(item['nombre'], style: TextStyle(fontWeight: FontWeight.bold, color: checked ? Colors.black : const Color(0xFF334155))),
        subtitle: Text('Cantidad: ${item['cantidad']}  ${item['talla'] != null && item['talla'] != '' ? 'Talla: ${item['talla']}  Sexo: ${item['sexo']}' : ''}'),
        activeColor: Colors.orange,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        secondary: Icon(Icons.inventory_2_outlined, color: checked ? Colors.orange : const Color(0xFF94A3B8)),
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
