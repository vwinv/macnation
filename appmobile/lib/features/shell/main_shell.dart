import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_widgets.dart';
import '../../data/models.dart';
import '../../state/app_state.dart';
import '../account/account_screen.dart';
import '../booking/booking_screen.dart';
import '../home/home_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;

  void _goReserve({ServiceItem? service}) {
    final state = AppScope.of(context);
    if (service != null) {
      state.startBooking(service);
    } else {
      state.openReservation();
    }
    setState(() => _index = 1);
  }

  void _onTab(int value) {
    if (value == 1) {
      AppScope.of(context).openReservation();
    }
    setState(() => _index = value);
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      HomeScreen(onReserve: _goReserve),
      const BookingScreen(),
      const AccountScreen(),
    ];

    return Scaffold(
      body: IndexedStack(index: _index, children: pages),
      bottomNavigationBar: _BottomNav(
        index: _index,
        onTap: _onTab,
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
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xF00B0B0B),
        border: Border(top: BorderSide(color: AppColors.stroke)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(8, 8, 8, 6),
          child: Row(
            children: [
              _Item(
                icon: Icons.home_outlined,
                activeIcon: Icons.home,
                label: 'Accueil',
                selected: index == 0,
                onTap: () => onTap(0),
              ),
              Expanded(
                flex: 2,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: GoldButton(
                    label: 'Réserver',
                    height: 44,
                    onPressed: () => onTap(1),
                  ),
                ),
              ),
              _Item(
                icon: Icons.person_outline,
                activeIcon: Icons.person,
                label: 'Compte',
                selected: index == 2,
                onTap: () => onTap(2),
              ),
            ],
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
    final color = selected ? AppColors.gold : AppColors.muted;
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(selected ? activeIcon : icon, color: color, size: 22),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  color: color,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
