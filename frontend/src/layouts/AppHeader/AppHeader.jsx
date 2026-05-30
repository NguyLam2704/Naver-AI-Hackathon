import { Layout, Menu, Avatar, Button, Space, Tooltip, Dropdown, message } from 'antd';
import {
  SunOutlined,
  MoonOutlined,
  SettingOutlined,
  LogoutOutlined,
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
          <div>
            <div
              // (SỬA) Dùng className và data-theme
              className="app-header-title"
              data-theme={themeMode}
            >
              AI Interviewer
            </div>
            {screens.lg && (
              <div
                // (SỬA) Dùng className và data-theme
                className="app-header-subtitle"
                data-theme={themeMode}
              >
                Naver Hackathon
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
        </Space>
      </div>
    </Header>
  );
};

export default AppHeader;