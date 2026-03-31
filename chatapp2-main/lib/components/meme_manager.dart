// lib/components/meme_manager.dart
import 'package:flutter/material.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:convert';
import 'dart:io';

class Meme {
  final String id;
  String name;
  String? image;

  Meme({required this.id, required this.name, this.image});
}

class MemeManager extends StatefulWidget {
  final VoidCallback onClose; // thêm onClose

  const MemeManager({Key? key, required this.onClose}) : super(key: key);

  @override
  _MemeManagerState createState() => _MemeManagerState();
}

class _MemeManagerState extends State<MemeManager> {
  final _dbRef = FirebaseDatabase.instance.ref('memes');
  List<Meme> memes = [];
  String newMemeName = '';
  File? file;
  String? editingId;
  String editingName = '';

  @override
  void initState() {
    super.initState();
    _loadMemes();
  }

  void _loadMemes() {
    _dbRef.onValue.listen((event) {
      final data = event.snapshot.value as Map<dynamic, dynamic>?;
      if (data == null) {
        setState(() => memes = []);
        return;
      }
      final list = data.entries.map((e) {
        final val = Map<String, dynamic>.from(e.value);
        return Meme(id: e.key, name: val['name'], image: val['image']);
      }).toList();
      list.sort((a, b) => b.id.compareTo(a.id));
      setState(() => memes = list);
    });
  }

  Future<String?> _fileToBase64(File file) async {
    final bytes = await file.readAsBytes();
    return base64Encode(bytes);
  }

  void _addMeme() async {
    if (newMemeName.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Nhập tên meme')));
      return;
    }
    String? base64Image;
    if (file != null) base64Image = await _fileToBase64(file!);
    final id = DateTime.now().millisecondsSinceEpoch.toString();
    await _dbRef.child(id).set({'name': newMemeName.trim(), 'image': base64Image});
    setState(() {
      newMemeName = '';
      file = null;
    });
  }

  void _deleteMeme(String id) => _dbRef.child(id).remove();

  void _editMeme(String id, String name) {
    setState(() {
      editingId = id;
      editingName = name;
    });
  }

  void _saveMeme(String id) async {
    await _dbRef.child(id).update({'name': editingName});
    setState(() {
      editingId = null;
      editingName = '';
    });
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final XFile? picked = await picker.pickImage(source: ImageSource.gallery);
    if (picked != null) setState(() => file = File(picked.path));
  }

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: 40,
      left: 40,
      right: 40,
      bottom: 40,
      child: Material(
        elevation: 8,
        borderRadius: BorderRadius.circular(12),
        color: Colors.white,
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Quản lý Meme', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  IconButton(
                    icon: Icon(Icons.close),
                    onPressed: widget.onClose, // dùng onClose
                  ),
                ],
              ),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      decoration: InputDecoration(hintText: 'Tên meme mới'),
                      onChanged: (v) => newMemeName = v,
                    ),
                  ),
                  IconButton(icon: Icon(Icons.upload), onPressed: _pickImage),
                  ElevatedButton(onPressed: _addMeme, child: Text('Thêm')),
                ],
              ),
              SizedBox(height: 16),
              Expanded(
                child: ListView.builder(
                  itemCount: memes.length,
                  itemBuilder: (_, i) {
                    final m = memes[i];
                    return ListTile(
                      leading: m.image != null ? Image.memory(base64Decode(m.image!)) : null,
                      title: editingId == m.id
                          ? TextField(
                              onChanged: (v) => editingName = v,
                              controller: TextEditingController(text: editingName),
                            )
                          : Text(m.name),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (editingId == m.id)
                            IconButton(icon: Icon(Icons.save), onPressed: () => _saveMeme(m.id))
                          else ...[
                            IconButton(icon: Icon(Icons.edit), onPressed: () => _editMeme(m.id, m.name)),
                            IconButton(icon: Icon(Icons.delete), onPressed: () => _deleteMeme(m.id)),
                          ]
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
