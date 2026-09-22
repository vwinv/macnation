import 'dart:convert';

import 'package:http/http.dart' as http;

import 'api_config.dart';
import 'api_exception.dart';
import 'token_store.dart';

class ApiClient {
  ApiClient({
    http.Client? httpClient,
    String? baseUrl,
    TokenStore? tokens,
  })  : _http = httpClient ?? http.Client(),
        baseUrl = baseUrl ?? defaultApiBaseUrl(),
        tokens = tokens ?? TokenStore();

  final http.Client _http;
  final String baseUrl;
  final TokenStore tokens;

  Future<void> ready() => tokens.load();

  Future<dynamic> get(String path) => _send('GET', path);

  Future<dynamic> post(String path, [Map<String, dynamic>? body]) {
    return _send('POST', path, body: body);
  }

  Future<dynamic> patch(String path, [Map<String, dynamic>? body]) {
    return _send('PATCH', path, body: body);
  }

  Future<dynamic> delete(String path) => _send('DELETE', path);

  Future<dynamic> _send(
    String method,
    String path, {
    Map<String, dynamic>? body,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    final headers = <String, String>{
      'Accept': 'application/json',
      if (body != null) 'Content-Type': 'application/json',
      if (tokens.token != null) 'Authorization': 'Bearer ${tokens.token}',
    };
    late http.Response res;
    try {
      switch (method) {
        case 'GET':
          res = await _http.get(uri, headers: headers).timeout(
                const Duration(seconds: 15),
              );
        case 'POST':
          res = await _http
              .post(uri, headers: headers, body: jsonEncode(body ?? {}))
              .timeout(const Duration(seconds: 15));
        case 'PATCH':
          res = await _http
              .patch(uri, headers: headers, body: jsonEncode(body ?? {}))
              .timeout(const Duration(seconds: 15));
        case 'DELETE':
          res = await _http.delete(uri, headers: headers).timeout(
                const Duration(seconds: 15),
              );
        default:
          throw ApiException('Méthode HTTP inconnue.');
      }
    } on ApiException {
      rethrow;
    } catch (_) {
      throw const ApiException(
        'Impossible de joindre MAC NATION. Vérifie que l’API tourne.',
      );
    }

    final decoded = _decode(res.body);
    if (res.statusCode >= 400) {
      throw ApiException(_errorMessage(decoded), statusCode: res.statusCode);
    }
    return decoded;
  }

  dynamic _decode(String raw) {
    if (raw.isEmpty) return null;
    try {
      return jsonDecode(raw);
    } catch (_) {
      return raw;
    }
  }

  String _errorMessage(dynamic decoded) {
    if (decoded is Map && decoded['error'] is String) {
      return decoded['error'] as String;
    }
    if (decoded is Map && decoded['message'] is String) {
      return decoded['message'] as String;
    }
    return 'Une erreur est survenue.';
  }
}
