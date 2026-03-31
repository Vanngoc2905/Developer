import React, { useEffect, useState } from 'react';
import { ref, onValue, get } from 'firebase/database';
import { db } from '../firebase/firebaseConfig';
import { Avatar, Tooltip } from 'antd';

function MemeList({ search, onSelectMeme }) {
  const [memes, setMemes] = useState([]);

  useEffect(() => {
    // 💡 Tối ưu: Thử lấy từ cache trước để hiển thị ngay lập tức khi mạng yếu
    const cachedMemes = localStorage.getItem('cached_memes');
    if (cachedMemes) {
      try {
        setMemes(JSON.parse(cachedMemes));
      } catch (e) {
        console.error('Lỗi load cache memes:', e);
      }
    }

    const memeRef = ref(db, 'memes');
    
    // Lắng nghe thay đổi, nhưng chỉ cập nhật nếu thực sự cần thiết
    const unsubscribe = onValue(memeRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const memeList = Object.keys(data).map((key) => ({
          id: key,
          name: data[key].name,
          image: data[key].image || null,
        }));
        const newList = memeList.reverse();
        setMemes(newList);
        // Lưu vào cache cho lần sau
        try {
          localStorage.setItem('cached_memes', JSON.stringify(newList));
        } catch (e) {
          console.warn("Lỗi thiết lập cache meme:", e);
        }
      } else {
        setMemes([]);
        localStorage.removeItem('cached_memes');
      }
    });

    return () => unsubscribe();
  }, []);

  if (!search || search.trim() === '') return null;

  const filtered = memes.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
  if (filtered.length === 0) return null;

  return (
    <div style={{ display: 'flex', overflowX: 'auto', gap: 8, padding: '4px 0', borderBottom: '1px solid #eee' }}>
      {filtered.map(m => (
        <Tooltip key={m.id} title={m.name}>
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => onSelectMeme(m)}
          >
            <Avatar src={m.image} size={48} style={{ marginBottom: 4, backgroundColor: '#eee' }}>
              {m.name[0]?.toUpperCase() || '?'}
            </Avatar>
            <span style={{
              fontSize: 12,
              textAlign: 'center',
              maxWidth: 60,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {m.name}
            </span>
          </div>
        </Tooltip>
      ))}
    </div>
  );
}

export default MemeList;
