import { Inter } from 'next/font/google'
import {
  Avatar,
  Tooltip,
  Modal,
  Drawer,
  Button,
  Dropdown,
  Image,
} from 'antd'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { ref, onValue } from 'firebase/database'
import { db } from '../src/firebase/firebaseConfig'
import {
  MenuOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  TeamOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons'

import ConversationContent from '../src/components/ConversationContent'
import MemberList from '../src/components/MemberList'
import RoomList from '../src/components/RoomList'
import MemeManager from '../src/components/MemeManager'
import StoreModal from '../src/components/StoreModal'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const [username, setUsername] = useState('')
  const [currentRoom, setCurrentRoom] = useState('')
  const [roomMembers, setRoomMembers] = useState(() => {
    // 💡 Tối ưu: Lấy danh sách thành viên các phòng từ cache để không phải chờ Firebase confirm
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cached_room_members");
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });
  const [showMembers, setShowMembers] = useState(false)
  const [showMemeManager, setShowMemeManager] = useState(false)
  const [showStore, setShowStore] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const router = useRouter()

  // 🔹 Kiểm tra đăng nhập
  useEffect(() => {
    const savedUsername = localStorage.getItem('username')
    if (!savedUsername) router.replace('/login')
    else setUsername(savedUsername)
  }, [router])

  // 🔹 Lắng nghe danh sách thành viên cho từng phòng
  useEffect(() => {
    if (!currentRoom) return
    const roomRef = ref(db, `rooms/${currentRoom}`)
    const unsubscribe = onValue(roomRef, (snap) => {
      const data = snap.val()
      const members = data?.members || [];
      setRoomMembers((prev) => {
        const next = { ...prev, [currentRoom]: members };
        // Lưu vào cache
        localStorage.setItem("cached_room_members", JSON.stringify(next));
        return next;
      });
    })
    return () => unsubscribe()
  }, [currentRoom])

  if (!username) return null

  // 🎨 Tông màu đồng – mộc
  const mainColor = '#f7f0e3'
  const panelColor = '#f0e3cf'
  const headerColor = '#d8b892'
  const accent = '#a67b47'
  const textColor = '#3e3327'

  const accountMenu = [
    {
      key: 'account',
      label: 'Quản lý tài khoản',
      icon: <SettingOutlined />,
      onClick: () => router.push('/account'),
    },
    {
      key: 'logout',
      label: 'Đăng xuất',
      icon: <LogoutOutlined />,
      onClick: () => {
        localStorage.removeItem('username')
        router.replace('/login')
      },
    },
  ]

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: mainColor,
        fontFamily: inter.style.fontFamily,
        color: textColor,
      }}
    >
      {/* 🌾 Header logo */}
      <div
        className="d-flex align-items-center justify-content-between px-3 py-2"
        style={{
          background: headerColor,
          borderRadius: '12px',
          boxShadow: '0 3px 8px rgba(0,0,0,0.08)',
          margin: 8,
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <Image
            src="Screenshot 2025-10-20 210910.png" // 🐉 logo đặt trong thư mục /public
            preview={false}
            width={42}
            height={42}
            style={{
              borderRadius: '50%',
              objectFit: 'cover',
              boxShadow: '0 0 6px rgba(0,0,0,0.2)',
            }}
            alt="Rồng Mộc Logo"
          />
          <h4
            style={{
              margin: 0,
              fontWeight: 700,
              color: '#4a3829',
              fontSize: '1.1rem',
              letterSpacing: '0.5px',
            }}
          >
            MeMeChat
          </h4>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* 🛒 Nút mở cửa hàng VIP */}
          <Tooltip title="Nâng cấp VIP (Giỏ hàng)">
            <Button
              shape="circle"
              icon={<ShoppingCartOutlined />}
              onClick={() => setShowStore(true)}
              style={{
                backgroundColor: '#fadb14',
                color: '#fff',
                border: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                marginRight: 8,
              }}
            />
          </Tooltip>

          {/* 👥 Nút hiện danh sách thành viên */}
          {currentRoom && (
            <Tooltip title="Danh sách thành viên">
              <Button
                shape="circle"
                icon={<TeamOutlined />}
                onClick={() => setShowMembers((prev) => !prev)}
                style={{
                  backgroundColor: accent,
                  color: '#fff',
                  border: 'none',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              />
            </Tooltip>
          )}

          {/* 🍔 Nút mở menu bên trái (mobile) */}
          <Button
            className="d-md-none"
            icon={<MenuOutlined />}
            style={{
              border: 'none',
              backgroundColor: accent,
              color: '#fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
            onClick={() => setDrawerVisible(true)}
          />
        </div>
      </div>

      {/* 🌿 Layout chính */}
      <div
        className="flex-grow-1 d-flex"
        style={{
          flex: 1,
          minHeight: 0,
          padding: '0 8px 8px 8px',
        }}
      >
        {/* --- Sidebar trái --- */}
        <div
          style={{
            width: 250,
            background: panelColor,
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '8px 6px',
            marginRight: 8,
            boxShadow: 'inset 0 0 6px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <RoomList
              currentRoom={currentRoom}
              setCurrentRoom={(room) => {
                setCurrentRoom(room)
                setShowMembers(false)
              }}
              username={username}
            />
          </div>

          {/* 🧍 Phần tài khoản dưới cùng */}
          <div
            style={{
              borderTop: '1px solid rgba(0,0,0,0.08)',
              marginTop: 8,
              paddingTop: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <Avatar
                size={38}
                style={{
                  backgroundColor: accent,
                  color: '#fff',
                  fontWeight: 'bold',
                }}
              >
                {username[0]?.toUpperCase()}
              </Avatar>
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    color: textColor,
                    fontSize: 14,
                  }}
                >
                  {username}
                </div>
                <Dropdown menu={{ items: accountMenu }} placement="topLeft" arrow>
                  <Button
                    size="small"
                    style={{
                      marginTop: 2,
                      fontSize: 12,
                      background: '#e6d4b6',
                      border: 'none',
                      color: textColor,
                      fontWeight: 500,
                    }}
                  >
                    Tài khoản
                  </Button>
                </Dropdown>
              </div>
            </div>
          </div>
        </div>

        {/* --- Vùng chat --- */}
        <div
          className="flex-grow-1 d-flex flex-column"
          style={{
            background: '#fffaf2',
            borderRadius: '12px',
            boxShadow: '0 0 8px rgba(0,0,0,0.06)',
            minHeight: 0,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <ConversationContent
            username={username}
            roomId={currentRoom}
            roomMembers={roomMembers[currentRoom] || []}
            openMemeManager={() => setShowMemeManager(true)}
          />

          {/* 🧩 MemberList ẩn/hiện */}
          {showMembers && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                height: '100%',
                width: 220,
                background: panelColor,
                borderLeft: '1px solid rgba(0,0,0,0.05)',
                boxShadow: '-2px 0 6px rgba(0,0,0,0.05)',
                padding: '8px',
                borderRadius: '0 12px 12px 0',
              }}
            >
              <MemberList currentRoom={currentRoom} currentUser={username} />
            </div>
          )}
        </div>
      </div>

      {/* --- Modal meme --- */}
      <Modal
        open={showMemeManager}
        title="Quản lý Meme"
        onCancel={() => setShowMemeManager(false)}
        footer={null}
        width={600}
        styles={{
          content: {
            background: '#fffaf2',
            borderRadius: '12px',
          },
        }}
      >
        <MemeManager username={username} />
      </Modal>

      {/* --- Store Modal --- */}
      <StoreModal 
        isOpen={showStore} 
        onClose={() => setShowStore(false)} 
        username={username} 
      />

      {/* --- Drawer mobile --- */}
      <Drawer
        title="Phòng & Thành viên"
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={260}
        bodyStyle={{ backgroundColor: panelColor }}
      >
        <RoomList
          currentRoom={currentRoom}
          setCurrentRoom={(room) => {
            setCurrentRoom(room)
            setDrawerVisible(false)
          }}
          username={username}
        />
        <hr />
        {currentRoom && (
          <MemberList currentRoom={currentRoom} currentUser={username} />
        )}
      </Drawer>
    </div>
  )
}
