import 'package:flutter/material.dart';

import '../../core/format.dart';
import '../../core/theme/app_assets.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_widgets.dart';
import '../../data/models.dart';
import '../../state/app_state.dart';
import '../blog/blog_screens.dart';
import '../brand/brand_screen.dart';
import '../catalog/catalog_screen.dart';
import '../plans/plans_screen.dart';
import '../shop/shop_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.onReserve});

  final void Function({ServiceItem? service}) onReserve;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  _HomeData? _data;
  Object? _error;
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    _load();
  }

  Future<void> _load() async {
    final repo = AppScope.of(context).repository;
    try {
      final catalog = await repo.fetchHomeCatalog();
      if (!mounted) return;
      setState(() {
        _data = _HomeData(
          services: catalog.services,
          articles: catalog.articles,
          salon: catalog.salon,
          reviews: catalog.reviews,
        );
        _error = null;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        if (_data == null) _error = error;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final data = _data;
    if (_error != null && data == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Impossible de joindre MAC NATION. Lance l’API puis réessaie.',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              GoldButton(label: 'Réessayer', onPressed: _load),
            ],
          ),
        ),
      );
    }
    if (data == null) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.gold),
      );
    }
    final featured = data.services
        .where((s) => s.price != null)
        .take(6)
        .toList();
    return RefreshIndicator(
      color: AppColors.gold,
      backgroundColor: AppColors.card,
      onRefresh: _load,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(
            child: _Header(name: state.user?.name, salon: data.salon),
          ),
          if (state.lastAppointment != null)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                child: _UpcomingCard(
                  appointment: state.lastAppointment!,
                  onOpen: () => widget.onReserve(),
                ),
              ),
            ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: _ReserveHero(onReserve: () => widget.onReserve()),
            ),
          ),
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: _ShopPlanButtons(),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 28, 20, 12),
              child: SectionTitle(
                'Réserver',
                subtitle: 'Choisis une prestation',
                action: TextButton(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) =>
                          CatalogScreen(onReserve: widget.onReserve),
                    ),
                  ),
                  child: const Text('Toutes'),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: SizedBox(
              height: 168,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                scrollDirection: Axis.horizontal,
                itemCount: featured.length,
                separatorBuilder: (_, _) => const SizedBox(width: 10),
                itemBuilder: (context, index) {
                  final service = featured[index];
                  return _ServiceChip(
                    service: service,
                    onTap: () => widget.onReserve(service: service),
                  );
                },
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
              child: _SalonCard(salon: data.salon),
            ),
          ),
          if (data.reviews.isNotEmpty)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 28, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SectionTitle(
                      'Ils en parlent',
                      subtitle: 'Avis clients',
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 156,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: data.reviews.length,
                        separatorBuilder: (_, _) => const SizedBox(width: 10),
                        itemBuilder: (context, index) {
                          return SizedBox(
                            width: 260,
                            child: _ReviewCard(review: data.reviews[index]),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 32, 20, 12),
              child: SectionTitle(
                'Journal',
                subtitle: 'Actus et conseils',
                action: TextButton(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const BlogScreen()),
                  ),
                  child: const Text('Tout voir'),
                ),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
            sliver: SliverList.separated(
              itemCount: data.articles.take(3).length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) =>
                  _ArticleRow(article: data.articles[index]),
            ),
          ),
        ],
      ),
    );
  }
}

class _HomeData {
  _HomeData({
    required this.services,
    required this.articles,
    required this.salon,
    this.reviews = const [],
  });

  final List<ServiceItem> services;
  final List<Article> articles;
  final SalonInfo salon;
  final List<Review> reviews;
}

class _Header extends StatelessWidget {
  const _Header({required this.salon, this.name});

  final SalonInfo salon;
  final String? name;

  @override
  Widget build(BuildContext context) {
    final firstName = name?.split(' ').first;
    return SafeArea(
      bottom: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 4),
        child: Row(
          children: [
            const MnLogo(size: 32),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    firstName == null ? 'MAC NATION' : 'Salut, $firstName',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  Text(
                    '${salon.address.split('\n').first} · ${salonOpenLabel()}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: AppColors.gold, fontSize: 13),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _UpcomingCard extends StatelessWidget {
  const _UpcomingCard({required this.appointment, required this.onOpen});

  final Appointment appointment;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    return StrokeCard(
      onTap: onOpen,
      color: AppColors.gold.withValues(alpha: 0.1),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.gold.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.event_available, color: AppColors.gold),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Prochain rendez-vous',
                  style: TextStyle(fontSize: 12, color: AppColors.gold),
                ),
                Text(
                  appointment.serviceName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  '${formatDateLong(appointment.date)} · ${appointment.time}',
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: AppColors.muted),
        ],
      ),
    );
  }
}

class _ShopPlanButtons extends StatelessWidget {
  const _ShopPlanButtons();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _HomeAction(
            icon: Icons.storefront,
            label: 'Boutique',
            subtitle: 'Produits & kits',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ShopScreen()),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _HomeAction(
            icon: Icons.workspace_premium,
            label: 'Abonnements',
            subtitle: 'Packs mensuels',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const PlansScreen()),
            ),
          ),
        ),
      ],
    );
  }
}

class _HomeAction extends StatelessWidget {
  const _HomeAction({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return StrokeCard(
      onTap: onTap,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.gold, size: 22),
          const SizedBox(height: 10),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
          Text(subtitle, style: const TextStyle(fontSize: 12)),
        ],
      ),
    );
  }
}

class _ReserveHero extends StatelessWidget {
  const _ReserveHero({required this.onReserve});

  final VoidCallback onReserve;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: SizedBox(
        height: 210,
        child: Stack(
          fit: StackFit.expand,
          children: [
            Image.asset(
              AppAssets.cut,
              fit: BoxFit.cover,
              alignment: const Alignment(0, -0.2),
            ),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.transparent, Color(0xE6050505)],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Spacer(),
                  Text(
                    'Réserve ta coupe',
                    style: Theme.of(context).textTheme.displaySmall,
                  ),
                  const Text(
                    'Créneau en ligne, paiement Wave, Orange ou Free.',
                  ),
                  const SizedBox(height: 12),
                  GoldButton(label: 'Choisir un créneau', onPressed: onReserve),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ServiceChip extends StatelessWidget {
  const _ServiceChip({required this.service, required this.onTap});

  final ServiceItem service;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 132,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AssetPhoto(service.image, height: 96, radius: 14),
            const SizedBox(height: 8),
            Text(
              service.name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
            ),
            Text(
              service.price != null
                  ? '${formatFcfa(service.price!)} · ${service.duration}'
                  : service.duration,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 12, color: AppColors.gold),
            ),
          ],
        ),
      ),
    );
  }
}

class _SalonCard extends StatelessWidget {
  const _SalonCard({required this.salon});

  final SalonInfo salon;

  @override
  Widget build(BuildContext context) {
    return StrokeCard(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const BrandScreen()),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.asset(
              AppAssets.reception,
              width: 72,
              height: 72,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  salon.name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  salon.address.replaceAll('\n', ' · '),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  salon.hours,
                  style: const TextStyle(color: AppColors.gold),
                ),
                if (salon.phone.isNotEmpty)
                  Text(salon.phone, style: const TextStyle(fontSize: 12)),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: AppColors.muted),
        ],
      ),
    );
  }
}

class _ReviewCard extends StatelessWidget {
  const _ReviewCard({required this.review});

  final Review review;

  @override
  Widget build(BuildContext context) {
    return StrokeCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            review.author,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
          Text(
            review.city,
            style: const TextStyle(fontSize: 11, color: AppColors.gold),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: Text(
              review.quote,
              maxLines: 4,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

class _ArticleRow extends StatelessWidget {
  const _ArticleRow({required this.article});

  final Article article;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => ArticleScreen(id: article.id)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 92,
            child: AssetPhoto(article.image, height: 92, radius: 12),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  article.category,
                  style: const TextStyle(fontSize: 12, color: AppColors.gold),
                ),
                Text(
                  article.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    height: 1.25,
                  ),
                ),
                const SizedBox(height: 4),
                Text(formatDateShort(article.date)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
