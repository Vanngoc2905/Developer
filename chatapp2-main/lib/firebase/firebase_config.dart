import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:firebase_storage/firebase_storage.dart';

class FirebaseConfig {
  // Biến giữ instance FirebaseApp
  static FirebaseApp? _app;

  /// Khởi tạo Firebase an toàn, chỉ chạy nếu chưa có app nào
  static Future<FirebaseApp> initialize() async {
    // Nếu đã init rồi, trả về luôn
    if (_app != null) return _app!;

    // Nếu Firebase đã có app mặc định, dùng luôn
    if (Firebase.apps.isNotEmpty) {
      _app = Firebase.apps.firstWhere(
        (app) => app.name == '[DEFAULT]',
        orElse: () => Firebase.apps.first,
      );
      return _app!;
    }

    // Khởi tạo Firebase lần đầu
    _app = await Firebase.initializeApp(
      options: const FirebaseOptions(
        apiKey: "AIzaSyByV88b1HvydGBW59mXZD18slCBe332Rdo",
        authDomain: "chatappdemo-44d04.firebaseapp.com",
        databaseURL:
            "https://chatappdemo-44d04-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "chatappdemo-44d04",
        storageBucket: "chatappdemo-44d04.appspot.com",
        messagingSenderId: "827872970653",
        appId: "1:827872970653:web:f5423367bd92becf089174",
        measurementId: "G-2YGCZ31CEN",
      ),
    );

    return _app!;
  }

  /// DatabaseReference chính
  static DatabaseReference get database {
    // Trả về ref mặc định của app đã init
    return FirebaseDatabase.instance.ref();
  }

  /// FirebaseStorage chính
  static FirebaseStorage get storage {
    return FirebaseStorage.instance;
  }
}
