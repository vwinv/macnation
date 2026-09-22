import 'package:flutter/material.dart';

import '../../core/format.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_widgets.dart';
import '../../data/models.dart';
import '../../state/app_state.dart';
import 'social_login.dart';

class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    if (!state.isLoggedIn) return const _LoginView();
    return _ProfileView(state: state);
  }
}

class _LoginView extends StatefulWidget {
  const _LoginView();

  @override
  State<_LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends State<_LoginView> {
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (_phone.text.trim().length < 8) {
      setState(() => _error = 'Entre un numéro de téléphone valide.');
      return;
    }
    if (_password.text.length < 8) {
      setState(() => _error = 'Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await AppScope.of(context).login(
        name: _name.text,
        phone: _phone.text,
        password: _password.text,
      );
    } catch (error) {
      setState(() => _error = error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
        child: Column(
          children: [
            const MnLogo(size: 200),
            const SizedBox(height: 10),
            Text(
              'MAC NATION',
              style: Theme.of(context).textTheme.displaySmall?.copyWith(
                    letterSpacing: 2.4,
                  ),
            ),
            const SizedBox(height: 28),
            Expanded(
              child: ListView(
                children: [
                  TextField(
                    controller: _name,
                    textCapitalization: TextCapitalization.words,
                    decoration: const InputDecoration(labelText: 'Nom'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _phone,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(labelText: 'Téléphone *'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _password,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'Mot de passe *',
                      helperText: '8 caractères minimum',
                    ),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 8),
                    Text(_error!, style: const TextStyle(color: Colors.redAccent)),
                  ],
                  const SizedBox(height: 8),
                  GoldButton(
                    label: 'Entrer',
                    loading: _loading,
                    onPressed: _loading ? null : _login,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const _SocialLogos(),
          ],
        ),
      ),
    );
  }
}

class _SocialLogos extends StatelessWidget {
  const _SocialLogos();

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _SocialLogo(
          onTap: () => _social(context, 'google'),
          child: const CustomPaint(
            size: Size.square(22),
            painter: _GoogleMarkPainter(),
          ),
        ),
        const SizedBox(width: 18),
        _SocialLogo(
          onTap: () => _social(context, 'apple'),
          child: const Icon(Icons.apple, color: Colors.white, size: 26),
        ),
        const SizedBox(width: 18),
        _SocialLogo(
          onTap: () => _social(context, 'facebook'),
          child: const Icon(Icons.facebook, color: Color(0xFF1877F2), size: 26),
        ),
      ],
    );
  }

  Future<void> _social(BuildContext context, String provider) async {
    try {
      await startSocialLogin(context, provider: provider);
    } catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))),
      );
    }
  }
}

class _SocialLogo extends StatelessWidget {
  const _SocialLogo({required this.child, required this.onTap});

  final Widget child;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.card,
      shape: const CircleBorder(
        side: BorderSide(color: AppColors.stroke),
      ),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: SizedBox(
          width: 54,
          height: 54,
          child: Center(child: child),
        ),
      ),
    );
  }
}

class _GoogleMarkPainter extends CustomPainter {
  const _GoogleMarkPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final stroke = size.width * 0.18;
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.butt;
    final inset = stroke / 2 + 1;
    final arcRect = Rect.fromLTWH(
      inset,
      inset,
      size.width - inset * 2,
      size.height - inset * 2,
    );

    paint.color = const Color(0xFF4285F4);
    canvas.drawArc(arcRect, -0.2, 1.4, false, paint);
    paint.color = const Color(0xFF34A853);
    canvas.drawArc(arcRect, 1.2, 0.9, false, paint);
    paint.color = const Color(0xFFFBBC05);
    canvas.drawArc(arcRect, 2.1, 0.8, false, paint);
    paint.color = const Color(0xFFEA4335);
    canvas.drawArc(arcRect, 2.9, 1.2, false, paint);

    final bar = Paint()
      ..color = const Color(0xFF4285F4)
      ..style = PaintingStyle.fill;
    canvas.drawRect(
      Rect.fromLTWH(size.width * 0.48, size.height * 0.42, size.width * 0.42, stroke),
      bar,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _ProfileView extends StatelessWidget {
  const _ProfileView({required this.state});

  final AppState state;

  @override
  Widget build(BuildContext context) {
    final user = state.user!;
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
      children: [
        const SafeArea(bottom: false, child: SizedBox.shrink()),
        Text('Mon compte', style: Theme.of(context).textTheme.displayLarge),
        const SizedBox(height: 16),
        StrokeCard(
          child: Row(
            children: [
              const CircleAvatar(
                radius: 28,
                backgroundColor: AppColors.gold,
                child: Icon(Icons.person, color: AppColors.ink),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(user.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 18)),
                    Text(user.phone),
                    if (user.email != null) Text(user.email!),
                  ],
                ),
              ),
              IconButton(
                onPressed: () => _openEditSheet(context, user),
                tooltip: 'Modifier',
                icon: const Icon(Icons.edit_outlined, color: AppColors.gold),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: StrokeCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Points'),
                    PriceTag('${user.points}', large: true),
                    Text('${user.redeemPoints} pts = ${formatFcfa(user.redeemFcfa)}'),
                    if (user.creditFcfa > 0) ...[
                      const SizedBox(height: 6),
                      Text(
                        'Crédit ${formatFcfa(user.creditFcfa)}',
                        style: const TextStyle(color: AppColors.gold),
                      ),
                    ],
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
                  ],
                ),
              ),
            ),
          ],
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
        const SizedBox(height: 18),
        const Text('Mes rendez-vous', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        if (state.appointments.isEmpty)
          const StrokeCard(child: Text('Aucun rendez-vous pour le moment.'))
        else if (state.appointments.length == 1)
          _AppointmentTile(appointment: state.appointments.first)
        else
          SizedBox(
            height: 128,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: state.appointments.length,
              separatorBuilder: (_, _) => const SizedBox(width: 10),
              itemBuilder: (context, index) {
                return SizedBox(
                  width: 268,
                  child: _AppointmentTile(appointment: state.appointments[index]),
                );
              },
            ),
          ),
        const SizedBox(height: 18),
        const Text('Achats boutique', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        if (state.orders.isEmpty)
          const StrokeCard(child: Text('Pas encore d’achat.'))
        else
          ...state.orders.map(
            (product) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: StrokeCard(
                child: Row(
                  children: [
                    Expanded(
                      child: Text(product.name, style: const TextStyle(color: Colors.white)),
                    ),
                    Text(formatFcfa(product.price), style: const TextStyle(color: AppColors.gold)),
                  ],
                ),
              ),
            ),
          ),
        const SizedBox(height: 20),
        GhostButton(
          label: 'Se déconnecter',
          onPressed: () => state.logout(),
        ),
      ],
    );
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
        backgroundColor: AppColors.card,
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
      backgroundColor: AppColors.card,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (context) => _EditProfileSheet(user: user),
    );
  }
}

class _AppointmentTile extends StatelessWidget {
  const _AppointmentTile({required this.appointment});

  final Appointment appointment;

  @override
  Widget build(BuildContext context) {
    final month = monthNamesFr[appointment.date.month - 1].toUpperCase();
    final monthLabel = month.length <= 4 ? month : month.substring(0, 4);
    return StrokeCard(
      child: Row(
        children: [
          Container(
            width: 58,
            padding: const EdgeInsets.symmetric(vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.gold.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                Text(
                  '${appointment.date.day}',
                  style: const TextStyle(
                    fontFamily: 'BebasNeue',
                    fontSize: 26,
                    color: AppColors.gold,
                    height: 1,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  monthLabel,
                  style: const TextStyle(
                    fontSize: 10,
                    letterSpacing: 0.6,
                    color: AppColors.gold,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  appointment.serviceName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  '${appointment.time} · ${appointment.location == LocationType.salon ? 'Salon Nord Foire' : 'À domicile'}',
                ),
                Text(
                  '${formatFcfa(appointment.total)} · ${appointment.paid ? 'Payé' : 'À payer au salon'}',
                  style: const TextStyle(color: AppColors.gold, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
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
                color: Colors.white24,
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
