import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../data/repository.dart';
import '../firebase_options.dart';

class PushLink {
  const PushLink({required this.kind, this.articleId, this.bookingId});

  final String kind;
  final String? articleId;
  final String? bookingId;

  factory PushLink.fromData(Map<String, dynamic> data) {
    return PushLink(
      kind: data['kind'] as String? ?? 'general',
      articleId: data['articleId'] as String?,
      bookingId: data['bookingId'] as String?,
    );
  }
}

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    if (Firebase.apps.isEmpty) {
      await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
    }
  } catch (_) {}
}

class PushController extends ChangeNotifier {
  PushController._();
  static final PushController instance = PushController._();

  static const _channel = AndroidNotificationChannel(
    'mac_nation',
    'MAC NATION',
    description: 'Rappels de rendez-vous et actus du salon.',
    importance: Importance.high,
  );

  final FlutterLocalNotificationsPlugin _local = FlutterLocalNotificationsPlugin();
  MacNationRepository? _repository;
  PushLink? pending;
  bool _started = false;

  Future<void> start(MacNationRepository repository) async {
    _repository = repository;
    if (kIsWeb) return;
    try {
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
      }
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission(alert: true, badge: true, sound: true);
      await messaging.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );
      if (!_started) {
        await _local.initialize(
          const InitializationSettings(
            android: AndroidInitializationSettings('@mipmap/ic_launcher'),
            iOS: DarwinInitializationSettings(),
          ),
          onDidReceiveNotificationResponse: (response) {
            final payload = response.payload;
            if (payload == null || payload.isEmpty) return;
            final parts = payload.split('|');
            _setPending(
              PushLink(
                kind: parts.isNotEmpty ? parts[0] : 'general',
                articleId: parts.length > 1 && parts[1].isNotEmpty ? parts[1] : null,
                bookingId: parts.length > 2 && parts[2].isNotEmpty ? parts[2] : null,
              ),
            );
          },
        );
        await _local
            .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
            ?.createNotificationChannel(_channel);
        FirebaseMessaging.onMessage.listen(_showForeground);
        FirebaseMessaging.onMessageOpenedApp.listen((message) {
          _setPending(PushLink.fromData(message.data));
        });
        final initial = await messaging.getInitialMessage();
        if (initial != null) {
          _setPending(PushLink.fromData(initial.data));
        }
        messaging.onTokenRefresh.listen(_saveToken);
        _started = true;
      }
      final token = await messaging.getToken();
      if (token != null) await _saveToken(token);
    } catch (_) {}
  }

  Future<void> sync() async {
    final repository = _repository;
    if (repository == null || kIsWeb) return;
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) await _saveToken(token);
    } catch (_) {}
  }

  PushLink? takePending() {
    final link = pending;
    pending = null;
    return link;
  }

  Future<void> _saveToken(String token) async {
    final repository = _repository;
    if (repository == null) return;
    final platform = defaultTargetPlatform == TargetPlatform.iOS
        ? 'ios'
        : 'android';
    try {
      await repository.registerDeviceToken(token: token, platform: platform);
    } catch (_) {}
  }

  Future<void> _showForeground(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;
    if (defaultTargetPlatform == TargetPlatform.iOS) return;
    final link = PushLink.fromData(message.data);
    await _local.show(
      notification.hashCode,
      notification.title,
      notification.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _channel.id,
          _channel.name,
          channelDescription: _channel.description,
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
      ),
      payload: '${link.kind}|${link.articleId ?? ''}|${link.bookingId ?? ''}',
    );
  }

  void _setPending(PushLink link) {
    pending = link;
    notifyListeners();
  }
}
