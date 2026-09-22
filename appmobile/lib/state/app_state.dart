import 'package:flutter/material.dart';

import '../data/account_snapshot.dart';
import '../data/api_exception.dart';
import '../data/models.dart';
import '../data/repository.dart';

class AppState extends ChangeNotifier {
  AppState({required this.repository}) {
    _boot();
  }

  final MacNationRepository repository;

  UserProfile? user;
  final List<Appointment> appointments = [];
  MembershipPlan? activePlan;
  final List<Product> orders = [];
  BookingDraft booking = BookingDraft();
  int bookingRequestId = 0;
  int bookingStartStep = 0;
  bool booting = true;

  bool get isLoggedIn => user != null;

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
    try {
      final session = await repository.restoreSession();
      if (session != null) _apply(session);
    } finally {
      booting = false;
      notifyListeners();
    }
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
  }) async {
    final session = await repository.loginWithPhone(
      phone: phone,
      password: password,
      name: name,
    );
    _apply(session);
    notifyListeners();
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
