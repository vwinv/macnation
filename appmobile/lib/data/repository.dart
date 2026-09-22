import 'account_snapshot.dart';
import 'models.dart';

class OauthConfig {
  const OauthConfig({
    this.google = '',
    this.apple = '',
    this.facebook = '',
  });

  final String google;
  final String apple;
  final String facebook;

  bool get googleReady => google.isNotEmpty;
  bool get appleReady => apple.isNotEmpty;
  bool get facebookReady => facebook.isNotEmpty;
}

class BookingOutcome {
  const BookingOutcome({
    this.appointment,
    this.invoiceId,
    this.pendingId,
    this.amount = 0,
    this.accountCreated = false,
    this.loginRequired = false,
  });

  final Appointment? appointment;
  final String? invoiceId;
  final String? pendingId;
  final int amount;
  final bool accountCreated;
  final bool loginRequired;
}

class CheckoutOutcome {
  const CheckoutOutcome({
    this.invoiceId,
    this.pendingId,
    required this.amount,
    this.accountCreated = false,
    this.loginRequired = false,
  });

  final String? invoiceId;
  final String? pendingId;
  final int amount;
  final bool accountCreated;
  final bool loginRequired;
}

class SoftPayLaunch {
  const SoftPayLaunch({
    required this.message,
    this.url,
  });

  final String message;
  final String? url;
}

class HomeCatalog {
  const HomeCatalog({
    required this.salon,
    required this.services,
    required this.articles,
    this.reviews = const [],
  });

  final SalonInfo salon;
  final List<ServiceItem> services;
  final List<Article> articles;
  final List<Review> reviews;
}

abstract class MacNationRepository {
  Future<AccountSnapshot?> restoreSession();
  Future<void> logout();
  Future<AccountSnapshot> loginWithPhone({
    required String phone,
    required String password,
    required String name,
  });
  Future<UserProfile> updateProfile({
    required String name,
    required String phone,
    String? email,
    String? password,
  });

  Future<HomeCatalog> fetchHomeCatalog();
  Future<SalonInfo> fetchSalon();
  Future<List<ServiceItem>> fetchServices();
  Future<List<Product>> fetchProducts();
  Future<Product> fetchProduct(String id);
  Future<List<MembershipPlan>> fetchPlans();
  Future<List<Article>> fetchArticles();
  Future<Article> fetchArticle(String id);
  Future<List<Review>> fetchReviews();
  Future<List<TimeSlot>> fetchSlots(DateTime day, {String? serviceId});
  Future<SalonSchedule> fetchSchedule();
  Future<BookingOutcome> createAppointment(BookingDraft draft);
  Future<CheckoutOutcome> createProductOrder({
    required Product product,
    required PaymentMethod method,
  });
  Future<CheckoutOutcome> subscribe({
    required MembershipPlan plan,
    required PaymentMethod method,
  });
  Future<SoftPayLaunch> startSoftPay({
    String? invoiceId,
    String? pendingId,
    required PaymentMethod method,
    required String name,
    required String phone,
    String? email,
  });
  Future<bool> invoicePaid({
    String? invoiceId,
    String? pendingId,
    PaymentMethod? method,
  });
  Future<UserProfile> redeemPoints();
  Future<void> cancelMembership();
  Future<OauthConfig> fetchOauthConfig();
  Future<AccountSnapshot> loginWithOauth({
    required String provider,
    required String credential,
    String? nonce,
    String? name,
  });
}
