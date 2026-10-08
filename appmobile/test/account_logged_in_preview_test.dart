import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:macnation/core/theme/app_assets.dart';
import 'package:macnation/core/theme/app_theme.dart';
import 'package:macnation/data/account_snapshot.dart';
import 'package:macnation/data/mock_repository.dart';
import 'package:macnation/data/models.dart';
import 'package:macnation/features/account/account_screen.dart';
import 'package:macnation/state/app_state.dart';
import 'package:shared_preferences/shared_preferences.dart';

class _LoggedInMock extends MockMacNationRepository {
  @override
  Future<AccountSnapshot?> restoreSession() async {
    return AccountSnapshot(
      user: const UserProfile(
        name: 'Amadou Diallo',
        phone: '+221 77 123 45 67',
        email: 'amadou@macnation.sn',
        points: 12,
        creditFcfa: 1000,
        planName: 'Signature',
      ),
      plan: const MembershipPlan(
        id: 'signature',
        name: 'Signature',
        price: 28000,
        featured: true,
        perks: ['4 visites coupe + barbe'],
      ),
      appointments: [
        Appointment(
          id: 'rdv-1',
          serviceName: 'Coupe + barbe',
          date: DateTime(2026, 10, 3),
          time: '11:30',
          location: LocationType.salon,
          total: 8000,
          paid: true,
        ),
      ],
      orders: const [
        Product(
          id: 'pommade-hold',
          name: 'Pommade Hold',
          category: 'Coiffage',
          description: 'Tenue mate, flexible.',
          price: 5000,
          image: AppAssets.cut,
        ),
      ],
    );
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  SharedPreferences.setMockInitialValues({});

  testWidgets('capture compte connecté', (tester) async {
    await tester.runAsync(() async {
      Future<void> loadFont(String family, String path) async {
        final bytes = await File(path).readAsBytes();
        final loader = FontLoader(family)
          ..addFont(Future.value(ByteData.sublistView(Uint8List.fromList(bytes))));
        await loader.load();
      }

      await loadFont('Manrope', 'assets/fonts/Manrope-Regular.ttf');
      await loadFont('BebasNeue', 'assets/fonts/BebasNeue-Regular.ttf');
    });

    await tester.binding.setSurfaceSize(const Size(390, 1120));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final state = AppState(repository: _LoggedInMock());
    await tester.pumpWidget(
      AppScope(
        state: state,
        child: MaterialApp(
          debugShowCheckedModeBanner: false,
          theme: AppTheme.dark(),
          home: const RepaintBoundary(
            child: Scaffold(
              backgroundColor: Color(0xFF050505),
              body: AccountScreen(),
            ),
          ),
        ),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));

    expect(find.text('Mon compte'), findsOneWidget);
    expect(find.text('Amadou Diallo'), findsOneWidget);

    await tester.runAsync(() async {
      final boundary = tester.renderObject<RenderRepaintBoundary>(
        find.byType(RepaintBoundary).first,
      );
      final image = await boundary.toImage(pixelRatio: 2.5);
      final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
      await File('${Directory.current.path}/test/account_logged_in.png')
          .writeAsBytes(bytes!.buffer.asUint8List());
    });
  });
}
