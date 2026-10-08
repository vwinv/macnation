import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/format.dart';
import '../../core/theme/app_assets.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_widgets.dart';
import '../../data/models.dart';

class SalonScreen extends StatelessWidget {
  const SalonScreen({
    super.key,
    required this.salon,
    required this.onReserve,
  });

  final SalonInfo salon;
  final VoidCallback onReserve;

  String get _mapsQuery {
    final compact = salon.address.replaceAll('\n', ', ');
    return 'MAC NATION $compact';
  }

  String get _hoursDisplay {
    return salon.hours
        .split('·')
        .map((part) => part.trim())
        .where((part) => part.isNotEmpty)
        .join('\n');
  }

  String get _addressDisplay {
    final lines = salon.address
        .split('\n')
        .map((part) => part.trim())
        .where((part) => part.isNotEmpty)
        .toList();
    if (lines.isEmpty) return salon.address;
    final last = lines.last.replaceAll(RegExp(r',?\s*Sénégal$', caseSensitive: false), '');
    if (lines.length == 1) return last;
    return '${lines.first}\n$last';
  }

  Future<void> _open(Uri uri) async {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Future<void> _maps() {
    return _open(
      Uri.parse(
        'https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(_mapsQuery)}',
      ),
    );
  }

  Future<void> _call() {
    final digits = salon.phone.replaceAll(RegExp(r'\D'), '');
    final intl = digits.startsWith('221') ? digits : '221$digits';
    return _open(Uri.parse('tel:+$intl'));
  }

  Future<void> _whatsapp() {
    final digits = salon.phone.replaceAll(RegExp(r'\D'), '');
    final intl = digits.startsWith('221') ? digits : '221$digits';
    return _open(Uri.parse('https://wa.me/$intl'));
  }

  @override
  Widget build(BuildContext context) {
    final topInset = MediaQuery.paddingOf(context).top;
    final bottomInset = MediaQuery.paddingOf(context).bottom;
    final heroHeight =
        (MediaQuery.sizeOf(context).height * 0.48).clamp(340.0, 460.0);

    return Scaffold(
      backgroundColor: AppColors.of(context).background,
      body: Stack(
        children: [
          ListView(
            padding: EdgeInsets.zero,
            children: [
              SizedBox(
                height: heroHeight,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Image.asset(
                      AppAssets.stations,
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
                            Color(0x99000000),
                            AppColors.of(context).background,
                          ],
                          stops: [0, 0.28, 0.68, 1],
                        ),
                      ),
                    ),
                    Positioned(
                      left: 20,
                      right: 20,
                      bottom: 12,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'MARBRE, OR, LUMIÈRE',
                            style: TextStyle(
                              color: AppColors.gold,
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 2.4,
                            ),
                          ),
                          SizedBox(height: 8),
                          Text(
                            'Le salon',
                            style: Theme.of(context).textTheme.displayLarge?.copyWith(
                                  letterSpacing: 1.2,
                                  fontWeight: FontWeight.w500,
                                  height: 0.95,
                                  color: AppColors.onInk,
                                ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: EdgeInsets.fromLTRB(20, 8, 20, 32 + bottomInset),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Marbre noir, moulures blanches, touches d’or. Un second lieu de vie dédié à l’homme, en face du service d’hygiène, au cœur de Nord Foire.',
                      style: TextStyle(
                        color: AppColors.of(context).muted,
                        height: 1.5,
                        fontSize: 15,
                      ),
                    ),
                    SizedBox(height: 20),
                    StrokeCard(
                      dark: true,
                      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      child: Column(
                        children: [
                          _InfoRow(label: 'Adresse', value: _addressDisplay),
                          Divider(height: 1, color: AppColors.of(context).stroke),
                          _InfoRow(label: 'Horaires', value: _hoursDisplay),
                          Divider(height: 1, color: AppColors.of(context).stroke),
                          _InfoRow(
                            label: 'Statut',
                            value: salonOpenLabel(),
                            valueColor: AppColors.gold,
                          ),
                        ],
                      ),
                    ),
                    SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: _ActionChip(
                            label: 'Itinéraire',
                            filled: true,
                            onTap: _maps,
                          ),
                        ),
                        SizedBox(width: 8),
                        Expanded(
                          child: _ActionChip(label: 'Appeler', onTap: _call),
                        ),
                        SizedBox(width: 8),
                        Expanded(
                          child: _ActionChip(label: 'WhatsApp', onTap: _whatsapp),
                        ),
                      ],
                    ),
                    SizedBox(height: 16),
                    SizedBox(
                      height: 148,
                      child: Row(
                        children: [
                          Expanded(
                            child: AssetPhoto(AppAssets.stations, height: 148, radius: 16),
                          ),
                          SizedBox(width: 10),
                          Expanded(
                            child: AssetPhoto(AppAssets.waiting, height: 148, radius: 16),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(height: 22),
                    Text(
                      'Tous types de cheveux',
                      style: TextStyle(
                        color: AppColors.of(context).onDark,
                        fontWeight: FontWeight.w700,
                        fontSize: 22,
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Afro, bouclés, lisses, locks. Aucune distinction de texture. Le diagnostic d’abord, le geste ensuite.',
                      style: TextStyle(
                        color: AppColors.of(context).muted,
                        height: 1.5,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 22),
                    GoldButton(
                      label: 'Réserver au salon',
                      onPressed: () {
                        Navigator.of(context).pop();
                        onReserve();
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
          Positioned(
            top: topInset + 6,
            left: 16,
            child: Material(
              color: Color(0x99000000),
              shape: CircleBorder(),
              child: InkWell(
                customBorder: CircleBorder(),
                onTap: () => Navigator.of(context).pop(),
                child: SizedBox(
                  width: 40,
                  height: 40,
                  child: Icon(Icons.chevron_left, color: AppColors.onInk, size: 22),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.label,
    required this.value,
    this.valueColor,
  });

  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 86,
            child: Text(
              label,
              style: TextStyle(color: AppColors.of(context).muted, fontSize: 14),
            ),
          ),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: TextStyle(
                color: valueColor ?? AppColors.of(context).onDark,
                fontSize: 14,
                height: 1.4,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionChip extends StatelessWidget {
  const _ActionChip({
    required this.label,
    required this.onTap,
    this.filled = false,
  });

  final String label;
  final VoidCallback onTap;
  final bool filled;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: filled ? AppColors.gold : AppColors.of(context).card,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          height: 46,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: filled ? null : Border.all(color: AppColors.of(context).stroke),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontFamily: 'Manrope',
              fontWeight: FontWeight.w700,
              fontSize: 14,
              color: filled ? AppColors.ink : AppColors.of(context).onDark,
            ),
          ),
        ),
      ),
    );
  }
}
