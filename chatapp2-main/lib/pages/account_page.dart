// lib/pages/account_page.dart
import 'package:flutter/material.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'login_page.dart';

class AccountPage extends StatefulWidget {
  @override
  State<AccountPage> createState() => _AccountPageState();
}

class _AccountPageState extends State<AccountPage> {
  String username = '';
  String email = '';
  bool editing = false;
  bool loading = true;

  final dbRef = FirebaseDatabase.instance.ref();

  @override
  void initState() {
    super.initState();
    loadUser();
  }

  Future<void> loadUser() async {
    final prefs = await SharedPreferences.getInstance();
    final savedUsername = prefs.getString('username');
    if (savedUsername == null) {
      Fluttertoast.showToast(msg: 'Vui lòng đăng nhập trước');
      Navigator.pushReplacement(
          context, MaterialPageRoute(builder: (_) => LoginPage()));
      return;
    }
    username = savedUsername;
    final snapshot = await dbRef.child('users/$username').get();
    if (snapshot.exists) {
      final data = snapshot.value as Map;
      email = data['email'] ?? '';
    }
    setState(() {
      loading = false;
    });
  }

  Future<void> handleSave() async {
    try {
      await dbRef.child('users/$username').update({'email': email});
      Fluttertoast.showToast(msg: 'Đã lưu thông tin!');
      setState(() {
        editing = false;
      });
    } catch (e) {
      Fluttertoast.showToast(msg: 'Lưu thất bại!');
    }
  }

  Future<void> handleLogout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('username');
    Fluttertoast.showToast(msg: 'Đăng xuất thành công');
    Navigator.pushReplacement(
        context, MaterialPageRoute(builder: (_) => LoginPage()));
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }
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
                Text('Tài khoản của tôi', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                SizedBox(height: 16),
                Text('Tên đăng nhập: $username'),
                SizedBox(height: 8),
                Row(
                  children: [
                    Text('Email: '),
                    editing
                        ? Expanded(
                            child: TextField(
                              onChanged: (v) => email = v,
                              controller: TextEditingController(text: email),
                            ),
                          )
                        : Text(email.isEmpty ? 'Chưa có' : email),
                  ],
                ),
                SizedBox(height: 16),
                editing
                    ? ElevatedButton(onPressed: handleSave, child: Text('💾 Lưu thay đổi'))
                    : ElevatedButton(
                        onPressed: () {
                          setState(() {
                            editing = true;
                          });
                        },
                        child: Text('✏️ Chỉnh sửa'),
                      ),
                SizedBox(height: 8),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                  onPressed: handleLogout,
                  child: Text('🚪 Đăng xuất'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
