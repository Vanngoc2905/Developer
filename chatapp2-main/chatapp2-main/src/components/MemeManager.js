import React, { useEffect, useState } from 'react';
import { ref, onValue, set, remove, update } from 'firebase/database';
import { db } from '../firebase/firebaseConfig';
import { Table, Button, Input, Upload, message, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import { checkCreateLimit, incrementCreateCount } from '../services/subscriptionService';

function MemeManager({ username }) {
  const [memes, setMemes] = useState([]);
  const [newMemeName, setNewMemeName] = useState('');
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  // Load meme từ Firebase
  useEffect(() => {
    const memeRef = ref(db, 'memes');
    const unsubscribe = onValue(memeRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map((key) => ({
          id: key,
          name: data[key].name,
          image: data[key].image || null,
        }));
        setMemes(list.reverse());
      } else setMemes([]);
    });
    return () => unsubscribe();
  }, []);

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Hàm nén ảnh
  const compressImage = (base64Str, maxWidth = 400, maxHeight = 400, quality = 0.5) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
        } else {
          if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
    });
  };

  // Thêm meme mới
  const handleAddMeme = async () => {
    if (!username) return message.error("Vui lòng đăng nhập lại");
    if (!newMemeName.trim()) return message.warning('Nhập tên meme');

    // Kiem tra gioi han 5 lan/ngay
    try {
      const limitInfo = await checkCreateLimit(username);
      if (!limitInfo.allowed) {
        return message.error("Bạn đã hết lượt tạo Meme trong ngày (Tối đa 5). Hãy nâng cấp VIP ở Giỏ hàng!");
      }

      let base64Image = null;
      if (file) {
        const rawBase64 = await fileToBase64(file).catch(() => { message.error('Lỗi ảnh'); return null; });
        if (rawBase64) {
          base64Image = await compressImage(rawBase64);
        }
      }
      const memeRef = ref(db, `memes/${Date.now()}`);
      await set(memeRef, { name: newMemeName.trim(), image: base64Image });
      
      // Tang so lan su dung
      if (!limitInfo.isVip) {
        await incrementCreateCount(username);
      }

      message.success('Đã thêm và nén meme thành công!');
      setNewMemeName('');
      setFile(null);
    } catch (error) {
       console.error(error);
       message.error('Lỗi khi thêm meme');
    }
  };

  // Xoá meme
  const handleDeleteMeme = (id) => {
    remove(ref(db, `memes/${id}`))
      .then(() => message.success('Đã xoá meme'))
      .catch(() => message.error('Không thể xoá meme'));
  };

  // Sửa meme
  const handleEditMeme = (id, name) => {
    setEditingId(id);
    setEditingName(name);
  };
  const handleSaveMeme = (id) => {
    update(ref(db, `memes/${id}`), { name: editingName })
      .then(() => { message.success('Đã cập nhật'); setEditingId(null); setEditingName(''); })
      .catch(() => message.error('Lỗi khi cập nhật'));
  };

  const columns = [
    {
      title: 'Tên meme',
      dataIndex: 'name',
      render: (_, record) =>
        editingId === record.id ? (
          <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
        ) : record.name,
    },
    {
      title: 'Hình ảnh',
      dataIndex: 'image',
      render: (src) => src ? <img src={src} alt="meme" style={{ width: 50, height: 50 }} /> : '-',
    },
    {
      title: 'Hành động',
      render: (_, record) => editingId === record.id ? (
        <Button icon={<SaveOutlined />} onClick={() => handleSaveMeme(record.id)} />
      ) : (
        <>
          <Button icon={<EditOutlined />} onClick={() => handleEditMeme(record.id, record.name)} style={{ marginRight: 8 }} />
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDeleteMeme(record.id)} />
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <h2>Quản lý Meme</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Input placeholder="Tên meme mới" value={newMemeName} onChange={(e) => setNewMemeName(e.target.value)} />
        <Upload beforeUpload={(file) => { setFile(file); return false; }} showUploadList={false}>
          <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
        </Upload>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddMeme}>Thêm</Button>
      </div>
      <Table rowKey="id" dataSource={memes} columns={columns} />
    </div>
  );
}

export default MemeManager;
