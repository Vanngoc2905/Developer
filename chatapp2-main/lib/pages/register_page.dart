// lib/pages/register_page.dart
import 'package:flutter/material.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:fluttertoast/fluttertoast.dart';

import 'login_page.dart';

class RegisterPage extends StatefulWidget {
  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  String username = '';
  String password = '';
  String confirm = '';

  final dbRef = FirebaseDatabase.instance.ref();

  Future<void> handleRegister() async {
    if (username.isEmpty || password.isEmpty || confirm.isEmpty) {
      Fluttertoast.showToast(msg: 'Vui lòng nhập đầy đủ thông tin');
      return;
    }
    if (password != confirm) {
      Fluttertoast.showToast(msg: 'Mật khẩu xác nhận không khớp');
      return;
    }

    final snapshot = await dbRef.child('users/$username').get();
    if (snapshot.exists) {
      Fluttertoast.showToast(msg: 'Tên đăng nhập đã tồn tại');
      return;
    }

    await dbRef.child('users/$username').set({
      'username': username,
      'password': password, // chỉ demo, nên hash thực tế
    });

    Fluttertoast.showToast(msg: 'Đăng ký thành công!');
    Navigator.pushReplacement(
        context, MaterialPageRoute(builder: (_) => LoginPage()));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Card(
          elevation: 8,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  decoration: InputDecoration(hintText: 'Tên đăng nhập'),
                  onChanged: (v) => username = v,
                ),
                SizedBox(height: 16),
                TextField(
                  obscureText: true,
                  decoration: InputDecoration(hintText: 'Mật khẩu'),
                  onChanged: (v) => password = v,
                ),
                SizedBox(height: 16),
                TextField(
                  obscureText: true,
                  decoration: InputDecoration(hintText: 'Xác nhận mật khẩu'),
                  onChanged: (v) => confirm = v,
                ),
                SizedBox(height: 16),
                ElevatedButton(
                  onPressed: handleRegister,
                  child: Text('Đăng ký'),
                ),
                SizedBox(height: 16),
                GestureDetector(
                  onTap: () {
                    Navigator.pushReplacement(
                        context, MaterialPageRoute(builder: (_) => LoginPage()));
                  },
                  child: Text('Đã có tài khoản? Đăng nhập'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
