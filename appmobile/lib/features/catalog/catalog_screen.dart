import 'package:flutter/material.dart';

import '../../core/format.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_widgets.dart';
import '../../data/models.dart';
import '../../state/app_state.dart';
import '../booking/booking_screen.dart';

class CatalogScreen extends StatefulWidget {
  const CatalogScreen({super.key, this.onReserve});

  final void Function({ServiceItem? service})? onReserve;

  @override
  State<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends State<CatalogScreen> {
  Future<List<ServiceItem>>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= AppScope.of(context).repository.fetchServices();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Catalogue')),
      body: FutureBuilder<List<ServiceItem>>(
        future: _future,
        builder: (context, snapshot) {
        if (!snapshot.hasData) {
          if (snapshot.hasError) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(32),
                child: Text(
                  'Impossible de charger le catalogue. Vérifie l’API.',
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }
          return const Center(
            child: CircularProgressIndicator(color: AppColors.gold),
          );
        }
          final services = snapshot.data!;
          final groups = <String, List<ServiceItem>>{};
          for (final service in services) {
            groups.putIfAbsent(service.category, () => []).add(service);
          }
          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
            children: [
              for (final entry in groups.entries) ...[
                Padding(
                  padding: const EdgeInsets.only(top: 8, bottom: 12),
                  child: Text(
                    entry.key,
                    style: Theme.of(context).textTheme.displaySmall,
                  ),
                ),
                for (final service in entry.value)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: StrokeCard(
                      padding: EdgeInsets.zero,
                      onTap: () {
                        final reserve = widget.onReserve;
                        if (reserve != null) {
                          Navigator.pop(context);
                          reserve(service: service);
                          return;
                        }
                        AppScope.of(context).startBooking(service);
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const BookingScreen(asPage: true),
                          ),
                        );
                      },
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          AssetPhoto(service.image, height: 150, radius: 16),
                          Padding(
                            padding: const EdgeInsets.all(14),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        service.name,
                                        style: Theme.of(context).textTheme.titleLarge,
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
                                const SizedBox(height: 6),
                                Text(service.description),
                                const SizedBox(height: 8),
                                Text(
                                  service.duration,
                                  style: const TextStyle(color: AppColors.gold),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ],
          );
        },
      ),
    );
  }
}
