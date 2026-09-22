import 'package:shared_preferences/shared_preferences.dart';

class TokenStore {
  static const _key = 'mn_token';

  String? _token;

  String? get token => _token;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(_key);
  }

  Future<void> save(String? value) async {
    _token = value;
    final prefs = await SharedPreferences.getInstance();
    if (value == null || value.isEmpty) {
      await prefs.remove(_key);
    } else {
      await prefs.setString(_key, value);
    }
  }
}
