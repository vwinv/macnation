import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      throw UnsupportedError(
        'Firebase web n’est pas utilisé par l’app MAC NATION.',
      );
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        return android;
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyAzUyjn-OiMyG2JrqhvScfNgsmt_bBL6jY',
    appId: '1:129490321592:android:a16bfe3d1ac92563cbf44d',
    messagingSenderId: '129490321592',
    projectId: 'macnation-3905a',
    storageBucket: 'macnation-3905a.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyAFP-IiCcxX1z935n6ocflYrmp_LTJ9_xg',
    appId: '1:129490321592:ios:f81f11b18c2d35fccbf44d',
    messagingSenderId: '129490321592',
    projectId: 'macnation-3905a',
    storageBucket: 'macnation-3905a.firebasestorage.app',
    iosBundleId: 'com.macnation.appmobile',
    iosClientId:
        '129490321592-lgqdqkmebvn5qeb1jd4qothosu85cil0.apps.googleusercontent.com',
  );
}
