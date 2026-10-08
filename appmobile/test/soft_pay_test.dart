import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:macnation/core/theme/app_theme.dart';
import 'package:macnation/data/mock_repository.dart';
import 'package:macnation/features/pay/soft_pay_screen.dart';
import 'package:macnation/state/app_state.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  SharedPreferences.setMockInitialValues({});

  testWidgets('opening payment does not show unavailable', (tester) async {
    final state = AppState(repository: MockMacNationRepository());
    await tester.pumpWidget(
      AppScope(
        state: state,
        child: MaterialApp(
          theme: AppTheme.dark(),
          home: const SoftPayScreen(
            pendingId: 'mock-pending',
            amount: 10000,
            name: 'Test',
            phone: '771234567',
          ),
        ),
      ),
    );
    await tester.pump();
    await tester.pump();
    expect(find.text('Paiement indisponible pour le moment.'), findsNothing);
    expect(find.text('10 000 F'), findsOneWidget);
    expect(find.text('Paiement reçu'), findsOneWidget);
  });
}
