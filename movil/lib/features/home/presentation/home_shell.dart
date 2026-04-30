import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:provider/provider.dart';

import '../../auth/presentation/auth_controller.dart';
import '../../../core/theme/app_theme.dart';
import '../../inventario/presentation/inventario_home_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  static final GlobalKey<ScaffoldState> scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    
    return Scaffold(
      key: HomeShell.scaffoldKey,
      backgroundColor: const Color(0xFFF8FAFC),
      drawer: _buildDrawer(context, auth),
      body: const InventarioHomeScreen(),
    );
  }

  Widget _buildDrawer(BuildContext context, AuthController auth) {
    final user = auth.user;
    
    return Drawer(
      backgroundColor: Colors.white,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.fromLTRB(20, 60, 20, 30),
            width: double.infinity,
            decoration: const BoxDecoration(gradient: MomentusTheme.heroGradient),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: MomentusTheme.red50,
                  child: Text(
                    user?.nombre.isNotEmpty == true ? user!.nombre[0] : 'U',
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: MomentusTheme.primary),
                  ),
                ),
                const SizedBox(height: 16),
                Text(user?.nombre ?? 'Bodeguero', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                Text('Portal Inventario', style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 13)),
              ],
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(8),
              children: [
                ListTile(
                  leading: const Icon(CupertinoIcons.square_arrow_left, color: Colors.red),
                  title: const Text('Cerrar Sesión', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                  onTap: () {
                    Navigator.pop(context);
                    auth.logout();
                  },
                )
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class MomentusAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final bool showBack;

  const MomentusAppBar({super.key, required this.title, this.showBack = false});

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      centerTitle: true,
      leading: showBack
          ? IconButton(icon: const Icon(CupertinoIcons.back), onPressed: () => Navigator.pop(context))
          : IconButton(icon: const Icon(CupertinoIcons.bars), onPressed: () => HomeShell.scaffoldKey.currentState?.openDrawer()),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black, fontSize: 18)),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
