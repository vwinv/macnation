import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/format.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_widgets.dart';
import '../../core/widgets/payment_sheet.dart';
import '../../data/models.dart';
import '../../state/app_state.dart';
import '../blog/blog_screens.dart';
import '../pay/soft_pay_screen.dart';
import '../salon/salon_screen.dart';
import 'social_login.dart';

class AccountScreen extends StatelessWidget {
  const AccountScreen({
    super.key,
    this.onReserve,
    this.onShop,
    this.onClub,
  });

  final VoidCallback? onReserve;
  final VoidCallback? onShop;
  final VoidCallback? onClub;

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    if (!state.isLoggedIn) return const _LoginView();
    return _ProfileView(
      state: state,
      onReserve: onReserve,
      onShop: onShop,
      onClub: onClub,
    );
  }
}

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    return Scaffold(
      backgroundColor: colors.background,
      body: Stack(
        children: [
          _LoginView(
            overlayBack: true,
            onSuccess: () {
              if (context.mounted) Navigator.pop(context, true);
            },
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 4, 12, 0),
              child: _CircleIconButton(
                icon: Icons.chevron_left,
                onTap: () => Navigator.pop(context, false),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LoginView extends StatefulWidget {
  const _LoginView({this.onSuccess, this.overlayBack = false});

  final VoidCallback? onSuccess;
  final bool overlayBack;

  @override
  State<_LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends State<_LoginView> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  bool _register = true;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_register && _name.text.trim().isEmpty) {
      setState(() => _error = 'Indique ton nom.');
      return;
    }
    if (_phone.text.trim().length < 8) {
      setState(() => _error = 'Entre un numéro de téléphone valide.');
      return;
    }
    if (_register && _password.text.length < 8) {
      setState(() => _error = 'Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (!_register && _password.text.isEmpty) {
      setState(() => _error = 'Indique ton mot de passe.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await AppScope.of(context).login(
        name: _register ? _name.text : '',
        email: _register ? _email.text : null,
        phone: _phone.text,
        password: _password.text,
      );
      widget.onSuccess?.call();
    } catch (error) {
      setState(() => _error = error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(20, widget.overlayBack ? 48 : 8, 20, 16),
        child: Column(
          children: [
            const MnLogo(size: 72),
            const SizedBox(height: 16),
            Text(
              'M A C   N A T I O N',
              style: TextStyle(
                fontSize: 13,
                letterSpacing: 3.2,
                fontWeight: FontWeight.w600,
                color: colors.onDark,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              'Réserve, suis tes rendez-vous et\ncumule des points à chaque passage.',
              textAlign: TextAlign.center,
              style: TextStyle(color: colors.muted, height: 1.45, fontSize: 14),
            ),
            const SizedBox(height: 22),
            Container(
              height: 48,
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: colors.card,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: colors.stroke),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: _ModeTab(
                      label: 'Inscription',
                      selected: _register,
                      onTap: () => setState(() {
                        _register = true;
                        _error = null;
                      }),
                    ),
                  ),
                  Expanded(
                    child: _ModeTab(
                      label: 'Connexion',
                      selected: !_register,
                      onTap: () => setState(() {
                        _register = false;
                        _error = null;
                      }),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ListView(
                children: [
                  if (_register) ...[
                    TextField(
                      controller: _name,
                      textCapitalization: TextCapitalization.words,
                      decoration: const InputDecoration(labelText: 'Nom'),
                    ),
                    const SizedBox(height: 12),
                  ],
                  TextField(
                    controller: _phone,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'Téléphone *',
                      prefixText: '+221  ',
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _password,
                    obscureText: true,
                    decoration: InputDecoration(
                      labelText: 'Mot de passe *',
                      helperText: _register ? '8 caractères minimum' : null,
                    ),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 8),
                    Text(_error!, style: const TextStyle(color: Colors.redAccent)),
                  ],
                  const SizedBox(height: 18),
                  GoldButton(
                    label: _register ? 'Créer mon compte' : 'Se connecter',
                    loading: _loading,
                    onPressed: _loading ? null : _submit,
                  ),
                  const SizedBox(height: 22),
                  Row(
                    children: [
                      Expanded(child: Divider(color: colors.stroke)),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: Text(
                          'ou continuer avec',
                          style: TextStyle(color: colors.muted, fontSize: 12),
                        ),
                      ),
                      Expanded(child: Divider(color: colors.stroke)),
                    ],
                  ),
                  const SizedBox(height: 14),
                  _SocialLogos(onSuccess: widget.onSuccess),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ModeTab extends StatelessWidget {
  const _ModeTab({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 44,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? AppColors.ink : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 13,
            color: selected ? AppColors.onInk : AppColors.of(context).onDark,
          ),
        ),
      ),
    );
  }
}

class _SocialLogos extends StatelessWidget {
  const _SocialLogos({this.onSuccess});

  final VoidCallback? onSuccess;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _SocialLogo(
            label: 'Google',
            onTap: () => _social(context, 'google'),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _SocialLogo(
            label: 'Apple',
            onTap: () => _social(context, 'apple'),
          ),
        ),
      ],
    );
  }

  Future<void> _social(BuildContext context, String provider) async {
    try {
      await startSocialLogin(context, provider: provider);
      onSuccess?.call();
    } catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))),
      );
    }
  }
}

class _SocialLogo extends StatelessWidget {
  const _SocialLogo({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    return Material(
      color: colors.card,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          height: 46,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: colors.stroke),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 13,
              color: colors.onDark,
            ),
          ),
        ),
      ),
    );
  }
}

class _CircleIconButton extends StatelessWidget {
  const _CircleIconButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: Ink(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: colors.card,
            border: Border.all(color: colors.stroke),
          ),
          child: Icon(icon, color: colors.onDark),
        ),
      ),
    );
  }
}

class _ProfileView extends StatelessWidget {
  const _ProfileView({
    required this.state,
    this.onReserve,
    this.onShop,
    this.onClub,
  });

  final AppState state;
  final VoidCallback? onReserve;
  final VoidCallback? onShop;
  final VoidCallback? onClub;

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty);
    if (parts.isEmpty) return 'M';
    final list = parts.toList();
    if (list.length == 1) {
      final value = list.first;
      return value.substring(0, value.length >= 2 ? 2 : 1).toUpperCase();
    }
    return (list[0][0] + list[1][0]).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final user = state.user!;
    final colors = AppColors.of(context);
    final dark = state.themeMode == ThemeMode.dark ||
        (state.themeMode == ThemeMode.system &&
            MediaQuery.platformBrightnessOf(context) == Brightness.dark);
    final media = MediaQuery.paddingOf(context);
    return ListView(
      padding: EdgeInsets.fromLTRB(20, 8 + media.top, 20, 24),
      children: [
        Text('Mon compte', style: Theme.of(context).textTheme.displayLarge),
        const SizedBox(height: 16),
        StrokeCard(
          onTap: () => _openEditSheet(context, user),
          child: Row(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: AppColors.gold,
                child: Text(
                  _initials(user.name),
                  style: const TextStyle(
                    color: AppColors.ink,
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user.name,
                      style: TextStyle(
                        color: colors.onDark,
                        fontWeight: FontWeight.w600,
                        fontSize: 18,
                      ),
                    ),
                    Text(
                      user.phone,
                      style: TextStyle(
                        color: colors.onDark,
                        fontWeight: FontWeight.w500,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: StrokeCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Points'),
                      PriceTag('${user.points}', large: true),
                      Text('${user.redeemPoints} pts = ${formatFcfa(user.redeemFcfa)}'),
                      Text(
                        'Valeur ${formatFcfa(user.redeemPoints <= 0 ? 0 : (user.points * user.redeemFcfa / user.redeemPoints).floor())}',
                        style: const TextStyle(color: AppColors.gold, fontSize: 13),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: StrokeCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Abonnement'),
                      Text(
                        state.activePlan?.name ?? user.planName ?? 'Aucun',
                        style: Theme.of(context).textTheme.displaySmall,
                      ),
                      if (state.activePlan == null && onClub != null) ...[
                        const Spacer(),
                        GestureDetector(
                          onTap: onClub,
                          child: const Text(
                            'Découvrir les formules',
                            style: TextStyle(color: AppColors.gold, fontSize: 13),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        if (user.canRedeem) ...[
          const SizedBox(height: 12),
          GoldButton(
            label: 'Échanger ${user.redeemPoints} pts contre ${formatFcfa(user.redeemFcfa)}',
            onPressed: () => _redeem(context),
          ),
        ],
        if (state.activePlan != null) ...[
          const SizedBox(height: 10),
          GhostButton(
            label: 'Résilier l’abonnement',
            onPressed: () => _cancelPlan(context),
          ),
        ],
        const SizedBox(height: 22),
        Text(
          'Mes rendez-vous',
          style: TextStyle(color: colors.muted, fontWeight: FontWeight.w600, fontSize: 14),
        ),
        const SizedBox(height: 8),
        if (state.appointments.isEmpty)
          _DashedEmpty(
            label: 'Aucun rendez-vous pour le moment.',
            action: 'Réserver',
            onTap: onReserve,
          )
        else
          ...state.appointments.map(
            (appointment) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _AppointmentTile(
                appointment: appointment,
                onPayOnline: () => _payQuote(context, appointment),
                onPaySalon: () => _payQuoteSalon(context, appointment),
              ),
            ),
          ),
        const SizedBox(height: 18),
        Text(
          'Achats boutique',
          style: TextStyle(color: colors.muted, fontWeight: FontWeight.w600, fontSize: 14),
        ),
        const SizedBox(height: 8),
        if (state.orders.isEmpty)
          _DashedEmpty(
            label: 'Pas encore d’achat.',
            action: 'Boutique',
            onTap: onShop,
          )
        else
          ...state.orders.map(
            (product) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: StrokeCard(
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        product.name,
                        style: TextStyle(color: colors.onDark),
                      ),
                    ),
                    Text(
                      formatFcfa(product.price),
                      style: const TextStyle(color: AppColors.gold),
                    ),
                  ],
                ),
              ),
            ),
          ),
        const SizedBox(height: 16),
        StrokeCard(
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Apparence',
                      style: TextStyle(
                        color: colors.onDark,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(dark ? 'Mode sombre' : 'Mode clair'),
                  ],
                ),
              ),
              _AppearanceToggle(
                dark: dark,
                onDark: () => state.setThemeMode(ThemeMode.dark),
                onLight: () => state.setThemeMode(ThemeMode.light),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        StrokeCard(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              _ProfileLink(
                label: 'Le salon',
                onTap: () => _openSalon(context),
              ),
              Divider(height: 1, color: colors.stroke),
              _ProfileLink(
                label: 'Journal',
                onTap: () => _openJournal(context),
              ),
              Divider(height: 1, color: colors.stroke),
              _ProfileLink(
                label: 'Nous contacter sur WhatsApp',
                onTap: () => _openWhatsApp(context),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        OutlinedButton(
          onPressed: () => state.logout(),
          style: OutlinedButton.styleFrom(
            foregroundColor: colors.onDark,
            side: BorderSide(color: colors.stroke),
            minimumSize: const Size.fromHeight(52),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(18),
            ),
          ),
          child: const Text(
            'Se déconnecter',
            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
          ),
        ),
      ],
    );
  }

  Future<void> _payQuote(BuildContext context, Appointment appointment) async {
    if (appointment.invoiceId == null || appointment.invoiceId!.isEmpty) return;
    final user = state.user;
    if (user == null) return;
    final method = await showPaymentSheet(
      context,
      title: appointment.serviceName,
      amountLabel: formatFcfa(appointment.total),
      allowSalon: false,
    );
    if (method == null || !context.mounted) return;
    final paid = await completeOnlinePayment(
      context,
      invoiceId: appointment.invoiceId,
      amount: appointment.total,
      method: method,
      name: user.name,
      phone: user.phone,
      email: user.email,
      isBooking: true,
    );
    if (paid && context.mounted) {
      try {
        await state.refreshAccount();
      } catch (_) {}
    }
  }

  Future<void> _payQuoteSalon(BuildContext context, Appointment appointment) async {
    try {
      await state.acceptQuoteAtSalon(appointment.id);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tu paies au salon, Nord Foire.')),
      );
    } catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))),
      );
    }
  }

  Future<void> _redeem(BuildContext context) async {
    try {
      await state.redeemPoints();
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '${formatFcfa(state.user?.redeemFcfa ?? 1000)} de crédit salon ajoutés.',
          ),
        ),
      );
    } catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))),
      );
    }
  }

  Future<void> _cancelPlan(BuildContext context) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.of(context).card,
        title: const Text('Résilier ?'),
        content: const Text(
          'L’abonnement s’arrête. Les visites restantes ne seront plus utilisables.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Garder'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Résilier'),
          ),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;
    try {
      await state.cancelMembership();
    } catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))),
      );
    }
  }

  Future<void> _openEditSheet(BuildContext context, UserProfile user) {
    return showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.of(context).card,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (context) => _EditProfileSheet(user: user),
    );
  }

  Future<void> _openSalon(BuildContext context) async {
    try {
      final salon = await state.repository.fetchSalon();
      if (!context.mounted) return;
      await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => SalonScreen(
            salon: salon,
            onReserve: () {
              Navigator.pop(context);
              onReserve?.call();
            },
          ),
        ),
      );
    } catch (_) {}
  }

  void _openJournal(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const BlogScreen()),
    );
  }

  Future<void> _openWhatsApp(BuildContext context) async {
    try {
      final salon = await state.repository.fetchSalon();
      final digits = salon.phone.replaceAll(RegExp(r'\D'), '');
      final intl = digits.startsWith('221') ? digits : '221$digits';
      await launchUrl(
        Uri.parse('https://wa.me/$intl'),
        mode: LaunchMode.externalApplication,
      );
    } catch (_) {}
  }
}

class _ProfileLink extends StatelessWidget {
  const _ProfileLink({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Row(
          children: [
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  color: colors.onDark,
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
            ),
            Icon(Icons.chevron_right, size: 20, color: colors.mutedDark),
          ],
        ),
      ),
    );
  }
}

class _DashedEmpty extends StatelessWidget {
  const _DashedEmpty({
    required this.label,
    required this.action,
    this.onTap,
  });

  final String label;
  final String action;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    return CustomPaint(
      painter: _DashedRRectPainter(color: colors.stroke),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 14, 16),
        child: Row(
          children: [
            Expanded(
              child: Text(label, style: TextStyle(color: colors.muted, fontSize: 13)),
            ),
            if (onTap != null)
              GestureDetector(
                onTap: onTap,
                child: Text(
                  action,
                  style: const TextStyle(
                    color: AppColors.gold,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _DashedRRectPainter extends CustomPainter {
  const _DashedRRectPainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;
    final rrect = RRect.fromRectAndRadius(
      Offset.zero & size,
      const Radius.circular(16),
    );
    final path = Path()..addRRect(rrect);
    for (final metric in path.computeMetrics()) {
      var distance = 0.0;
      const dash = 5.0;
      const gap = 4.0;
      while (distance < metric.length) {
        final next = (distance + dash).clamp(0.0, metric.length);
        canvas.drawPath(metric.extractPath(distance, next), paint);
        distance += dash + gap;
      }
    }
  }

  @override
  bool shouldRepaint(covariant _DashedRRectPainter oldDelegate) =>
      oldDelegate.color != color;
}

class _AppearanceToggle extends StatelessWidget {
  const _AppearanceToggle({
    required this.dark,
    required this.onDark,
    required this.onLight,
  });

  final bool dark;
  final VoidCallback onDark;
  final VoidCallback onLight;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: AppColors.of(context).background,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _ThemePill(label: 'Sombre', selected: dark, onTap: onDark),
          _ThemePill(label: 'Clair', selected: !dark, onTap: onLight),
        ],
      ),
    );
  }
}

class _ThemePill extends StatelessWidget {
  const _ThemePill({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppColors.ink : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: selected ? AppColors.onInk : AppColors.of(context).onDark,
          ),
        ),
      ),
    );
  }
}

class _AppointmentTile extends StatelessWidget {
  const _AppointmentTile({
    required this.appointment,
    this.onPayOnline,
    this.onPaySalon,
  });

  final Appointment appointment;
  final VoidCallback? onPayOnline;
  final VoidCallback? onPaySalon;

  @override
  Widget build(BuildContext context) {
    final month = monthNamesFr[appointment.date.month - 1].toUpperCase();
    final monthLabel = month.length <= 4 ? month : month.substring(0, 4);
    return StrokeCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 58,
            padding: EdgeInsets.symmetric(vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.gold.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '${appointment.date.day}',
                  style: TextStyle(
                    fontFamily: 'Manrope',
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: AppColors.gold,
                    height: 1,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  monthLabel,
                  style: TextStyle(
                    fontSize: 10,
                    letterSpacing: 0.6,
                    color: AppColors.gold,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  appointment.serviceName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: AppColors.of(context).onDark,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  '${appointment.time} · ${appointment.location == LocationType.salon ? 'Salon Nord Foire' : 'À domicile'}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  appointment.waitingQuote
                      ? 'Devis en préparation'
                      : appointment.paid
                          ? '${formatFcfa(appointment.total)} · Payé'
                          : appointment.salonChosen
                              ? '${formatFcfa(appointment.total)} · Paiement au salon'
                              : '${formatFcfa(appointment.total)} · Devis prêt',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: AppColors.gold, fontSize: 12),
                ),
                if (appointment.waitingQuote ||
                    (appointment.quoteReady && !appointment.salonChosen) ||
                    !appointment.paid) ...[
                  const SizedBox(height: 4),
                  Wrap(
                    spacing: 4,
                    runSpacing: 0,
                    children: [
                      if (appointment.waitingQuote ||
                          (appointment.quoteReady && !appointment.salonChosen))
                        _TileAction(
                          label: 'Voir le devis',
                          onPressed: () {
                            if (appointment.waitingQuote) {
                              showDialog<void>(
                                context: context,
                                builder: (ctx) => AlertDialog(
                                  title: const Text('Devis'),
                                  content: const Text('Devis pas encore disponible.'),
                                  actions: [
                                    TextButton(
                                      onPressed: () => Navigator.of(ctx).pop(),
                                      child: const Text('Fermer'),
                                    ),
                                  ],
                                ),
                              );
                              return;
                            }
                            showDialog<void>(
                              context: context,
                              builder: (ctx) => AlertDialog(
                                title: const Text('Ton devis'),
                                content: Text(
                                  '${appointment.serviceName}\n${formatFcfa(appointment.total)}',
                                ),
                                actions: [
                                  TextButton(
                                    onPressed: () => Navigator.of(ctx).pop(),
                                    child: const Text('Fermer'),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      if (appointment.quoteReady && !appointment.salonChosen) ...[
                        _TileAction(label: 'Confirmer', onPressed: onPayOnline),
                        _TileAction(label: 'Au salon', onPressed: onPaySalon),
                      ],
                      if (!appointment.paid)
                        _TileAction(
                          label: 'Annuler le RDV',
                          onPressed: () async {
                            final ok = await showDialog<bool>(
                              context: context,
                              builder: (ctx) => AlertDialog(
                                title: const Text('Annuler le rendez-vous'),
                                content: const Text(
                                  'Tu veux vraiment annuler ce rendez-vous ?',
                                ),
                                actions: [
                                  TextButton(
                                    onPressed: () => Navigator.of(ctx).pop(false),
                                    child: const Text('Non'),
                                  ),
                                  TextButton(
                                    onPressed: () => Navigator.of(ctx).pop(true),
                                    child: const Text('Annuler'),
                                  ),
                                ],
                              ),
                            );
                            if (ok == true && context.mounted) {
                              try {
                                await AppScope.of(context)
                                    .cancelBooking(appointment.id);
                              } catch (error) {
                                if (!context.mounted) return;
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      error
                                          .toString()
                                          .replaceFirst('Exception: ', ''),
                                    ),
                                  ),
                                );
                              }
                            }
                          },
                        ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TileAction extends StatelessWidget {
  const _TileAction({required this.label, this.onPressed});

  final String label;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return TextButton(
      onPressed: onPressed,
      style: TextButton.styleFrom(
        visualDensity: VisualDensity.compact,
        padding: const EdgeInsets.symmetric(horizontal: 8),
        minimumSize: Size.zero,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        foregroundColor: AppColors.of(context).onDark,
      ),
      child: Text(label, style: const TextStyle(fontSize: 13)),
    );
  }
}

class _EditProfileSheet extends StatefulWidget {
  const _EditProfileSheet({required this.user});

  final UserProfile user;

  @override
  State<_EditProfileSheet> createState() => _EditProfileSheetState();
}

class _EditProfileSheetState extends State<_EditProfileSheet> {
  late final _name = TextEditingController(text: widget.user.name);
  late final _phone = TextEditingController(text: widget.user.phone);
  late final _email = TextEditingController(text: widget.user.email ?? '');
  late final _password = TextEditingController();
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_name.text.trim().isEmpty) {
      setState(() => _error = 'Le nom est obligatoire.');
      return;
    }
    if (_phone.text.trim().length < 8) {
      setState(() => _error = 'Entre un numéro de téléphone valide.');
      return;
    }
    if (_password.text.isNotEmpty && _password.text.length < 8) {
      setState(() => _error = 'Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    try {
      await AppScope.of(context).updateProfile(
        name: _name.text,
        phone: _phone.text,
        email: _email.text,
        password: _password.text.trim().isEmpty ? null : _password.text,
      );
      if (mounted) Navigator.pop(context);
    } catch (error) {
      setState(() => _error = error.toString().replaceFirst('Exception: ', ''));
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.viewInsetsOf(context).bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 12, 20, 20 + bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.of(context).handle,
                borderRadius: BorderRadius.circular(99),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text('Modifier le profil', style: Theme.of(context).textTheme.displaySmall),
          const SizedBox(height: 16),
          TextField(
            controller: _name,
            textCapitalization: TextCapitalization.words,
            decoration: const InputDecoration(labelText: 'Nom complet'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _phone,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(labelText: 'Téléphone'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(labelText: 'Email'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _password,
            obscureText: true,
            decoration: const InputDecoration(
              labelText: 'Nouveau mot de passe',
              helperText: 'Laisse vide pour ne pas changer',
            ),
          ),
          if (_error != null) ...[
            const SizedBox(height: 10),
            Text(_error!, style: const TextStyle(color: Colors.redAccent)),
          ],
          const SizedBox(height: 18),
          GoldButton(label: 'Enregistrer', onPressed: _save),
        ],
      ),
    );
  }
}
