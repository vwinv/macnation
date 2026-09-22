import 'models.dart';

class AccountSnapshot {
  const AccountSnapshot({
    required this.user,
    this.appointments = const [],
    this.plan,
    this.orders = const [],
  });

  final UserProfile user;
  final List<Appointment> appointments;
  final MembershipPlan? plan;
  final List<Product> orders;
}
