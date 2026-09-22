import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';

String defaultApiBaseUrl() {
  const fromEnv = String.fromEnvironment('API_URL');
  if (fromEnv.isNotEmpty) {
    final trimmed = fromEnv.replaceAll(RegExp(r'/$'), '');
    return trimmed.endsWith('/api') ? trimmed : '$trimmed/api';
  }
  if (!kIsWeb && Platform.isAndroid) {
    return 'http://10.0.2.2:3001/api';
  }
  return 'http://localhost:3001/api';
}
