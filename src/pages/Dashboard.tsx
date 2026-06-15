import * as echarts from 'echarts';
import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, Col, Row, Statistic, Typography } from 'antd';
import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BookingTimeline } from '@/components/common/BookingTimeline';
import { RoomStatusCard } from '@/components/common/RoomStatusCard';
import { BookingStatus } from '@/constants/booking';
import { PAGE_MESSAGES } from '@/constants/messages';
import { RoomStatus } from '@/constants/room';
import { useAuth } from '@/hooks/useAuth';
import { useBookingStore } from '@/stores/bookingStore';
import { useRoomStore } from '@/stores/roomStore';
import { useThemeStore } from '@/stores/themeStore';
import { isSameDay } from '@/utils/timeRange';

export function Dashboard() {
  const chartRef = useRef<HTMLDivElement>(null);
  const rooms = useRoomStore((state) => state.rooms);
  const bookings = useBookingStore((state) => state.bookings);
  const tokens = useThemeStore((state) => state.tokens);
  const mode = useThemeStore((state) => state.mode);
  const { currentUser } = useAuth();

  const todaysBookings = useMemo(() => bookings.filter((booking) => isSameDay(booking.start_time)), [bookings]);
  const myTodayBookings = useMemo(
    () =>
      todaysBookings.filter(
        (booking) => booking.user_id === currentUser?.id || booking.attendees.includes(currentUser?.name ?? ''),
      ),
    [currentUser?.id, currentUser?.name, todaysBookings],
  );
  const availableRooms = rooms.filter((room) => room.status === RoomStatus.AVAILABLE).length;
  const activeMeetings = todaysBookings.filter((booking) => booking.status === BookingStatus.ONGOING).length;
  const utilization = rooms.length ? Math.round((todaysBookings.length / (rooms.length * 6)) * 100) : 0;

  useEffect(() => {
    if (!chartRef.current) {
      return undefined;
    }

    const chart = echarts.init(chartRef.current, mode);
    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      grid: { top: 24, right: 18, bottom: 24, left: 36 },
      xAxis: {
        type: 'category',
        data: rooms.map((room) => room.name.split(' ')[0]),
        axisLine: { lineStyle: { color: tokens.border } },
        axisLabel: { color: tokens.muted },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { color: tokens.chartGrid } },
        axisLabel: { color: tokens.muted },
      },
      series: [
        {
          name: '今日预约数',
          type: 'bar',
          barWidth: 18,
          itemStyle: { color: '#2f5d50', borderRadius: [4, 4, 0, 0] },
          data: rooms.map((room) => todaysBookings.filter((booking) => booking.room_id === room.id).length),
        },
      ],
    });

    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
    };
  }, [mode, rooms, todaysBookings, tokens.border, tokens.chartGrid, tokens.muted]);

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <Typography.Title className="!m-0" level={2}>
            {PAGE_MESSAGES.dashboardTitle}
          </Typography.Title>
          <Typography.Paragraph className="!m-0 text-[var(--rf-muted)]">
            {PAGE_MESSAGES.dashboardSubtitle}
          </Typography.Paragraph>
        </div>
        <Link to="/booking">
          <Button type="primary" icon={<ArrowRightOutlined />}>
            快速预约
          </Button>
        </Link>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <div className="metric-panel">
            <Statistic title="会议室使用率" value={utilization} suffix="%" />
          </div>
        </Col>
        <Col xs={24} md={8}>
          <div className="metric-panel">
            <Statistic title="可预约会议室" value={availableRooms} suffix={`/ ${rooms.length}`} />
          </div>
        </Col>
        <Col xs={24} md={8}>
          <div className="metric-panel">
            <Statistic title="进行中会议" value={activeMeetings} />
          </div>
        </Col>
      </Row>

      <div className="dashboard-grid">
        <section className="surface-panel">
          <div className="section-head">
            <Typography.Title level={3}>今日容量分布</Typography.Title>
            <Typography.Text type="secondary">按会议室统计预约密度</Typography.Text>
          </div>
          <div ref={chartRef} className="h-[280px] w-full" />
        </section>

        <section className="surface-panel">
          <BookingTimeline title="我的今日会议" bookings={myTodayBookings} rooms={rooms} dense />
        </section>
      </div>

      <section>
        <div className="section-head">
          <Typography.Title level={3}>推荐会议室</Typography.Title>
          <Typography.Text type="secondary">优先展示当前可预约空间</Typography.Text>
        </div>
        <div className="room-card-grid">
          {rooms.slice(0, 3).map((room) => (
            <RoomStatusCard key={room.id} room={room} bookings={bookings} />
          ))}
        </div>
      </section>
    </div>
  );
}
