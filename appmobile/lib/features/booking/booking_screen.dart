import 'package:flutter/material.dart';

import '../../core/format.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_widgets.dart';
import '../../core/widgets/payment_sheet.dart';
import '../../data/models.dart';
import '../../state/app_state.dart';
import '../pay/soft_pay_screen.dart';

class BookingScreen extends StatefulWidget {
  const BookingScreen({super.key, this.asPage = false, this.onClose});

  final bool asPage;
  final VoidCallback? onClose;

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
  late DateTime _month = DateTime(DateTime.now().year, DateTime.now().month);
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _address = TextEditingController();

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final state = AppScope.of(context);
    if (_services.isEmpty) {
      _loadCatalog(state);
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

  Future<void> _loadCatalog(AppState state) async {
    await Future.wait([
      () async {
        try {
          final value = await state.repository.fetchServices();
          if (mounted) setState(() => _services = value);
        } catch (_) {}
      }(),
      () async {
        try {
          final value = await state.repository.fetchSchedule();
          if (mounted) setState(() => _schedule = value);
        } catch (_) {}
      }(),
    ]);
  }

  BookingDraft get draft => AppScope.of(context).booking;

  void _close() {
    if (widget.asPage) {
      Navigator.of(context).maybePop();
      return;
    }
    widget.onClose?.call();
  }

  Future<void> _loadSlots(DateTime day) async {
    setState(() => _loadingSlots = true);
    try {
      final slots = await AppScope.of(
        context,
      ).repository.fetchSlots(day, serviceId: draft.service?.id);
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

  String _whenLabel() {
    final date = draft.date;
    TimeSlot? slot;
    for (final item in _slots) {
      if (item.time == draft.time) {
        slot = item;
        break;
      }
    }
    final time = slot?.display ?? draft.time ?? '';
    if (date == null) return time;
    final day = weekdayShortFr[date.weekday - 1].toLowerCase();
    return '$day. ${date.day} ${monthNamesFr[date.month - 1]} · $time · ${draft.location == LocationType.home ? 'À domicile' : 'Au salon'}';
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

    final quoted = draft.service?.isQuoted ?? false;
    if (quoted) {
      draft.paymentTiming = PaymentTiming.atSalon;
      draft.paymentMethod = PaymentMethod.salon;
    } else {
      draft.paymentTiming = PaymentTiming.now;
    }

    final appState = AppScope.of(context);
    final payNow = !quoted;
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
      if (payNow) {
        paid = await completeOnlinePayment(
          context,
          invoiceId: outcome.invoiceId,
          pendingId: outcome.pendingId,
          amount: outcome.amount,
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
                ? (outcome.loginRequired
                      ? 'Connecte-toi pour confirmer'
                      : 'Rendez-vous pris')
                : 'Payer pour confirmer',
            message: paid || !payNow
                ? '${outcome.appointment?.serviceName ?? serviceName} · ${formatDateLong(outcome.appointment?.date ?? when ?? DateTime.now())} à ${outcome.appointment?.time ?? time}. ${paid
                      ? 'Payé en ligne. On t’attend au salon. '
                      : 'Tarif sur devis, à confirmer au salon. '}${outcome.loginRequired ? (outcome.accountCreated ? 'Ton compte est créé : mot de passe par SMS et email.' : 'Ouvre Mon compte pour confirmer.') : ''}'
                : 'Dès que le paiement Wave, Orange Money ou Free Money est validé sur PayTech, ton rendez-vous est confirmé.',
            actionLabel: outcome.loginRequired
                ? 'Ouvrir mon compte'
                : 'Retour à l’accueil',
            onAction: () {
              navigator.popUntil((route) => route.isFirst);
              widget.onClose?.call();
            },
          ),
        ),
      );
    } catch (error) {
      if (!mounted) return;
      setState(() => _submitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error.toString().replaceFirst('Exception: ', '')),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.of(context).background,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: Row(
                children: [
                  _CircleClose(onTap: _close),
                  const Spacer(),
                  Text(
                    'Étape ${_step + 1} sur 3',
                    style: TextStyle(color: AppColors.of(context).muted, fontSize: 13),
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: ListView(
              padding: EdgeInsets.fromLTRB(20, 4, 20, 24),
              children: [
                Text(
                  'Réserver',
                  style: Theme.of(context).textTheme.displayLarge,
                ),
                SizedBox(height: 6),
                Text(
                  'Salon : lun–sam 10h–21h, dim 12h–20h. À domicile : + 2 000 F, Dakar uniquement.',
                  style: TextStyle(color: AppColors.of(context).muted, height: 1.4),
                ),
                const SizedBox(height: 18),
                _Steps(step: _step),
                const SizedBox(height: 22),
                if (_step == 0) _serviceStep(),
                if (_step == 1) _slotStep(),
                if (_step == 2) _identityStep(),
              ],
            ),
          ),
          _bottomBar(),
        ],
      ),
    );
  }

  Widget _bottomBar() {
    final quoted = draft.service?.isQuoted ?? false;
    final payLabel = quoted
        ? 'Demander le rendez-vous'
        : 'Payer ${formatFcfa(draft.total)}';
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
        child: Row(
          children: [
            Expanded(
              child: GhostButton(
                label: 'Retour',
                onPressed: () {
                  if (_step == 0) {
                    _close();
                    return;
                  }
                  setState(() => _step -= 1);
                },
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              flex: 2,
              child: GoldButton(
                label: _step == 0
                    ? 'Choisir un créneau'
                    : _step == 1
                    ? 'Continuer'
                    : payLabel,
                loading: _submitting,
                onPressed: _submitting ||
                        (_step == 0 && draft.service == null) ||
                        (_step == 1 && (draft.date == null || draft.time == null))
                    ? null
                    : _onNext,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _onNext() {
    if (_step == 0) {
      if (draft.service == null) return;
      setState(() => _step = 1);
      if (draft.date != null) _loadSlots(draft.date!);
      return;
    }
    if (_step == 1) {
      if (draft.date == null || draft.time == null) return;
      setState(() => _step = 2);
      return;
    }
    _submit();
  }

  Widget _serviceStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Lieu',
          style: TextStyle(color: AppColors.of(context).muted, fontSize: 14),
        ),
        const SizedBox(height: 10),
        IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: _PlaceChoice(
                  title: 'Au salon',
                  subtitle: 'Nord Foire',
                  selected: draft.location == LocationType.salon,
                  onTap: () =>
                      setState(() => draft.location = LocationType.salon),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _PlaceChoice(
                  title: 'À domicile',
                  subtitle: '+ 2 000 F',
                  selected: draft.location == LocationType.home,
                  onTap: () => setState(() => draft.location = LocationType.home),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 22),
        Text(
          'Prestation',
          style: TextStyle(color: AppColors.of(context).muted, fontSize: 14),
        ),
        const SizedBox(height: 10),
        if (_services.isEmpty)
          const Center(child: CircularProgressIndicator(color: AppColors.gold))
        else
          for (final service in _services)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _ServiceCard(
                service: service,
                selected: draft.service?.id == service.id,
                onTap: () {
                  setState(() {
                    draft.service = service;
                    draft.time = null;
                    if (service.isQuoted) {
                      draft.paymentTiming = PaymentTiming.atSalon;
                    } else {
                      draft.paymentTiming = PaymentTiming.now;
                    }
                  });
                  if (draft.date != null) _loadSlots(draft.date!);
                },
              ),
            ),
      ],
    );
  }

  Widget _slotStep() {
    final now = DateTime.now();
    final monthStart = DateTime(_month.year, _month.month, 1);
    final daysInMonth = DateTime(_month.year, _month.month + 1, 0).day;
    final startWeekday = monthStart.weekday;
    final cells = startWeekday - 1 + daysInMonth;
    final canPrev = _month.year > now.year || _month.month > now.month;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (draft.service != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 18),
            child: StrokeCard(
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          draft.service!.name,
                          style: TextStyle(
                            color: AppColors.of(context).onDark,
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${draft.location == LocationType.home ? 'À domicile' : 'Au salon'} · ${draft.service!.duration}',
                          style: TextStyle(color: AppColors.of(context).muted, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        (draft.service?.isQuoted ?? false)
                            ? (draft.service?.priceLabel ?? 'Sur devis')
                            : formatFcfa(draft.servicePrice),
                        style: const TextStyle(
                          color: AppColors.gold,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 4),
                      GestureDetector(
                        onTap: () => setState(() => _step = 0),
                        child: const Text(
                          'Modifier',
                          style: TextStyle(color: AppColors.gold, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        Row(
          children: [
            Expanded(
              child: Text(
                '${monthNamesFr[_month.month - 1]} ${_month.year}',
                style: Theme.of(context).textTheme.displaySmall,
              ),
            ),
            _MonthArrow(
              icon: Icons.chevron_left,
              enabled: canPrev,
              onTap: () => setState(() {
                _month = DateTime(_month.year, _month.month - 1);
              }),
            ),
            const SizedBox(width: 6),
            _MonthArrow(
              icon: Icons.chevron_right,
              enabled: true,
              onTap: () => setState(() {
                _month = DateTime(_month.year, _month.month + 1);
              }),
            ),
          ],
        ),
        SizedBox(height: 14),
        Row(
          children: [
            for (final day in weekdayShortFr)
              Expanded(
                child: Text(
                  day,
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 11, color: AppColors.of(context).muted),
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
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
          ),
          itemBuilder: (context, index) {
            final dayNum = index - (startWeekday - 2);
            if (dayNum < 1 || dayNum > daysInMonth) {
              return const SizedBox.shrink();
            }
            final date = DateTime(_month.year, _month.month, dayNum);
            final disabled =
                date.isBefore(DateTime(now.year, now.month, now.day)) ||
                _schedule.isClosed(date);
            final selected =
                draft.date?.year == date.year &&
                draft.date?.month == date.month &&
                draft.date?.day == date.day;
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
                  color: selected
                      ? AppColors.of(context).background
                      : disabled
                          ? AppColors.gold.withValues(alpha: 0.38)
                          : AppColors.gold,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: selected ? AppColors.gold : Colors.transparent,
                    width: selected ? 2 : 1,
                  ),
                ),
                child: Text(
                  '$dayNum',
                  style: TextStyle(
                    color: disabled
                        ? AppColors.of(context).mutedDark
                        : AppColors.ink,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            );
          },
        ),
        SizedBox(height: 22),
        Row(
          children: [
            Text(
              'Créneau',
              style: TextStyle(color: AppColors.of(context).muted, fontWeight: FontWeight.w600),
            ),
            Spacer(),
            if (draft.date != null)
              Text(
                '${weekdayShortFr[draft.date!.weekday - 1].toLowerCase()}. ${draft.date!.day} ${monthNamesFr[draft.date!.month - 1]}',
                style: TextStyle(color: AppColors.of(context).muted, fontSize: 13),
              ),
          ],
        ),
        SizedBox(height: 10),
        if (draft.date == null)
          Container(
            width: double.infinity,
            padding: EdgeInsets.symmetric(vertical: 22),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.of(context).stroke),
            ),
            child: Text(
              'Choisis un jour pour voir les créneaux.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.of(context).muted),
            ),
          )
        else if (_loadingSlots)
          const Center(child: CircularProgressIndicator(color: AppColors.gold))
        else
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _slots.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
              childAspectRatio: 2.4,
            ),
            itemBuilder: (context, index) {
              final slot = _slots[index];
              final selected = draft.time == slot.time;
              return GestureDetector(
                onTap: slot.available
                    ? () => setState(() => draft.time = slot.time)
                    : null,
                child: Container(
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: AppColors.of(context).card,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: selected
                          ? AppColors.gold
                          : AppColors.of(context).stroke,
                      width: selected ? 1.4 : 1,
                    ),
                  ),
                  child: Text(
                    slot.display,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 11,
                      color: !slot.available
                          ? AppColors.of(context).mutedDark
                          : AppColors.of(context).onDark,
                    ),
                  ),
                ),
              );
            },
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
    final quoted = draft.service?.isQuoted ?? false;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        StrokeCard(
          color: AppColors.of(context).card,
          borderColor: AppColors.of(context).stroke,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                draft.service?.name ?? '',
                style: TextStyle(
                  color: AppColors.of(context).onDark,
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
                ),
              ),
              SizedBox(height: 4),
              Text(
                _whenLabel(),
                style: TextStyle(color: AppColors.of(context).muted, fontSize: 13),
              ),
              SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      draft.service?.name ?? 'Prestation',
                      style: TextStyle(color: AppColors.of(context).muted),
                    ),
                  ),
                  Text(
                    quoted
                        ? (draft.service?.priceLabel ?? 'Sur devis')
                        : formatFcfa(draft.servicePrice),
                    style: TextStyle(color: AppColors.of(context).onDark),
                  ),
                ],
              ),
              if (draft.travelFee > 0) ...[
                SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Déplacement',
                        style: TextStyle(color: AppColors.of(context).muted),
                      ),
                    ),
                    Text(
                      formatFcfa(draft.travelFee),
                      style: TextStyle(color: AppColors.of(context).onDark),
                    ),
                  ],
                ),
              ],
              SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Total',
                      style: TextStyle(
                        color: AppColors.of(context).muted,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  Text(
                    quoted
                        ? (draft.service?.priceLabel ?? 'Sur devis')
                        : formatFcfa(draft.total),
                    style: TextStyle(
                      color: AppColors.gold,
                      fontWeight: FontWeight.w700,
                      fontSize: 22,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        SizedBox(height: 22),
        Text(
          'Coordonnées',
          style: TextStyle(color: AppColors.of(context).muted, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 10),
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
          decoration: const InputDecoration(labelText: 'Email (optionnel)'),
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
    return Column(
      children: [
        Row(
          children: [
            for (var i = 0; i < labels.length; i++) ...[
              if (i > 0) const SizedBox(width: 8),
              Expanded(
                child: Container(
                  height: 3,
                  decoration: BoxDecoration(
                    color: i <= step ? AppColors.gold : AppColors.of(context).stroke,
                    borderRadius: BorderRadius.circular(99),
                  ),
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            for (var i = 0; i < labels.length; i++)
              Expanded(
                child: Text(
                  '${i + 1}. ${labels[i]}',
                  textAlign: i == 0
                      ? TextAlign.left
                      : i == 2
                      ? TextAlign.right
                      : TextAlign.center,
                  style: TextStyle(
                    fontSize: 12,
                    color: i <= step ? AppColors.of(context).onDark : AppColors.of(context).muted,
                  ),
                ),
              ),
          ],
        ),
      ],
    );
  }
}

class _PlaceChoice extends StatelessWidget {
  const _PlaceChoice({
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
    final colors = AppColors.of(context);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        alignment: Alignment.centerLeft,
        padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
        decoration: BoxDecoration(
          color: selected ? colors.featured : colors.card,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? AppColors.gold : colors.stroke,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: TextStyle(
                color: colors.onDark,
                fontWeight: FontWeight.w700,
                fontSize: 17,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 14,
                color: selected ? AppColors.gold : colors.muted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ServiceCard extends StatelessWidget {
  const _ServiceCard({
    required this.service,
    required this.selected,
    required this.onTap,
  });

  final ServiceItem service;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: colors.card,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? AppColors.gold : colors.stroke,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: SizedBox(
                width: 72,
                height: 72,
                child: AssetPhoto(service.image, height: 72, radius: 12),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          service.name,
                          style: TextStyle(
                            color: colors.onDark,
                            fontWeight: FontWeight.w700,
                            fontSize: 18,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        service.price != null
                            ? formatFcfa(service.price!)
                            : (service.priceLabel ?? ''),
                        style: const TextStyle(
                          color: AppColors.gold,
                          fontWeight: FontWeight.w700,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${service.duration} · ${service.category}',
                    style: TextStyle(fontSize: 13, color: colors.muted),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    service.description,
                    maxLines: 4,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 14,
                      color: colors.muted,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MonthArrow extends StatelessWidget {
  const _MonthArrow({
    required this.icon,
    required this.enabled,
    required this.onTap,
  });

  final IconData icon;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: AppColors.of(context).stroke),
        ),
        child: Icon(
          icon,
          size: 20,
          color: enabled ? AppColors.of(context).onDark : AppColors.of(context).mutedDark,
        ),
      ),
    );
  }
}

class _CircleClose extends StatelessWidget {
  const _CircleClose({required this.onTap});

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
          child: Icon(Icons.close, size: 20, color: colors.onDark),
        ),
      ),
    );
  }
}
