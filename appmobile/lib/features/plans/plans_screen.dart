import 'package:flutter/material.dart';

import '../../core/format.dart';
import '../../core/theme/app_assets.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_widgets.dart';
import '../../core/widgets/payment_sheet.dart';
import '../../data/models.dart';
import '../../state/app_state.dart';
import '../pay/soft_pay_screen.dart';

class PlansScreen extends StatefulWidget {
  const PlansScreen({super.key});

  @override
  State<PlansScreen> createState() => _PlansScreenState();
}

class _PlansScreenState extends State<PlansScreen> {
  Future<List<MembershipPlan>>? _future;
  bool _loading = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= AppScope.of(context).repository.fetchPlans();
  }

  Future<void> _pay(MembershipPlan plan) async {
    final method = await showPaymentSheet(
      context,
      title: 'Abonnement ${plan.name}',
      amountLabel: '${formatFcfa(plan.price)} / mois',
    );
    if (method == null || !mounted) return;
    final state = AppScope.of(context);
    if (!state.isLoggedIn) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Connecte-toi pour t’abonner.')),
      );
      return;
    }
    setState(() => _loading = true);
    try {
      final outcome = await state.payPlan(plan, method);
      var paid = method == PaymentMethod.salon;
      if (!mounted) return;
      if (!paid) {
        paid = await completeOnlinePayment(
          context,
          invoiceId: outcome.invoiceId,
          pendingId: outcome.pendingId,
          amount: outcome.amount,
          method: method,
          name: state.user?.name ?? '',
          phone: state.user?.phone ?? '',
          email: state.user?.email,
        );
        if (paid) {
          try {
            await state.refreshAccount();
          } catch (_) {}
        }
      }
      if (!mounted) return;
      setState(() => _loading = false);
      await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => SuccessScreen(
            title: paid ? 'Abonnement activé' : (method == PaymentMethod.salon ? 'Abonnement enregistré' : 'Paiement non reçu'),
            message: paid
                ? '${plan.name} démarre dès aujourd’hui. Les visites non utilisées ne se reportent pas.'
                : method == PaymentMethod.salon
                    ? '${plan.name} est enregistré. Valide le paiement pour l’activer.'
                    : 'L’abonnement n’a pas été activé. Réessaie le paiement.',
            actionLabel: 'Retour',
            onAction: () => Navigator.pop(context),
          ),
        ),
      );
    } catch (error) {
      if (!mounted) return;
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Abonnements')),
      body: FutureBuilder<List<MembershipPlan>>(
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
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
          children: [
            const Text(
              'Payer en ligne. Wave, Orange Money ou Free Money. Un rythme, pas une surprise.',
            ),
            const SizedBox(height: 16),
            AssetPhoto(AppAssets.waiting, height: 160),
            const SizedBox(height: 20),
            for (final plan in plans) ...[
              _PlanCard(
                plan: plan,
                loading: _loading,
                onPay: () => _pay(plan),
              ),
              const SizedBox(height: 12),
            ],
            const Text(
              'L’abonnement démarre dès le paiement. Les visites non utilisées ne se reportent pas au mois suivant.',
            ),
          ],
        );
      },
    ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({
    required this.plan,
    required this.onPay,
    required this.loading,
  });

  final MembershipPlan plan;
  final VoidCallback onPay;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: plan.featured
            ? AppColors.gold.withValues(alpha: 0.08)
            : AppColors.card,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: plan.featured ? AppColors.gold : AppColors.stroke,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(plan.name, style: Theme.of(context).textTheme.displaySmall),
              const Spacer(),
              if (plan.featured) const GoldChip('Le plus choisi'),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              PriceTag(formatFcfa(plan.price), large: true),
              Padding(
                padding: const EdgeInsets.only(bottom: 8, left: 6),
                child: Text(
                  'par mois',
                  style: const TextStyle(color: AppColors.muted),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          for (final perk in plan.perks)
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                children: [
                  const Icon(Icons.check, size: 16, color: AppColors.gold),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(perk, style: const TextStyle(color: Colors.white)),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 10),
          GoldButton(
            label: 'Payer par Wave / Orange / Free',
            loading: loading,
            onPressed: loading ? null : onPay,
          ),
        ],
      ),
    );
  }
}
