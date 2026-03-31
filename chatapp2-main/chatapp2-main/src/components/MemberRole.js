// MemberRole.js
import { ref, get, update } from 'firebase/database';
import { db } from '../firebase/firebaseConfig';

// ✅ Lấy dữ liệu vai trò
export const getRoomRoles = async (roomId) => {
  const roomRef = ref(db, `rooms/${roomId}`);
  const snap = await get(roomRef);
  if (!snap.exists()) return { owner: '', members: [] };
  const data = snap.val();
  return {
    owner: data.owner || '',
    members: Array.isArray(data.members) ? data.members : []
  };
};

// ✅ Kiểm tra quyền chủ phòng
export const isRoomOwner = (user, owner) => user === owner;

// ✅ Thêm thành viên mới
export const addMember = async (roomId, members, newMember) => {
  const updated = [...members, newMember];
  await update(ref(db, `rooms/${roomId}`), { members: updated });
  return updated;
};

// ✅ Xóa thành viên
export const removeMember = async (roomId, members, memberName) => {
  const updated = members.filter(m => m !== memberName);
  await update(ref(db, `rooms/${roomId}`), { members: updated });
  return updated;
};

// ✅ Nhượng quyền chủ phòng
export const transferOwner = async (roomId, newOwner) => {
  await update(ref(db, `rooms/${roomId}`), { owner: newOwner });
  return newOwner;
};
