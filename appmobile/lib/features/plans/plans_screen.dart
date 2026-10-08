import 'package:flutter/material.dart';

import '../../core/format.dart';
import '../../core/theme/app_assets.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_widgets.dart';
import '../../core/widgets/payment_sheet.dart';
import '../../data/models.dart';
import '../../state/app_state.dart';
import '../pay/soft_pay_screen.dart';
import '../shop/shop_screen.dart';

class PlansScreen extends StatefulWidget {
  const PlansScreen({super.key});

  @override
  State<PlansScreen> createState() => _PlansScreenState();
}

class _PlansScreenState extends State<PlansScreen> {
  Future<List<MembershipPlan>>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= AppScope.of(context).repository.fetchPlans();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: FutureBuilder<List<MembershipPlan>>(
          future: _future,
          builder: (context, snapshot) {
            if (!snapshot.hasData) {
              if (snapshot.hasError) {
                return const Center(
                  child: Padding(
                    padding: EdgeInsets.all(32),
                    child: Text(
                      'Impossible de charger les abonnements. Vérifie l’API.',
                      textAlign: TextAlign.center,
                    ),
                  ),
                );
              }
              return const Center(
                child: CircularProgressIndicator(color: AppColors.gold),
              );
            }
            final plans = snapshot.data!;
            return ListView(
              padding: EdgeInsets.fromLTRB(20, 8, 20, 32),
              children: [
                Text(
                  'Abonnements',
                  style: Theme.of(context).textTheme.displayLarge?.copyWith(
                        letterSpacing: 1.2,
                        fontWeight: FontWeight.w500,
                      ),
                ),
                SizedBox(height: 10),
                Text(
                  'Payer en ligne. Wave, Orange Money ou Free Money. Un rythme, pas une surprise.',
                  style: TextStyle(
                    color: AppColors.of(context).muted,
                    height: 1.45,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 18),
                const AssetPhoto(AppAssets.reception, height: 168, radius: 18),
                const SizedBox(height: 16),
                for (final plan in plans) ...[
                  _PlanCard(
                    plan: plan,
                    onPay: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => PlanCheckoutScreen(plan: plan),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
              ],
            );
          },
        ),
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({required this.plan, required this.onPay});

  final MembershipPlan plan;
  final VoidCallback onPay;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(18, 18, 18, 16),
      decoration: BoxDecoration(
        color: plan.featured
            ? AppColors.of(context).featured
            : AppColors.of(context).card,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: plan.featured ? AppColors.gold : AppColors.of(context).stroke,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  plan.name,
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w600,
                    color: AppColors.of(context).onDark,
                    height: 1.1,
                  ),
                ),
              ),
              if (plan.featured) GoldChip('Le plus choisi'),
            ],
          ),
          SizedBox(height: 10),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                formatFcfa(plan.price),
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  color: AppColors.gold,
                  height: 1,
                ),
              ),
              Padding(
                padding: EdgeInsets.only(bottom: 3, left: 8),
                child: Text(
                  'par mois',
                  style: TextStyle(color: AppColors.of(context).muted, fontSize: 14),
                ),
              ),
            ],
          ),
          SizedBox(height: 14),
          for (final perk in plan.perks)
            Padding(
              padding: EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  Icon(Icons.check, size: 16, color: AppColors.gold),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      perk,
                      style: TextStyle(
                        color: AppColors.of(context).onDark,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 8),
          GoldButton(
            label: 'Payer par Wave / Orange / Free',
            onPressed: onPay,
          ),
        ],
      ),
    );
  }
}

class PlanCheckoutScreen extends StatefulWidget {
  const PlanCheckoutScreen({super.key, required this.plan});

  final MembershipPlan plan;

  @override
  State<PlanCheckoutScreen> createState() => _PlanCheckoutScreenState();
}

class _PlanCheckoutScreenState extends State<PlanCheckoutScreen> {
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  bool _loading = false;
  bool _prefilled = false;
  String? _error;
  String? _invoiceId;
  String? _pendingId;

  bool get _hasSession =>
      (_invoiceId != null && _invoiceId!.isNotEmpty) ||
      (_pendingId != null && _pendingId!.isNotEmpty);

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_prefilled) return;
    _prefilled = true;
    final user = AppScope.of(context).user;
    if (user == null) return;
    _name.text = user.name;
    _phone.text = user.phone;
    _email.text = user.email ?? '';
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _email.dispose();
    super.dispose();
  }

  Future<void> _pay() async {
    final state = AppScope.of(context);
    final name = _name.text.trim();
    final phone = _phone.text.trim();
    final email = _email.text.trim();
    if (name.isEmpty) {
      setState(() => _error = 'Indique ton nom.');
      return;
    }
    if (phone.length < 8) {
      setState(() => _error = 'Indique un numéro sénégalais valide.');
      return;
    }
    if (!state.isLoggedIn && email.isEmpty) {
      setState(() => _error = 'Indique ton email pour recevoir tes accès.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      if (!_hasSession) {
        final outcome = await state.checkoutPlan(
          plan: widget.plan,
          name: name,
          phone: phone,
          email: email.isEmpty ? null : email,
        );
        _invoiceId = outcome.invoiceId;
        _pendingId = outcome.pendingId;
        if (outcome.loginRequired || !state.isLoggedIn) {
          if (!mounted) return;
          final loggedIn = await showCheckoutLogin(
            context,
            phone: phone,
            accountCreated: outcome.accountCreated,
          );
          if (!loggedIn) {
            if (!mounted) return;
            setState(() => _loading = false);
            return;
          }
        }
      } else if (!state.isLoggedIn) {
        final loggedIn = await showCheckoutLogin(context, phone: phone);
        if (!loggedIn) {
          if (!mounted) return;
          setState(() => _loading = false);
          return;
        }
      }
      if (!mounted) return;
      final paid = await completeOnlinePayment(
        context,
        invoiceId: _invoiceId,
        pendingId: _pendingId,
        amount: widget.plan.price,
        name: name,
        phone: phone,
        email: email.isEmpty ? null : email,
      );
      if (paid) {
        try {
          await state.refreshAccount();
        } catch (_) {}
      }
      if (!mounted) return;
      setState(() => _loading = false);
      if (!paid) return;
      await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => SuccessScreen(
            title: 'Abonnement activé',
            message:
                '${widget.plan.name} démarre dès aujourd’hui. Les visites non utilisées ne se reportent pas.',
            actionLabel: 'Retour',
            onAction: () =>
                Navigator.popUntil(context, (route) => route.isFirst),
          ),
        ),
      );
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = error.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final plan = widget.plan;
    final state = AppScope.of(context);
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: EdgeInsets.fromLTRB(20, 8, 20, 32),
          children: [
            Row(
              children: [
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: Icon(Icons.chevron_left),
                ),
                Expanded(
                  child: Text(
                    plan.name,
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                ),
              ],
            ),
            SizedBox(height: 8),
            Text(
              formatFcfa(plan.price),
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.w700,
                color: AppColors.gold,
              ),
            ),
            SizedBox(height: 6),
            Text(
              'Par mois. Valable à Nord Foire. Les visites non utilisées ne se reportent pas.',
              style: TextStyle(color: AppColors.of(context).muted, height: 1.45),
            ),
            const SizedBox(height: 20),
            TextField(
              controller: _name,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(labelText: 'Nom complet *'),
            ),
            const SizedBox(height: 12),
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
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              decoration: InputDecoration(
                labelText: state.isLoggedIn ? 'Email' : 'Email *',
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Colors.redAccent)),
            ],
            const SizedBox(height: 22),
            GoldButton(
              label: _loading
                  ? 'Préparation…'
                  : _hasSession
                      ? 'Relancer le paiement'
                      : 'Payer ${formatFcfa(plan.price)}',
              loading: _loading,
              onPressed: _loading ? null : _pay,
            ),
          ],
        ),
      ),
    );
  }
}
