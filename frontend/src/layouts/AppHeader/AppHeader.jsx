import { Layout, Menu, Avatar, Button, Space, Tooltip, Dropdown, message } from 'antd';
import {
  SunOutlined,
  MoonOutlined,
  SettingOutlined,
  LogoutOutlined,
  LeftOutlined,
  PlusOutlined,
} from '@ant-design/icons';

import './AppHeader.css';

const { Header } = Layout;

const generalMenuItems = [
  { key: 'setting', icon: <SettingOutlined />, label: 'Setting' },
  { key: 'logout', icon: <LogoutOutlined />, label: 'Log Out' }
];

const AppHeader = ({ themeMode, toggleTheme, screens, onNewChat }) => {
  
  const userMenu = (
    <Menu
      theme={themeMode}
      items={generalMenuItems}
      onClick={({ key }) => {
        message.info(`Chức năng '${key}' đang được phát triển!`);
      }}
    />
  );

  return (
    <Header
      // (SỬA) Dùng className và data-theme
      className="app-header"
      data-theme={themeMode}
    >
      <div className="app-header-content">
        <Space size={12} align="center">
          {screens.lg && (
            <Button
              type="text"
              shape="circle"
              icon={<LeftOutlined />}
              // (SỬA) Dùng className và data-theme
              className="app-header-button"
              data-theme={themeMode}
            />
          )}
          <div>
            <div
              // (SỬA) Dùng className và data-theme
              className="app-header-title"
              data-theme={themeMode}
            >
              Interview for UI/UX Designer
            </div>
            {screens.lg && (
              <div
                // (SỬA) Dùng className và data-theme
                className="app-header-subtitle"
                data-theme={themeMode}
              >
                AI Assistant
              </div>
            )}
          </div>
        </Space>
        <Space size={12} align="center">
          <Button
            type="text"
            shape="circle"
            icon={themeMode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
            // (SỬA) Dùng className và data-theme
            className="app-header-button"
            data-theme={themeMode}
          />
          {screens.lg && (
            <Tooltip title="Cuộc trò chuyện mới">
              <Button
                type="text"
                shape="circle"
                icon={<PlusOutlined />}
                onClick={onNewChat}
                // (SỬA) Dùng className và data-theme
                className="app-header-button"
                data-theme={themeMode}
              />
            </Tooltip>
          )}
          <Dropdown overlay={userMenu} trigger={['hover']}>
            {/* (GIỮ NGUYÊN) Style này là riêng biệt, giữ lại inline cũng không sao */}
            <Avatar style={{ backgroundColor: '#1677ff', cursor: 'pointer', transition: 'all 0.3s' }} className="hover:opacity-80">
              404
            </Avatar>
          </Dropdown>
        </Space>
      </div>
    </Header>
  );
};

export default AppHeader;