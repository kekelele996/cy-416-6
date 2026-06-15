import {
  Alert,
  App as AntApp,
  Avatar,
  Button,
  ConfigProvider,
  Layout,
  Menu,
  Select,
  Spin,
  Switch,
  Typography,
  theme,
} from 'antd';
import {
  AppstoreOutlined,
  BellOutlined,
  CalendarOutlined,
  MoonOutlined,
  ScheduleOutlined,
  SunOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useEffect, useMemo } from 'react';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { GlobalErrorBoundary } from '@/components/common/GlobalErrorBoundary';
import { MessageBinder } from '@/components/common/MessageBinder';
import { WAITLIST_MESSAGES } from '@/constants/messages';
import { THEME_LABELS } from '@/constants/themes';
import { useAuth } from '@/hooks/useAuth';
import { GuardedRoute, RootRedirect, appRoutes } from '@/router';
import { useAuthStore } from '@/stores/authStore';
import { useBookingStore } from '@/stores/bookingStore';
import { useRoomStore } from '@/stores/roomStore';
import { useThemeStore } from '@/stores/themeStore';
import { formatDate, formatDepartment, formatTimeRange } from '@/utils/formatters';

const { Header, Sider, Content } = Layout;

const navItems = [
  { key: '/dashboard', icon: <AppstoreOutlined />, label: <Link to="/dashboard">工作台</Link> },
  { key: '/rooms', icon: <CalendarOutlined />, label: <Link to="/rooms">会议室</Link> },
  { key: '/booking', icon: <ScheduleOutlined />, label: <Link to="/booking">预约</Link> },
  { key: '/my-bookings', icon: <CalendarOutlined />, label: <Link to="/my-bookings">我的会议</Link> },
  { key: '/admin/rooms', icon: <ToolOutlined />, label: <Link to="/admin/rooms">管理</Link> },
];

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { users, currentUser, login, isAdmin } = useAuth();
  const authInitialized = useAuthStore((state) => state.initialized);
  const initializeAuth = useAuthStore((state) => state.initialize);
  const initializeRooms = useRoomStore((state) => state.initialize);
  const initializeBookings = useBookingStore((state) => state.initialize);
  const initializeTheme = useThemeStore((state) => state.initialize);
  const toggleTheme = useThemeStore((state) => state.toggle);
  const mode = useThemeStore((state) => state.mode);
  const tokens = useThemeStore((state) => state.tokens);
  const notifications = useBookingStore((state) => state.notifications);
  const clearNotification = useBookingStore((state) => state.clearNotification);
  const markNotificationRead = useBookingStore((state) => state.markNotificationRead);
  const rooms = useRoomStore((state) => state.rooms);

  useEffect(() => {
    void Promise.all([initializeTheme(), initializeAuth(), initializeRooms(), initializeBookings()]);
  }, [initializeAuth, initializeBookings, initializeRooms, initializeTheme]);

  const selectedKey = useMemo(() => {
    const matched = navItems.find((item) => location.pathname.startsWith(item.key));
    return matched?.key ?? '/dashboard';
  }, [location.pathname]);

  const roomMap = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);
  const userNotifications = useMemo(
    () => notifications.filter((n) => n.booking.user_id === currentUser?.id),
    [notifications, currentUser?.id],
  );

  if (!authInitialized || !currentUser) {
    return (
      <div className="loading-screen">
        <Spin />
        <span>RoomFlow 正在准备本地数据</span>
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#2f5d50',
          borderRadius: 6,
          fontFamily: 'Aptos, ui-sans-serif, system-ui, sans-serif',
          colorInfo: '#2f5d50',
          colorWarning: '#d8942f',
        },
      }}
    >
      <AntApp>
        <MessageBinder />
        <GlobalErrorBoundary>
          <Layout className="app-layout" style={{ background: tokens.background }}>
            <Sider breakpoint="lg" collapsedWidth="0" className="app-sider" width={238}>
              <div className="brand-lockup">
                <div className="brand-mark">RF</div>
                <div>
                  <Typography.Title level={4} className="!m-0 !text-[var(--rf-text)]">
                    RoomFlow
                  </Typography.Title>
                  <Typography.Text className="text-xs text-[var(--rf-muted)]">智能会议室预约</Typography.Text>
                </div>
              </div>
              <Menu
                mode="inline"
                selectedKeys={[selectedKey]}
                items={navItems.filter((item) => item.key !== '/admin/rooms' || isAdmin)}
                className="app-menu"
              />
            </Sider>
            <Layout>
              <Header className="app-header">
                <div>
                  <Typography.Text className="text-sm text-[var(--rf-muted)]">
                    {formatDepartment(currentUser.department)}
                  </Typography.Text>
                  <Typography.Title level={4} className="!m-0 !text-[var(--rf-text)]">
                    {currentUser.name}
                  </Typography.Title>
                </div>
                <div className="header-actions">
                  {userNotifications.filter((n) => !n.read).length > 0 && (
                    <Button
                      type="default"
                      icon={<BellOutlined />}
                      onClick={() => navigate('/my-bookings')}
                    >
                      候补转正 ({userNotifications.filter((n) => !n.read).length})
                    </Button>
                  )}
                  <Select
                    aria-label="切换用户"
                    value={currentUser.id}
                    options={users.map((user) => ({
                      label: `${user.name} · ${user.role === 'admin' ? '管理员' : '员工'}`,
                      value: user.id,
                    }))}
                    onChange={login}
                    className="min-w-[190px]"
                  />
                  <Switch
                    checked={mode === 'dark'}
                    checkedChildren={<MoonOutlined />}
                    unCheckedChildren={<SunOutlined />}
                    onChange={() => toggleTheme()}
                    aria-label={`切换主题，当前 ${THEME_LABELS[mode]}`}
                  />
                  <Avatar src={currentUser.avatar}>{currentUser.name.slice(0, 1)}</Avatar>
                </div>
              </Header>

              {userNotifications
                .filter((n) => !n.read)
                .map((n) => (
                  <div key={n.id} className="px-6 pt-4">
                    <Alert
                      type="success"
                      showIcon
                      closable
                      onClose={() => clearNotification(n.id)}
                      onClick={() => {
                        markNotificationRead(n.id);
                        navigate('/my-bookings');
                      }}
                      message={WAITLIST_MESSAGES.convertedTitle}
                      description={`「${n.booking.title}」已候补转正，${roomMap.get(n.booking.room_id)?.name ?? '会议室'} · ${formatDate(n.booking.start_time)} ${formatTimeRange(n.booking.start_time, n.booking.end_time)}，点击查看详情`}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                ))}

              <Content className="app-content">
                <Routes>
                  <Route path="/" element={<RootRedirect />} />
                  {appRoutes.map((route) => (
                    <Route key={route.path} path={route.path} element={<GuardedRoute route={route} />} />
                  ))}
                </Routes>
              </Content>
            </Layout>
          </Layout>
        </GlobalErrorBoundary>
      </AntApp>
    </ConfigProvider>
  );
}

export default AppShell;
