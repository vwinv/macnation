import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

import '../../data/api_exception.dart';
import '../../state/app_state.dart';

Future<void> startSocialLogin(
  BuildContext context, {
  required String provider,
}) async {
  final state = AppScope.of(context);
  final config = await state.repository.fetchOauthConfig();

  if (provider == 'facebook') {
    throw const ApiException(
      'Facebook se connecte pour l’instant sur le site. Utilise Google, Apple ou ton mot de passe.',
    );
  }

  if (provider == 'google') {
    if (!config.googleReady) {
      throw const ApiException('Connexion Google pas encore activée.');
    }
    final google = GoogleSignIn(serverClientId: config.google);
    final account = await google.signIn();
    if (account == null) return;
    final auth = await account.authentication;
    final token = auth.idToken;
    if (token == null || token.isEmpty) {
      throw const ApiException('Connexion Google incomplète. Réessaie.');
    }
    await state.loginWithOauth(
      provider: 'google',
      credential: token,
      name: account.displayName,
    );
    return;
  }

  if (provider == 'apple') {
    if (!config.appleReady) {
      throw const ApiException('Connexion Apple pas encore activée.');
    }
    if (kIsWeb || !(Platform.isIOS || Platform.isMacOS)) {
      throw const ApiException('Apple est disponible sur iPhone et Mac.');
    }
    final nonce = DateTime.now().microsecondsSinceEpoch.toString();
    final credential = await SignInWithApple.getAppleIDCredential(
      scopes: [
        AppleIDAuthorizationScopes.email,
        AppleIDAuthorizationScopes.fullName,
      ],
      nonce: nonce,
    );
    final token = credential.identityToken;
    if (token == null || token.isEmpty) {
      throw const ApiException('Connexion Apple incomplète. Réessaie.');
    }
    final name = [
      credential.givenName,
      credential.familyName,
    ].whereType<String>().where((part) => part.trim().isNotEmpty).join(' ');
    await state.loginWithOauth(
      provider: 'apple',
      credential: token,
      nonce: nonce,
      name: name,
    );
  }
}
