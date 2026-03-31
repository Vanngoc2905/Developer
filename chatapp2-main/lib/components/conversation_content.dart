// lib/components/conversation_content.dart
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:firebase_database/firebase_database.dart';
import '../firebase/firebase_config.dart';
import 'meme_list.dart';

class ConversationMessage {
  final String key;
  final String from;
  final String? content;
  final String? imageUrl;
  final int createdAt;

  ConversationMessage({
    required this.key,
    required this.from,
    this.content,
    this.imageUrl,
    required this.createdAt,
  });
}

class ConversationContent extends StatefulWidget {
  final String username;
  final String roomId;
  final List<String> roomMembers;
  final VoidCallback openMemeManager;

  const ConversationContent({
    Key? key,
    required this.username,
    required this.roomId,
    required this.roomMembers,
    required this.openMemeManager,
  }) : super(key: key);

  @override
  _ConversationContentState createState() => _ConversationContentState();
}

class _ConversationContentState extends State<ConversationContent> {
  final _dbRef = FirebaseConfig.database.child('conversations');
  final _scrollController = ScrollController();
  final _messageController = TextEditingController();
  final _searchController = TextEditingController();

  List<ConversationMessage> conversations = [];
  bool uploading = false;

  StreamSubscription<DatabaseEvent>? _subscription;

  @override
  void initState() {
    super.initState();
    _loadConversations();
  }

  void _loadConversations() {
    if (widget.roomId.isEmpty) return;

    _subscription?.cancel();
    _subscription = _dbRef.onValue.listen((event) {
      final data = event.snapshot.value as Map<dynamic, dynamic>?;

      if (data == null) {
        setState(() {
          conversations = [];
        });
        return;
      }

      final list = <ConversationMessage>[];
      data.forEach((key, val) {
        final map = Map<String, dynamic>.from(val);
        if (map['roomId'] == widget.roomId) {
          list.add(ConversationMessage(
            key: key,
            from: map['from'] ?? '',
            content: map['content'],
            imageUrl: map['imageUrl'],
            createdAt: map['createdAt'] ?? 0,
          ));
        }
      });

      list.sort((a, b) => a.createdAt.compareTo(b.createdAt));

      setState(() {
        conversations = list;
      });

      _scrollToEnd();
    });
  }

  @override
  void didUpdateWidget(covariant ConversationContent oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.roomId != widget.roomId) {
      _loadConversations();
    }
  }

  @override
  void dispose() {
    _subscription?.cancel();
    _messageController.dispose();
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  String formatTime(int ts) {
    final date = DateTime.fromMillisecondsSinceEpoch(ts);
    return "${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}";
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> sendMessage() async {
    if (_messageController.text.trim().isEmpty || widget.roomId.isEmpty) return;
    final msgRef = _dbRef.push();
    await msgRef.set({
      'roomId': widget.roomId,
      'from': widget.username,
      'content': _messageController.text.trim(),
      'imageUrl': null,
      'createdAt': DateTime.now().millisecondsSinceEpoch,
    });
    _messageController.clear();
    _searchController.clear();
  }

  Future<void> sendImage(String imageBase64) async {
    if (imageBase64.isEmpty || widget.roomId.isEmpty) return;
    final msgRef = _dbRef.push();
    await msgRef.set({
      'roomId': widget.roomId,
      'from': widget.username,
      'content': null,
      'imageUrl': imageBase64,
      'createdAt': DateTime.now().millisecondsSinceEpoch,
    });
  }

  @override
  Widget build(BuildContext context) {
    if (widget.roomId.isEmpty) {
      return Center(child: Text("Hãy chọn một phòng để bắt đầu chat!", style: TextStyle(color: Colors.grey)));
    }

    if (!widget.roomMembers.contains(widget.username)) {
      return Center(child: Text("Bạn chưa phải thành viên phòng này!", style: TextStyle(color: Colors.grey)));
    }

    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            controller: _scrollController,
            itemCount: conversations.length,
            padding: EdgeInsets.all(8),
            itemBuilder: (context, index) {
              final item = conversations[index];
              final isMe = item.from == widget.username;
              return Align(
                alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      if (!isMe)
                        CircleAvatar(
                          backgroundColor: Colors.grey[400],
                          child: Text(item.from.isNotEmpty ? item.from[0].toUpperCase() : '?'),
                        ),
                      SizedBox(width: 8),
                      Flexible(
                        child: Container(
                          padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: isMe ? Colors.blue[50] : Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 2)],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(isMe ? "Bạn" : item.from, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                                  Text(formatTime(item.createdAt), style: TextStyle(fontSize: 10, color: Colors.grey[400])),
                                ],
                              ),
                              if (item.imageUrl != null)
                                Padding(
                                  padding: EdgeInsets.only(top: 4),
                                  child: Image.network(item.imageUrl!),
                                ),
                              if (item.content != null)
                                Padding(
                                  padding: EdgeInsets.only(top: 4),
                                  child: Text(item.content!, style: TextStyle(fontSize: 14)),
                                ),
                            ],
                          ),
                        ),
                      ),
                      SizedBox(width: 8),
                      if (isMe)
                        CircleAvatar(
                          backgroundColor: Colors.blue,
                          child: Text(item.from.isNotEmpty ? item.from[0].toUpperCase() : '?', style: TextStyle(color: Colors.white)),
                        ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        MemeList(
          search: _searchController.text,
          onSelectMeme: (image) => sendImage(image),
        ),
        Padding(
          padding: const EdgeInsets.all(4),
          child: Row(
            children: [
              IconButton(
                icon: Icon(Icons.emoji_emotions),
                onPressed: widget.openMemeManager,
              ),
              IconButton(
                icon: uploading ? CircularProgressIndicator() : Icon(Icons.image),
                onPressed: () {
                  // Chọn ảnh từ device + gửi
                },
              ),
              Expanded(
                child: TextField(
                  controller: _messageController,
                  decoration: InputDecoration(hintText: "Nhập tin nhắn..."),
                  onChanged: (v) => _searchController.text = v,
                  onSubmitted: (_) => sendMessage(),
                ),
              ),
              IconButton(
                icon: Icon(Icons.send),
                onPressed: sendMessage,
              ),
            ],
          ),
        )
      ],
    );
  }
}
