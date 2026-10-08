import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'app_colors.dart';

abstract final class AppTheme {
  static ThemeData dark() => _theme(Brightness.dark, AppColors.dark);

  static ThemeData light() => _theme(Brightness.light, AppColors.light);

  static ThemeData _theme(Brightness brightness, AppColors colors) {
    const sans = 'Manrope';
    final overlay = brightness == Brightness.dark
        ? SystemUiOverlayStyle.light
        : SystemUiOverlayStyle.dark;

    TextStyle title(double size) => TextStyle(
          fontFamily: sans,
          fontSize: size,
          fontWeight: FontWeight.w700,
          height: 1.05,
          letterSpacing: 0,
          color: colors.onDark,
        );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      scaffoldBackgroundColor: colors.background,
      fontFamily: sans,
      extensions: [colors],
      colorScheme: ColorScheme(
        brightness: brightness,
        primary: AppColors.gold,
        onPrimary: AppColors.ink,
        secondary: AppColors.gold,
        onSecondary: AppColors.ink,
        surface: colors.surface,
        onSurface: colors.onDark,
        error: Colors.redAccent,
        onError: AppColors.onInk,
      ),
      textTheme: TextTheme(
        displayLarge: title(40),
        displayMedium: title(32),
        displaySmall: title(24),
        headlineMedium: title(20),
        titleLarge: TextStyle(
          fontFamily: sans,
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: colors.onDark,
        ),
        bodyLarge: TextStyle(
          fontFamily: sans,
          fontSize: 16,
          height: 1.45,
          color: colors.onDark,
        ),
        bodyMedium: TextStyle(
          fontFamily: sans,
          fontSize: 14,
          height: 1.5,
          color: colors.muted,
        ),
        labelLarge: TextStyle(
          fontFamily: sans,
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: colors.onDark,
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: colors.background,
        elevation: 0,
        scrolledUnderElevation: 0,
        foregroundColor: colors.onDark,
        surfaceTintColor: Colors.transparent,
        systemOverlayStyle: overlay,
        titleTextStyle: TextStyle(
          fontFamily: sans,
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: colors.onDark,
        ),
      ),
      dividerColor: colors.stroke,
      dialogTheme: DialogThemeData(
        backgroundColor: colors.surface,
        surfaceTintColor: Colors.transparent,
        titleTextStyle: TextStyle(
          fontFamily: sans,
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: colors.onDark,
        ),
        contentTextStyle: TextStyle(
          fontFamily: sans,
          fontSize: 14,
          height: 1.5,
          color: colors.muted,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: colors.onDark),
      ),
      iconTheme: IconThemeData(color: colors.onDark),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: AppColors.gold,
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: colors.surface,
        surfaceTintColor: Colors.transparent,
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: colors.cardElevated,
        contentTextStyle: TextStyle(color: colors.onDark, fontFamily: sans),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: colors.card,
        hintStyle: TextStyle(color: colors.muted, fontFamily: sans),
        labelStyle: TextStyle(color: colors.muted, fontFamily: sans),
        helperStyle: TextStyle(color: colors.muted, fontFamily: sans),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: colors.stroke),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.gold, width: 1.4),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Colors.redAccent),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Colors.redAccent),
        ),
      ),
    );
  }
}
