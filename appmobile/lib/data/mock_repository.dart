import '../core/theme/app_assets.dart';
import 'account_snapshot.dart';
import 'models.dart';
import 'repository.dart';

class MockMacNationRepository implements MacNationRepository {
  static const _delay = Duration(milliseconds: 280);

  Future<T> _later<T>(T value) async {
    await Future<void>.delayed(_delay);
    return value;
  }

  @override
  Future<HomeCatalog> fetchHomeCatalog() async {
    return _later(
      HomeCatalog(
        salon: const SalonInfo(
          name: 'MAC NATION',
          address: 'Nord Foire, en face du service d’hygiène\nDakar, Sénégal',
          hours: 'Lun–Sam 10h–21h · Dim 12h–20h',
          phone: '+221 77 000 00 00',
        ),
        services: _services,
        articles: _articles,
        reviews: _reviews,
      ),
    );
  }

  @override
  Future<SalonInfo> fetchSalon() => _later(
    const SalonInfo(
      name: 'MAC NATION',
      address: 'Nord Foire, en face du service d’hygiène\nDakar, Sénégal',
      hours: 'Lun–Sam 10h–21h · Dim 12h–20h',
      phone: '+221 77 000 00 00',
    ),
  );

  @override
  Future<List<ServiceItem>> fetchServices() => _later(_services);

  @override
  Future<List<Product>> fetchProducts() => _later(_products);

  @override
  Future<Product> fetchProduct(String id) async {
    await Future<void>.delayed(_delay);
    return _products.firstWhere((item) => item.id == id);
  }

  @override
  Future<List<MembershipPlan>> fetchPlans() => _later(_plans);

  @override
  Future<List<Article>> fetchArticles() => _later(_articles);

  @override
  Future<Article> fetchArticle(String id) async {
    await Future<void>.delayed(_delay);
    return _articles.firstWhere((item) => item.id == id);
  }

  @override
  Future<List<Review>> fetchReviews() => _later(_reviews);

  @override
  Future<List<TimeSlot>> fetchSlots(DateTime day, {String? serviceId}) async {
    await Future<void>.delayed(_delay);
    final taken = {day.day % 3 == 0 ? '11:00' : '14:30', '16:00', '19:00'};
    const hours = [
      '10:00',
      '10:15',
      '10:30',
      '10:45',
      '11:00',
      '11:15',
      '11:30',
      '11:45',
      '12:00',
      '12:30',
      '13:00',
      '13:30',
      '14:00',
      '14:30',
      '15:00',
      '15:30',
      '16:00',
      '16:30',
      '17:00',
      '17:30',
      '18:00',
      '18:30',
      '19:00',
      '19:30',
      '20:00',
    ];
    return [
      for (final time in hours)
        TimeSlot(
          time: time,
          available: !taken.contains(time),
          label: '$time – ${_mockEnd(time)}',
        ),
    ];
  }

  String _mockEnd(String time) {
    final parts = time.split(':');
    final h = int.tryParse(parts[0]) ?? 0;
    final m = int.tryParse(parts.length > 1 ? parts[1] : '0') ?? 0;
    final total = h * 60 + m + 30;
    final hh = (total ~/ 60) % 24;
    final mm = total % 60;
    return '${hh.toString().padLeft(2, '0')}:${mm.toString().padLeft(2, '0')}';
  }

  @override
  Future<SalonSchedule> fetchSchedule() async {
    await Future<void>.delayed(_delay);
    return const SalonSchedule(
      hours: [
        OpeningHour(weekday: 0, closed: false, openTime: '12:00', closeTime: '20:00'),
        OpeningHour(weekday: 1, closed: false, openTime: '10:00', closeTime: '21:00'),
        OpeningHour(weekday: 2, closed: false, openTime: '10:00', closeTime: '21:00'),
        OpeningHour(weekday: 3, closed: false, openTime: '10:00', closeTime: '21:00'),
        OpeningHour(weekday: 4, closed: false, openTime: '10:00', closeTime: '21:00'),
        OpeningHour(weekday: 5, closed: false, openTime: '10:00', closeTime: '21:00'),
        OpeningHour(weekday: 6, closed: false, openTime: '10:00', closeTime: '21:00'),
      ],
    );
  }

  @override
  Future<BookingOutcome> createAppointment(BookingDraft draft) async {
    await Future<void>.delayed(const Duration(milliseconds: 700));
    return BookingOutcome(
      appointment: draft.paymentTiming == PaymentTiming.now
          ? null
          : Appointment(
              id: 'rdv-${DateTime.now().millisecondsSinceEpoch}',
              serviceName: draft.service?.name ?? 'Prestation',
              date: draft.date ?? DateTime.now(),
              time: draft.time ?? '',
              location: draft.location,
              total: draft.total,
              paid: false,
            ),
      invoiceId: draft.paymentTiming == PaymentTiming.now ? null : 'mock-invoice',
      pendingId: draft.paymentTiming == PaymentTiming.now ? 'mock-pending' : null,
      amount: draft.total,
    );
  }

  @override
  Future<CheckoutOutcome> createProductOrder({
    required Product product,
    required PaymentMethod method,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 700));
    return CheckoutOutcome(
      invoiceId: method == PaymentMethod.salon ? 'mock-invoice' : null,
      pendingId: method == PaymentMethod.salon ? null : 'mock-pending',
      amount: product.price,
    );
  }

  @override
  Future<CheckoutOutcome> subscribe({
    required MembershipPlan plan,
    required PaymentMethod method,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 700));
    return CheckoutOutcome(
      invoiceId: method == PaymentMethod.salon ? 'mock-invoice' : null,
      pendingId: method == PaymentMethod.salon ? null : 'mock-pending',
      amount: plan.price,
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
    return const SoftPayLaunch(message: 'Paiement simulé.');
  }

  @override
  Future<bool> invoicePaid({
    String? invoiceId,
    String? pendingId,
    PaymentMethod? method,
  }) async {
    return true;
  }

  @override
  Future<UserProfile> redeemPoints() async {
    return const UserProfile(
      name: 'Client MAC NATION',
      phone: '+221771234567',
      points: 2,
      creditFcfa: 1000,
    );
  }

  @override
  Future<void> cancelMembership() async {}

  @override
  Future<OauthConfig> fetchOauthConfig() async => const OauthConfig();

  @override
  Future<AccountSnapshot> loginWithOauth({
    required String provider,
    required String credential,
    String? nonce,
    String? name,
  }) {
    return loginWithPhone(
      phone: '+221771234567',
      password: 'macnation1',
      name: name ?? 'Client MAC NATION',
    );
  }

  @override
  Future<AccountSnapshot?> restoreSession() async => null;

  @override
  Future<void> logout() async {}

  @override
  Future<AccountSnapshot> loginWithPhone({
    required String phone,
    required String password,
    required String name,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 500));
    if (password.length < 8) {
      throw Exception('Le mot de passe doit contenir au moins 8 caractères.');
    }
    return AccountSnapshot(
      user: UserProfile(
        name: name.trim().isEmpty ? 'Client MAC NATION' : name.trim(),
        phone: phone,
        points: 12,
        planName: 'Signature',
      ),
    );
  }

  @override
  Future<UserProfile> updateProfile({
    required String name,
    required String phone,
    String? email,
    String? password,
  }) async {
    return UserProfile(
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim().isEmpty ?? true ? null : email!.trim(),
    );
  }
}

const _services = [
  ServiceItem(
    id: 'coupe',
    name: 'Coupe',
    description:
        'Diagnostic, coupe adaptée à votre morphologie et à votre texture. Fades, dégradés, coupes longues.',
    duration: '30 min',
    category: 'Signature',
    image: AppAssets.cut,
    price: 5000,
  ),
  ServiceItem(
    id: 'barbe',
    name: 'Barbe',
    description:
        'Taille, contour et finitions. Une barbe structurée, alignée avec votre coupe.',
    duration: '20 min',
    category: 'Signature',
    image: AppAssets.client,
    price: 3000,
  ),
  ServiceItem(
    id: 'coupe-barbe',
    name: 'Coupe + Barbe',
    description:
        'Le rituel MAC NATION. Un look cohérent, de la coupe jusqu’au dernier poil.',
    duration: '45 min',
    category: 'Signature',
    image: AppAssets.barber,
    price: 7000,
  ),
  ServiceItem(
    id: 'soin',
    name: 'Soin capillaire',
    description:
        'Hydratation et réparation pensées pour le climat de Dakar. Diagnostic sur place.',
    duration: '25 min',
    category: 'Soins',
    image: AppAssets.plateau,
    price: 4000,
  ),
  ServiceItem(
    id: 'coloration',
    name: 'Coloration',
    description:
        'Couverture, nuances et teintures maîtrisées, cheveux et barbe.',
    duration: '45 min',
    category: 'Soins',
    image: AppAssets.stations,
    price: 8000,
  ),
  ServiceItem(
    id: 'locks',
    name: 'Locks',
    description:
        'Départ de locks ou reprises au crochet. Patience, précision, savoir-faire dédié.',
    duration: '60 min',
    category: 'Soins',
    image: AppAssets.waiting,
    priceLabel: 'Sur devis',
  ),
  ServiceItem(
    id: 'enfant',
    name: 'Coupe enfant',
    description:
        'Moins de 12 ans. Fade, dégradé ou coupe simple, avec patience.',
    duration: '20 min',
    category: 'Enfants',
    image: AppAssets.receptionTeam,
    price: 3500,
  ),
  ServiceItem(
    id: 'ado',
    name: 'Coupe ado',
    description:
        '12 à 16 ans. La coupe qu’il a vue, adaptée à sa texture et à sa tête.',
    duration: '25 min',
    category: 'Enfants',
    image: AppAssets.hero,
    price: 4000,
  ),
  ServiceItem(
    id: 'domicile',
    name: 'Coiffure à domicile',
    description:
        'Le barber vient chez vous, à Dakar. Coupe, barbe ou combo. Déplacement 2 000 F.',
    duration: '45–60 min',
    category: 'Domicile',
    image: AppAssets.reception,
    price: 8000,
    priceLabel: 'à partir de 8 000 F',
  ),
];

const _products = [
  Product(
    id: 'pommade-hold',
    name: 'Pommade Hold',
    category: 'Coiffage',
    description:
        'Tenue mate, flexible. Pour fades et textures courtes qui doivent tenir toute la journée.',
    price: 5000,
    image: AppAssets.cut,
  ),
  Product(
    id: 'huile-barbe',
    name: 'Huile barbe',
    category: 'Barbe',
    description:
        'Nourrit sans graisser. Parfum discret, pensé pour le climat chaud.',
    price: 6500,
    image: AppAssets.client,
  ),
  Product(
    id: 'shampoing-daily',
    name: 'Shampoing daily',
    category: 'Soin',
    description:
        'Lavage fréquent sans assécher. Convient aux cheveux afro, bouclés et lisses.',
    price: 7000,
    image: AppAssets.boutique,
  ),
  Product(
    id: 'spray-texture',
    name: 'Spray texture',
    category: 'Coiffage',
    description: 'Volume et grip léger. À vaporiser avant de sculpter.',
    price: 4500,
    image: AppAssets.stations,
  ),
  Product(
    id: 'kit-nation',
    name: 'Kit Nation',
    category: 'Coffret',
    description:
        'Shampoing, pommade et huile barbe. Le trio pour tenir un mois entre deux visites.',
    price: 18000,
    image: AppAssets.waiting,
  ),
];

const _plans = [
  MembershipPlan(
    id: 'essentiel',
    name: 'Essentiel',
    price: 15000,
    perks: [
      '2 coupes par mois',
      'Priorité sur les créneaux du soir',
      '10% sur la boutique',
    ],
  ),
  MembershipPlan(
    id: 'signature',
    name: 'Signature',
    price: 28000,
    featured: true,
    perks: [
      '4 visites coupe + barbe',
      'Diagnostic à chaque passage',
      '15% sur la boutique',
      'Rappel WhatsApp J-1',
    ],
  ),
  MembershipPlan(
    id: 'nation',
    name: 'Nation',
    price: 45000,
    perks: [
      '4 visites coupe + barbe + soin',
      'Barber attitré selon disponibilités',
      '20% sur la boutique',
      'Invité : 1 coupe offerte par trimestre',
    ],
  ),
];

final _articles = [
  Article(
    id: 'ouverture-mac-nation-nord-foire',
    title: 'MAC NATION ouvre à Nord Foire',
    category: 'Nos actus',
    date: DateTime(2026, 8, 12),
    excerpt:
        'Le premier salon MAC NATION est ouvert à Dakar, Nord Foire, en face du service d’hygiène. Un lieu, une coupe, une nation.',
    image: AppAssets.receptionTeam,
    body:
        'Le premier salon MAC NATION est ouvert à Dakar, Nord Foire, en face du service d’hygiène. Un lieu, une coupe, une nation.\n\nChez MAC NATION, chaque geste s’inscrit dans une culture commune : accueil, diagnostic, exigence. Nos barbers sont formés pour tous les types de cheveux, sans distinction, dans un salon pensé comme un second lieu de vie.\n\nNord Foire, en face du service d’hygiène. Un seul lieu pour le moment, pour que le standard reste le même à chaque chaise, chaque produit, chaque abonnement.',
  ),
  Article(
    id: 'fade-dakar-ce-qui-marche-en-2026',
    title: 'Le fade à Dakar : ce qui marche en 2026',
    category: 'Tendance',
    date: DateTime(2026, 8, 4),
    excerpt:
        'Skin fade, mid fade, drop fade : ce qui tient dans la chaleur de Dakar, et ce que nos barbers voient le plus souvent.',
    image: AppAssets.cut,
    body:
        'Le fade reste la coupe de référence à Dakar. En 2026, ce qui marche n’est pas le plus court, c’est le plus net : un dégradé lisible, un contour propre, une texture qui tient dans la chaleur.\n\nMid fade et drop fade dominent. Le skin fade se réserve aux têtes qui le portent vraiment. Le diagnostic vient avant la tondeuse : morphologie, densité, habitudes.\n\nAu salon, on sculpte d’abord, on affine ensuite. Le produit (pommade mate ou spray texture) n’est pas un extra : c’est ce qui fait tenir le geste jusqu’au soir.',
  ),
  Article(
    id: 'routine-capillaire-homme-dakar',
    title: 'Routine capillaire homme à Dakar',
    category: 'Guides et Conseils',
    date: DateTime(2026, 7, 28),
    excerpt:
        'Chaleur, poussière, lavage trop fréquent. Une routine simple pour afro, bouclés et lisses, entre deux visites.',
    image: AppAssets.boutique,
    body:
        'À Dakar, le climat sèche et le lavage trop fréquent casse la fibre. La routine MAC NATION est courte : laver sans agresser, hydrater, sculpter.\n\nShampoing daily pour les lavages fréquents. Huile barbe sans graisser. Pommade Hold pour les fades qui doivent tenir.\n\nLe diagnostic en chaise reste le point de départ. Tous types de cheveux, même exigence. Entre deux visites, le Kit Nation couvre le mois.',
  ),
  Article(
    id: 'pourquoi-un-abonnement-change-votre-rythme',
    title: 'Pourquoi un abonnement change votre rythme',
    category: 'Lifestyle',
    date: DateTime(2026, 7, 20),
    excerpt:
        'Plus de créneau à la dernière minute. Un rythme, un barber, une coupe qui reste nette.',
    image: AppAssets.waiting,
    body:
        'L’abonnement n’est pas un gadget. C’est un rythme : 2 ou 4 visites par mois, priorité sur les soirs, rappel WhatsApp la veille.\n\nSignature est le plus choisi : coupe + barbe, diagnostic à chaque passage, 15 % boutique. Nation ajoute le soin et un barber attitré.\n\nLes visites non utilisées ne se reportent pas. L’idée est simple : venir, pas accumuler.',
  ),
];

const _reviews = [
  Review(
    author: 'Cheikh Diop',
    quote:
        'Première visite à Nord Foire, coupe nette et accueil au top. Je reviens.',
  ),
  Review(
    author: 'Moussa Ndiaye',
    quote:
        'Le fade est propre, l’ambiance est calme. On se sent bien dès l’entrée.',
  ),
  Review(
    author: 'Ibrahima Sarr',
    quote:
        'Barbe et coupe dans le même geste. Diagnostic clair, résultat nickel.',
  ),
  Review(
    author: 'Omar Ba',
    quote:
        'Enfin un salon à Dakar qui prend tous les types de cheveux au sérieux.',
  ),
  Review(
    author: 'Awa Fall',
    quote:
        'J’y ai emmené mon fils. Écoute, patience, coupe nickel. Merci à l’équipe.',
  ),
  Review(
    author: 'Mamadou Kane',
    quote:
        'L’abonnement Signature me simplifie la vie. Je ne cherche plus de créneau à la dernière minute.',
  ),
  Review(
    author: 'Pape Sow',
    quote:
        'Boutique bien fournie. J’ai pris l’huile barbe, ça sent propre sans être trop fort.',
  ),
  Review(
    author: 'Abdoulaye Faye',
    quote:
        'Nord Foire, en face du service d’hygiène, facile à trouver. Service premium sans chichi.',
  ),
];
