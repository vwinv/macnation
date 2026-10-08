import 'package:flutter/material.dart';

import '../../core/format.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_widgets.dart';
import '../../core/widgets/payment_sheet.dart';
import '../../data/models.dart';
import '../../state/app_state.dart';
import '../account/account_screen.dart';
import '../pay/soft_pay_screen.dart';

class ShopScreen extends StatefulWidget {
  const ShopScreen({super.key});

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

Future<void> openCart(BuildContext context) async {
  if (!AppScope.of(context).isLoggedIn) {
    final loggedIn = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
    if (loggedIn != true || !context.mounted) return;
  }
  if (!context.mounted) return;
  await Navigator.of(context).push(
    MaterialPageRoute(builder: (_) => const CartScreen()),
  );
}

class _ShopScreenState extends State<ShopScreen> {
  Future<List<Product>>? _future;
  String _filter = 'Tout';

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= AppScope.of(context).repository.fetchProducts();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: FutureBuilder<List<Product>>(
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
            final categories = _categories(products);
            final visible = _filter == 'Tout'
                ? products
                : products
                    .where((item) => item.category == _filter)
                    .toList();
            return CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(20, 8, 16, 0),
                    child: _ShopHeader(),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(20, 10, 20, 16),
                    child: Text(
                      'Payer par Wave, Orange Money ou Free.\nRetrait au salon Nord Foire.',
                      style: TextStyle(
                        color: AppColors.of(context).muted,
                        height: 1.45,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: 40,
                    child: ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      scrollDirection: Axis.horizontal,
                      itemCount: categories.length,
                      separatorBuilder: (_, _) => const SizedBox(width: 8),
                      itemBuilder: (context, index) {
                        final label = categories[index];
                        return _FilterChip(
                          label: label,
                          selected: _filter == label,
                          onTap: () => setState(() => _filter = label),
                        );
                      },
                    ),
                  ),
                ),
                if (visible.isEmpty)
                  const SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(
                      child: Text('Aucun produit dans cette catégorie.'),
                    ),
                  )
                else
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 18, 16, 24),
                    sliver: SliverGrid(
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        mainAxisSpacing: 12,
                        crossAxisSpacing: 12,
                        mainAxisExtent: 272,
                      ),
                      delegate: SliverChildBuilderDelegate(
                        (context, index) => _ProductCard(product: visible[index]),
                        childCount: visible.length,
                      ),
                    ),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }

  List<String> _categories(List<Product> products) {
    final seen = <String>{};
    final labels = <String>['Tout'];
    for (final product in products) {
      final category = product.category.trim();
      if (category.isEmpty || !seen.add(category)) continue;
      labels.add(category);
    }
    return labels;
  }
}

class _ShopHeader extends StatelessWidget {
  const _ShopHeader();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            'Boutique',
            style: Theme.of(context).textTheme.displayLarge?.copyWith(
                  letterSpacing: 1.2,
                  fontWeight: FontWeight.w500,
                ),
          ),
        ),
        const _CartButton(),
      ],
    );
  }
}

class _CartButton extends StatelessWidget {
  const _CartButton();

  @override
  Widget build(BuildContext context) {
    final count = AppScope.of(context).cartCount;
    return _CircleIconButton(
      icon: Icons.shopping_bag_outlined,
      onTap: () => openCart(context),
      badge: count > 0 ? (count > 99 ? '99+' : '$count') : null,
    );
  }
}

class _CircleIconButton extends StatelessWidget {
  const _CircleIconButton({
    required this.icon,
    required this.onTap,
    this.badge,
  });

  final IconData icon;
  final VoidCallback onTap;
  final String? badge;

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            customBorder: CircleBorder(),
            child: Ink(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.of(context).card,
                border: Border.all(color: AppColors.of(context).stroke),
              ),
              child: Icon(icon, size: 20, color: AppColors.of(context).onDark),
            ),
          ),
        ),
        if (badge != null)
          Positioned(
            right: -2,
            top: -2,
            child: Container(
              constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
              padding: const EdgeInsets.symmetric(horizontal: 4),
              decoration: const BoxDecoration(
                color: AppColors.gold,
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: Text(
                badge!,
                style: const TextStyle(
                  color: AppColors.ink,
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final light = AppColors.isLight(context);
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: Duration(milliseconds: 160),
        padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: selected
              ? (light ? AppColors.ink : AppColors.gold)
              : AppColors.of(context).card,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: selected
                ? (light ? AppColors.ink : AppColors.gold)
                : AppColors.of(context).stroke,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected
                ? (light ? AppColors.onInk : AppColors.ink)
                : AppColors.of(context).onDark,
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
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
      onTap: () => showProductSheet(context, product),
      child: StrokeCard(
        dark: true,
        padding: EdgeInsets.zero,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 148,
              width: double.infinity,
              child: AssetPhoto(product.image, height: 148, radius: 16),
            ),
            Expanded(
              child: Padding(
                padding: EdgeInsets.fromLTRB(12, 10, 10, 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.category.toUpperCase(),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 10,
                        letterSpacing: 0.8,
                        fontWeight: FontWeight.w600,
                        color: AppColors.gold,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      product.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: AppColors.of(context).onDark,
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                      ),
                    ),
                    Spacer(),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            formatFcfa(product.price),
                            style: TextStyle(
                              color: AppColors.of(context).onDark,
                              fontWeight: FontWeight.w600,
                              fontSize: 15,
                            ),
                          ),
                        ),
                        _AddDot(
                          onTap: () => AppScope.of(context).addToCart(product),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AddDot extends StatelessWidget {
  const _AddDot({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.isLight(context) ? AppColors.ink : AppColors.gold,
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: SizedBox(
          width: 32,
          height: 32,
          child: Icon(
            Icons.add,
            size: 18,
            color: AppColors.isLight(context) ? AppColors.onInk : AppColors.ink,
          ),
        ),
      ),
    );
  }
}

Future<void> showProductSheet(BuildContext context, Product product) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    isDismissible: true,
    enableDrag: true,
    backgroundColor: Colors.transparent,
    barrierColor: const Color(0x73000000),
    builder: (context) => ProductDetailSheet(product: product),
  );
}

class ProductDetailSheet extends StatefulWidget {
  const ProductDetailSheet({super.key, required this.product});

  final Product product;

  @override
  State<ProductDetailSheet> createState() => _ProductDetailSheetState();
}

class _ProductDetailSheetState extends State<ProductDetailSheet> {
  int _qty = 1;

  @override
  Widget build(BuildContext context) {
    final product = widget.product;
    final colors = AppColors.of(context);
    final bottom = MediaQuery.paddingOf(context).bottom;
    final light = AppColors.isLight(context);
    void add() {
      final messenger = ScaffoldMessenger.of(context);
      AppScope.of(context).addToCart(product, _qty);
      Navigator.pop(context);
      messenger.showSnackBar(
        SnackBar(content: Text('${product.name} ajouté au panier.')),
      );
    }

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => Navigator.pop(context),
      child: Align(
        alignment: Alignment.bottomCenter,
        child: GestureDetector(
          onTap: () {},
          child: Material(
            color: colors.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            clipBehavior: Clip.antiAlias,
            child: Padding(
              padding: EdgeInsets.fromLTRB(18, 12, 18, 16 + bottom),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: colors.handle,
                        borderRadius: BorderRadius.circular(99),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  AssetPhoto(product.image, height: 176, radius: 18),
                  const SizedBox(height: 16),
                  Text(
                    product.category.toUpperCase(),
                    style: const TextStyle(
                      fontSize: 11,
                      letterSpacing: 1.2,
                      fontWeight: FontWeight.w700,
                      color: AppColors.gold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          product.name,
                          style: Theme.of(context).textTheme.displaySmall,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        formatFcfa(product.price),
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: light ? AppColors.gold : colors.onDark,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(product.description),
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      Text(
                        'Quantité',
                        style: TextStyle(
                          color: colors.onDark,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const Spacer(),
                      QtyStepper(
                        value: _qty,
                        onMinus: () =>
                            setState(() => _qty = clampCartQty(_qty - 1)),
                        onPlus: () =>
                            setState(() => _qty = clampCartQty(_qty + 1)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  light
                      ? BlackButton(
                          label:
                              'Ajouter au panier · ${formatFcfa(product.price * _qty)}',
                          height: 52,
                          onPressed: add,
                        )
                      : GoldButton(
                          label:
                              'Ajouter au panier · ${formatFcfa(product.price * _qty)}',
                          onPressed: add,
                        ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  bool _loading = false;
  bool _prefilled = false;
  String? _error;
  String? _invoiceId;
  String? _pendingId;
  int _payAmount = 0;

  bool get _hasSession =>
      (_invoiceId != null && _invoiceId!.isNotEmpty) ||
      (_pendingId != null && _pendingId!.isNotEmpty);

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_prefilled) return;
    _prefilled = true;
    final user = AppScope.of(context).user;
    if (user == null) return;
    _name.text = user.name;
    _phone.text = user.phone;
    _email.text = user.email ?? '';
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _email.dispose();
    super.dispose();
  }

  Future<void> _pay() async {
    final state = AppScope.of(context);
    if (state.cart.isEmpty) return;
    final name = _name.text.trim();
    final phone = _phone.text.trim();
    final email = _email.text.trim();
    if (name.isEmpty) {
      setState(() => _error = 'Indique ton nom.');
      return;
    }
    if (phone.length < 8) {
      setState(() => _error = 'Indique un numéro sénégalais valide.');
      return;
    }
    if (!state.isLoggedIn && email.isEmpty) {
      setState(() => _error = 'Indique ton email pour recevoir tes accès.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      if (_hasSession && _payAmount != state.cartTotal) {
        _invoiceId = null;
        _pendingId = null;
      }
      if (!_hasSession) {
        final outcome = await state.checkoutCart(
          name: name,
          phone: phone,
          email: email.isEmpty ? null : email,
        );
        _invoiceId = outcome.invoiceId;
        _pendingId = outcome.pendingId;
        _payAmount = outcome.amount;
        if (outcome.loginRequired || !state.isLoggedIn) {
          if (!mounted) return;
          final loggedIn = await showCheckoutLogin(
            context,
            phone: phone,
            accountCreated: outcome.accountCreated,
          );
          if (!loggedIn) {
            if (!mounted) return;
            setState(() => _loading = false);
            return;
          }
        }
      } else if (!state.isLoggedIn) {
        final loggedIn = await showCheckoutLogin(context, phone: phone);
        if (!loggedIn) {
          if (!mounted) return;
          setState(() => _loading = false);
          return;
        }
      }
      if (!mounted) return;
      final paid = await completeOnlinePayment(
        context,
        invoiceId: _invoiceId,
        pendingId: _pendingId,
        amount: _payAmount > 0 ? _payAmount : state.cartTotal,
        name: name,
        phone: phone,
        email: email.isEmpty ? null : email,
      );
      if (paid) {
        state.clearCart();
        _invoiceId = null;
        _pendingId = null;
        try {
          await state.refreshAccount();
        } catch (_) {}
      }
      if (!mounted) return;
      setState(() => _loading = false);
      if (!paid) return;
      await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => SuccessScreen(
            title: 'Commande payée',
            message: 'Ta commande est payée. Retrait au salon Nord Foire.',
            actionLabel: 'Retour à la boutique',
            onAction: () =>
                Navigator.popUntil(context, (route) => route.isFirst),
          ),
        ),
      );
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = error.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final lines = state.cart;
    final total = state.cartTotal;
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: EdgeInsets.fromLTRB(12, 4, 20, 8),
              child: Row(
                children: [
                  _CircleIconButton(
                    icon: Icons.chevron_left,
                    onTap: () => Navigator.pop(context),
                  ),
                  Expanded(
                    child: Text(
                      'PANIER',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 15,
                        letterSpacing: 1.6,
                        fontWeight: FontWeight.w600,
                        color: AppColors.of(context).onDark,
                      ),
                    ),
                  ),
                  SizedBox(width: 44),
                ],
              ),
            ),
            if (lines.isEmpty)
              Expanded(
                child: Center(
                  child: Padding(
                    padding: EdgeInsets.all(32),
                    child: Text(
                      'Ajoute un produit depuis la boutique pour commander.',
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              )
            else
              Expanded(
                child: ListView(
                  padding: EdgeInsets.fromLTRB(16, 8, 16, 24),
                  children: [
                    for (final line in lines) ...[
                      _CartLineTile(line: line),
                      SizedBox(height: 12),
                    ],
                    SizedBox(height: 8),
                    StrokeCard(
                      dark: true,
                      child: Column(
                        children: [
                          _SummaryRow(
                            label: 'Sous-total',
                            value: formatFcfa(total),
                          ),
                          SizedBox(height: 14),
                          _SummaryRow(
                            label: 'Retrait',
                            value: 'Salon Nord Foire · gratuit',
                            mutedValue: true,
                          ),
                          SizedBox(height: 18),
                          _SummaryRow(
                            label: 'Total',
                            value: formatFcfa(total),
                            emphasize: true,
                          ),
                        ],
                      ),
                    ),
                    SizedBox(height: 16),
                    Text(
                      'Payer maintenant. On prépare les produits, tu les récupères au salon.',
                      style: TextStyle(color: AppColors.of(context).muted, height: 1.45),
                    ),
                    SizedBox(height: 14),
                    TextField(
                      controller: _name,
                      textCapitalization: TextCapitalization.words,
                      decoration: InputDecoration(labelText: 'Nom complet *'),
                    ),
                    SizedBox(height: 12),
                    TextField(
                      controller: _phone,
                      keyboardType: TextInputType.phone,
                      decoration: InputDecoration(
                        labelText: 'Téléphone *',
                        prefixText: '+221  ',
                      ),
                    ),
                    SizedBox(height: 12),
                    TextField(
                      controller: _email,
                      keyboardType: TextInputType.emailAddress,
                      decoration: InputDecoration(
                        labelText: state.isLoggedIn ? 'Email' : 'Email *',
                      ),
                    ),
                    if (_error != null) ...[
                      SizedBox(height: 12),
                      Text(
                        _error!,
                        style: TextStyle(color: Colors.redAccent),
                      ),
                    ],
                    SizedBox(height: 8),
                    Text(
                      state.isLoggedIn
                          ? 'Le paiement s’ouvre sur PayTech. On confirme tout seul dès que c’est validé.'
                          : 'Si tu as déjà un compte, connecte-toi. Sinon on le crée et on t’envoie tes accès par email.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppColors.of(context).muted,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            if (lines.isNotEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
                child: GoldButton(
                  label: _loading
                      ? 'Préparation…'
                      : _hasSession
                          ? 'Relancer le paiement'
                          : 'Payer ${formatFcfa(total)}',
                  loading: _loading,
                  onPressed: _loading ? null : _pay,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

Future<bool> showCheckoutLogin(
  BuildContext context, {
  required String phone,
  bool accountCreated = false,
}) async {
  final result = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.of(context).surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
    ),
    builder: (context) => _CheckoutLoginSheet(
      phone: phone,
      accountCreated: accountCreated,
    ),
  );
  return result == true;
}

class _CheckoutLoginSheet extends StatefulWidget {
  const _CheckoutLoginSheet({
    required this.phone,
    this.accountCreated = false,
  });

  final String phone;
  final bool accountCreated;

  @override
  State<_CheckoutLoginSheet> createState() => _CheckoutLoginSheetState();
}

class _CheckoutLoginSheetState extends State<_CheckoutLoginSheet> {
  late final _phone = TextEditingController(text: widget.phone);
  final _password = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _phone.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_phone.text.trim().length < 8) {
      setState(() => _error = 'Entre un numéro de téléphone valide.');
      return;
    }
    if (_password.text.isEmpty) {
      setState(() => _error = 'Indique ton mot de passe.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await AppScope.of(context).login(
        name: '',
        phone: _phone.text,
        password: _password.text,
      );
      if (!mounted) return;
      Navigator.pop(context, true);
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = error.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final inset = MediaQuery.viewInsetsOf(context).bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 16, 20, 20 + inset),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.of(context).handle,
                borderRadius: BorderRadius.circular(99),
              ),
            ),
          ),
          const SizedBox(height: 18),
          Text('Connexion', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text(
            widget.accountCreated
                ? 'Ton compte est créé. Mot de passe envoyé par SMS et email.'
                : 'Connecte-toi pour ouvrir PayTech.',
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _phone,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(labelText: 'Téléphone *'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _password,
            obscureText: true,
            decoration: const InputDecoration(labelText: 'Mot de passe *'),
          ),
          if (_error != null) ...[
            const SizedBox(height: 10),
            Text(_error!, style: const TextStyle(color: Colors.redAccent)),
          ],
          const SizedBox(height: 16),
          GoldButton(
            label: 'Se connecter',
            loading: _loading,
            onPressed: _loading ? null : _submit,
          ),
        ],
      ),
    );
  }
}

class _CartLineTile extends StatelessWidget {
  const _CartLineTile({required this.line});

  final CartLine line;

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    return StrokeCard(
      dark: true,
      padding: EdgeInsets.all(12),
      child: Row(
        children: [
          SizedBox(
            width: 72,
            height: 72,
            child: AssetPhoto(line.product.image, height: 72, radius: 12),
          ),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  line.product.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: AppColors.of(context).onDark,
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  formatFcfa(line.product.price),
                  style: const TextStyle(
                    color: AppColors.gold,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          QtyStepper(
            value: line.qty,
            onMinus: () {
              if (line.qty <= 1) {
                state.removeFromCart(line.product.id);
              } else {
                state.setCartQty(line.product.id, line.qty - 1);
              }
            },
            onPlus: () => state.setCartQty(line.product.id, line.qty + 1),
          ),
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.label,
    required this.value,
    this.emphasize = false,
    this.mutedValue = false,
  });

  final String label;
  final String value;
  final bool emphasize;
  final bool mutedValue;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          label,
          style: TextStyle(
            color: AppColors.of(context).onDark,
            fontSize: emphasize ? 16 : 14,
            fontWeight: emphasize ? FontWeight.w600 : FontWeight.w500,
          ),
        ),
        SizedBox(width: 12),
        Expanded(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: TextStyle(
              color: emphasize
                  ? AppColors.gold
                  : mutedValue
                      ? AppColors.of(context).muted
                      : AppColors.of(context).onDark,
              fontSize: emphasize ? 22 : 14,
              fontWeight: emphasize ? FontWeight.w700 : FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }
}

class QtyStepper extends StatelessWidget {
  const QtyStepper({
    super.key,
    required this.value,
    required this.onMinus,
    required this.onPlus,
  });

  final int value;
  final VoidCallback onMinus;
  final VoidCallback onPlus;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 36,
      padding: EdgeInsets.symmetric(horizontal: 4),
      decoration: BoxDecoration(
        color: Color(0xFF1A1A1A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.of(context).stroke),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _StepButton(icon: Icons.remove, onTap: onMinus),
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 10),
            child: Text(
              '$value',
              style: TextStyle(
                color: AppColors.of(context).onDark,
                fontWeight: FontWeight.w700,
                fontSize: 14,
              ),
            ),
          ),
          _StepButton(icon: Icons.add, onTap: onPlus),
        ],
      ),
    );
  }
}

class _StepButton extends StatelessWidget {
  const _StepButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: SizedBox(
        width: 28,
        height: 28,
        child: Icon(icon, size: 16, color: AppColors.of(context).onDark),
      ),
    );
  }
}
