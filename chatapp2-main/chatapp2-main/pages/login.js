import { useState } from 'react';
import { Card, Input, Button, message, Avatar } from 'antd';
import { useRouter } from 'next/router';
import { db } from '../src/firebase/firebaseConfig';
import { ref, get, child } from 'firebase/database';
import { LockOutlined, UserOutlined } from '@ant-design/icons';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      message.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `users/${username}`));

    if (!snapshot.exists()) {
      message.error('Tài khoản không tồn tại');
      return;
    }

    const userData = snapshot.val();
    if (userData.password !== password) {
      message.error('Sai mật khẩu');
      return;
    }

    localStorage.setItem('username', username);
    message.success('Đăng nhập thành công!');
    router.push('/');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #c79a5b 0%, #6b4e32 100%)',
        fontFamily: 'Montserrat, sans-serif',
      }}
    >
      <Card
        style={{
          width: 400,
          borderRadius: 20,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
          textAlign: 'center',
          padding: '36px 24px',
          background: 'rgba(255, 250, 245, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* 🔥 Logo Rồng Mộc Chat */}
        <div style={{ marginBottom: 24 }}>
          <Avatar
            src="/Screenshot 2025-10-20 210910.png"
            size={100}
            style={{
              background: '#fff',
              border: '3px solid #8b633a',
              boxShadow: '0 0 20px rgba(139,99,58,0.4)',
              animation: 'float 4s ease-in-out infinite',
            }}
          />
          <h2
            style={{
              marginTop: 16,
              color: '#6b4e32',
              fontWeight: 700,
              letterSpacing: 0.5,
              fontSize: 22,
            }}
          >
            MeMeChat
          </h2>
          <p style={{ color: '#7e6c55', marginBottom: 0 }}>
            Kết nối cùng thiên nhiên và bạn bè 🌿
          </p>
        </div>

        <Input
          size="large"
          prefix={<UserOutlined style={{ color: '#8b633a' }} />}
          placeholder="Tên đăng nhập"
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={{
            marginBottom: 16,
            borderRadius: 10,
            background: '#fff',
            borderColor: '#d2b48c',
          }}
        />

        <Input.Password
          size="large"
          prefix={<LockOutlined style={{ color: '#8b633a' }} />}
          placeholder="Mật khẩu"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{
            marginBottom: 24,
            borderRadius: 10,
            background: '#fff',
            borderColor: '#d2b48c',
          }}
        />

        <Button
          type="primary"
          size="large"
          block
          onClick={handleLogin}
          style={{
            borderRadius: 10,
            background: 'linear-gradient(90deg, #8b633a, #c79a5b)',
            border: 'none',
            fontWeight: 600,
            letterSpacing: 0.5,
            transition: '0.3s',
          }}
          onMouseOver={e => (e.currentTarget.style.filter = 'brightness(1.15)')}
          onMouseOut={e => (e.currentTarget.style.filter = 'brightness(1)')}
        >
          Đăng nhập
        </Button>

        <div
          style={{
            marginTop: 20,
            textAlign: 'center',
            color: '#6b4e32',
            fontSize: 14,
          }}
        >
          Chưa có tài khoản?{' '}
          <a
            href="/register"
            style={{
              color: '#a06d35',
              fontWeight: 600,
              textDecoration: 'none',
            }}
            onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            Đăng ký ngay
          </a>
        </div>

        {/* 🌸 CSS hiệu ứng */}
        <style jsx>{`
          @keyframes float {
            0% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-6px);
            }
            100% {
              transform: translateY(0px);
            }
          }
        `}</style>
      </Card>
    </div>
  );
}
