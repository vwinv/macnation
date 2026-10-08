import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:macnation/app.dart';
import 'package:macnation/data/mock_repository.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  SharedPreferences.setMockInitialValues({});

  testWidgets('boutique adds a product to the cart like the website', (tester) async {
    await tester.pumpWidget(
      MacNationApp(
        showSplash: false,
        repository: MockMacNationRepository(),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));

    await tester.tap(find.text('Boutique').last);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));

    expect(find.text('Boutique'), findsWidgets);
    expect(find.text('Tout'), findsOneWidget);
    expect(find.text('Pommade Hold'), findsOneWidget);

    await tester.tap(find.byIcon(Icons.add).first);
    await tester.pump();

    await tester.tap(find.byIcon(Icons.shopping_bag_outlined).first);
    await tester.pumpAndSettle();

    expect(find.text('Connexion'), findsOneWidget);
    await tester.tap(find.text('Connexion'));
    await tester.pump();
    await tester.enterText(find.byType(TextField).first, '771234567');
    await tester.enterText(find.byType(TextField).at(1), 'password1');
    await tester.tap(find.text('Se connecter'));
    await tester.pumpAndSettle();

    expect(find.text('PANIER'), findsOneWidget);
    expect(find.text('Pommade Hold'), findsOneWidget);
    expect(find.text('Payer 5 000 F'), findsOneWidget);
    expect(find.textContaining('Salon Nord Foire'), findsOneWidget);
  });
}
