import 'package:flutter/material.dart';

import '../theme/app_assets.dart';
import '../theme/app_colors.dart';

class MnLogo extends StatelessWidget {
  const MnLogo({super.key, this.size = 72, this.color = Colors.white});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size.square(size),
      painter: _MnLogoPainter(color),
    );
  }
}

class _MnLogoPainter extends CustomPainter {
  _MnLogoPainter(this.color);

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.width / 100;
    canvas.scale(scale);
    final stroke = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 5;
    canvas.drawRect(const Rect.fromLTWH(7, 7, 86, 86), stroke);

    final fill = Paint()
      ..color = color
      ..style = PaintingStyle.fill;
    final path = Path()
      ..moveTo(23, 78)
      ..lineTo(23, 22)
      ..lineTo(35.5, 22)
      ..lineTo(50, 48.5)
      ..lineTo(64.5, 22)
      ..lineTo(77, 22)
      ..lineTo(77, 78)
      ..lineTo(66, 78)
      ..lineTo(66, 42.5)
      ..lineTo(50, 66)
      ..lineTo(34, 42.5)
      ..lineTo(34, 78)
      ..close();
    canvas.drawPath(path, fill);
  }

  @override
  bool shouldRepaint(covariant _MnLogoPainter oldDelegate) =>
      oldDelegate.color != color;
}

class GoldButton extends StatelessWidget {
  const GoldButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.loading = false,
    this.expand = true,
    this.icon,
    this.height = 52,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final bool expand;
  final IconData? icon;
  final double height;

  @override
  Widget build(BuildContext context) {
    final child = AnimatedOpacity(
      duration: const Duration(milliseconds: 160),
      opacity: onPressed == null ? 0.45 : 1,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: loading ? null : onPressed,
          borderRadius: BorderRadius.circular(10),
          child: Ink(
            height: height,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(10),
              gradient: const LinearGradient(
                colors: [AppColors.goldSoft, AppColors.gold, AppColors.goldDeep],
              ),
            ),
            child: Center(
              child: loading
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.2,
                        color: AppColors.ink,
                      ),
                    )
                  : Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (icon != null) ...[
                          Icon(icon, size: 18, color: AppColors.ink),
                          const SizedBox(width: 8),
                        ],
                        Text(
                          label,
                          style: const TextStyle(
                            fontFamily: 'Manrope',
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: AppColors.ink,
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        ),
      ),
    );

    return expand ? SizedBox(width: double.infinity, child: child) : child;
  }
}

class GhostButton extends StatelessWidget {
  const GhostButton({
    super.key,
    required this.label,
    required this.onPressed,
  });

  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: onPressed,
      style: OutlinedButton.styleFrom(
        foregroundColor: Colors.white,
        side: const BorderSide(color: AppColors.stroke),
        minimumSize: const Size.fromHeight(48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
      child: Text(label),
    );
  }
}

class StrokeCard extends StatelessWidget {
  const StrokeCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.onTap,
    this.color = AppColors.card,
  });

  final Widget child;
  final EdgeInsets padding;
  final VoidCallback? onTap;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final card = Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.stroke),
      ),
      child: child,
    );
    if (onTap == null) return card;
    return GestureDetector(onTap: onTap, child: card);
  }
}

class AssetPhoto extends StatelessWidget {
  const AssetPhoto(
    this.asset, {
    super.key,
    this.height,
    this.radius = 14,
    this.fit = BoxFit.cover,
    this.alignment = Alignment.center,
  });

  final String asset;
  final double? height;
  final double radius;
  final BoxFit fit;
  final Alignment alignment;

  @override
  Widget build(BuildContext context) {
    final network = asset.startsWith('http://') || asset.startsWith('https://');
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: network
          ? Image.network(
              asset,
              height: height,
              width: double.infinity,
              fit: fit,
              alignment: alignment,
              errorBuilder: (_, __, ___) => Image.asset(
                AppAssets.boutique,
                height: height,
                width: double.infinity,
                fit: fit,
                alignment: alignment,
              ),
            )
          : Image.asset(
              asset,
              height: height,
              width: double.infinity,
              fit: fit,
              alignment: alignment,
            ),
    );
  }
}

class GoldChip extends StatelessWidget {
  const GoldChip(this.label, {super.key});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.5)),
      ),
      child: Text(
        label,
        style: const TextStyle(
          fontFamily: 'Manrope',
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: AppColors.gold,
          letterSpacing: 0.4,
        ),
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(
    this.title, {
    super.key,
    this.subtitle,
    this.action,
    this.center = false,
  });

  final String title;
  final String? subtitle;
  final Widget? action;
  final bool center;

  @override
  Widget build(BuildContext context) {
    final heading = Text(title, style: Theme.of(context).textTheme.displayMedium);
    if (center) {
      return Column(
        children: [
          heading,
          if (subtitle != null) ...[
            const SizedBox(height: 8),
            Text(subtitle!, textAlign: TextAlign.center),
          ],
        ],
      );
    }
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              heading,
              if (subtitle != null) ...[
                const SizedBox(height: 4),
                Text(subtitle!),
              ],
            ],
          ),
        ),
        ?action,
      ],
    );
  }
}

class PriceTag extends StatelessWidget {
  const PriceTag(this.value, {super.key, this.large = false});

  final String value;
  final bool large;

  @override
  Widget build(BuildContext context) {
    return Text(
      value,
      style: TextStyle(
        fontFamily: 'BebasNeue',
        fontSize: large ? 32 : 22,
        color: AppColors.gold,
        letterSpacing: 0.6,
      ),
    );
  }
}
