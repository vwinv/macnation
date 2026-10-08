import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../data/account_snapshot.dart';
import '../data/api_exception.dart';
import '../data/models.dart';
import '../data/repository.dart';
import '../push/push_controller.dart';

class AppState extends ChangeNotifier {
  AppState({required this.repository}) {
    _boot();
  }

  static const _cartKey = 'mac-nation-cart';
  static const _themeKey = 'mac-nation-theme';

  final MacNationRepository repository;

  UserProfile? user;
  final List<Appointment> appointments = [];
  MembershipPlan? activePlan;
  final List<Product> orders = [];
  final List<CartLine> cart = [];
  BookingDraft booking = BookingDraft();
  int bookingRequestId = 0;
  int bookingStartStep = 0;
  bool booting = true;
  ThemeMode themeMode = ThemeMode.system;

  bool get isLoggedIn => user != null;

  int get cartCount => cart.fold<int>(0, (sum, line) => sum + line.qty);

  int get cartTotal => cart.fold<int>(0, (sum, line) => sum + line.total);

  Appointment? get lastAppointment {
    if (appointments.isEmpty) return null;
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final upcoming = appointments.where((item) {
      return !item.date.isBefore(today);
    }).toList()
      ..sort((a, b) => a.date.compareTo(b.date));
    return upcoming.isEmpty ? appointments.first : upcoming.first;
  }

  Future<void> _boot() async {
    await _loadTheme();
    try {
      final session = await repository.restoreSession();
      if (session != null) _apply(session);
    } finally {
      await _loadCart();
      booting = false;
      notifyListeners();
      await PushController.instance.start(repository);
    }
  }

  Future<void> _loadTheme() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      themeMode = switch (prefs.getString(_themeKey)) {
        'light' => ThemeMode.light,
        'dark' => ThemeMode.dark,
        _ => ThemeMode.system,
      };
    } catch (_) {}
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    themeMode = mode;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(
        _themeKey,
        switch (mode) {
          ThemeMode.light => 'light',
          ThemeMode.dark => 'dark',
          ThemeMode.system => 'system',
        },
      );
    } catch (_) {}
  }

  Future<void> _loadCart() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_cartKey);
      if (raw == null || raw.isEmpty) return;
      final parsed = jsonDecode(raw);
      if (parsed is! List) return;
      cart
        ..clear()
        ..addAll([
          for (final row in parsed)
            if (row is Map)
              CartLine.fromJson(Map<String, dynamic>.from(row)),
        ]);
    } catch (_) {}
  }

  Future<void> _saveCart() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(
        _cartKey,
        jsonEncode([for (final line in cart) line.toJson()]),
      );
    } catch (_) {}
  }

  void addToCart(Product product, [int qty = 1]) {
    final extra = clampCartQty(qty);
    final index = cart.indexWhere((line) => line.product.id == product.id);
    if (index >= 0) {
      cart[index] = cart[index].copyWith(
        qty: clampCartQty(cart[index].qty + extra),
      );
    } else {
      cart.add(CartLine(product: product, qty: extra));
    }
    notifyListeners();
    _saveCart();
  }

  void setCartQty(String productId, int qty) {
    final index = cart.indexWhere((line) => line.product.id == productId);
    if (index < 0) return;
    cart[index] = cart[index].copyWith(qty: clampCartQty(qty));
    notifyListeners();
    _saveCart();
  }

  void removeFromCart(String productId) {
    cart.removeWhere((line) => line.product.id == productId);
    notifyListeners();
    _saveCart();
  }

  void clearCart() {
    if (cart.isEmpty) return;
    cart.clear();
    notifyListeners();
    _saveCart();
  }

  void _apply(AccountSnapshot session) {
    user = session.user;
    appointments
      ..clear()
      ..addAll(session.appointments);
    activePlan = session.plan;
    orders
      ..clear()
      ..addAll(session.orders);
  }

  Future<void> refreshAccount() async {
    final session = await repository.restoreSession();
    if (session == null) return;
    _apply(session);
    notifyListeners();
  }

  void resetBooking() {
    booking = BookingDraft();
    bookingStartStep = 0;
    notifyListeners();
  }

  void openReservation() {
    bookingStartStep = 0;
    bookingRequestId++;
    notifyListeners();
  }

  void startBooking(ServiceItem service) {
    booking.service = service;
    booking.date = null;
    booking.time = null;
    bookingStartStep = 0;
    bookingRequestId++;
    notifyListeners();
  }

  void notify() => notifyListeners();

  Future<void> login({
    required String phone,
    required String password,
    required String name,
    String? email,
  }) async {
    final session = await repository.loginWithPhone(
      phone: phone,
      password: password,
      name: name,
      email: email,
    );
    _apply(session);
    notifyListeners();
    await PushController.instance.sync();
  }

  Future<void> logout() async {
    await repository.logout();
    user = null;
    appointments.clear();
    orders.clear();
    activePlan = null;
    notifyListeners();
  }

  Future<void> updateProfile({
    required String name,
    required String phone,
    String? email,
    String? password,
  }) async {
    if (user == null) return;
    user = await repository.updateProfile(
      name: name,
      phone: phone,
      email: email,
      password: password,
    );
    if (activePlan != null && user != null) {
      user = UserProfile(
        name: user!.name,
        phone: user!.phone,
        email: user!.email,
        points: user!.points,
        creditFcfa: user!.creditFcfa,
        planName: activePlan!.name,
        redeemPoints: user!.redeemPoints,
        redeemFcfa: user!.redeemFcfa,
      );
    }
    notifyListeners();
  }

  Future<BookingOutcome> confirmBooking() async {
    final outcome = await repository.createAppointment(booking);
    if (outcome.appointment != null) {
      appointments.insert(0, outcome.appointment!);
      resetBooking();
      try {
        await refreshAccount();
      } catch (_) {}
    }
    return outcome;
  }

  Future<CheckoutOutcome> payProduct(Product product, PaymentMethod method) async {
    if (user == null) {
      throw const ApiException('Connecte-toi pour commander.');
    }
    final outcome = await repository.createProductOrder(
      product: product,
      method: method,
    );
    if (method == PaymentMethod.salon) {
      orders.insert(0, product);
      notifyListeners();
      try {
        await refreshAccount();
      } catch (_) {}
    }
    return outcome;
  }

  Future<CheckoutOutcome> checkoutCart({
    required String name,
    required String phone,
    String? email,
  }) async {
    if (cart.isEmpty) {
      throw const ApiException('Ton panier est vide.');
    }
    return repository.checkoutBoutique(
      List<CartLine>.from(cart),
      name: name,
      phone: phone,
      email: email,
    );
  }

  Future<CheckoutOutcome> checkoutPlan({
    required MembershipPlan plan,
    required String name,
    required String phone,
    String? email,
  }) {
    return repository.subscribe(
      plan: plan,
      name: name,
      phone: phone,
      email: email,
    );
  }

  Future<CheckoutOutcome> payPlan(MembershipPlan plan, PaymentMethod method) async {
    if (user == null) {
      throw const ApiException('Connecte-toi pour t’abonner.');
    }
    final outcome = await repository.subscribe(plan: plan, method: method);
    if (method == PaymentMethod.salon) {
      activePlan = plan;
      if (user != null) {
        user = UserProfile(
          name: user!.name,
          phone: user!.phone,
          email: user!.email,
          points: user!.points,
          creditFcfa: user!.creditFcfa,
          planName: plan.name,
          redeemPoints: user!.redeemPoints,
          redeemFcfa: user!.redeemFcfa,
        );
      }
      notifyListeners();
      try {
        await refreshAccount();
      } catch (_) {}
    }
    return outcome;
  }

  Future<void> redeemPoints() async {
    user = await repository.redeemPoints();
    if (activePlan != null && user != null) {
      user = UserProfile(
        name: user!.name,
        phone: user!.phone,
        email: user!.email,
        points: user!.points,
        creditFcfa: user!.creditFcfa,
        planName: activePlan!.name,
        redeemPoints: user!.redeemPoints,
        redeemFcfa: user!.redeemFcfa,
      );
    }
    notifyListeners();
  }

  Future<void> acceptQuoteAtSalon(String bookingId) async {
    await repository.acceptQuoteAtSalon(bookingId);
    await refreshAccount();
  }

  Future<void> cancelBooking(String bookingId) async {
    await repository.cancelBooking(bookingId);
    await refreshAccount();
  }

  Future<void> cancelMembership() async {
    await repository.cancelMembership();
    activePlan = null;
    if (user != null) {
      user = UserProfile(
        name: user!.name,
        phone: user!.phone,
        email: user!.email,
        points: user!.points,
        creditFcfa: user!.creditFcfa,
        redeemPoints: user!.redeemPoints,
        redeemFcfa: user!.redeemFcfa,
      );
    }
    notifyListeners();
    try {
      await refreshAccount();
    } catch (_) {}
  }

  Future<void> loginWithOauth({
    required String provider,
    required String credential,
    String? nonce,
    String? name,
  }) async {
    final session = await repository.loginWithOauth(
      provider: provider,
      credential: credential,
      nonce: nonce,
      name: name,
    );
    _apply(session);
    notifyListeners();
    await PushController.instance.sync();
  }
}

class AppScope extends InheritedNotifier<AppState> {
  const AppScope({
    super.key,
    required AppState state,
    required super.child,
  }) : super(notifier: state);

  static AppState of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<AppScope>();
    assert(scope != null, 'AppScope introuvable');
    return scope!.notifier!;
  }
}
