import '../core/theme/app_assets.dart';

String serviceImage(String id) {
  switch (id) {
    case 'coupe':
      return AppAssets.cut;
    case 'barbe':
      return AppAssets.client;
    case 'combo':
    case 'coupe-barbe':
      return AppAssets.barber;
    case 'soin':
      return AppAssets.plateau;
    case 'coloration':
      return AppAssets.stations;
    case 'locks':
      return AppAssets.waiting;
    case 'coupe-enfant':
    case 'enfant':
      return AppAssets.receptionTeam;
    case 'coupe-ado':
    case 'ado':
      return AppAssets.hero;
    case 'domicile':
      return AppAssets.reception;
    default:
      return AppAssets.cut;
  }
}

String productImage(String id) {
  switch (id) {
    case 'pommade':
    case 'pommade-hold':
      return AppAssets.cut;
    case 'huile-barbe':
      return AppAssets.client;
    case 'shampoing':
    case 'shampoing-daily':
      return AppAssets.boutique;
    case 'spray':
    case 'spray-texture':
      return AppAssets.stations;
    case 'kit':
    case 'kit-nation':
      return AppAssets.waiting;
    default:
      return AppAssets.boutique;
  }
}

String articleImage(String id) {
  switch (id) {
    case 'ouverture-mac-nation-nord-foire':
      return AppAssets.receptionTeam;
    case 'fade-dakar-ce-qui-marche-en-2026':
      return AppAssets.cut;
    case 'routine-capillaire-homme-dakar':
      return AppAssets.boutique;
    case 'abonnements-pourquoi-ca-change-tout':
      return AppAssets.waiting;
    default:
      return AppAssets.hero;
  }
}
