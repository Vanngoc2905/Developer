// lib/pages/login_page.dart
import 'package:flutter/material.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:flutter_application_1/main.dart';
 // Sau khi login thành công

class LoginPage extends StatefulWidget {
  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  String username = '';
  String password = '';

  final dbRef = FirebaseDatabase.instance.ref();

  Future<void> handleLogin() async {
    if (username.isEmpty || password.isEmpty) {
      Fluttertoast.showToast(msg: 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    final snapshot = await dbRef.child('users/$username').get();
    if (!snapshot.exists) {
      Fluttertoast.showToast(msg: 'Tài khoản không tồn tại');
      return;
    }

    final userData = snapshot.value as Map;
    if (userData['password'] != password) {
      Fluttertoast.showToast(msg: 'Sai mật khẩu');
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('username', username);

    Fluttertoast.showToast(msg: 'Đăng nhập thành công!');
    Navigator.pushReplacement(
        context, MaterialPageRoute(builder: (_) => HomePage()));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFC79A5B), Color(0xFF6B4E32)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        alignment: Alignment.center,
        child: Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          elevation: 8,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircleAvatar(
                  radius: 50,
                  backgroundImage: AssetImage('assets/anh1.png'),
                ),
                SizedBox(height: 16),
                Text('MeMeChat', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF6B4E32))),
                SizedBox(height: 8),
                Text('Kết nối cùng thiên nhiên và bạn bè 🌿', style: TextStyle(color: Color(0xFF7E6C55))),
                SizedBox(height: 24),
                TextField(
                  decoration: InputDecoration(
                    prefixIcon: Icon(Icons.person, color: Color(0xFF8B633A)),
                    hintText: 'Tên đăng nhập',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onChanged: (v) => username = v,
                ),
                SizedBox(height: 16),
                TextField(
                  obscureText: true,
                  decoration: InputDecoration(
                    prefixIcon: Icon(Icons.lock, color: Color(0xFF8B633A)),
                    hintText: 'Mật khẩu',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onChanged: (v) => password = v,
                ),
                SizedBox(height: 24),
               ElevatedButton(
                    onPressed: handleLogin,
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size(double.infinity, 48),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      backgroundColor: Colors.blue,
                    ),
                    child: const Text(
                      'Đăng nhập',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),

                SizedBox(height: 20),
                GestureDetector(
                  onTap: () {
                    Navigator.pushNamed(context, '/register');
                  },
                  child: Text('Chưa có tài khoản? Đăng ký ngay',
                      style: TextStyle(color: Color(0xFFA06D35), fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
