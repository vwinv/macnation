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
import '../salon/salon_screen.dart';
import '../shop/shop_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({
    super.key,
    required this.onReserve,
    this.onShop,
    this.onClub,
  });

  final void Function({ServiceItem? service}) onReserve;
  final VoidCallback? onShop;
  final VoidCallback? onClub;

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
      backgroundColor: AppColors.of(context).card,
      onRefresh: _load,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(child: _Header(salon: data.salon)),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: _ReserveHero(onReserve: () => widget.onReserve()),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: _ShopPlanButtons(
                onShop: widget.onShop,
                onClub: widget.onClub,
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 28, 16, 12),
              child: SectionTitle(
                'Prestations',
                subtitle: 'Au salon ou à domicile',
                action: GestureDetector(
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) =>
                          CatalogScreen(onReserve: widget.onReserve),
                    ),
                  ),
                  child: const Text(
                    'Toutes',
                    style: TextStyle(
                      color: AppColors.gold,
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                    ),
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: SizedBox(
              height: 228,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                itemCount: featured.length,
                separatorBuilder: (_, _) => const SizedBox(width: 12),
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
              padding: const EdgeInsets.fromLTRB(16, 22, 16, 0),
              child: _SalonCard(
                salon: data.salon,
                onReserve: () => widget.onReserve(),
              ),
            ),
          ),
          if (data.reviews.isNotEmpty)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 32, 16, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SectionTitle(
                      'Ils en parlent',
                      subtitle: 'Avis clients · ${data.reviews.first.rating}',
                    ),
                    const SizedBox(height: 14),
                    SizedBox(
                      height: 210,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: data.reviews.length,
                        separatorBuilder: (_, _) => const SizedBox(width: 12),
                        itemBuilder: (context, index) {
                          return SizedBox(
                            width: 268,
                            child: _ReviewCard(
                              review: data.reviews[index],
                              accent: index.isOdd,
                            ),
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
              padding: const EdgeInsets.fromLTRB(16, 32, 16, 12),
              child: SectionTitle(
                'Journal',
                subtitle: 'Actus et conseils',
                action: GestureDetector(
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const BlogScreen()),
                  ),
                  child: const Text(
                    'Tout voir',
                    style: TextStyle(
                      color: AppColors.gold,
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                    ),
                  ),
                ),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            sliver: SliverList.separated(
              itemCount: data.articles.take(3).length,
              separatorBuilder: (_, _) => const SizedBox(height: 16),
              itemBuilder: (context, index) =>
                  _ArticleRow(article: data.articles[index]),
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 24)),
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
  const _Header({required this.salon});

  final SalonInfo salon;

  @override
  Widget build(BuildContext context) {
    final place = salon.address.split('\n').first.split(',').first;
    return SafeArea(
      bottom: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
        child: Row(
          children: [
            GestureDetector(
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const BrandScreen()),
              ),
              child: Container(
                width: 42,
                height: 42,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.of(context).stroke),
                ),
                child: const MnLogo(size: 22),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'MAC NATION',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontSize: 16,
                      letterSpacing: 0.4,
                    ),
                  ),
                  Row(
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: const BoxDecoration(
                          color: AppColors.gold,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          '$place · ${salonOpenLabel()}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: AppColors.gold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const _HeaderCartButton(),
          ],
        ),
      ),
    );
  }
}

class _HeaderCartButton extends StatelessWidget {
  const _HeaderCartButton();

  @override
  Widget build(BuildContext context) {
    final count = AppScope.of(context).cartCount;
    return GestureDetector(
      onTap: () => openCart(context),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.of(context).stroke),
            ),
            child: const Center(
              child: Icon(Icons.shopping_bag, size: 16, color: AppColors.gold),
            ),
          ),
          if (count > 0)
            Positioned(
              right: -3,
              top: -3,
              child: Container(
                constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                padding: const EdgeInsets.symmetric(horizontal: 4),
                decoration: const BoxDecoration(
                  color: AppColors.gold,
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Text(
                  count > 99 ? '99+' : '$count',
                  style: const TextStyle(
                    color: AppColors.ink,
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _ShopPlanButtons extends StatelessWidget {
  const _ShopPlanButtons({this.onShop, this.onClub});

  final VoidCallback? onShop;
  final VoidCallback? onClub;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _HomeAction(
            icon: Icons.shopping_bag_outlined,
            label: 'Boutique',
            subtitle: 'Produits & kits',
            onTap:
                onShop ??
                () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const ShopScreen()),
                ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _HomeAction(
            icon: Icons.workspace_premium_outlined,
            label: 'Abonnements',
            subtitle: 'Packs mensuels',
            onTap:
                onClub ??
                () => Navigator.push(
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
      color: AppColors.of(context).card,
      borderColor: AppColors.of(context).stroke,
      onTap: onTap,
      padding: EdgeInsets.fromLTRB(14, 16, 14, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.gold, size: 22),
          SizedBox(height: 12),
          Text(
            label,
            style: TextStyle(
              color: AppColors.of(context).onDark,
              fontWeight: FontWeight.w700,
              fontSize: 16,
            ),
          ),
          SizedBox(height: 2),
          Text(
            subtitle,
            style: TextStyle(fontSize: 12, color: AppColors.of(context).muted),
          ),
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
      borderRadius: BorderRadius.circular(22),
      child: SizedBox(
        height: 278,
        child: Stack(
          fit: StackFit.expand,
          children: [
            Image.asset(
              AppAssets.cut,
              fit: BoxFit.cover,
              alignment: Alignment(0, -0.15),
            ),
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Color(0x33000000),
                    Color(0x00000000),
                    Color(0xCC050505),
                  ],
                  stops: [0, 0.35, 1],
                ),
              ),
            ),
            Padding(
              padding: EdgeInsets.fromLTRB(18, 16, 18, 18),
              child: Column(
                children: [
                  Spacer(),
                  Text(
                    'UN LIEU, UNE NATION, UNE EXPÉRIENCE',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: AppColors.gold,
                      fontSize: 10,
                      letterSpacing: 1.6,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'RÉSERVE TA COUPE',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.displayMedium?.copyWith(
                      color: AppColors.onInk,
                      fontSize: 28,
                    ),
                  ),
                  SizedBox(height: 6),
                  Text(
                    'Créneau en ligne, paiement Wave, Orange ou Free.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppColors.onInk, fontSize: 13),
                  ),
                  const SizedBox(height: 14),
                  GoldButton(
                    label: 'Choisir un créneau',
                    height: 48,
                    radius: 14,
                    onPressed: onReserve,
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

class _ServiceChip extends StatelessWidget {
  const _ServiceChip({required this.service, required this.onTap});

  final ServiceItem service;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 158,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AssetPhoto(service.image, height: 158, radius: 16),
            const SizedBox(height: 10),
            Text(
              service.name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: AppColors.of(context).onDark,
                fontWeight: FontWeight.w700,
                fontSize: 16,
              ),
            ),
            Text(
              service.price != null
                  ? '${formatFcfa(service.price!)} · ${service.duration}'
                  : service.duration,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.gold,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SalonCard extends StatelessWidget {
  const _SalonCard({required this.salon, required this.onReserve});

  final SalonInfo salon;
  final VoidCallback onReserve;

  String get _addressLine {
    final lines = salon.address
        .split('\n')
        .map(
          (part) => part
              .replaceAll(RegExp(r',?\s*Sénégal$', caseSensitive: false), '')
              .trim(),
        )
        .where((part) => part.isNotEmpty)
        .toList();
    if (lines.isEmpty) return salon.address;
    if (lines.length == 1) return lines.first;
    return '${lines.first} · ${lines.last}';
  }

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    return StrokeCard(
      color: colors.card,
      borderColor: colors.stroke,
      padding: const EdgeInsets.all(12),
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => SalonScreen(salon: salon, onReserve: onReserve),
        ),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
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
                  'LE SALON',
                  style: TextStyle(
                    color: colors.onDark,
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _addressLine,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 13,
                    color: colors.muted,
                    height: 1.35,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  salon.hours,
                  style: TextStyle(fontSize: 12, color: colors.muted),
                ),
              ],
            ),
          ),
          Icon(Icons.chevron_right, color: colors.mutedDark),
        ],
      ),
    );
  }
}

class _ReviewCard extends StatelessWidget {
  const _ReviewCard({required this.review, required this.accent});

  final Review review;
  final bool accent;

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    return StrokeCard(
      color: accent ? colors.featured : colors.card,
      borderColor: accent ? const Color(0x55C49A22) : colors.stroke,
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: List.generate(
              5,
              (_) => const Padding(
                padding: EdgeInsets.only(right: 3),
                child: Icon(
                  Icons.star_rounded,
                  size: 16,
                  color: AppColors.gold,
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: Text(
              review.quote,
              maxLines: 4,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(color: colors.onDark, height: 1.4, fontSize: 15),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            review.author,
            style: TextStyle(
              color: colors.onDark,
              fontWeight: FontWeight.w700,
              fontSize: 15,
            ),
          ),
          Text(
            review.city,
            style: TextStyle(fontSize: 12, color: colors.muted),
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
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: SizedBox(
              width: 76,
              height: 76,
              child: AssetPhoto(article.image, height: 76, radius: 14),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  article.category.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.gold,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  article.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: AppColors.of(context).onDark,
                    fontWeight: FontWeight.w700,
                    height: 1.25,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  formatDateLong(article.date),
                  style: TextStyle(
                    fontSize: 13,
                    color: AppColors.of(context).muted,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
