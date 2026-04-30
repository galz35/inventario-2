import 'dart:async';

class AuthEventBus {
  AuthEventBus._();

  static final AuthEventBus instance = AuthEventBus._();

  final StreamController<void> _logoutController =
      StreamController<void>.broadcast();

  Stream<void> get onLogout => _logoutController.stream;

  void emitLogout() {
    _logoutController.add(null);
  }
}
