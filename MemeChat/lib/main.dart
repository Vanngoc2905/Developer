

import 'package:flutter/material.dart';
import 'firebase/firebase_config.dart';

import 'components/room_list.dart';
import 'components/member_list.dart';
import 'components/conversation_content.dart';
import 'components/meme_manager.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await FirebaseConfig.initialize(); // chắc chắn chỉ chạy 1 lần
  runApp(MeMeChatApp());
}


class MeMeChatApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'MeMeChat',
      theme: ThemeData(
        primaryColor: Color(0xFFA67B47),
        scaffoldBackgroundColor: Color(0xFFF7F0E3),
      ),
      home: HomePage(),
    );
  }
}

class HomePage extends StatefulWidget {
  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  String username = '';
  String currentRoom = '';
  Map<String, List<String>> roomMembers = {};
  bool showMembers = false;
  bool showMemeManager = false;

  final panelColor = Color(0xFFF0E3CF);
  final headerColor = Color(0xFFD8B892);
  final accent = Color(0xFFA67B47);
  final textColor = Color(0xFF3E3327);

  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      setState(() {
        username = 'User';
      });
    });
  }

  void listenRoomMembers(String roomId) {
    if (roomId.isEmpty) return;

    final roomRef = FirebaseConfig.database.child('rooms/$roomId');
    roomRef.onValue.listen((event) {
      final data = event.snapshot.value as Map<dynamic, dynamic>?;

      final membersList = data?['members'] as List<dynamic>?;

      setState(() {
        roomMembers[roomId] =
            membersList?.map((e) => e.toString()).toList() ?? [];
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    if (username.isEmpty) {
      return Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      key: _scaffoldKey,
      body: SafeArea(
        child: Column(
          children: [
            Container(
              padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              margin: EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: headerColor,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 8)],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 21,
                        backgroundImage: AssetImage('assets/anh1.png'),
                      ),
                      SizedBox(width: 8),
                      Text(
                        'MeMeChat',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                          color: Color(0xFF4A3829),
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      if (currentRoom.isNotEmpty)
                        IconButton(
                          icon: Icon(Icons.group, color: Colors.white),
                          onPressed: () {
                            setState(() {
                              showMembers = !showMembers;
                            });
                          },
                        ),
                      IconButton(
                        icon: Icon(Icons.menu),
                        color: Colors.white,
                        onPressed: () {
                          _scaffoldKey.currentState?.openDrawer();
                        },
                      ),
                    ],
                  )
                ],
              ),
            ),
            Expanded(
              child: Row(
                children: [
                  Container(
                    width: 250,
                    margin: EdgeInsets.only(right: 8),
                    padding: EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: panelColor,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        Expanded(
                          child: RoomList(
                            currentRoom: currentRoom,
                            username: username,
                            onRoomSelected: (room) {
                              setState(() {
                                currentRoom = room;
                                showMembers = false;
                                listenRoomMembers(room);
                              });
                            },
                          ),
                        ),
                        Divider(),
                        Row(
                          children: [
                            CircleAvatar(
                              backgroundColor: accent,
                              child: Text(
                                username.isNotEmpty
                                    ? username[0].toUpperCase()
                                    : '',
                                style: TextStyle(color: Colors.white),
                              ),
                            ),
                            SizedBox(width: 8),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(username,
                                    style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: textColor)),
                                TextButton(
                                  onPressed: () {},
                                  child: Text('Tài khoản'),
                                ),
                              ],
                            )
                          ],
                        )
                      ],
                    ),
                  ),
                  Expanded(
                    child: Stack(
                      children: [
                        Container(
                          decoration: BoxDecoration(
                            color: Color(0xFFFFFAF2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: currentRoom.isEmpty
                              ? Center(
                                  child: Text('Chọn phòng để bắt đầu chat'))
                              : ConversationContent(
                                  username: username,
                                  roomId: currentRoom,
                                  roomMembers:
                                      roomMembers[currentRoom] ?? [],
                                  openMemeManager: () {
                                    setState(() {
                                      showMemeManager = true;
                                    });
                                  },
                                ),
                        ),
                        if (showMembers)
                          Positioned(
                            top: 0,
                            right: 0,
                            bottom: 0,
                            width: 220,
                            child: Container(
                              padding: EdgeInsets.all(8),
                              color: panelColor,
                              child: MemberList(
                                currentRoom: currentRoom,
                                currentUser: username,
                              ),
                            ),
                          )
                      ],
                    ),
                  )
                ],
              ),
            ),
            if (showMemeManager)
              MemeManager(
                onClose: () {
                  setState(() {
                    showMemeManager = false;
                  });
                },
              ),
          ],
        ),
      ),
      drawer: Drawer(
        child: Container(
          color: panelColor,
          child: Column(
            children: [
              RoomList(
                currentRoom: currentRoom,
                username: username,
                onRoomSelected: (room) {
                  setState(() {
                    currentRoom = room;
                  });
                  Navigator.pop(context);
                },
              ),
              if (currentRoom.isNotEmpty)
                MemberList(currentRoom: currentRoom, currentUser: username),
            ],
          ),
        ),
      ),
    );
  }
}
