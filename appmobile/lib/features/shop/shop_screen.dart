import 'package:flutter/material.dart';

import '../../core/format.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_widgets.dart';
import '../../core/widgets/payment_sheet.dart';
import '../../data/models.dart';
import '../../state/app_state.dart';
import '../pay/soft_pay_screen.dart';

class ShopScreen extends StatefulWidget {
  const ShopScreen({super.key});

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  Future<List<Product>>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= AppScope.of(context).repository.fetchProducts();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Boutique')),
      body: FutureBuilder<List<Product>>(
      future: _future,
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          if (snapshot.hasError) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(32),
                child: Text(
                  'Impossible de charger la boutique. Vérifie l’API.',
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }
          return const Center(
            child: CircularProgressIndicator(color: AppColors.gold),
          );
        }
        final products = snapshot.data!;
        return CustomScrollView(
          slivers: [
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(20, 8, 20, 8),
                child: Text(
                  'Payer par Wave, Orange Money ou Free. Retrait au salon Nord Foire.',
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 0.68,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, index) => _ProductCard(product: products[index]),
                  childCount: products.length,
                ),
              ),
            ),
          ],
        );
      },
    ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  const _ProductCard({required this.product});

  final Product product;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ProductDetailScreen(product: product),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(child: AssetPhoto(product.image)),
          const SizedBox(height: 8),
          Text(
            product.category,
            style: const TextStyle(fontSize: 11, color: AppColors.gold),
          ),
          Text(
            product.name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
          PriceTag(formatFcfa(product.price)),
        ],
      ),
    );
  }
}

class ProductDetailScreen extends StatefulWidget {
  const ProductDetailScreen({super.key, required this.product});

  final Product product;

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  bool _loading = false;

  Future<void> _pay() async {
    final method = await showPaymentSheet(
      context,
      title: widget.product.name,
      amountLabel: formatFcfa(widget.product.price),
    );
    if (method == null || !mounted) return;
    final state = AppScope.of(context);
    if (!state.isLoggedIn) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Connecte-toi pour commander.')),
      );
      return;
    }
    setState(() => _loading = true);
    try {
      final outcome = await state.payProduct(widget.product, method);
      var paid = method == PaymentMethod.salon;
      if (!mounted) return;
      if (!paid) {
        paid = await completeOnlinePayment(
          context,
          invoiceId: outcome.invoiceId,
          pendingId: outcome.pendingId,
          amount: outcome.amount,
          method: method,
          name: state.user?.name ?? '',
          phone: state.user?.phone ?? '',
          email: state.user?.email,
        );
        if (paid) {
          try {
            await state.refreshAccount();
          } catch (_) {}
        }
      }
      if (!mounted) return;
      setState(() => _loading = false);
      await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => SuccessScreen(
            title: paid ? 'Commande payée' : 'Paiement non reçu',
            message: paid
                ? '${widget.product.name} est payé. Retrait au salon Nord Foire.'
                : method == PaymentMethod.salon
                    ? '${widget.product.name} est réservé. Tu pourras payer au salon Nord Foire.'
                    : 'La commande n’a pas été enregistrée. Réessaie le paiement.',
            actionLabel: 'Retour à la boutique',
            onAction: () => Navigator.popUntil(context, (route) => route.isFirst),
          ),
        ),
      );
    } catch (error) {
      if (!mounted) return;
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final product = widget.product;
    return Scaffold(
      appBar: AppBar(title: const Text('Boutique')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 120),
        children: [
          AssetPhoto(product.image, height: 280, radius: 18),
          const SizedBox(height: 18),
          GoldChip(product.category),
          const SizedBox(height: 10),
          Text(product.name, style: Theme.of(context).textTheme.displayMedium),
          PriceTag(formatFcfa(product.price), large: true),
          const SizedBox(height: 8),
          Text(product.description, style: Theme.of(context).textTheme.bodyLarge),
          const SizedBox(height: 20),
          const StrokeCard(
            child: Text(
              'Paiement Wave, Orange Money ou Free Money. Retrait au salon, Nord Foire.',
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
          child: GoldButton(
            label: 'Payer par Wave / Orange / Free',
            loading: _loading,
            onPressed: _loading ? null : _pay,
          ),
        ),
      ),
    );
  }
}
