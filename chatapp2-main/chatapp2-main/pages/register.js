import { useState } from 'react';
import { Card, Input, Button, message } from 'antd';
import { useRouter } from 'next/router';
import { db } from '../src/firebase/firebaseConfig';
import { ref, set, get, child } from 'firebase/database';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const router = useRouter();

  const handleRegister = async () => {
    if (!username || !password || !confirm) {
      message.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    if (password !== confirm) {
      message.error('Mật khẩu xác nhận không khớp');
      return;
    }
    // Kiểm tra username đã tồn tại chưa
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `users/${username}`));
    if (snapshot.exists()) {
      message.error('Tên đăng nhập đã tồn tại');
      return;
    }
    // Lưu tài khoản vào database
    await set(ref(db, `users/${username}`), {
      username,
      password, // Lưu plain text chỉ để demo, thực tế nên mã hóa!
    });
    message.success('Đăng ký thành công!');
    router.push('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card title="Đăng ký" style={{ width: 350 }}>
        <Input
          placeholder="Tên đăng nhập"
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <Input.Password
          placeholder="Mật khẩu"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <Input.Password
          placeholder="Xác nhận mật khẩu"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <Button type="primary" block onClick={handleRegister}>
          Đăng ký
        </Button>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          Đã có tài khoản? <a href="/login">Đăng nhập</a>
        </div>
      </Card>
    </div>
  );
}