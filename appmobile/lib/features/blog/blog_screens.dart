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
  String _filter = 'Tous';

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= AppScope.of(context).repository.fetchArticles();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Journal')),
      body: FutureBuilder<List<Article>>(
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
          final categories = ['Tous', ...{for (final a in articles) a.category}];
          final visible = _filter == 'Tous'
              ? articles
              : articles.where((a) => a.category == _filter).toList();
          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
            children: [
              SizedBox(
                height: 38,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: categories.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 8),
                  itemBuilder: (context, index) {
                    final cat = categories[index];
                    final selected = cat == _filter;
                    return GestureDetector(
                      onTap: () => setState(() => _filter = cat),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: selected ? AppColors.gold : AppColors.card,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: selected ? AppColors.gold : AppColors.stroke,
                          ),
                        ),
                        child: Text(
                          cat,
                          style: TextStyle(
                            color: selected ? AppColors.ink : Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 18),
              for (final article in visible)
                Padding(
                  padding: const EdgeInsets.only(bottom: 18),
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
                        AssetPhoto(article.image, height: 180),
                        const SizedBox(height: 10),
                        Text(article.category, style: const TextStyle(color: AppColors.gold)),
                        Text(article.title, style: Theme.of(context).textTheme.displaySmall),
                        Text(formatDateShort(article.date)),
                        const SizedBox(height: 4),
                        Text(article.excerpt),
                      ],
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
    return Scaffold(
      appBar: AppBar(title: const Text('Journal')),
      body: FutureBuilder<Article>(
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
              GoldChip(article.category),
              const SizedBox(height: 12),
              Text(article.title, style: Theme.of(context).textTheme.displayMedium),
              const SizedBox(height: 6),
              Text(formatDateLong(article.date)),
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
    );
  }
}
