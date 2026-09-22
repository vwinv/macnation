import 'package:flutter/material.dart';

import '../../core/theme/app_assets.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_widgets.dart';

class BrandScreen extends StatelessWidget {
  const BrandScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const blocks = [
      (
        'Marbre et or',
        'Le lieu dicte le geste. Marbre noir, moulures blanches, touches d’or : un salon pensé pour durer.',
      ),
      (
        'Un savoir-faire',
        'Accueil, diagnostic, geste. Un parcours client clair, du premier regard jusqu’au produit emporté.',
      ),
      (
        'Un savoir-être',
        'Chacun se sent à sa place. L’équipe incarne la diversité dakaroise et ouvre le salon à toutes les textures.',
      ),
      (
        'Des valeurs',
        'MAC NATION est plus qu’un salon : c’est une vision. La diversité forge le geste.',
      ),
      (
        'Un lieu unique',
        'Pour le moment, un seul salon : Nord Foire, en face du service d’hygiène.',
      ),
      (
        'Salon, boutique, abonnement',
        'On ne sépare pas la coupe de l’entretien. Du rendez-vous jusqu’au kit emporté.',
      ),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('La marque')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          const AssetPhoto(AppAssets.reception, height: 220, radius: 18),
          const SizedBox(height: 18),
          Text('MAC NATION', style: Theme.of(context).textTheme.displayLarge),
          Text(
            'Grooming à Dakar',
            style: const TextStyle(
              fontFamily: 'BebasNeue',
              fontSize: 22,
              color: AppColors.gold,
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'L’art de lier la coiffure classique au barbering moderne. Même exigence sur tous types de cheveux.',
          ),
          const SizedBox(height: 20),
          for (final block in blocks)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: StrokeCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(block.$1, style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 6),
                    Text(block.$2),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 8),
          Text('Notre histoire', style: Theme.of(context).textTheme.displaySmall),
          const SizedBox(height: 10),
          const StrokeCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                GoldChip('2025'),
                SizedBox(height: 8),
                Text('L’idée', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                Text(
                  'MAC NATION naît à Dakar d’une envie simple : un salon où la coupe, la barbe et les produits vivent sous le même toit.',
                ),
                SizedBox(height: 16),
                GoldChip('2026'),
                SizedBox(height: 8),
                Text('Nord Foire', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                Text(
                  'Ouverture du premier salon, en face du service d’hygiène. Un second espace de vie pour l’homme dakarois.',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
