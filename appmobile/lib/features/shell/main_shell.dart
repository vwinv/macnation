import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models.dart';
import '../../state/app_state.dart';
import '../account/account_screen.dart';
import '../booking/booking_screen.dart';
import '../home/home_screen.dart';
import '../plans/plans_screen.dart';
import '../shop/shop_screen.dart';
import '../blog/blog_screens.dart';
import '../../push/push_controller.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;

  @override
  void initState() {
    super.initState();
    PushController.instance.addListener(_openPush);
    WidgetsBinding.instance.addPostFrameCallback((_) => _openPush());
  }

  @override
  void dispose() {
    PushController.instance.removeListener(_openPush);
    super.dispose();
  }

  void _openPush() {
    final link = PushController.instance.takePending();
    if (link == null || !mounted) return;
    if (link.kind == 'article' && (link.articleId ?? '').isNotEmpty) {
      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => ArticleScreen(id: link.articleId!)),
      );
      return;
    }
    if (link.kind.startsWith('booking')) {
      setState(() => _index = 4);
    }
  }

  void _goReserve({ServiceItem? service}) {
    final state = AppScope.of(context);
    if (service != null) {
      state.startBooking(service);
    } else {
      state.openReservation();
    }
    setState(() => _index = 2);
  }

  void _onTab(int value) {
    if (value == 2) {
      AppScope.of(context).openReservation();
    }
    setState(() => _index = value);
  }

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final pages = [
      HomeScreen(
        onReserve: _goReserve,
        onShop: () => _onTab(1),
        onClub: () => _onTab(3),
      ),
      const ShopScreen(),
      BookingScreen(onClose: () => _onTab(0)),
      const PlansScreen(),
      AccountScreen(
        onReserve: () => _onTab(2),
        onShop: () => _onTab(1),
        onClub: () => _onTab(3),
      ),
    ];
    final showNav = _index != 2;
    final overlay = Theme.of(context).brightness == Brightness.dark
        ? SystemUiOverlayStyle.light
        : SystemUiOverlayStyle.dark;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: overlay,
      child: Scaffold(
        backgroundColor: colors.background,
        body: Stack(
          children: [
            Padding(
              padding: EdgeInsets.only(bottom: showNav ? 132 : 0),
              child: IndexedStack(index: _index, children: pages),
            ),
            if (showNav)
              Align(
                alignment: Alignment.bottomCenter,
                child: _BottomNav(index: _index, onTap: _onTab),
              ),
          ],
        ),
      ),
    );
  }
}

class _BottomNav extends StatelessWidget {
  const _BottomNav({required this.index, required this.onTap});

  final int index;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final light = AppColors.isLight(context);
    return SafeArea(
      minimum: const EdgeInsets.fromLTRB(14, 0, 14, 10),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: colors.nav,
          borderRadius: BorderRadius.circular(40),
          border: Border.all(
            color: light ? const Color(0x14000000) : colors.navBorder,
          ),
          boxShadow: [
            BoxShadow(
              color: light ? const Color(0x14000000) : colors.shadow,
              blurRadius: 24,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(8, 12, 8, 12),
          child: Row(
            children: [
              _Item(
                icon: Icons.home_outlined,
                activeIcon: Icons.home,
                label: 'Accueil',
                selected: index == 0,
                onTap: () => onTap(0),
              ),
              _Item(
                icon: Icons.shopping_bag_outlined,
                activeIcon: Icons.shopping_bag_outlined,
                label: 'Boutique',
                selected: index == 1,
                onTap: () => onTap(1),
              ),
              _ReserveButton(onTap: () => onTap(2)),
              _Item(
                icon: Icons.workspace_premium_outlined,
                activeIcon: Icons.workspace_premium_outlined,
                label: 'Club',
                selected: index == 3,
                onTap: () => onTap(3),
              ),
              _Item(
                icon: Icons.person_outline,
                activeIcon: Icons.person,
                label: 'Compte',
                selected: index == 4,
                onTap: () => onTap(4),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ReserveButton extends StatelessWidget {
  const _ReserveButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 2),
      child: Material(
        color: AppColors.gold,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: const SizedBox(
            height: 56,
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: 18),
              child: Center(
                child: Text(
                  'Réserver',
                  style: TextStyle(
                    fontFamily: 'Manrope',
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Item extends StatelessWidget {
  const _Item({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = selected
        ? AppColors.gold
        : (AppColors.isLight(context) ? AppColors.ink : AppColors.of(context).navIdle);
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(selected ? activeIcon : icon, color: color, size: 24),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  color: color,
                  fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
