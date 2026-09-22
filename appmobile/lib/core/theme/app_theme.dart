import 'package:flutter/material.dart';

import 'app_colors.dart';

abstract final class AppTheme {
  static ThemeData dark() {
    const bebas = 'BebasNeue';
    const manrope = 'Manrope';

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.background,
      fontFamily: manrope,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.gold,
        onPrimary: AppColors.ink,
        surface: AppColors.surface,
        onSurface: Colors.white,
      ),
      textTheme: const TextTheme(
        displayLarge: TextStyle(
          fontFamily: bebas,
          fontSize: 44,
          height: 1.05,
          letterSpacing: 0.6,
          color: Colors.white,
        ),
        displayMedium: TextStyle(
          fontFamily: bebas,
          fontSize: 34,
          height: 1.08,
          letterSpacing: 0.4,
          color: Colors.white,
        ),
        displaySmall: TextStyle(
          fontFamily: bebas,
          fontSize: 26,
          height: 1.1,
          color: Colors.white,
        ),
        headlineMedium: TextStyle(
          fontFamily: bebas,
          fontSize: 22,
          color: Colors.white,
        ),
        titleLarge: TextStyle(
          fontFamily: manrope,
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
        bodyLarge: TextStyle(
          fontFamily: manrope,
          fontSize: 16,
          height: 1.45,
          color: Colors.white,
        ),
        bodyMedium: TextStyle(
          fontFamily: manrope,
          fontSize: 14,
          height: 1.5,
          color: AppColors.muted,
        ),
        labelLarge: TextStyle(
          fontFamily: manrope,
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Color(0xEB050505),
        elevation: 0,
        scrolledUnderElevation: 0,
        foregroundColor: Colors.white,
        titleTextStyle: TextStyle(
          fontFamily: bebas,
          fontSize: 22,
          letterSpacing: 1.2,
          color: Colors.white,
        ),
      ),
      dividerColor: AppColors.stroke,
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.card,
        hintStyle: const TextStyle(color: AppColors.mutedDark, fontFamily: manrope),
        labelStyle: const TextStyle(color: AppColors.muted, fontFamily: manrope),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.stroke),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.gold, width: 1.4),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.redAccent),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.redAccent),
        ),
      ),
    );
  }
}
