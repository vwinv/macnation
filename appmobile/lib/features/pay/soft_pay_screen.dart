import 'dart:async';

import 'package:flutter/material.dart';
import 'package:paytech/paytech.dart';

import '../../core/format.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_widgets.dart';
import '../../data/api_exception.dart';
import '../../data/models.dart';
import '../../state/app_state.dart';

Future<bool> completeOnlinePayment(
  BuildContext context, {
  String? invoiceId,
  String? pendingId,
  required int amount,
  required PaymentMethod method,
  required String name,
  required String phone,
  String? email,
}) async {
  if (method == PaymentMethod.salon) return true;
  if ((invoiceId == null || invoiceId.isEmpty) &&
      (pendingId == null || pendingId.isEmpty)) {
    return false;
  }
  final paid = await Navigator.of(context).push<bool>(
    MaterialPageRoute(
      builder: (_) => SoftPayScreen(
        invoiceId: invoiceId,
        pendingId: pendingId,
        amount: amount,
        method: method,
        name: name,
        phone: phone,
        email: email,
      ),
    ),
  );
  return paid == true;
}

class SoftPayScreen extends StatefulWidget {
  const SoftPayScreen({
    super.key,
    this.invoiceId,
    this.pendingId,
    required this.amount,
    required this.method,
    required this.name,
    required this.phone,
    this.email,
  });

  final String? invoiceId;
  final String? pendingId;
  final int amount;
  final PaymentMethod method;
  final String name;
  final String phone;
  final String? email;

  @override
  State<SoftPayScreen> createState() => _SoftPayScreenState();
}

class _SoftPayScreenState extends State<SoftPayScreen> {
  bool _starting = true;
  bool _paid = false;
  String? _error;
  String _message = '';
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _start();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _start() async {
    setState(() {
      _starting = true;
      _error = null;
    });
    try {
      final launch = await AppScope.of(context).repository.startSoftPay(
        invoiceId: widget.invoiceId,
        pendingId: widget.pendingId,
        method: widget.method,
        name: widget.name,
        phone: widget.phone,
        email: widget.email,
      );
      if (!mounted) return;
      setState(() {
        _starting = false;
        _message = launch.message;
      });
      if (launch.url != null) {
        final result = await Navigator.of(context).push<bool>(
          MaterialPageRoute(
            builder: (_) => PayTech(
              launch.url!,
              appBarTitle: 'Paiement MAC NATION',
              appBarBgColor: AppColors.gold,
              centerTitle: true,
            ),
          ),
        );
        if (!mounted) return;
        if (result == true) await _check();
      }
      _watch();
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _starting = false;
        _error = error.message;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _starting = false;
        _error = 'Paiement indisponible pour le moment.';
      });
    }
  }

  void _watch() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 3), (_) => _check());
    _check();
  }

  Future<void> _check() async {
    try {
      final paid = await AppScope.of(context).repository.invoicePaid(
        invoiceId: widget.invoiceId,
        pendingId: widget.pendingId,
        method: widget.method,
      );
      if (!mounted || !paid) return;
      _timer?.cancel();
      setState(() => _paid = true);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Paiement')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
          child: Column(
            children: [
              const Spacer(),
              Text(
                formatFcfa(widget.amount),
                style: Theme.of(context).textTheme.displayLarge,
              ),
              const SizedBox(height: 8),
              Text(
                paymentLabel(widget.method),
                style: const TextStyle(color: AppColors.gold),
              ),
              const SizedBox(height: 24),
              if (_starting)
                const CircularProgressIndicator(color: AppColors.gold)
              else if (_paid) ...[
                const Icon(Icons.check_circle, color: AppColors.gold, size: 56),
                const SizedBox(height: 16),
                const Text(
                  'Paiement reçu',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 18,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Merci. À tout à l’heure au salon.',
                  textAlign: TextAlign.center,
                ),
              ] else ...[
                Text(
                  _error ??
                      (_message.isEmpty
                          ? 'Ouvre ton app pour valider. MAC NATION reste ouvert.'
                          : _message),
                  textAlign: TextAlign.center,
                ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  const Text(
                    'Rien n’est enregistré tant que le paiement n’est pas validé.',
                    textAlign: TextAlign.center,
                  ),
                ],
              ],
              const Spacer(),
              if (_paid)
                GoldButton(
                  label: 'Continuer',
                  onPressed: () => Navigator.pop(context, true),
                )
              else ...[
                GoldButton(
                  label: _error == null ? 'J’ai payé' : 'Réessayer',
                  loading: _starting,
                  onPressed: _starting
                      ? null
                      : () {
                          if (_error != null) {
                            _start();
                          } else {
                            _check();
                          }
                        },
                ),
                const SizedBox(height: 10),
                GhostButton(
                  label: 'Plus tard',
                  onPressed: () => Navigator.pop(context, false),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

String paymentLabel(PaymentMethod method) {
  return switch (method) {
    PaymentMethod.wave => 'Wave',
    PaymentMethod.orangeMoney => 'Orange Money',
    PaymentMethod.freeMoney => 'Free Money',
    PaymentMethod.salon => 'Au salon',
  };
}
