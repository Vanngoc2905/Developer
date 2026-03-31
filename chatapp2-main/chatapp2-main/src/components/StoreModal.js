import React, { useEffect, useState } from 'react';
import { Modal, Card, Button, Spin, message, Tag } from 'antd';
import { ShoppingCartOutlined, CrownOutlined, FilePdfOutlined } from '@ant-design/icons';
import { getVipInfo, buyPackage } from '../services/subscriptionService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const packages = [
  { id: 'WEEK', name: 'Gói Tuần', priceContent: '100.000 VNĐ', price: 100000, days: 7, color: '#fadb14' },
  { id: 'MONTH', name: 'Gói Tháng', priceContent: '450.000 VNĐ', price: 450000, days: 30, color: '#52c41a' },
  { id: 'YEAR', name: 'Gói Năm', priceContent: '1.000.000 VNĐ', price: 1000000, days: 365, color: '#ff4d4f' }
];

// Hàm bỏ dấu tiếng Việt để xuất file PDF cơ bản ko bị lỗi Font
const removeAccents = (str) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

export default function StoreModal({ isOpen, onClose, username }) {
  const [loading, setLoading] = useState(false);
  const [vipInfo, setVipInfo] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchVipInfo();
    }
  }, [isOpen, username]);

  const fetchVipInfo = async () => {
    try {
      const info = await getVipInfo(username);
      setVipInfo(info);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBuy = async (pkg) => {
    setLoading(true);
    try {
      const tx = await buyPackage(username, pkg.id);
      message.success(`Thanh toán thành công ${pkg.name}!`);
      await fetchVipInfo();
      generateInvoicePDF(pkg, tx);
    } catch (err) {
      message.error("Lỗi giao dịch");
    }
    setLoading(false);
  };

  const generateInvoicePDF = (pkg, tx) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(255, 0, 0); // Màu đỏ
    doc.text("HOA DON GIA TRI GIA TANG (HOA DON DO)", 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Mau so: 01GTKT0/001", 150, 30);
    doc.text("Ky hieu: AA/26E", 150, 38);
    doc.text(`So: ${tx.txId.replace('INV-','')}`, 150, 46);

    const d = new Date(tx.timestamp);
    doc.text(`Ngay ${d.getDate()} thang ${d.getMonth()+1} nam ${d.getFullYear()}`, 105, 30, { align: 'center' });

    doc.setFontSize(11);
    doc.text("Don vi ban hang: CONG TY TNHH MEME CHAT VN", 15, 60);
    doc.text("Ma so thue: 0123456789", 15, 68);
    doc.text("Dia chi: 123 Duong Rong Moc, P. An Phu, Q.2, TP.HCM", 15, 76);

    doc.line(15, 82, 195, 82);

    doc.text(`Nguoi mua hang: ${removeAccents(username)}`, 15, 95);
    doc.text("Hinh thuc thanh toan: TM/CK", 15, 103);

    const data = [
      [
        1, 
        removeAccents(`Goi dang ky VIP - ${pkg.name}`), 
        "Goi", 
        1, 
        `${pkg.price.toLocaleString()} VND`, 
        `${pkg.price.toLocaleString()} VND`
      ]
    ];

    autoTable(doc, {
      startY: 115,
      head: [["STT", "Ten hang hoa, dich vu", "DVT", "So luong", "Don gia", "Thanh tien"]],
      body: data,
      theme: 'grid',
      headStyles: { fillColor: [255, 0, 0] }, // Đỏ cho nổi bật
    });

    const finalY = doc.lastAutoTable.finalY || 130;
    
    const vat = pkg.price * 0.1;
    const total = pkg.price + vat;

    doc.text(`Cong tien hang: ${pkg.price.toLocaleString()} VND`, 120, finalY + 10);
    doc.text(`Thue GTGT (10%): ${vat.toLocaleString()} VND`, 120, finalY + 18);
    doc.setFontSize(12);
    doc.text(`Tong tien thanh toan: ${total.toLocaleString()} VND`, 120, finalY + 28);

    doc.setFontSize(10);
    doc.text("Nguoi Mua Hang", 40, finalY + 50, { align: 'center' });
    doc.text("(Ky, ghi ro ho ten)", 40, finalY + 55, { align: 'center' });
    
    doc.text("Nguoi Ban Hang", 160, finalY + 50, { align: 'center' });
    doc.text("(Ky, dong dau, ghi ro ho ten)", 160, finalY + 55, { align: 'center' });

    doc.save(`Hoa_Don_VIP_${tx.txId}.pdf`);
  };

  const now = Date.now();
  const isActive = vipInfo && vipInfo.expiresAt > now;

  return (
    <Modal
      title={<div><CrownOutlined style={{color: '#faad14', marginRight: 8}} /> CỬA HÀNG VẬT PHẨM (MUA LƯỢT GỬI MEME)</div>}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={700}
      bodyStyle={{ background: '#fffaf2', padding: 20, borderRadius: 8 }}
    >
      <div style={{ marginBottom: 20, padding: 16, background: isActive ? '#e6f7ff' : '#f5f5f5', borderRadius: 8, border: '1px solid #d9d9d9' }}>
        <h4 style={{ margin: 0, fontWeight: 600 }}>Tình trạng tài khoản:</h4>
        {isActive ? (
          <div>
            <Tag color="success" style={{ marginTop: 8 }}>Đang có gói VIP</Tag>
            <p style={{ margin: '8px 0 0' }}>
              Bạn đang được TẠO và GỬI không giới hạn số lượng Meme. 
              <br/>Thời gian hết hạn: <b style={{color: '#ff4d4f'}}>{new Date(vipInfo.expiresAt).toLocaleString('vi-VN')}</b>
            </p>
          </div>
        ) : (
          <div>
            <Tag color="default" style={{ marginTop: 8 }}>Thành viên hạng thường</Tag>
            <p style={{ margin: '8px 0 0', color: '#666' }}>Giới hạn <b>5 lần TẠO Meme</b> và <b>10 lần GỬI Meme</b> mỗi ngày.</p>
          </div>
        )}
      </div>

      <Spin spinning={loading}>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          {packages.map(pkg => (
            <Card 
              key={pkg.id} 
              style={{ flex: 1, minWidth: 180, textAlign: 'center', borderColor: pkg.color, borderWidth: 2 }}
              hoverable
            >
              <h3 style={{ color: pkg.color, margin: 0 }}>{pkg.name}</h3>
              <p style={{ color: '#888', margin: '8px 0', fontSize: 12 }}>Lợi ích: Gửi Meme thả ga</p>
              <h2 style={{ fontSize: '1.2rem', margin: '16px 0' }}>{pkg.priceContent}</h2>
              <Button 
                type="primary" 
                shape="round" 
                icon={<ShoppingCartOutlined />} 
                style={{ background: pkg.color, border: 'none', width: '100%', color: '#fff', fontWeight: 'bold' }}
                onClick={() => handleBuy(pkg)}
              >
                MUA NGAY
              </Button>
            </Card>
          ))}
        </div>
      </Spin>
      <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#aaa', fontStyle: 'italic' }}>
        *Giao dịch tự động xuất Hóa đơn điện tử Định dạng PDF (Hóa đơn GTGT) tải về máy.
      </div>
    </Modal>
  );
}
