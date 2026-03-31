// components/room_list.dart
import 'package:flutter/material.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:fluttertoast/fluttertoast.dart';

class RoomList extends StatefulWidget {
  final String currentRoom;
  final Function(String) onRoomSelected; // required callback
  final String username;

  const RoomList({
    super.key,
    required this.currentRoom,
    required this.onRoomSelected,
    required this.username,
  });

  @override
  State<RoomList> createState() => _RoomListState();
}

class _RoomListState extends State<RoomList> {
  List<Map<String, dynamic>> rooms = [];
  String searchCode = '';
  String newRoomName = '';
  bool showCreateModal = false;

  @override
  void initState() {
    super.initState();
    fetchRooms();
  }

  void fetchRooms() {
    final roomsRef = FirebaseDatabase.instance.ref('rooms');
    roomsRef.onValue.listen((event) {
      final data = event.snapshot.value as Map<dynamic, dynamic>?;
      final userRooms = <Map<String, dynamic>>[];
      if (data != null) {
        data.forEach((key, val) {
          final members = List<String>.from(val['members'] ?? []);
          if (members.contains(widget.username)) {
            userRooms.add({
              'key': key.toString(),
              'name': val['name']?.toString() ?? 'Phòng trống',
              'code': val['code']?.toString() ?? '000000',
              'owner': val['owner']?.toString() ?? '',
              'members': members,
            });
          }
        });
      }
      setState(() => rooms = userRooms.reversed.toList());
    });
  }

  String generateCode() =>
      (DateTime.now().millisecondsSinceEpoch % 1000000).toString().padLeft(6, '0');

  Future<void> createRoom() async {
    if (newRoomName.trim().isEmpty) {
      Fluttertoast.showToast(msg: 'Nhập tên phòng');
      return;
    }
    final code = generateCode();
    final refRoom = FirebaseDatabase.instance.ref('rooms').push();
    await refRoom.set({
      'name': newRoomName.trim(),
      'code': code,
      'owner': widget.username,
      'members': [widget.username],
    });
    Fluttertoast.showToast(msg: 'Tạo phòng thành công! Mã: $code');
    setState(() {
      newRoomName = '';
      showCreateModal = false;
    });
  }

  Future<void> joinRoomByCode() async {
    if (searchCode.trim().isEmpty) {
      Fluttertoast.showToast(msg: 'Nhập mã phòng');
      return;
    }

    final roomsRef = FirebaseDatabase.instance.ref('rooms');
    final snapshot = await roomsRef.get();

    if (!snapshot.exists) {
      Fluttertoast.showToast(msg: 'Không tìm thấy phòng');
      return;
    }

    Map<dynamic, dynamic>? data = snapshot.value as Map<dynamic, dynamic>?;
    String? foundKey;
    Map<dynamic, dynamic>? foundRoom;

    data?.forEach((key, val) {
      if (val['code']?.toString() == searchCode.trim()) {
        foundKey = key.toString();
        foundRoom = val as Map<dynamic, dynamic>?;
      }
    });

    if (foundKey == null || foundRoom == null) {
      Fluttertoast.showToast(msg: 'Không tìm thấy phòng');
      return;
    }

    final members = List<String>.from(foundRoom?['members'] ?? []);

    if (!members.contains(widget.username)) {
      members.add(widget.username);
      await FirebaseDatabase.instance
          .ref('rooms/$foundKey')
          .update({'members': members});
    }

    widget.onRoomSelected(foundKey!); // ở joinRoomByCode


    Fluttertoast.showToast(
  msg: 'Đã vào phòng "${foundRoom?['name']?.toString() ?? ''}"'
);

  }

  Future<void> deleteRoom(Map<String, dynamic> room) async {
    if ((room['owner'] ?? '') != widget.username) {
      Fluttertoast.showToast(msg: 'Chỉ chủ phòng mới xóa được');
      return;
    }

    await FirebaseDatabase.instance.ref('rooms/${room['key']}').remove();
    if (widget.currentRoom == room['key']) widget.onRoomSelected('');
    Fluttertoast.showToast(msg: 'Đã xóa phòng');
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Tìm phòng theo code
        Row(
          children: [
            Expanded(
              child: TextField(
                decoration: InputDecoration(
                  hintText: 'Mã phòng',
                  isDense: true,
                  contentPadding: EdgeInsets.all(8),
                ),
                onChanged: (v) => searchCode = v,
              ),
            ),
            IconButton(
              icon: Icon(Icons.search),
              onPressed: joinRoomByCode,
            ),
          ],
        ),
        SizedBox(height: 8),
        // Danh sách phòng
        Expanded(
          child: ListView.builder(
            itemCount: rooms.length,
            itemBuilder: (context, index) {
              final room = rooms[index];
              final selected = widget.currentRoom == room['key'];
              return ListTile(
                tileColor: selected ? Colors.blue.shade100 : null,
                leading: CircleAvatar(
                  backgroundColor: Colors.blue,
                  child: Text((room['name']?.toString() ?? '')[0].toUpperCase()),
                ),
                title: Text(room['name']?.toString() ?? ''),
                subtitle: Text('#${room['code']?.toString() ?? ''}'),
                trailing: (room['owner']?.toString() ?? '') == widget.username
                    ? IconButton(
                        icon: Icon(Icons.delete, color: Colors.red),
                        onPressed: () => deleteRoom(room),
                      )
                    : null,
                onTap: () => widget.onRoomSelected(room['key']?.toString() ?? ''),
              );
            },
          ),
        ),
        SizedBox(height: 8),
        // Tạo phòng
        ElevatedButton.icon(
          icon: Icon(Icons.add),
          label: Text('Tạo phòng mới'),
          onPressed: () => setState(() => showCreateModal = true),
        ),
        if (showCreateModal)
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Column(
              children: [
                TextField(
                  decoration: InputDecoration(hintText: 'Tên phòng'),
                  onChanged: (v) => newRoomName = v,
                ),
                SizedBox(height: 4),
                ElevatedButton(onPressed: createRoom, child: Text('Tạo')),
              ],
            ),
          ),
      ],
    );
  }
}
