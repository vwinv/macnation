import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'core/theme/app_colors.dart';
import 'core/theme/app_theme.dart';
import 'core/widgets/app_widgets.dart';
import 'data/api_repository.dart';
import 'data/repository.dart';
import 'features/shell/main_shell.dart';
import 'state/app_state.dart';

class MacNationApp extends StatefulWidget {
  const MacNationApp({super.key, this.showSplash = true, this.repository});

  final bool showSplash;
  final MacNationRepository? repository;

  @override
  State<MacNationApp> createState() => _MacNationAppState();
}

class _MacNationAppState extends State<MacNationApp> {
  late final AppState _state = AppState(
    repository: widget.repository ?? ApiMacNationRepository(),
  );

  @override
  Widget build(BuildContext context) {
    return AppScope(
      state: _state,
      child: MaterialApp(
        title: 'MAC NATION',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.dark(),
        home: widget.showSplash ? const SplashScreen() : const MainShell(),
      ),
    );
  }
}

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 900),
  )..forward();

  late final Animation<double> _fade = CurvedAnimation(
    parent: _controller,
    curve: Curves.easeOut,
  );

  @override
  void initState() {
    super.initState();
    Future<void>.delayed(const Duration(milliseconds: 1600), () {
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          pageBuilder: (_, _, _) => const MainShell(),
          transitionsBuilder: (_, animation, _, child) =>
              FadeTransition(opacity: animation, child: child),
          transitionDuration: const Duration(milliseconds: 450),
        ),
      );
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: Colors.black,
        body: FadeTransition(
          opacity: _fade,
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.gold.withValues(alpha: 0.28),
                        blurRadius: 36,
                      ),
                    ],
                  ),
                  child: const MnLogo(size: 92),
                ),
                const SizedBox(height: 22),
                const Text(
                  'MAC NATION',
                  style: TextStyle(
                    fontFamily: 'BebasNeue',
                    fontSize: 34,
                    letterSpacing: 4,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'DAKAR · NORD FOIRE',
                  style: TextStyle(
                    fontSize: 11,
                    letterSpacing: 2.4,
                    color: AppColors.gold,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
