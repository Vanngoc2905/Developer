import { useEffect, useState } from 'react';
import { Card, Input, Button, message, Spin } from 'antd';
import { db } from '../src/firebase/firebaseConfig';
import { ref, get, update } from 'firebase/database';
import { useRouter } from 'next/router';

export default function Account() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      const savedUsername = localStorage.getItem('username');
      if (!savedUsername) {
        message.warning('Vui lòng đăng nhập trước');
        router.replace('/login');
        return;
      }
      setUsername(savedUsername);

      // Lấy thông tin user từ Firebase
      const userRef = ref(db, `users/${savedUsername}`);
      const snap = await get(userRef);
      if (snap.exists()) {
        const data = snap.val();
        setEmail(data.email || '');
      }
      setLoading(false);
    };

    loadUser();
  }, [router]);

  const handleSave = async () => {
    if (!username.trim()) {
      message.error('Thiếu tên đăng nhập');
      return;
    }
    try {
      await update(ref(db, `users/${username}`), { email });
      message.success('Đã lưu thông tin!');
      setEditing(false);
    } catch (err) {
      console.error(err);
      message.error('Lưu thất bại!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    message.info('Đăng xuất thành công');
    router.push('/login');
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin tip="Đang tải..." />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
      }}
    >
      <Card title="Tài khoản của tôi" style={{ width: 360, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
        <p><b>Tên đăng nhập:</b> {username}</p>
        <p>
          <b>Email:</b>{' '}
          {editing ? (
            <Input
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: 220 }}
              placeholder="Nhập email..."
            />
          ) : (
            email || <i>Chưa có</i>
          )}
        </p>

        {editing ? (
          <Button type="primary" block onClick={handleSave} style={{ marginBottom: 8 }}>
            💾 Lưu thay đổi
          </Button>
        ) : (
          <Button block onClick={() => setEditing(true)} style={{ marginBottom: 8 }}>
            ✏️ Chỉnh sửa
          </Button>
        )}

        <Button danger block onClick={handleLogout}>
          🚪 Đăng xuất
        </Button>
      </Card>
    </div>
  );
}
