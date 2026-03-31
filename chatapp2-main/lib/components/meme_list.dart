// lib/components/meme_list.dart
import 'package:flutter/material.dart';

import '../firebase/firebase_config.dart';

class Meme {
  final String id;
  final String name;
  final String? image;

  Meme({required this.id, required this.name, this.image});
}

class MemeList extends StatefulWidget {
  final String search;
  final Function(String) onSelectMeme;

  const MemeList({Key? key, required this.search, required this.onSelectMeme}) : super(key: key);

  @override
  _MemeListState createState() => _MemeListState();
}

class _MemeListState extends State<MemeList> {
  final _dbRef = FirebaseConfig.database.child('memes');
  List<Meme> memes = [];

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
        return Meme(
          id: e.key,
          name: val['name'] ?? '',
          image: val['image'],
        );
      }).toList();
      list.sort((a, b) => b.id.compareTo(a.id));
      setState(() => memes = list);
    });
  }

  @override
  Widget build(BuildContext context) {
    if (widget.search.trim().isEmpty) return SizedBox.shrink();
    final filtered = memes.where((m) => m.name.toLowerCase().contains(widget.search.toLowerCase())).toList();
    if (filtered.isEmpty) return SizedBox.shrink();

    return Container(
      height: 80,
      padding: EdgeInsets.symmetric(vertical: 4),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: filtered.length,
        itemBuilder: (_, i) {
          final m = filtered[i];
          return GestureDetector(
            onTap: () => widget.onSelectMeme(m.image ?? ''),
            child: Container(
              width: 60,
              margin: EdgeInsets.symmetric(horizontal: 4),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 24,
                    backgroundImage: m.image != null ? NetworkImage(m.image!) : null,
                    child: m.image == null ? Text(m.name[0].toUpperCase()) : null,
                    backgroundColor: Colors.grey[300],
                  ),
                  SizedBox(height: 4),
                  Text(
                    m.name,
                    style: TextStyle(fontSize: 12),
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
