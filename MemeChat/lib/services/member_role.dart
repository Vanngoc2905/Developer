// lib/services/member_role.dart
import 'package:firebase_database/firebase_database.dart';

class MemberRole {
  static final _db = FirebaseDatabase.instance.ref();

  // Lấy owner + members
  static Future<Map<String, dynamic>> getRoomRoles(String roomId) async {
    final snap = await _db.child('rooms/$roomId').get();
    if (!snap.exists) return {'owner': '', 'members': <String>[]};

    final data = Map<String, dynamic>.from(snap.value as Map);
    return {
      'owner': data['owner'] ?? '',
      'members': List<String>.from(data['members'] ?? [])
    };
  }

  // Kiểm tra quyền chủ phòng
  static bool isRoomOwner(String user, String owner) => user == owner;

  // Thêm thành viên
  static Future<List<String>> addMember(String roomId, List<String> members, String newMember) async {
    final updated = [...members, newMember];
    await _db.child('rooms/$roomId').update({'members': updated});
    return updated;
  }

  // Xóa thành viên
  static Future<List<String>> removeMember(String roomId, List<String> members, String memberName) async {
    final updated = members.where((m) => m != memberName).toList();
    await _db.child('rooms/$roomId').update({'members': updated});
    return updated;
  }

  // Chuyển quyền chủ phòng
  static Future<String> transferOwner(String roomId, String newOwner) async {
    await _db.child('rooms/$roomId').update({'owner': newOwner});
    return newOwner;
  }
}
