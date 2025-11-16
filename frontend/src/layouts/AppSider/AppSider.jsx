// import { useState, useMemo } from 'react';
// import { Layout, Menu, Avatar, Button, Space, Tooltip, Input, Popconfirm } from 'antd';
// import {
//   MessageOutlined,
//   RobotOutlined,
//   MenuFoldOutlined,
//   MenuUnfoldOutlined,
//   EditOutlined,
//   DeleteOutlined,
//   LeftOutlined, 
//   PlusOutlined, 
// } from '@ant-design/icons';

// import './AppSider.css';

// const { Sider } = Layout;

// const AppSider = ({ 
//   collapsed, 
//   onToggle,
//   onClose,
//   onNewChat,
//   isMobile,
//   themeMode, 
//   chatSessions, 
//   activeChatId, 
//   setActiveChatId,
//   renamingChatId,
//   setRenamingChatId,
//   handleRenameChat,
//   handleDeleteChat
// }) => {

//   const [hoveredChatId, setHoveredChatId] = useState(null);
//   const [deletingChatId, setDeletingChatId] = useState(null);

//   const chatMenuItems = useMemo(() => {
//     return chatSessions.map(chat => ({
//       key: chat.id,
//       icon: <MessageOutlined />,
//       label: (
//         chat.id === renamingChatId ? (
//           <Input
//             defaultValue={chat.title}
//             onClick={(e) => e.stopPropagation()}
//             onPressEnter={(e) => handleRenameChat(chat.id, e.target.value)}
//             onBlur={(e) => handleRenameChat(chat.id, e.target.value)}
//             autoFocus
//           />
//         ) : (
//           <div 
//             className="menu-item-label"
//             onMouseEnter={() => setHoveredChatId(chat.id)}
//             onMouseLeave={() => setHoveredChatId(null)}
//           >
//             <span 
//               onDoubleClick={(e) => { 
//                 e.stopPropagation(); 
//                 setRenamingChatId(chat.id);
//               }}
//               className="menu-item-text"
//             >
//               {chat.title}
//             </span>
            
//             {/* (SỬA) Cập nhật logic hiển thị nút Sửa/Xóa */}
//             {
//               // Điều kiện: (Luôn hiện trên Mobile) HOẶC (Hiện khi hover trên Desktop)
//               ((isMobile && !collapsed) || 
//                (!isMobile && !collapsed && (hoveredChatId === chat.id || deletingChatId === chat.id)))
//               && ( // "&&" thay vì "?" để code gọn hơn
//                 <Space size={4}>
//                   <Button
//                     type="text"
//                     size="small"
//                     icon={<EditOutlined />}
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       setRenamingChatId(chat.id);
//                     }}
//                     className="menu-item-edit-button"
//                     data-theme={themeMode}
//                   />
                  
//                   <Popconfirm
//                     title="Xóa cuộc trò chuyện?"
//                     description="Bạn có chắc muốn xóa?"
//                     placement="right"
//                     open={deletingChatId === chat.id} 
//                     onConfirm={(e) => {
//                       e.stopPropagation();
//                       handleDeleteChat(chat.id);
//                       setDeletingChatId(null); 
//                     }}
//                     onCancel={(e) => {
//                       e.stopPropagation();
//                       setDeletingChatId(null); 
//                     }}
//                     okText="Xóa"
//                     cancelText="Hủy"
//                   >
//                     <Button
//                       type="text"
//                       size="small"
//                       danger
//                       icon={<DeleteOutlined />}
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         setDeletingChatId(chat.id); 
//                       }}
//                       className="menu-item-delete-button"
//                     />
//                   </Popconfirm>
//                 </Space>
//               )
//             }
//           </div>
//         )
//       ),
//     }));
//   // (SỬA) Thêm 'isMobile' vào mảng dependencies
//   }, [chatSessions, renamingChatId, setRenamingChatId, handleRenameChat, collapsed, hoveredChatId, themeMode, handleDeleteChat, deletingChatId, isMobile]);

//   return (
//     <Sider
//       width={260}
//       className="app-sider"
//       data-theme={themeMode}
//       collapsible={false} 
//       collapsed={collapsed}
//       breakpoint={undefined}
//       trigger={null}
//       style={{ height: '100%', display: 'flex', flexDirection: 'column' }} 
//     >
//       <div 
//         className="sider-logo-area" 
//         data-theme={themeMode}
//       >
//         <Space>
//           <Avatar
//             size={40}
//             className="sider-logo-avatar"
//             icon={<RobotOutlined className="sider-logo-avatar-icon" />}
//           />
//           {!collapsed && (
//             <span 
//               className="sider-logo-text" 
//               data-theme={themeMode}
//             >
//               InterviewAI
//             </span>
//           )}
//         </Space>
//       </div>

//       {isMobile && !collapsed && (
//         <div style={{ padding: '16px 16px 0 16px' }}>
//           <Button 
//             type="primary" 
//             block 
//             icon={<PlusOutlined />}
//             onClick={onNewChat}
//           >
//             Cuộc trò chuyện mới
//           </Button>
//         </div>
//       )}

//       <div 
//         className="sider-menu-area" 
//         data-collapsed={collapsed}
//         style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}
//       >
//         <div 
//           className="sider-menu-header"
//           data-theme={themeMode}
//           data-collapsed={collapsed}
//         >
//           {!collapsed && <span>HISTORY</span>}
//           <Tooltip title={isMobile ? "Đóng" : (collapsed ? "Open sidebar" : "Close sidebar")} placement="right">
//             <Button
//               type="text"
//               icon={isMobile ? <LeftOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
//               onClick={isMobile ? onClose : onToggle} 
//               className="sider-collapse-button"
//               data-theme={themeMode}
//             />
//           </Tooltip>
//         </div>
//         <Menu
//           theme={themeMode}
//           mode="inline"
//           items={chatMenuItems}
//           onClick={(info) => {
//             if (renamingChatId === info.key) return;
//             setRenamingChatId(null);
//             setActiveChatId(info.key); 
//           }}
//           selectedKeys={[activeChatId]}
//           className="sider-menu"
//           inlineCollapsed={collapsed}
//         />
//       </div>
//     </Sider>
//   );
// };

// export default AppSider;
import React, { useState, useMemo } from 'react';
import { Layout, Menu, Avatar, Button, Space, Tooltip, Input, Popconfirm, message } from 'antd';
import {
  MessageOutlined,
  RobotOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  EditOutlined,
  DeleteOutlined,
  LeftOutlined, 
  PlusOutlined, 
  FileImageOutlined,
  FileOutlined
} from '@ant-design/icons';

import './AppSider.css';

const { Sider } = Layout;

const AppSider = ({ 
  collapsed, 
  onToggle,
  onClose,
  onNewChat,
  isMobile,
  themeMode, 
  chatSessions, 
  activeChatId, 
  setActiveChatId,
  renamingChatId,
  setRenamingChatId,
  handleRenameChat,
  handleDeleteChat,
  fileMessages,
  handleRenameFileMessage,
  handleDeleteFileMessage
}) => {

  const [hoveredChatId, setHoveredChatId] = useState(null);
  const [deletingChatId, setDeletingChatId] = useState(null);
  
  const [hoveredFileId, setHoveredFileId] = useState(null);
  const [renamingFileId, setRenamingFileId] = useState(null);
  const [deletingFileId, setDeletingFileId] = useState(null);

  const chatMenuItems = useMemo(() => {
    return chatSessions.map(chat => ({
      key: chat.id,
      icon: <MessageOutlined />,
      label: (
        chat.id === renamingChatId ? (
          <Input
            defaultValue={chat.title}
            onClick={(e) => e.stopPropagation()}
            onPressEnter={(e) => {
              handleRenameChat(chat.id, e.target.value);
              setRenamingChatId(null); 
            }}
            onBlur={(e) => {
              handleRenameChat(chat.id, e.target.value);
              setRenamingChatId(null); 
            }}
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
            
            {
              ((isMobile && !collapsed) || 
               (!isMobile && !collapsed && (hoveredChatId === chat.id || deletingChatId === chat.id)))
              && ( 
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
                  <Popconfirm
                    title="Xóa cuộc trò chuyện?"
                    description="Bạn có chắc muốn xóa?"
                    placement="right"
                    open={deletingChatId === chat.id} 
                    onConfirm={(e) => {
                      e.stopPropagation();
                      handleDeleteChat(chat.id);
                      setDeletingChatId(null); 
                    }}
                    onCancel={(e) => {
                      e.stopPropagation();
                      setDeletingChatId(null); 
                    }}
                    okText="Xóa"
                    cancelText="Hủy"
                  >
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingChatId(chat.id); 
                      }}
                      className="menu-item-delete-button"
                    />
                  </Popconfirm>
                </Space>
              )
            }
          </div>
        )
      ),
    }));
  }, [chatSessions, renamingChatId, setRenamingChatId, handleRenameChat, collapsed, hoveredChatId, themeMode, handleDeleteChat, deletingChatId, isMobile]);

  // Cập nhật fileMenuItems
  const fileMenuItems = useMemo(() => {
    if (!fileMessages) return []; 

    return fileMessages
      .filter(file => file.sender === 'user')
      .map((file) => ({
        key: file.id, 
        icon: file.type === 'image' ? <FileImageOutlined /> : <FileOutlined />,
        label: (
          file.id === renamingFileId ? (
            <Input
              defaultValue={file.name}
              onClick={(e) => e.stopPropagation()}
              onPressEnter={(e) => {
                handleRenameFileMessage(file.id, e.target.value);
                setRenamingFileId(null);
              }}
              onBlur={(e) => {
                handleRenameFileMessage(file.id, e.target.value);
                setRenamingFileId(null);
              }}
              autoFocus
            />
          ) : (
            <div 
              className="menu-item-label"
              onMouseEnter={() => setHoveredFileId(file.id)}
              onMouseLeave={() => setHoveredFileId(null)}
            >
              <span 
                onDoubleClick={(e) => { 
                  e.stopPropagation(); 
                  setRenamingFileId(file.id);
                }}
                className="menu-item-text"
                title={file.name}
              >
                {file.name}
              </span>
              
              {
                ((isMobile && !collapsed) || 
                 (!isMobile && !collapsed && (hoveredFileId === file.id || deletingFileId === file.id)))
                && ( 
                  <Space size={4}>
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingFileId(file.id);
                      }}
                      className="menu-item-edit-button"
                      data-theme={themeMode}
                    />
                    <Popconfirm
                      title="Ẩn file này?" 
                      description="File vẫn ở trong chat, chỉ ẩn khỏi danh sách này." 
                      placement="right"
                      open={deletingFileId === file.id} 
                      onConfirm={(e) => {
                        e.stopPropagation();
                        handleDeleteFileMessage(file.id);
                        setDeletingFileId(null); 
                      }}
                      onCancel={(e) => {
                        e.stopPropagation();
                        setDeletingFileId(null); 
                      }}
                      okText="Ẩn" 
                      cancelText="Hủy"
                    >
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingFileId(file.id); 
                        }}
                        className="menu-item-delete-button"
                      />
                    </Popconfirm>
                  </Space>
                )
              }
            </div>
          )
        ),
        onClick: () => {
          if (file.type === 'image' && file.data) {
            const newWindow = window.open();
            
            if (newWindow) {
              newWindow.document.write(`<img src="${file.data}" alt="${file.name}" style="max-width: 100%;" />`);
              newWindow.document.close(); 
            } else {
              message.error("Pop-up bị chặn! Vui lòng cho phép pop-up.");
            }
          }
        }
    }));
  // Thêm 'hoveredFileId' vào mảng dependencies
  }, [fileMessages, isMobile, collapsed, themeMode, renamingFileId, deletingFileId, handleRenameFileMessage, handleDeleteFileMessage, hoveredFileId]);


  return (
    <Sider
      width={260}
      className="app-sider"
      data-theme={themeMode}
      collapsible={false} 
      collapsed={collapsed}
      breakpoint={undefined}
      trigger={null}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }} 
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

      {isMobile && !collapsed && (
        <div style={{ padding: '16px 16px 0 16px' }}>
          <Button 
            type="primary" 
            block 
            icon={<PlusOutlined />}
            onClick={onNewChat}
          >
            Cuộc trò chuyện mới
          </Button>
        </div>
      )}

      <div 
        className="sider-menu-area" 
        data-collapsed={collapsed}
        style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}
      >

        <div 
          className="sider-menu-header"
          data-theme={themeMode}
          data-collapsed={collapsed}
          style={{ marginTop: '24px' }} 
        >
          {!collapsed && <span>HISTORY</span>}
          <Tooltip title={isMobile ? "Đóng" : (collapsed ? "Mở Sidebar" : "Đóng Sidebar")} placement="right">
            <Button
              type="text"
              icon={isMobile ? <LeftOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
              onClick={isMobile ? onClose : onToggle} 
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
            setActiveChatId(info.key); 
          }}
          selectedKeys={[activeChatId]}
          className="sider-menu"
          inlineCollapsed={collapsed}
        />

        {!collapsed && (
          <>
            <div 
              className="sider-menu-header"
              data-theme={themeMode}
              data-collapsed={collapsed}
              style={{ marginTop: '24px' }} 
            >
              <span>FILES</span>
            </div>
            <Menu
              theme={themeMode}
              mode="inline"
              items={fileMenuItems} 
              className="sider-menu"
              inlineCollapsed={collapsed}
              onClick={(info) => {
                if (renamingFileId === info.key) return; 
                
                const clickedItem = fileMenuItems.find(item => item.key === info.key);
                if (clickedItem && clickedItem.onClick) {
                  clickedItem.onClick(info); 
                }
              }}
            />
          </>
        )}
        
      </div>
    </Sider>
  );
};

export default AppSider;