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
  PaymentMethod? method,
  required String name,
  required String phone,
  String? email,
  bool isBooking = false,
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
        isBooking: isBooking,
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
    this.method,
    required this.name,
    required this.phone,
    this.email,
    this.isBooking = false,
  });

  final String? invoiceId;
  final String? pendingId;
  final int amount;
  final PaymentMethod? method;
  final String name;
  final String phone;
  final String? email;
  final bool isBooking;

  @override
  State<SoftPayScreen> createState() => _SoftPayScreenState();
}

class _SoftPayScreenState extends State<SoftPayScreen>
    with WidgetsBindingObserver {
  bool _starting = true;
  bool _opening = false;
  bool _paid = false;
  String? _error;
  String _message = '';
  String? _payUrl;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _start();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _timer?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && !_paid) _check();
  }

  Future<void> _start() async {
    if (!mounted) return;
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
        _payUrl = launch.url;
      });
      _watch();
      if (launch.url == null || launch.url!.isEmpty) {
        setState(() {
          _error = launch.message.isNotEmpty
              ? launch.message
              : 'Impossible d’ouvrir PayTech.';
        });
        return;
      }
      await _openPaytech();
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _starting = false;
        _error = error.message;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _starting = false;
        _error = error.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  Future<void> _openPaytech() async {
    final url = _payUrl;
    if (url == null || url.isEmpty || !mounted || _opening || _paid) return;
    _opening = true;
    try {
      final paymentResult = await Navigator.push<bool>(
        context,
        MaterialPageRoute(
          builder: (context) => PayTech(
            url,
            appBarTitle: 'Paiement MAC NATION',
            appBarBgColor: AppColors.ink,
            appBarTextStyle: const TextStyle(
              color: AppColors.onInk,
              fontWeight: FontWeight.w600,
              fontSize: 16,
            ),
            centerTitle: true,
          ),
        ),
      );
      if (!mounted) return;
      if (paymentResult == true) await _check();
    } finally {
      _opening = false;
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
      appBar: AppBar(title: Text('PAIEMENT')),
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(24, 16, 24, 24),
          child: Column(
            children: [
              Spacer(),
              Text(
                formatFcfa(widget.amount),
                style: Theme.of(context).textTheme.displayLarge,
              ),
              SizedBox(height: 8),
              Text(
                widget.method == null
                    ? 'Le paiement s’ouvre sur PayTech.'
                    : paymentLabel(widget.method!),
                style: TextStyle(color: AppColors.gold),
              ),
              SizedBox(height: 24),
              if (_starting)
                CircularProgressIndicator(color: AppColors.gold)
              else if (_paid) ...[
                Icon(Icons.check_circle, color: AppColors.gold, size: 56),
                SizedBox(height: 16),
                Text(
                  widget.isBooking ? 'Rendez-vous pris' : 'Paiement reçu',
                  style: TextStyle(
                    color: AppColors.of(context).onDark,
                    fontWeight: FontWeight.w700,
                    fontSize: 18,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  widget.isBooking
                      ? 'Ton rendez-vous est bien confirmé. On t’attend au salon.'
                      : 'Merci. À tout à l’heure au salon.',
                  textAlign: TextAlign.center,
                ),
              ] else ...[
                Text(
                  _error ??
                      (_message.isEmpty
                          ? 'Le paiement s’ouvre sur PayTech. On confirme tout seul dès que c’est validé.'
                          : _message),
                  textAlign: TextAlign.center,
                ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  const Text(
                    'Rien n’est enregistré tant que le paiement n’est pas validé.',
                    textAlign: TextAlign.center,
                  ),
                ] else ...[
                  const SizedBox(height: 16),
                  const Text(
                    'En attente de confirmation sur ton téléphone…',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppColors.gold),
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
                if (_payUrl != null) ...[
                  GoldButton(
                    label: 'Continuer le paiement',
                    onPressed: _starting ? null : _openPaytech,
                  ),
                  const SizedBox(height: 10),
                ],
                GoldButton(
                  label: _error == null ? 'Relancer le paiement' : 'Réessayer',
                  loading: _starting,
                  onPressed: _starting
                      ? null
                      : () {
                          if (_payUrl == null || _error != null) {
                            _start();
                          } else {
                            _openPaytech();
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
