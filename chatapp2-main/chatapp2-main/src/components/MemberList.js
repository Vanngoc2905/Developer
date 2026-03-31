// MemberList.js
import React, { useEffect, useState } from 'react';
import { List, Avatar, Button, Modal, Input, Dropdown, Menu, message, Tooltip } from 'antd';
import { UserAddOutlined, MoreOutlined, PlusOutlined } from '@ant-design/icons';
import {
  getRoomRoles,
  addMember,
  removeMember,
  transferOwner,
  isRoomOwner
} from './MemberRole'; // ✅ import file mới

function MemberList({ currentRoom, currentUser }) {
  const [members, setMembers] = useState([]);
  const [owner, setOwner] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newMember, setNewMember] = useState('');

  useEffect(() => {
    if (!currentRoom) return;
    getRoomRoles(currentRoom).then(({ owner, members }) => {
      setOwner(owner);
      setMembers(members);
    });
  }, [currentRoom]);

  const handleAdd = async () => {
    if (!isRoomOwner(currentUser, owner)) {
      message.error('Chỉ chủ phòng mới được thêm thành viên');
      return;
    }
    if (!newMember.trim()) {
      message.error('Nhập tên thành viên');
      return;
    }
    if (members.includes(newMember.trim())) {
      message.warning('Thành viên đã có trong phòng');
      return;
    }

    const updated = await addMember(currentRoom, members, newMember.trim());
    setMembers(updated);
    message.success(`Đã thêm ${newMember}`);
    setNewMember('');
    setShowModal(false);
  };

  const handleRemove = async (name) => {
    if (!isRoomOwner(currentUser, owner)) {
      message.error('Chỉ chủ phòng mới được xóa thành viên');
      return;
    }
    if (name === owner) {
      message.warning('Không thể xóa chủ phòng');
      return;
    }

    Modal.confirm({
      title: 'Xóa thành viên',
      content: `Bạn có chắc muốn xóa ${name}?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        const updated = await removeMember(currentRoom, members, name);
        setMembers(updated);
        message.success(`Đã xóa ${name}`);
      },
    });
  };

  const handleTransfer = async (name) => {
    if (!isRoomOwner(currentUser, owner)) {
      message.error('Chỉ chủ phòng mới được nhượng quyền');
      return;
    }

    Modal.confirm({
      title: 'Nhượng quyền chủ phòng',
      content: `Bạn có chắc muốn nhượng quyền cho ${name}?`,
      okText: 'Đồng ý',
      cancelText: 'Hủy',
      onOk: async () => {
        const newOwner = await transferOwner(currentRoom, name);
        setOwner(newOwner);
        message.success(`Đã nhượng quyền cho ${name}`);
      },
    });
  };

  const menuActions = (name) => (
    <Menu>
      <Menu.Item key="transfer" onClick={() => handleTransfer(name)}>👑 Nhượng quyền</Menu.Item>
      <Menu.Item key="remove" danger onClick={() => handleRemove(name)}>🗑 Xóa</Menu.Item>
    </Menu>
  );

  return (
    <div style={{ background: '#fff', padding: 12 }}>
      {/* --- Header: Tiêu đề + Icon thêm nhỏ gọn --- */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
      }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>Thành viên</h3>

        {isRoomOwner(currentUser, owner) && (
          <Tooltip title="Thêm thành viên">
            <Button
              type="primary"
              shape="circle"
              icon={<PlusOutlined />}
              size="small"
              onClick={() => setShowModal(true)}
            />
          </Tooltip>
        )}
      </div>

      {/* --- Danh sách thành viên --- */}
      <List
        dataSource={members}
        renderItem={(item) => (
          <List.Item
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Avatar style={{
                background: item === owner ? '#1890ff' : '#bfbfbf',
                marginRight: 10
              }}>
                {item[0]?.toUpperCase() || '?'}
              </Avatar>
              <div>
                <div style={{ fontWeight: 600 }}>{item}</div>
                <small style={{ color: '#888' }}>
                  {item === owner ? 'Chủ phòng' : item === currentUser ? 'Bạn' : ''}
                </small>
              </div>
            </div>

            {isRoomOwner(currentUser, owner) && item !== owner && (
              <Dropdown overlay={menuActions(item)} trigger={['click']}>
                <Button icon={<MoreOutlined />} size="small" />
              </Dropdown>
            )}
          </List.Item>
        )}
      />

      {/* --- Modal thêm thành viên --- */}
      <Modal
        open={showModal}
        title="Thêm thành viên"
        onCancel={() => setShowModal(false)}
        onOk={handleAdd}
        okText="Thêm"
        cancelText="Hủy"
      >
        <Input
          placeholder="Nhập tên thành viên"
          value={newMember}
          onChange={(e) => setNewMember(e.target.value)}
        />
      </Modal>
    </div>
  );
}

export default MemberList;
