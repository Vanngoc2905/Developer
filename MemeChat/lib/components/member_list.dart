// lib/components/member_list.dart
import 'package:flutter/material.dart';
import '../services/member_role.dart';

class MemberList extends StatefulWidget {
  final String currentRoom;
  final String currentUser;

  const MemberList({Key? key, required this.currentRoom, required this.currentUser}) : super(key: key);

  @override
  _MemberListState createState() => _MemberListState();
}

class _MemberListState extends State<MemberList> {
  List<String> members = [];
  String owner = '';
  TextEditingController newMemberController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadMembers();
  }

  void _loadMembers() async {
    if (widget.currentRoom.isEmpty) return;
    final data = await MemberRole.getRoomRoles(widget.currentRoom);
    setState(() {
      owner = data['owner'];
      members = List<String>.from(data['members']);
    });
  }

  void _addMember() async {
    if (!MemberRole.isRoomOwner(widget.currentUser, owner)) {
      _showMessage('Chỉ chủ phòng mới được thêm thành viên');
      return;
    }
    final newMember = newMemberController.text.trim();
    if (newMember.isEmpty) {
      _showMessage('Nhập tên thành viên');
      return;
    }
    if (members.contains(newMember)) {
      _showMessage('Thành viên đã có trong phòng');
      return;
    }
    final updated = await MemberRole.addMember(widget.currentRoom, members, newMember);
    setState(() => members = updated);
    newMemberController.clear();
    Navigator.pop(context);
    _showMessage('Đã thêm $newMember');
  }

  void _removeMember(String name) async {
    if (!MemberRole.isRoomOwner(widget.currentUser, owner)) {
      _showMessage('Chỉ chủ phòng mới được xóa thành viên');
      return;
    }
    if (name == owner) {
      _showMessage('Không thể xóa chủ phòng');
      return;
    }
    final confirm = await showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Xóa thành viên'),
        content: Text('Bạn có chắc muốn xóa $name?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text('Hủy')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: Text('Xóa')),
        ],
      ),
    );
    if (confirm == true) {
      final updated = await MemberRole.removeMember(widget.currentRoom, members, name);
      setState(() => members = updated);
      _showMessage('Đã xóa $name');
    }
  }

  void _transferOwner(String name) async {
    if (!MemberRole.isRoomOwner(widget.currentUser, owner)) {
      _showMessage('Chỉ chủ phòng mới được nhượng quyền');
      return;
    }
    final confirm = await showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Nhượng quyền chủ phòng'),
        content: Text('Bạn có chắc muốn nhượng quyền cho $name?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text('Hủy')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: Text('Đồng ý')),
        ],
      ),
    );
    if (confirm == true) {
      final newOwner = await MemberRole.transferOwner(widget.currentRoom, name);
      setState(() => owner = newOwner);
      _showMessage('Đã nhượng quyền cho $name');
    }
  }

  void _showMessage(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  void _openAddMemberModal() {
    showModalBottomSheet(
      context: context,
      builder: (_) => Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: newMemberController,
              decoration: InputDecoration(labelText: 'Nhập tên thành viên'),
            ),
            SizedBox(height: 8),
            ElevatedButton(onPressed: _addMember, child: Text('Thêm')),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(12),
      color: Colors.white,
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Thành viên', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              if (MemberRole.isRoomOwner(widget.currentUser, owner))
                IconButton(icon: Icon(Icons.add), onPressed: _openAddMemberModal),
            ],
          ),
          Expanded(
            child: ListView.builder(
              itemCount: members.length,
              itemBuilder: (_, index) {
                final item = members[index];
                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: item == owner ? Colors.blue : Colors.grey,
                    child: Text(item[0].toUpperCase()),
                  ),
                  title: Text(item),
                  subtitle: Text(item == owner ? 'Chủ phòng' : item == widget.currentUser ? 'Bạn' : ''),
                  trailing: MemberRole.isRoomOwner(widget.currentUser, owner) && item != owner
                      ? PopupMenuButton(
                          onSelected: (v) {
                            if (v == 'transfer') _transferOwner(item);
                            if (v == 'remove') _removeMember(item);
                          },
                          itemBuilder: (_) => [
                            PopupMenuItem(value: 'transfer', child: Text('👑 Nhượng quyền')),
                            PopupMenuItem(value: 'remove', child: Text('🗑 Xóa')),
                          ],
                        )
                      : null,
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
