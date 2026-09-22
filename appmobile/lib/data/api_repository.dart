import 'account_snapshot.dart';
import 'api_client.dart';
import 'api_exception.dart';
import 'catalog_images.dart';
import 'models.dart';
import 'repository.dart';

class ApiMacNationRepository implements MacNationRepository {
  ApiMacNationRepository({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  @override
  Future<AccountSnapshot?> restoreSession() async {
    await _client.ready();
    if (_client.tokens.token == null) return null;
    try {
      return await _session();
    } on ApiException catch (error) {
      if (error.isUnauthorized) await logout();
      return null;
    }
  }

  @override
  Future<void> logout() => _client.tokens.save(null);

  @override
  Future<AccountSnapshot> loginWithPhone({
    required String phone,
    required String password,
    required String name,
  }) async {
    await _client.ready();
    final trimmedName = name.trim();
    Map<String, dynamic> auth;
    if (trimmedName.isNotEmpty) {
      try {
        auth = _map(
          await _client.post('/auth/register', {
            'name': trimmedName,
            'phone': phone.trim(),
            'password': password.trim(),
          }),
        );
      } on ApiException catch (error) {
        if (!error.isConflict) rethrow;
        auth = _map(
          await _client.post('/auth/login', {
            'phone': phone.trim(),
            'password': password.trim(),
          }),
        );
      }
    } else {
      auth = _map(
        await _client.post('/auth/login', {
          'phone': phone.trim(),
          'password': password.trim(),
        }),
      );
    }
    await _client.tokens.save(auth['token'] as String);
    return _session();
  }

  @override
  Future<UserProfile> updateProfile({
    required String name,
    required String phone,
    String? email,
    String? password,
  }) async {
    final client = _map(
      await _client.patch('/me', {
        'name': name.trim(),
        'phone': phone.trim(),
        'email': email?.trim() ?? '',
        if (password != null && password.trim().isNotEmpty) 'password': password.trim(),
      }),
    );
    return _profile(client);
  }

  @override
  Future<HomeCatalog> fetchHomeCatalog() async {
    final json = _map(await _client.get('/catalog'));
    return HomeCatalog(
      salon: _salon(_map(json['salon'])),
      services: _list(json['services']).map(_service).toList(),
      articles: _list(json['articles']).map(_article).toList(),
      reviews: _reviews(json['reviews']),
    );
  }

  @override
  Future<SalonInfo> fetchSalon() async {
    return _salon(_map(await _client.get('/catalog/salon')));
  }

  @override
  Future<List<ServiceItem>> fetchServices() async {
    final list = _list(await _client.get('/catalog/services'));
    return list.map(_service).toList();
  }

  @override
  Future<List<Product>> fetchProducts() async {
    final list = _list(await _client.get('/catalog/products'));
    return list.map(_product).toList();
  }

  @override
  Future<Product> fetchProduct(String id) async {
    return _product(_map(await _client.get('/catalog/products/$id')));
  }

  @override
  Future<List<MembershipPlan>> fetchPlans() async {
    final list = _list(await _client.get('/catalog/plans'));
    return list.map(_plan).toList();
  }

  @override
  Future<List<Article>> fetchArticles() async {
    final list = _list(await _client.get('/catalog/articles'));
    return list.map(_article).toList();
  }

  @override
  Future<Article> fetchArticle(String id) async {
    return _article(_map(await _client.get('/catalog/articles/$id')));
  }

  @override
  Future<List<Review>> fetchReviews() async {
    return _reviews(await _client.get('/catalog/reviews'));
  }

  @override
  Future<List<TimeSlot>> fetchSlots(DateTime day, {String? serviceId}) async {
    final query = StringBuffer('/bookings/slots?date=${_iso(day)}');
    if (serviceId != null && serviceId.isNotEmpty) {
      query.write('&service=$serviceId');
    }
    final raw = await _client.get(query.toString());
    final list = raw is List
        ? _list(raw)
        : _list(_map(raw)['slots']);
    return [
      for (final item in list)
        TimeSlot(
          time: item['time'] as String,
          available: item['available'] != false,
          end: item['end'] as String?,
          label: item['label'] as String?,
        ),
    ];
  }

  @override
  Future<SalonSchedule> fetchSchedule() async {
    final json = _map(await _client.get('/bookings/schedule'));
    return SalonSchedule(
      hours: [
        for (final item in _list(json['hours']))
          OpeningHour(
            weekday: (item['weekday'] as num?)?.toInt() ?? 0,
            closed: item['closed'] == true,
            openTime: item['openTime'] as String? ?? '10:00',
            closeTime: item['closeTime'] as String? ?? '21:00',
          ),
      ],
      closedDates: [
        for (final item in _rawList(json['closedDates']))
          if (item is String)
            item
          else if (item is Map && item['dateIso'] is String)
            item['dateIso'] as String,
      ],
    );
  }

  @override
  Future<BookingOutcome> createAppointment(BookingDraft draft) async {
    final json = _map(
      await _client.post('/bookings', {
        'name': draft.name.trim(),
        'phone': draft.phone.trim(),
        'email': draft.email.trim(),
        'serviceId': draft.service?.id,
        'dateIso': _iso(draft.date ?? DateTime.now()),
        'time': draft.time,
        'place': draft.location == LocationType.home ? 'domicile' : 'salon',
        'address': draft.location == LocationType.home ? draft.address.trim() : '',
        'payNow': draft.paymentTiming == PaymentTiming.now,
        'paymentMethod': _method(draft.paymentMethod),
      }),
    );
    final bookingJson = json['booking'];
    final invoiceId = json['invoiceId'] as String?;
    final pendingId = json['pendingId'] as String?;
    return BookingOutcome(
      appointment: bookingJson is Map ? _appointment(_map(bookingJson)) : null,
      invoiceId: invoiceId == null || invoiceId.isEmpty ? null : invoiceId,
      pendingId: pendingId == null || pendingId.isEmpty ? null : pendingId,
      amount: (json['amount'] as num?)?.toInt() ?? 0,
      accountCreated: json['accountCreated'] == true,
      loginRequired: json['loginRequired'] == true,
    );
  }

  @override
  Future<CheckoutOutcome> createProductOrder({
    required Product product,
    required PaymentMethod method,
  }) {
    return _checkout(kind: 'boutique', itemId: product.id, method: method);
  }

  @override
  Future<CheckoutOutcome> subscribe({
    required MembershipPlan plan,
    required PaymentMethod method,
  }) {
    return _checkout(kind: 'abonnement', itemId: plan.id, method: method);
  }

  Future<CheckoutOutcome> _checkout({
    required String kind,
    required String itemId,
    required PaymentMethod method,
  }) async {
    final json = _map(
      await _client.post('/checkout', {
        'kind': kind,
        'itemId': itemId,
        'qty': 1,
        'paymentMethod': _method(method),
      }),
    );
    return CheckoutOutcome(
      invoiceId: (json['invoiceId'] as String?)?.isEmpty == true
          ? null
          : json['invoiceId'] as String?,
      pendingId: (json['pendingId'] as String?)?.isEmpty == true
          ? null
          : json['pendingId'] as String?,
      amount: (json['amount'] as num?)?.toInt() ?? 0,
      accountCreated: json['accountCreated'] == true,
      loginRequired: json['loginRequired'] == true,
    );
  }

  @override
  Future<SoftPayLaunch> startSoftPay({
    String? invoiceId,
    String? pendingId,
    required PaymentMethod method,
    required String name,
    required String phone,
    String? email,
  }) async {
    final channel = _softPayMethod(method);
    if (channel == null) {
      return const SoftPayLaunch(message: 'Paiement au salon.');
    }
    final json = _map(
      await _client.post('/paytech/checkout', {
        if (invoiceId != null && invoiceId.isNotEmpty) 'invoiceId': invoiceId,
        if (pendingId != null && pendingId.isNotEmpty) 'pendingId': pendingId,
        'method': channel,
        'name': name,
        'phone': phone,
        'email': email ?? '',
        'source': 'app',
      }),
    );
    final url = json['url'] as String?;
    return SoftPayLaunch(
      message: json['message'] as String? ?? 'Ouvre ton app pour valider.',
      url: url == null || url.isEmpty ? null : url,
    );
  }

  @override
  Future<bool> invoicePaid({
    String? invoiceId,
    String? pendingId,
    PaymentMethod? method,
  }) async {
    final query = StringBuffer('/paytech/status?');
    if (pendingId != null && pendingId.isNotEmpty) {
      query.write('pending=$pendingId');
    } else {
      query.write('invoice=$invoiceId');
    }
    final json = _map(await _client.get(query.toString()));
    return json['paid'] == true;
  }

  @override
  Future<UserProfile> redeemPoints() async {
    final client = _map(await _client.post('/me/redeem'));
    return _profile(client);
  }

  @override
  Future<void> cancelMembership() async {
    await _client.delete('/me/membership');
  }

  @override
  Future<void> acceptQuoteAtSalon(String bookingId) async {
    await _client.post('/bookings/$bookingId/salon', {});
  }

  @override
  Future<void> cancelBooking(String bookingId) async {
    await _client.post('/bookings/$bookingId/cancel', {});
  }

  @override
  Future<OauthConfig> fetchOauthConfig() async {
    final json = _map(await _client.get('/auth/oauth/config'));
    return OauthConfig(
      google: json['google'] as String? ?? '',
      apple: json['apple'] as String? ?? '',
      appleEnabled: json['appleEnabled'] == true,
      facebook: json['facebook'] as String? ?? '',
    );
  }

  @override
  Future<AccountSnapshot> loginWithOauth({
    required String provider,
    required String credential,
    String? nonce,
    String? name,
  }) async {
    await _client.ready();
    final auth = _map(
      await _client.post('/auth/oauth', {
        'provider': provider,
        'credential': credential,
        if (nonce != null && nonce.isNotEmpty) 'nonce': nonce,
        if (name != null && name.isNotEmpty) 'name': name,
      }),
    );
    await _client.tokens.save(auth['token'] as String);
    return _session();
  }

  Future<AccountSnapshot> _session() async {
    final json = _map(await _client.get('/me'));
    final client = _map(json['client']);
    final membership = json['membership'] is Map
        ? _map(json['membership'])
        : null;
    MembershipPlan? plan;
    if (membership != null) {
      final plans = await fetchPlans();
      final planId = membership['planId'] as String?;
      plan = plans.where((item) => item.id == planId).firstOrNull;
      plan ??= MembershipPlan(
        id: planId ?? '',
        name: membership['planName'] as String? ?? 'Abonnement',
        price: 0,
        perks: const [],
      );
    }
    final bookings = _list(json['bookings']);
    final invoices = _list(json['invoices']);
    return AccountSnapshot(
      user: _profile(
        client,
        planName: plan?.name,
        redeemPoints: (json['redeemPoints'] as num?)?.toInt(),
        redeemFcfa: (json['redeemFcfa'] as num?)?.toInt(),
      ),
      appointments: bookings.map(_appointment).toList(),
      plan: plan,
      orders: [
        for (final invoice in invoices)
          if (invoice['kind'] == 'boutique') _order(invoice),
      ],
    );
  }

  UserProfile _profile(
    Map<String, dynamic> client, {
    String? planName,
    int? redeemPoints,
    int? redeemFcfa,
  }) {
    final email = (client['email'] as String?)?.trim();
    return UserProfile(
      name: client['name'] as String? ?? '',
      phone: client['phone'] as String? ?? '',
      email: email == null || email.isEmpty ? null : email,
      points: (client['points'] as num?)?.toInt() ?? 0,
      creditFcfa: (client['creditFcfa'] as num?)?.toInt() ?? 0,
      planName: planName,
      redeemPoints: redeemPoints ?? 10,
      redeemFcfa: redeemFcfa ?? 1000,
    );
  }

  List<Review> _reviews(dynamic raw) {
    return [
      for (final item in _list(raw))
        Review(
          author: item['author'] as String? ?? '',
          quote: item['quote'] as String? ?? '',
          rating: item['rating'] as String? ?? '5/5',
          city: item['city'] as String? ?? 'Nord Foire, Dakar',
        ),
    ];
  }

  SalonInfo _salon(Map<String, dynamic> json) {
    return SalonInfo(
      name: json['name'] as String? ?? 'MAC NATION',
      address: json['address'] as String? ?? '',
      hours: json['hours'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
    );
  }

  ServiceItem _service(Map<String, dynamic> json) {
    final id = json['id'] as String;
    return ServiceItem(
      id: id,
      name: json['name'] as String? ?? '',
      description: json['description'] as String? ?? '',
      duration: json['duration'] as String? ?? '',
      category: json['category'] as String? ?? 'Signature',
      image: serviceImage(id),
      price: (json['price'] as num?)?.toInt(),
      priceLabel: json['priceLabel'] as String?,
    );
  }

  Product _product(Map<String, dynamic> json) {
    final id = json['id'] as String;
    return Product(
      id: id,
      name: json['name'] as String? ?? '',
      category: json['category'] as String? ?? '',
      description: json['description'] as String? ?? '',
      price: (json['price'] as num?)?.toInt() ?? 0,
      image: _productPhoto(json['image'] as String?, id),
    );
  }

  MembershipPlan _plan(Map<String, dynamic> json) {
    return MembershipPlan(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      price: (json['price'] as num?)?.toInt() ?? 0,
      featured: json['featured'] == true,
      perks: [for (final perk in _rawList(json['perks'])) perk.toString()],
    );
  }

  Article _article(Map<String, dynamic> json) {
    final id = json['id'] as String;
    return Article(
      id: id,
      title: json['title'] as String? ?? '',
      category: json['category'] as String? ?? '',
      date:
          DateTime.tryParse(json['dateIso'] as String? ?? '') ?? DateTime.now(),
      excerpt: json['excerpt'] as String? ?? '',
      body: json['body'] as String? ?? json['excerpt'] as String? ?? '',
      image: articleImage(id),
    );
  }

  Appointment _appointment(Map<String, dynamic> json) {
    return Appointment(
      id: json['id'] as String? ?? '',
      serviceName: json['serviceName'] as String? ?? 'Prestation',
      date:
          DateTime.tryParse(json['dateIso'] as String? ?? '') ?? DateTime.now(),
      time: json['time'] as String? ?? '',
      location: json['place'] == 'domicile'
          ? LocationType.home
          : LocationType.salon,
      total: (json['amount'] as num?)?.toInt() ?? 0,
      paid: json['paymentStatus'] == 'paid',
      invoiceId: json['invoiceId'] as String?,
      paymentMethod: json['paymentMethod'] as String?,
    );
  }

  Product _order(Map<String, dynamic> invoice) {
    final items = _list(invoice['items']);
    final name = items.isNotEmpty
        ? items.first['name'] as String? ?? 'Commande'
        : 'Commande';
    return Product(
      id: invoice['id'] as String? ?? name,
      name: name,
      category: 'Boutique',
      description: invoice['note'] as String? ?? 'Retrait au salon',
      price: (invoice['amount'] as num?)?.toInt() ?? 0,
      image: _orderImage(name),
    );
  }

  String _productPhoto(String? image, String id) {
    if (image == null || image.isEmpty) return productImage(id);
    if (image.startsWith('http://') || image.startsWith('https://')) return image;
    if (image.startsWith('/api/')) {
      final origin = _client.baseUrl.replaceFirst(RegExp(r'/api/?$'), '');
      return '$origin$image';
    }
    return productImage(id);
  }

  String _orderImage(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('pommade')) return productImage('pommade');
    if (lower.contains('huile')) return productImage('huile-barbe');
    if (lower.contains('shampoing')) return productImage('shampoing');
    if (lower.contains('spray')) return productImage('spray');
    if (lower.contains('kit')) return productImage('kit');
    return productImage('');
  }

  String _iso(DateTime day) {
    final y = day.year.toString().padLeft(4, '0');
    final m = day.month.toString().padLeft(2, '0');
    final d = day.day.toString().padLeft(2, '0');
    return '$y-$m-$d';
  }

  String _method(PaymentMethod method) {
    return switch (method) {
      PaymentMethod.wave => 'wave',
      PaymentMethod.orangeMoney => 'orange',
      PaymentMethod.freeMoney => 'free',
      PaymentMethod.salon => 'especes',
    };
  }

  String? _softPayMethod(PaymentMethod method) {
    return switch (method) {
      PaymentMethod.wave => 'wave',
      PaymentMethod.orangeMoney => 'orange',
      PaymentMethod.freeMoney => 'free',
      PaymentMethod.salon => null,
    };
  }

  Map<String, dynamic> _map(dynamic value) {
    if (value is Map<String, dynamic>) return value;
    if (value is Map) return Map<String, dynamic>.from(value);
    throw const ApiException('Réponse API inattendue.');
  }

  List<Map<String, dynamic>> _list(dynamic value) {
    return [for (final item in _rawList(value)) _map(item)];
  }

  List<dynamic> _rawList(dynamic value) {
    if (value is List) return value;
    return const [];
  }
}
