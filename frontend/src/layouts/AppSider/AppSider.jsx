import { useState, useMemo } from 'react';
// (SỬA) Thêm Popconfirm
import { Layout, Menu, Avatar, Button, Space, Tooltip, Input, Popconfirm } from 'antd';
import {
  MessageOutlined,
  RobotOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

import './AppSider.css';

const { Sider } = Layout;

const AppSider = ({ 
  collapsed, 
  setCollapsed, 
  themeMode, 
  chatSessions, 
  activeChatId, 
  setActiveChatId,
  renamingChatId,
  setRenamingChatId,
  handleRenameChat,
  handleDeleteChat // (SỬA) Thêm handleDeleteChat vào props
}) => {

  const [hoveredChatId, setHoveredChatId] = useState(null);
  // (MỚI) Thêm state để kiểm soát Popconfirm
  const [deletingChatId, setDeletingChatId] = useState(null);

  const chatMenuItems = useMemo(() => {
    return chatSessions.map(chat => ({
      key: chat.id,
      icon: <MessageOutlined />,
      label: (
        chat.id === renamingChatId ? (
          <Input
            defaultValue={chat.title}
            onClick={(e) => e.stopPropagation()}
            onPressEnter={(e) => handleRenameChat(chat.id, e.target.value)}
            onBlur={(e) => handleRenameChat(chat.id, e.target.value)}
            autoFocus
          />
        ) : (
          <div 
            className="menu-item-label"
            onMouseEnter={() => setHoveredChatId(chat.id)}
            onMouseLeave={() => setHoveredChatId(null)}
          >
            <span 
              onDoubleClick={(e) => { 
                e.stopPropagation(); 
                setRenamingChatId(chat.id);
              }}
              className="menu-item-text"
            >
              {chat.title}
            </span>
            
            {/* (SỬA) Logic hiển thị: hiện khi hover HOẶC khi đang xóa */}
            {!collapsed && (hoveredChatId === chat.id || deletingChatId === chat.id) && (
              <Space size={4}>
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenamingChatId(chat.id);
                  }}
                  className="menu-item-edit-button"
                  data-theme={themeMode}
                />
                
                {/* (SỬA) Thêm props 'open', 'onConfirm', 'onCancel' để kiểm soát Popconfirm */}
                <Popconfirm
                  title="Xóa cuộc trò chuyện?"
                  description="Bạn có chắc muốn xóa?"
                  placement="right"
                  // (SỬA) Kiểm soát trạng thái mở
                  open={deletingChatId === chat.id} 
                  onConfirm={(e) => {
                    e.stopPropagation();
                    handleDeleteChat(chat.id);
                    setDeletingChatId(null); // (SỬA) Đóng Popconfirm
                  }}
                  onCancel={(e) => {
                    e.stopPropagation();
                    setDeletingChatId(null); // (SỬA) Đóng Popconfirm
                  }}
                  okText="Xóa"
                  cancelText="Hủy"
                >
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    // (SỬA) onClick giờ sẽ MỞ Popconfirm
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingChatId(chat.id); // (SỬA) Mở Popconfirm
                    }}
                    className="menu-item-delete-button"
                  />
                </Popconfirm>
              </Space>
            )}
          </div>
        )
      ),
    }));
    // (SỬA) Thêm deletingChatId và setDeletingChatId vào dependencies
  }, [chatSessions, renamingChatId, setRenamingChatId, handleRenameChat, collapsed, hoveredChatId, themeMode, handleDeleteChat, deletingChatId]);

  return (
    <Sider
      width={260}
      className="app-sider"
      data-theme={themeMode}
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      breakpoint="lg"
      trigger={null}
    >
      <div 
        className="sider-logo-area" 
        data-theme={themeMode}
      >
        <Space>
          <Avatar
            size={40}
            className="sider-logo-avatar"
            icon={<RobotOutlined className="sider-logo-avatar-icon" />}
          />
          {!collapsed && (
            <span 
              className="sider-logo-text" 
              data-theme={themeMode}
            >
              InterviewAI
            </span>
          )}
        </Space>
      </div>

      <div 
        className="sider-menu-area" 
        data-collapsed={collapsed}
      >
        <div 
          className="sider-menu-header"
          data-theme={themeMode}
          data-collapsed={collapsed}
        >
          {!collapsed && <span>HISTORY</span>}
          <Tooltip title={collapsed ? "Mở Sidebar" : "Đóng Sidebar"} placement="right">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="sider-collapse-button"
              data-theme={themeMode}
            />
          </Tooltip>
        </div>
        <Menu
          theme={themeMode}
          mode="inline"
          items={chatMenuItems}
          onClick={(info) => {
            if (renamingChatId === info.key) return;
            setRenamingChatId(null);
            setActiveChatId(info.key);
          }}
          selectedKeys={[activeChatId]}
          className="sider-menu"
          inlineCollapsed={collapsed}
        />
      </div>
    </Sider>
  );
};

export default AppSider;