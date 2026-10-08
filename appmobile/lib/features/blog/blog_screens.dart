import 'package:flutter/material.dart';

import '../../core/format.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_widgets.dart';
import '../../data/models.dart';
import '../../state/app_state.dart';

class BlogScreen extends StatefulWidget {
  const BlogScreen({super.key});

  @override
  State<BlogScreen> createState() => _BlogScreenState();
}

class _BlogScreenState extends State<BlogScreen> {
  Future<List<Article>>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= AppScope.of(context).repository.fetchArticles();
  }

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    return Scaffold(
      backgroundColor: colors.background,
      body: SafeArea(
        child: FutureBuilder<List<Article>>(
          future: _future,
          builder: (context, snapshot) {
            if (!snapshot.hasData) {
              if (snapshot.hasError) {
                return const Center(
                  child: Padding(
                    padding: EdgeInsets.all(32),
                    child: Text(
                      'Impossible de charger le journal. Vérifie l’API.',
                      textAlign: TextAlign.center,
                    ),
                  ),
                );
              }
              return const Center(
                child: CircularProgressIndicator(color: AppColors.gold),
              );
            }
            final articles = snapshot.data!;
            return ListView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
              children: [
                Align(
                  alignment: Alignment.centerLeft,
                  child: _CircleBack(onTap: () => Navigator.maybePop(context)),
                ),
                const SizedBox(height: 18),
                Text('Journal', style: Theme.of(context).textTheme.displayLarge),
                const SizedBox(height: 8),
                Text(
                  'Actus du salon, conseils grooming et coulisses à Dakar.',
                  style: TextStyle(color: colors.muted, height: 1.4, fontSize: 15),
                ),
                const SizedBox(height: 22),
                for (final article in articles)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 22),
                    child: GestureDetector(
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ArticleScreen(id: article.id),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          AssetPhoto(article.image, height: 188, radius: 18),
                          const SizedBox(height: 12),
                          Text(
                            '${article.category.toUpperCase()} · ${formatJournalStamp(article.date)}',
                            style: const TextStyle(
                              color: AppColors.gold,
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.8,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            article.title,
                            style: Theme.of(context).textTheme.displaySmall,
                          ),
                        ],
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
}

class ArticleScreen extends StatefulWidget {
  const ArticleScreen({super.key, required this.id});

  final String id;

  @override
  State<ArticleScreen> createState() => _ArticleScreenState();
}

class _ArticleScreenState extends State<ArticleScreen> {
  Future<Article>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= AppScope.of(context).repository.fetchArticle(widget.id);
  }

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    return Scaffold(
      backgroundColor: colors.background,
      body: SafeArea(
        child: FutureBuilder<Article>(
          future: _future,
          builder: (context, snapshot) {
            if (!snapshot.hasData) {
              return const Center(
                child: CircularProgressIndicator(color: AppColors.gold),
              );
            }
            final article = snapshot.data!;
            return ListView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
              children: [
                Align(
                  alignment: Alignment.centerLeft,
                  child: _CircleBack(onTap: () => Navigator.maybePop(context)),
                ),
                const SizedBox(height: 18),
                Text(
                  '${article.category.toUpperCase()} · ${formatJournalStamp(article.date)}',
                  style: const TextStyle(
                    color: AppColors.gold,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 10),
                Text(article.title, style: Theme.of(context).textTheme.displayMedium),
                const SizedBox(height: 16),
                AssetPhoto(article.image, height: 220, radius: 18),
                const SizedBox(height: 18),
                Text(
                  article.body,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.55),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _CircleBack extends StatelessWidget {
  const _CircleBack({required this.onTap});

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
          child: Icon(Icons.chevron_left, color: colors.onDark),
        ),
      ),
    );
  }
}
