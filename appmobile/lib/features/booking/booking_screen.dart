import 'package:flutter/material.dart';

import '../../core/format.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_widgets.dart';
import '../../core/widgets/payment_sheet.dart';
import '../../data/models.dart';
import '../../state/app_state.dart';
import '../pay/soft_pay_screen.dart';

class BookingScreen extends StatefulWidget {
  const BookingScreen({super.key, this.asPage = false});

  final bool asPage;

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  int _step = 0;
  int _seenRequestId = 0;
  List<ServiceItem> _services = [];
  List<TimeSlot> _slots = [];
  bool _loadingSlots = false;
  bool _submitting = false;
  SalonSchedule _schedule = const SalonSchedule();
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _address = TextEditingController();

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final state = AppScope.of(context);
    if (_services.isEmpty) {
      state.repository.fetchServices().then((value) {
        if (mounted) setState(() => _services = value);
      });
      state.repository.fetchSchedule().then((value) {
        if (mounted) setState(() => _schedule = value);
      });
    }
    if (state.bookingRequestId != _seenRequestId) {
      _seenRequestId = state.bookingRequestId;
      _step = state.bookingStartStep;
      _slots = [];
    }
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _email.dispose();
    _address.dispose();
    super.dispose();
  }

  BookingDraft get draft => AppScope.of(context).booking;

  Future<void> _pickService() async {
    final currentId = draft.service?.id;
    final selected = await showModalBottomSheet<ServiceItem>(
      context: context,
      backgroundColor: AppColors.card,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (context) {
        return DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.72,
          minChildSize: 0.45,
          maxChildSize: 0.92,
          builder: (context, controller) {
            return Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
              child: Column(
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
                  Text('Service', style: Theme.of(context).textTheme.displaySmall),
                  const SizedBox(height: 4),
                  const Text('Choisis la prestation, le détail s’affiche ici.'),
                  const SizedBox(height: 14),
                  Expanded(
                    child: ListView.separated(
                      controller: controller,
                      itemCount: _services.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final service = _services[index];
                        final active = currentId == service.id;
                        return StrokeCard(
                          color: active
                              ? AppColors.gold.withValues(alpha: 0.12)
                              : AppColors.cardElevated,
                          onTap: () => Navigator.pop(context, service),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      service.name,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w700,
                                        fontSize: 16,
                                      ),
                                    ),
                                  ),
                                  Text(
                                    service.price != null
                                        ? formatFcfa(service.price!)
                                        : (service.priceLabel ?? ''),
                                    style: const TextStyle(
                                      color: AppColors.gold,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${service.duration} · ${service.category}',
                                style: const TextStyle(color: AppColors.gold, fontSize: 12),
                              ),
                              const SizedBox(height: 6),
                              Text(service.description),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
    if (selected == null || !mounted) return;
    setState(() {
      draft.service = selected;
      draft.time = null;
      if (selected.isQuoted) draft.paymentTiming = PaymentTiming.atSalon;
    });
    if (draft.date != null) _loadSlots(draft.date!);
  }

  Future<void> _loadSlots(DateTime day) async {
    setState(() => _loadingSlots = true);
    try {
      final slots = await AppScope.of(context).repository.fetchSlots(
        day,
        serviceId: draft.service?.id,
      );
      if (!mounted) return;
      setState(() {
        _slots = slots;
        _loadingSlots = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loadingSlots = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Impossible de charger les créneaux.')),
      );
    }
  }

  Future<void> _submit() async {
    draft.name = _name.text;
    draft.phone = _phone.text;
    draft.email = _email.text;
    draft.address = _address.text;
    if (!draft.isComplete) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            draft.location == LocationType.home && draft.address.trim().isEmpty
                ? 'Indique l’adresse pour le déplacement.'
                : 'Complète la prestation, le créneau et tes coordonnées.',
          ),
        ),
      );
      return;
    }

    if (draft.service?.isQuoted ?? false) {
      draft.paymentTiming = PaymentTiming.atSalon;
    }

    if (draft.paymentTiming == PaymentTiming.now) {
      final method = await showPaymentSheet(
        context,
        title: draft.service?.name ?? 'Rendez-vous',
        amountLabel: formatFcfa(draft.total),
        allowSalon: false,
      );
      if (method == null || !mounted) return;
      draft.paymentMethod = method;
    } else {
      draft.paymentMethod = PaymentMethod.salon;
    }

    final appState = AppScope.of(context);
    final payNow = draft.paymentTiming == PaymentTiming.now;
    final method = draft.paymentMethod;
    final name = draft.name.trim();
    final phone = draft.phone.trim();
    final email = draft.email.trim();
    final serviceName = draft.service?.name ?? 'Prestation';
    final when = draft.date;
    final time = draft.time ?? '';
    setState(() => _submitting = true);
    try {
      final outcome = await appState.confirmBooking();
      var paid = outcome.appointment?.paid ?? false;
      if (!mounted) return;
      if (payNow && method != PaymentMethod.salon) {
        paid = await completeOnlinePayment(
          context,
          invoiceId: outcome.invoiceId,
          pendingId: outcome.pendingId,
          amount: outcome.amount,
          method: method,
          name: name,
          phone: phone,
          email: email,
          isBooking: true,
        );
        if (paid) {
          appState.resetBooking();
          try {
            await appState.refreshAccount();
          } catch (_) {}
        }
      }
      if (!mounted) return;
      setState(() => _submitting = false);
      final navigator = Navigator.of(context);
      await navigator.push(
        MaterialPageRoute(
          builder: (_) => SuccessScreen(
            title: paid || !payNow
                ? (outcome.loginRequired ? 'Connecte-toi pour confirmer' : 'Rendez-vous confirmé')
                : 'Paiement non reçu',
            message: paid || !payNow
                ? '${outcome.appointment?.serviceName ?? serviceName} · ${formatDateLong(outcome.appointment?.date ?? when ?? DateTime.now())} à ${outcome.appointment?.time ?? time}. ${paid ? 'Payé en ligne. ' : (draft.service?.isQuoted ?? false) ? 'Tarif sur devis, à confirmer au salon. ' : 'Paiement au salon. '}${outcome.loginRequired ? (outcome.accountCreated ? 'Ton compte est créé : mot de passe par SMS et email. Ouvre Mon compte pour confirmer.' : 'Ouvre Mon compte pour confirmer ce rendez-vous.') : ''}'
                : 'Le rendez-vous n’a pas été enregistré. Réessaie le paiement.',
            actionLabel: outcome.loginRequired ? 'Ouvrir mon compte' : 'Retour à l’accueil',
            onAction: () => navigator.popUntil((route) => route.isFirst),
          ),
        ),
      );
    } catch (error) {
      if (!mounted) return;
      setState(() => _submitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final body = ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 40),
      children: [
        const SafeArea(bottom: false, child: SizedBox.shrink()),
        Text('Réserver', style: Theme.of(context).textTheme.displayLarge),
        const SizedBox(height: 4),
        const Text('Salon : lun–sam 10h–21h, dim 12h–20h. À domicile : + 2 000 F, Dakar uniquement.'),
        const SizedBox(height: 18),
        _Steps(step: _step),
        const SizedBox(height: 20),
        if (_step == 0) _serviceStep(),
        if (_step == 1) _slotStep(),
        if (_step == 2) _identityStep(),
      ],
    );

    if (!widget.asPage) return body;
    return Scaffold(
      appBar: AppBar(title: const Text('Réserver')),
      body: body,
    );
  }

  Widget _serviceStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (draft.service != null && !draft.service!.isQuoted) ...[
          const Text('Paiement du rendez-vous', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _Choice(
                  title: 'Payer maintenant',
                  subtitle: 'Wave · Orange · Free',
                  selected: draft.paymentTiming == PaymentTiming.now,
                  onTap: () => setState(() => draft.paymentTiming = PaymentTiming.now),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _Choice(
                  title: 'Payer au salon',
                  subtitle: 'Espèces ou Mobile Money',
                  selected: draft.paymentTiming == PaymentTiming.atSalon,
                  onTap: () => setState(() => draft.paymentTiming = PaymentTiming.atSalon),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
        ],
        const Text('Lieu', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _Choice(
                title: 'Au salon',
                subtitle: 'Nord Foire',
                selected: draft.location == LocationType.salon,
                onTap: () => setState(() => draft.location = LocationType.salon),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _Choice(
                title: 'À domicile',
                subtitle: '+ 2 000 F',
                selected: draft.location == LocationType.home,
                onTap: () => setState(() => draft.location = LocationType.home),
              ),
            ),
          ],
        ),
        const SizedBox(height: 18),
        const Text('Service', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
        const SizedBox(height: 10),
        if (_services.isEmpty)
          const Center(child: CircularProgressIndicator(color: AppColors.gold))
        else
          StrokeCard(
            onTap: _pickService,
            child: Row(
              children: [
                Expanded(
                  child: draft.service == null
                      ? const Text('Choisir une prestation')
                      : Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              draft.service!.name,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            Text(
                              '${draft.service!.duration} · ${draft.service!.price != null ? formatFcfa(draft.service!.price!) : (draft.service!.priceLabel ?? '')}',
                            ),
                          ],
                        ),
                ),
                const Icon(Icons.keyboard_arrow_down, color: AppColors.gold),
              ],
            ),
          ),
        const SizedBox(height: 12),
        GoldButton(
          label: 'Choisir un créneau',
          onPressed: draft.service == null
              ? null
              : () {
                  setState(() => _step = 1);
                  if (draft.date != null) _loadSlots(draft.date!);
                },
        ),
      ],
    );
  }

  Widget _slotStep() {
    final now = DateTime.now();
    final monthStart = DateTime(now.year, now.month, 1);
    final daysInMonth = DateTime(now.year, now.month + 1, 0).day;
    final startWeekday = monthStart.weekday;
    final cells = startWeekday - 1 + daysInMonth;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (draft.service != null) ...[
          StrokeCard(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    draft.service!.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                Text(
                  draft.service!.price != null
                      ? formatFcfa(draft.service!.price!)
                      : (draft.service!.priceLabel ?? ''),
                  style: const TextStyle(color: AppColors.gold),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],
        Text(
          '${monthNamesFr[now.month - 1]} ${now.year}',
          style: Theme.of(context).textTheme.displaySmall,
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            for (final day in weekdayShortFr)
              Expanded(
                child: Text(
                  day,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 11, color: AppColors.muted),
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: cells,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 7,
            mainAxisSpacing: 6,
            crossAxisSpacing: 6,
          ),
          itemBuilder: (context, index) {
            final dayNum = index - (startWeekday - 2);
            if (dayNum < 1 || dayNum > daysInMonth) return const SizedBox.shrink();
            final date = DateTime(now.year, now.month, dayNum);
            final disabled = date.isBefore(DateTime(now.year, now.month, now.day)) ||
                _schedule.isClosed(date);
            final selected = draft.date?.day == dayNum;
            return GestureDetector(
              onTap: disabled
                  ? null
                  : () {
                      setState(() {
                        draft.date = date;
                        draft.time = null;
                      });
                      _loadSlots(date);
                    },
              child: Container(
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: selected ? AppColors.gold : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: selected ? AppColors.gold : AppColors.stroke,
                  ),
                ),
                child: Text(
                  '$dayNum',
                  style: TextStyle(
                    color: disabled
                        ? AppColors.mutedDark
                        : selected
                            ? AppColors.ink
                            : Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            );
          },
        ),
        const SizedBox(height: 18),
        const Text('Créneau', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
        const SizedBox(height: 10),
        if (draft.date == null)
          const Text('Choisissez un jour.')
        else if (_loadingSlots)
          const Center(child: CircularProgressIndicator(color: AppColors.gold))
        else if (_slots.where((slot) => slot.available).isEmpty)
          const Text('Plus de plage ce jour-là pour cette prestation.')
        else
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final slot in _slots.where((item) => item.available))
                GestureDetector(
                  onTap: () => setState(() => draft.time = slot.time),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(
                      color: draft.time == slot.time
                          ? AppColors.gold
                          : AppColors.card,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: AppColors.stroke,
                      ),
                    ),
                    child: Text(
                      slot.display,
                      style: TextStyle(
                        color: draft.time == slot.time
                            ? AppColors.ink
                            : Colors.white,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              child: GhostButton(
                label: 'Retour',
                onPressed: () => setState(() => _step = 0),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: GoldButton(
                label: 'Coordonnées',
                onPressed: draft.date == null || draft.time == null
                    ? null
                    : () => setState(() => _step = 2),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _identityStep() {
    final user = AppScope.of(context).user;
    if (user != null && _name.text.isEmpty) {
      _name.text = user.name;
      _phone.text = user.phone;
      _email.text = user.email ?? '';
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        StrokeCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(draft.service?.name ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
              Text(
                '${draft.date != null ? formatDateLong(draft.date!) : ''} · ${draft.time ?? ''} · ${draft.location == LocationType.home ? 'À domicile' : 'Salon'}',
              ),
              const SizedBox(height: 8),
              PriceTag(formatFcfa(draft.total), large: true),
            ],
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _name,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(labelText: 'Nom complet *'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _phone,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(labelText: 'Téléphone *'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _email,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(
            labelText: 'Email',
            hintText: 'Pour recevoir la confirmation',
          ),
        ),
        if (draft.location == LocationType.home) ...[
          const SizedBox(height: 12),
          TextField(
            controller: _address,
            textCapitalization: TextCapitalization.sentences,
            decoration: const InputDecoration(
              labelText: 'Adresse à Dakar *',
              hintText: 'Quartier, rue, précisions',
            ),
          ),
        ],
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              child: GhostButton(
                label: 'Retour',
                onPressed: () => setState(() => _step = 1),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: GoldButton(
                label: (draft.service?.isQuoted ?? false)
                    ? 'Demander le rendez-vous'
                    : draft.paymentTiming == PaymentTiming.now
                    ? 'Réserver et payer'
                    : 'Confirmer',
                loading: _submitting,
                onPressed: _submitting ? null : _submit,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _Steps extends StatelessWidget {
  const _Steps({required this.step});

  final int step;

  @override
  Widget build(BuildContext context) {
    const labels = ['Prestation', 'Créneau', 'Paiement'];
    return Row(
      children: [
        for (var i = 0; i < labels.length; i++) ...[
          if (i > 0)
            Expanded(
              child: Container(
                height: 1,
                color: i <= step ? AppColors.gold : AppColors.stroke,
              ),
            ),
          Column(
            children: [
              CircleAvatar(
                radius: 12,
                backgroundColor: i <= step ? AppColors.gold : AppColors.card,
                child: Text(
                  '${i + 1}',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: i <= step ? AppColors.ink : AppColors.muted,
                  ),
                ),
              ),
              const SizedBox(height: 4),
              Text(labels[i], style: const TextStyle(fontSize: 11)),
            ],
          ),
        ],
      ],
    );
  }
}

class _Choice extends StatelessWidget {
  const _Choice({
    required this.title,
    required this.subtitle,
    required this.selected,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return StrokeCard(
      color: selected ? AppColors.gold.withValues(alpha: 0.14) : AppColors.card,
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
          const SizedBox(height: 2),
          Text(subtitle, style: const TextStyle(fontSize: 12)),
        ],
      ),
    );
  }
}
