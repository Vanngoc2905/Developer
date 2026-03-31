import React, { useEffect, useState, useRef } from "react";
import { ref, onValue, push, set, query, orderByChild, equalTo, limitToLast, orderByKey } from "firebase/database";
import { db } from "../firebase/firebaseConfig";
import { Avatar, Input, Button, message, Tooltip } from "antd";
import { PictureOutlined, SendOutlined, SmileOutlined, LoadingOutlined } from "@ant-design/icons";
import MemeList from "./MemeList";
import { checkSendLimit, incrementSendCount } from "../services/subscriptionService";

// Format thời gian
function formatTime(ts) {
  if (!ts) return "";
  const date = new Date(ts);
  return date.getHours().toString().padStart(2, "0") + ":" + date.getMinutes().toString().padStart(2, "0");
}

// Hàm nén ảnh bằng Canvas
const compressImage = (base64Str, maxWidth = 800, maxHeight = 800, quality = 0.6) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      // Tính toán tỷ lệ
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      // Nén về dạng JPEG với chất lượng thấp hơn để giảm dung lượng
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
  });
};

export default function ConversationContent({ username, roomId, roomMembers, openMemeManager }) {
  const [conversations, setConversations] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Lấy tin nhắn (tối ưu hóa: Truy cập trực tiếp vào path theo Room ID + Cache cục bộ)
  useEffect(() => {
    if (!roomId) {
      setConversations([]);
      return;
    }

    // 💡 Tối ưu: Xóa tin nhắn cũ của phòng trước đó ngay lập tức
    // và thử nạp từ Cache của phòng mới này
    const cacheKey = `chat_cache_${roomId}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        setConversations(parsed);
      } catch (e) {
        setConversations([]);
      }
    } else {
      setConversations([]);
    }

    // 🔥 Cấu trúc mới: room_messages / {roomId} / {messageId}
    const roomMessagesRef = ref(db, `room_messages/${roomId}`);
    const q = query(roomMessagesRef, orderByKey(), limitToLast(15));

    const unsub = onValue(q, (snap) => {
      if (snap.exists()) {
        const arr = [];
        snap.forEach((item) => {
          arr.push({ key: item.key, ...item.val() });
        });
        // Sắp xếp theo thời gian
        arr.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        setConversations(arr);

        // 💡 Lưu lại vào cache (xóa bớt chuỗi base64 dài để tránh lỗi tràn dung lượng bộ nhớ gây mất cache)
        try {
          const cacheArr = arr.slice(-15).map(msg => ({
            ...msg,
            imageUrl: msg.imageUrl ? "cached_image" : null
          }));
          localStorage.setItem(cacheKey, JSON.stringify(cacheArr));
        } catch (e) {
          console.warn("Lỗi thiết lập cache:", e);
        }
      } else {
        setConversations([]);
        localStorage.removeItem(cacheKey);
      }
    }, (error) => {
      console.error("Firebase error:", error);
    });

    return () => unsub();
  }, [roomId]);

  // Scroll xuống cuối
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations]);

  // Gửi text message
  const sendMessage = async () => {
    if (!messageText.trim() || !roomId) return;
    const msgRef = push(ref(db, `room_messages/${roomId}`));
    await set(msgRef, {
      from: username,
      content: messageText.trim(),
      imageUrl: null,
      createdAt: Date.now(),
    });
    setMessageText("");
    setSearch("");
  };

  // Gửi ảnh
  const sendImage = async (imageBase64, isFromMemeList = false) => {
    if (!imageBase64 || !roomId) return;

    if (isFromMemeList) {
      try {
        const limitInfo = await checkSendLimit(username);
        if (!limitInfo.allowed) {
          message.error("Đã hết phần gửi Meme hôm nay (Tối đa 10). Mở Cửa Hàng để nâng cấp VIP!");
          return;
        }
        if (!limitInfo.isVip) {
          await incrementSendCount(username);
        }
      } catch (error) {
        console.error("Lỗi gửi meme", error);
        message.error("Lỗi kiểm tra quyền gửi Meme");
        return;
      }
    }

    const msgRef = push(ref(db, `room_messages/${roomId}`));
    await set(msgRef, {
      from: username,
      content: null,
      imageUrl: imageBase64,
      createdAt: Date.now(),
    });
  };

  // Upload ảnh (Có nén ảnh)
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawBase64 = event.target.result;
      // 💡 Bước tối ưu: Nén ảnh trước khi gửi
      const compressedBase64 = await compressImage(rawBase64);
      await sendImage(compressedBase64);
      message.success("Ảnh đã được nén và gửi thành công!");
    };
    reader.readAsDataURL(file);
    reader.onloadend = () => setUploading(false);
    e.target.value = "";
  };

  // Check quyền thành viên (Tối ưu: Không chặn Render tin nhắn cũ)
  const isMember = roomMembers.includes(username);
  
  if (!roomId) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ flex: 1, color: "#bbb" }}>
        Hãy chọn một phòng để bắt đầu chat!
      </div>
    );
  }

  // 💡 Tối ưu: Nếu chưa có data member (đang load) thì cứ cho hiện UI chat để xem tin nhắn cũ từ cache
  // Chỉ hiện thông báo chặn nếu đã có data member mà user thực sự không nằm trong đó
  if (roomMembers.length > 0 && !isMember) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ flex: 1, color: "#bbb" }}>
        Bạn không có quyền tham gia phòng này!
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      {/* DANH SÁCH TIN NHẮN */}
      <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
        {conversations.length > 0 ? (
          conversations.map((item) => {
            const isMe = item.from === username;
            return (
              <div key={item.key} style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-end", marginBottom: 12 }}>
                <Avatar style={{ background: isMe ? "#1890ff" : "#bfbfbf", margin: isMe ? "0 0 0 8px" : "0 8px 0 0" }}>
                  {item.from ? item.from[0].toUpperCase() : "?"}
                </Avatar>
                <div style={{ background: isMe ? "#e6f7ff" : "#fff", borderRadius: 12, padding: "6px 12px", maxWidth: 300, boxShadow: "0 1px 4px #00000022", wordBreak: "break-word" }}>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
                    {isMe ? "Bạn" : item.from}
                    <span style={{ float: "right", fontSize: 10, color: "#bbb", marginLeft: 8 }}>{formatTime(item.createdAt)}</span>
                  </div>
                  {item.imageUrl && item.imageUrl !== "cached_image" && <img src={item.imageUrl} alt="ảnh" style={{ maxWidth: "100%", borderRadius: 8, marginBottom: item.content ? 4 : 0 }} />}
                  {item.imageUrl === "cached_image" && (
                    <div style={{ width: 120, height: 80, background: '#f5f5f5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 12, marginBottom: item.content ? 4 : 0 }}>
                      Đang tải ảnh...
                    </div>
                  )}
                  {item.content && <div style={{ fontSize: 14 }}>{item.content}</div>}
                </div>
              </div>
            );
          })
        ) : (
          <p style={{ color: "#888", textAlign: "center" }}>Chưa có cuộc trò chuyện nào.</p>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* MEME PICKER */}
      <MemeList
        search={search}
        onSelectMeme={(m) => sendImage(m.image, true)}
      />

      {/* THANH NHẬP */}
      <div style={{ display: "flex", gap: 8, padding: 4, borderTop: "1px solid #eee", alignItems: "center" }}>
        <Button icon={<SmileOutlined />} style={{ borderRadius: "50%" }} onClick={openMemeManager} />
        <input type="file" accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />
        <Button icon={uploading ? <LoadingOutlined /> : <PictureOutlined />} onClick={() => !uploading && fileInputRef.current.click()} />
        <Input
          placeholder="Nhập tin nhắn..."
          value={messageText}
          onChange={(e) => { setMessageText(e.target.value); setSearch(e.target.value); }}
          onPressEnter={sendMessage}
          style={{ flex: 1 }}
        />
        <Button type="primary" icon={<SendOutlined />} onClick={sendMessage} />
      </div>
    </div>
  );
}
