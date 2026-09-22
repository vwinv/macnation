import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:macnation/app.dart';
import 'package:macnation/data/mock_repository.dart';

void main() {
  testWidgets('home puts booking first and keeps the journal', (tester) async {
    await tester.pumpWidget(
      MacNationApp(
        showSplash: false,
        repository: MockMacNationRepository(),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));
    expect(find.text('Choisir un créneau'), findsOneWidget);
    expect(find.text('Boutique'), findsOneWidget);
    expect(find.text('Abonnements'), findsOneWidget);
    expect(find.text('Abos'), findsNothing);
    await tester.drag(find.byType(CustomScrollView), const Offset(0, -900));
    await tester.pump();
    expect(find.text('Journal'), findsOneWidget);
    expect(find.textContaining('Un lieu'), findsNothing);
  });
}
