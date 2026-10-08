import 'package:flutter/material.dart';

class AppColors extends ThemeExtension<AppColors> {
  const AppColors({
    required this.background,
    required this.surface,
    required this.card,
    required this.cardElevated,
    required this.muted,
    required this.mutedDark,
    required this.stroke,
    required this.success,
    required this.nav,
    required this.navBorder,
    required this.navIdle,
    required this.onDark,
    required this.handle,
    required this.chip,
    required this.featured,
    required this.shadow,
  });

  static const gold = Color(0xFFC49A22);
  static const goldDeep = Color(0xFFA98418);
  static const goldSoft = Color(0xFFD4B02E);
  static const ink = Color(0xFF000000);
  static const onInk = Color(0xFFFFFFFF);

  final Color background;
  final Color surface;
  final Color card;
  final Color cardElevated;
  final Color muted;
  final Color mutedDark;
  final Color stroke;
  final Color success;
  final Color nav;
  final Color navBorder;
  final Color navIdle;
  final Color onDark;
  final Color handle;
  final Color chip;
  final Color featured;
  final Color shadow;

  static AppColors of(BuildContext context) {
    return Theme.of(context).extension<AppColors>() ?? dark;
  }

  static bool isLight(BuildContext context) {
    return Theme.of(context).brightness == Brightness.light;
  }

  static const dark = AppColors(
    background: Color(0xFF050505),
    surface: Color(0xFF0B0B0B),
    card: Color(0xFF151311),
    cardElevated: Color(0xFF151311),
    muted: Color(0xFF9CA3AF),
    mutedDark: Color(0xFF6B7280),
    stroke: Color(0x33FFFFFF),
    success: Color(0xFF86EFAC),
    nav: Color(0xFF0A0A0A),
    navBorder: Color(0xFF3E3528),
    navIdle: Color(0xFFC4B59A),
    onDark: Color(0xFFFFFFFF),
    handle: Color(0x3DFFFFFF),
    chip: Color(0xFF2A2418),
    featured: Color(0xFF1A160C),
    shadow: Color(0x66000000),
  );

  static const light = AppColors(
    background: Color(0xFFF4F1EA),
    surface: Color(0xFFFFFFFF),
    card: Color(0xFFFFFFFF),
    cardElevated: Color(0xFFFFFFFF),
    muted: Color(0xFF4F4A43),
    mutedDark: Color(0xFF8A847A),
    stroke: Color(0x1A000000),
    success: Color(0xFF16A34A),
    nav: Color(0xFFFFFFFF),
    navBorder: Color(0xFFE7E0D4),
    navIdle: Color(0xFF9A948A),
    onDark: Color(0xFF111111),
    handle: Color(0x33000000),
    chip: Color(0xFFF3E6C4),
    featured: Color(0xFFF8F1DE),
    shadow: Color(0x0F000000),
  );

  @override
  AppColors copyWith({
    Color? background,
    Color? surface,
    Color? card,
    Color? cardElevated,
    Color? muted,
    Color? mutedDark,
    Color? stroke,
    Color? success,
    Color? nav,
    Color? navBorder,
    Color? navIdle,
    Color? onDark,
    Color? handle,
    Color? chip,
    Color? featured,
    Color? shadow,
  }) {
    return AppColors(
      background: background ?? this.background,
      surface: surface ?? this.surface,
      card: card ?? this.card,
      cardElevated: cardElevated ?? this.cardElevated,
      muted: muted ?? this.muted,
      mutedDark: mutedDark ?? this.mutedDark,
      stroke: stroke ?? this.stroke,
      success: success ?? this.success,
      nav: nav ?? this.nav,
      navBorder: navBorder ?? this.navBorder,
      navIdle: navIdle ?? this.navIdle,
      onDark: onDark ?? this.onDark,
      handle: handle ?? this.handle,
      chip: chip ?? this.chip,
      featured: featured ?? this.featured,
      shadow: shadow ?? this.shadow,
    );
  }

  @override
  AppColors lerp(ThemeExtension<AppColors>? other, double t) {
    if (other is! AppColors) return this;
    return AppColors(
      background: Color.lerp(background, other.background, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      card: Color.lerp(card, other.card, t)!,
      cardElevated: Color.lerp(cardElevated, other.cardElevated, t)!,
      muted: Color.lerp(muted, other.muted, t)!,
      mutedDark: Color.lerp(mutedDark, other.mutedDark, t)!,
      stroke: Color.lerp(stroke, other.stroke, t)!,
      success: Color.lerp(success, other.success, t)!,
      nav: Color.lerp(nav, other.nav, t)!,
      navBorder: Color.lerp(navBorder, other.navBorder, t)!,
      navIdle: Color.lerp(navIdle, other.navIdle, t)!,
      onDark: Color.lerp(onDark, other.onDark, t)!,
      handle: Color.lerp(handle, other.handle, t)!,
      chip: Color.lerp(chip, other.chip, t)!,
      featured: Color.lerp(featured, other.featured, t)!,
      shadow: Color.lerp(shadow, other.shadow, t)!,
    );
  }
}
