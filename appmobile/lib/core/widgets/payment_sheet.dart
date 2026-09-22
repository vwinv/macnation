import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_widgets.dart';
import '../../data/models.dart';

const paymentLabels = {
  PaymentMethod.wave: 'Wave',
  PaymentMethod.orangeMoney: 'Orange Money',
  PaymentMethod.freeMoney: 'Free Money',
  PaymentMethod.salon: 'Payer au salon',
};

Future<PaymentMethod?> showPaymentSheet(
  BuildContext context, {
  required String title,
  required String amountLabel,
  bool allowSalon = false,
}) {
  return showModalBottomSheet<PaymentMethod>(
    context: context,
    backgroundColor: AppColors.card,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
    ),
    builder: (context) {
      var selected = PaymentMethod.wave;
      return StatefulBuilder(
        builder: (context, setModal) {
          final methods = [
            PaymentMethod.wave,
            PaymentMethod.orangeMoney,
            PaymentMethod.freeMoney,
            if (allowSalon) PaymentMethod.salon,
          ];
          return Padding(
            padding: EdgeInsets.fromLTRB(
              20,
              16,
              20,
              20 + MediaQuery.paddingOf(context).bottom,
            ),
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
                const SizedBox(height: 18),
                Text(title, style: Theme.of(context).textTheme.displaySmall),
                const SizedBox(height: 6),
                Text(
                  amountLabel,
                  style: const TextStyle(
                    fontFamily: 'BebasNeue',
                    fontSize: 28,
                    color: AppColors.gold,
                  ),
                ),
                const SizedBox(height: 16),
                for (final method in methods)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: StrokeCard(
                      color: selected == method
                          ? AppColors.gold.withValues(alpha: 0.12)
                          : AppColors.cardElevated,
                      onTap: () => setModal(() => selected = method),
                      child: Row(
                        children: [
                          Icon(
                            selected == method
                                ? Icons.radio_button_checked
                                : Icons.radio_button_off,
                            color: AppColors.gold,
                            size: 20,
                          ),
                          const SizedBox(width: 12),
                          Text(
                            paymentLabels[method]!,
                            style: const TextStyle(color: Colors.white),
                          ),
                        ],
                      ),
                    ),
                  ),
                const SizedBox(height: 8),
                GoldButton(
                  label: 'Payer',
                  onPressed: () => Navigator.pop(context, selected),
                ),
              ],
            ),
          );
        },
      );
    },
  );
}

class SuccessScreen extends StatelessWidget {
  const SuccessScreen({
    super.key,
    required this.title,
    required this.message,
    required this.actionLabel,
    required this.onAction,
  });

  final String title;
  final String message;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const Spacer(),
              Container(
                width: 84,
                height: 84,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.gold.withValues(alpha: 0.15),
                  border: Border.all(color: AppColors.gold),
                ),
                child: const Icon(Icons.check, color: AppColors.gold, size: 40),
              ),
              const SizedBox(height: 28),
              Text(
                title,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.displayMedium,
              ),
              const SizedBox(height: 12),
              Text(message, textAlign: TextAlign.center),
              const Spacer(),
              GoldButton(label: actionLabel, onPressed: onAction),
            ],
          ),
        ),
      ),
    );
  }
}
