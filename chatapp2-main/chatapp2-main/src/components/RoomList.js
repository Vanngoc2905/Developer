// RoomList.js
import React, { useEffect, useState, useRef } from 'react';
import { db } from '../firebase/firebaseConfig';
import { ref, onValue, push, remove, get, update, query, limitToLast, orderByKey, onChildAdded } from 'firebase/database';
import { List, Button, Input, Modal, message, Avatar, notification } from 'antd';
import { DeleteOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';

function RoomList({ currentRoom, setCurrentRoom, username }) {
  const [rooms, setRooms] = useState(() => {
    // 💡 Tối ưu: Lấy danh sách phòng từ cache để sidebar hiện ngay lập tức
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`cached_rooms_${username}`);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [showModal, setShowModal] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [searchCode, setSearchCode] = useState('');

  // Lấy danh sách các phòng user tham gia (Tối ưu: Lấy từ Firebase)
  useEffect(() => {
    const roomsRef = ref(db, 'rooms');
    const unsubscribe = onValue(roomsRef, (snap) => {
      if (snap.exists()) {
        const items = [];
        snap.forEach((item) => {
          const val = item.val();
          // Kiểm tra xem user có phải thành viên không
          if (val.members && Array.isArray(val.members) && val.members.includes(username)) {
            items.push({
              key: item.key,
              ...val,
            });
          }
        });
        setRooms(items);
        // Lưu vào cache
        localStorage.setItem(`cached_rooms_${username}`, JSON.stringify(items));
      } else {
        setRooms([]);
        localStorage.removeItem(`cached_rooms_${username}`);
      }
    }, (error) => {
      console.error("Firebase RoomList error:", error);
    });
    return () => unsubscribe();
  }, [username]);

  // Luôn giữ latest currentRoom mà không làm trigger lại event Firebase
  const currentRoomRef = useRef(currentRoom);
  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);

  // Lắng nghe tin nhắn mới ở tất cả các phòng người dùng tham gia
  useEffect(() => {
    if (!rooms || rooms.length === 0) return;
    const unsubs = [];
    const mountTime = Date.now();

    rooms.forEach((room) => {
      const roomMsgRef = ref(db, `room_messages/${room.key}`);
      const q = query(roomMsgRef, orderByKey(), limitToLast(1));
      
      const unsub = onChildAdded(q, (snap) => {
        const msg = snap.val();
        if (!msg) return;
        if (msg.from === username) return; // Bỏ qua tin của chính mình
        if (room.key === currentRoomRef.current) return; // Bỏ qua tin phòng đang xem
        if (msg.createdAt && msg.createdAt <= mountTime) return; // Bỏ qua lịch sử cũ

        notification.info({
          message: `Có tin nhắn mới: ${room.name}`,
          description: `${msg.from}: ${msg.content ? msg.content : '[Đã gửi một ảnh]'}`,
          placement: 'topRight',
          duration: 4,
          style: { cursor: 'pointer', borderRadius: '12px', background: '#fffaf2' },
          onClick: () => {
            setCurrentRoom(room.key);
          }
        });
      });
      unsubs.push(unsub);
    });

    return () => {
      unsubs.forEach(fn => fn());
    };
  }, [rooms, username, setCurrentRoom]);

  const generateRoomCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      message.error('Tên phòng không được để trống');
      return;
    }
    const code = generateRoomCode();
    const roomData = {
      name: roomName.trim(),
      code,
      owner: username,
      members: [username],
    };

    try {
      await push(ref(db, 'rooms'), roomData);
      setRoomName('');
      setShowModal(false);
      message.success(`Tạo phòng thành công! Mã: ${code}`);
    } catch (err) {
      console.error(err);
      message.error('Tạo phòng thất bại');
    }
  };

  // Tìm phòng theo mã (tìm trong toàn bộ rooms)
  const handleSearchRoom = async () => {
    if (!searchCode.trim()) {
      message.warning('Nhập mã phòng để tìm');
      return;
    }
    const roomsRef = ref(db, 'rooms');
    const snap = await get(roomsRef);
    if (!snap.exists()) {
      message.error('Không có phòng nào trong hệ thống');
      return;
    }
    let found = null;
    snap.forEach((item) => {
      const val = item.val();
      if (val.code === searchCode.trim().toUpperCase()) {
        found = { key: item.key, ...val };
      }
    });

    if (!found) {
      message.error('Không tìm thấy phòng với mã này');
      return;
    }

    // Nếu user chưa có trong members, thêm họ vào
    if (!found.members || !Array.isArray(found.members) || !found.members.includes(username)) {
      const newMembers = [...(found.members || []), username];
      await update(ref(db, `rooms/${found.key}`), { members: newMembers });
    }

    setCurrentRoom(found.key);
    message.success(`Đã vào phòng "${found.name}"`);
  };

  const handleDeleteRoom = (room) => {
    if (!room.owner || room.owner !== username) {
      message.error('Chỉ chủ phòng mới có quyền xóa phòng');
      return;
    }
    Modal.confirm({
      title: 'Xóa phòng?',
      content: `Bạn có chắc muốn xóa "${room.name}"?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await remove(ref(db, `rooms/${room.key}`));
          message.success('Đã xóa phòng');
          if (currentRoom === room.key) setCurrentRoom('');
        } catch (err) {
          console.error(err);
          message.error('Xóa phòng thất bại');
        }
      },
    });
  };

  return (
    <div style={{ padding: '1rem 0.5rem', background: '#fff', height: '100%' }}>
      <div style={{ marginBottom: 12 }}>
        <Input.Search
          placeholder="Nhập mã phòng để tham gia"
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value)}
          onSearch={handleSearchRoom}
          enterButton={<SearchOutlined />}
          allowClear
          size="small"
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <b style={{ fontSize: 16 }}>Phòng chat</b>
        <Button
          type="primary"
          shape="circle"
          icon={<PlusOutlined />}
          onClick={() => setShowModal(true)}
          size="middle"
          style={{ background: '#1890ff', color: '#fff', border: 'none' }}
        />
      </div>

      <List
        dataSource={rooms}
        renderItem={(item) => (
          <List.Item
            style={{
              background: currentRoom === item.key ? '#e6f7ff' : 'transparent',
              borderRadius: 8,
              marginBottom: 4,
              cursor: 'pointer',
              padding: 8,
              display: 'flex',
              alignItems: 'center',
            }}
            onClick={() => setCurrentRoom(item.key)}
          >
            <Avatar style={{ background: '#1890ff', marginRight: 10 }}>
              {item.name ? item.name[0].toUpperCase() : '?'}
            </Avatar>
            <span style={{ flex: 1, fontWeight: 500 }}>
              {item.name}
              <span style={{ color: '#888', fontSize: 12, marginLeft: 8 }}>#{item.code}</span>
            </span>

            {item.owner === username && (
              <Button
                icon={<DeleteOutlined />}
                size="small"
                danger
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteRoom(item);
                }}
              />
            )}
          </List.Item>
        )}
      />

      <Modal
        open={showModal}
        title="Tạo phòng mới"
        onOk={handleCreateRoom}
        onCancel={() => setShowModal(false)}
        okText="Tạo"
        cancelText="Hủy"
      >
        <Input
          placeholder="Tên phòng"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          onPressEnter={handleCreateRoom}
        />
      </Modal>
    </div>
  );
}

export default RoomList;
