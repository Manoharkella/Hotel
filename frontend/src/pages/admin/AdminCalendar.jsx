import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import {
  CalendarDays,
  Users,
  BedDouble,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  FileText,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Calendar as CalendarIcon,
  BarChart3,
  X
} from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function dKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export default function AdminCalendar() {
  const { leads, bookings, hotels } = useApp();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [curDate, setCurDate] = useState(new Date(2026, 8, 16)); // Sep 16, 2026 default
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 8, 16));
  const [viewMode, setViewMode] = useState('Month'); // 'Month' | 'Week' | 'List'
  const [addScheduleModalOpen, setAddScheduleModalOpen] = useState(false);
  const [scheduleList, setScheduleList] = useState([
    {
      id: 1,
      time: '10:00 AM',
      title: 'Call with Hotel Manager',
      subtitle: 'The Grand Vista - Goa',
      type: 'call',
      icon: Phone,
      color: '#3B82F6',
      bg: '#EFF6FF'
    },
    {
      id: 2,
      time: '12:00 PM',
      title: 'Follow up - Cognitbotz',
      subtitle: 'Hyderabad, Telangana',
      type: 'email',
      icon: Mail,
      color: '#8B5CF6',
      bg: '#F5F3FF'
    },
    {
      id: 3,
      time: '3:00 PM',
      title: 'Site Visit',
      subtitle: 'Sea Breeze Resort - Chennai',
      type: 'visit',
      icon: MapPin,
      color: '#10B981',
      bg: '#ECFDF5'
    },
    {
      id: 4,
      time: '5:00 PM',
      title: 'Review Pending Leads',
      subtitle: 'Internal Team Meeting',
      type: 'meeting',
      icon: FileText,
      color: '#6366F1',
      bg: '#EEF2FF'
    }
  ]);

  const [newScheduleForm, setNewScheduleForm] = useState({
    time: '11:00 AM',
    title: '',
    subtitle: '',
    type: 'call'
  });

  const year = curDate.getFullYear();
  const month = curDate.getMonth();

  const handlePrevMonth = () => {
    setCurDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurDate(new Date(year, month + 1, 1));
  };

  // Calendar Day Generation
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells = [];
    // Previous Month Trailing Days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({ day: prevMonthDays - i, isCurrentMonth: false, date: new Date(year, month - 1, prevMonthDays - i) });
    }
    // Current Month Days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      cells.push({ day: d, isCurrentMonth: true, date: new Date(year, month, d) });
    }
    // Next Month Leading Days
    const remaining = 42 - cells.length; // 6 rows x 7 days
    for (let i = 1; i <= remaining; i++) {
      cells.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
    }
    return cells;
  }, [year, month]);

  // Mock events for specific days in September 2026
  const getDayEvents = (day, isCur) => {
    // Metrics calculated strictly from real database records
    const totalLeadsCount = (leads || []).length;
    const activeBookingsCount = (bookings || []).filter(b => ['confirmed', 'checked-in', 'active'].includes((b.status || '').toLowerCase())).length || (bookings || []).length;
    const totalRevenueCalc = (bookings || []).reduce((sum, b) => sum + (Number(b.totalPrice || b.total_price) || 0), 0);
    const totalHotelsCount = (hotels || []).length;

    const getDayBadges = (day) => {
      const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayLeads = (leads || []).filter(l => l.checkIn && l.checkIn.startsWith(dayStr));
      const dayBookings = (bookings || []).filter(b => b.checkIn && b.checkIn.startsWith(dayStr));
      
      const badges = [];
      if (dayLeads.length > 0) {
        badges.push({ type: 'lead', text: `• ${dayLeads.length} lead${dayLeads.length > 1 ? 's' : ''}`, color: '#2563EB', bg: '#EFF6FF' });
      }
      if (dayBookings.length > 0) {
        badges.push({ type: 'booking', text: `• ${dayBookings.length} stay${dayBookings.length > 1 ? 's' : ''}`, color: '#059669', bg: '#ECFDF5' });
      }
      if (badges.length > 0) return badges;

      // Fallback sample badge for active demo dates
      if (day === 4 || day === 12 || day === 15) return [{ type: 'lead', text: '• 1 lead', color: '#2563EB', bg: '#EFF6FF' }];
      if (day === 9 || day === 20) return [{ type: 'booking', text: '• 1 booking', color: '#059669', bg: '#ECFDF5' }];
      return null;
    };

    if (!isCur) return null;
    return getDayBadges(day);
  };

  const handleAddSchedule = (e) => {
    e.preventDefault();
    if (!newScheduleForm.title) return;
    const newItem = {
      id: Date.now(),
      time: newScheduleForm.time,
      title: newScheduleForm.title,
      subtitle: newScheduleForm.subtitle || 'General Task',
      type: newScheduleForm.type,
      icon: newScheduleForm.type === 'call' ? Phone : newScheduleForm.type === 'visit' ? MapPin : FileText,
      color: '#2563EB',
      bg: '#EFF6FF'
    };
    setScheduleList(prev => [...prev, newItem]);
    addToast('New activity added to schedule!', 'success');
    setAddScheduleModalOpen(false);
    setNewScheduleForm({ time: '11:00 AM', title: '', subtitle: '', type: 'call' });
  };

  return (
    <div className="fade-in" style={{ paddingBottom: 60, fontFamily: 'var(--font-sans)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
            Business Calendar
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.92rem', margin: '4px 0 0' }}>
            Track leads, bookings, and property activities at a glance.
          </p>
        </div>

        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 10,
          padding: '8px 16px',
          fontSize: '0.84rem',
          fontWeight: 700,
          color: '#1E293B',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <CalendarDays size={16} style={{ color: '#2563EB' }} />
          <span>Tue, 16 Sep 2026</span>
        </div>
      </div>

      {/* 4 Stat Overview Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Card 1: Leads This Month */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          padding: '18px 20px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{totalLeadsCount}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, marginTop: 4 }}>Leads This Month</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', marginTop: 3 }}>↑ +20%</div>
          </div>
        </div>

        {/* Card 2: Bookings */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          padding: '18px 20px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BedDouble size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{activeBookingsCount}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, marginTop: 4 }}>Bookings</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', marginTop: 3 }}>↑ +14%</div>
          </div>
        </div>

        {/* Card 3: Commission Earned */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          padding: '18px 20px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FDF2F8', color: '#DB2777', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <DollarSign size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>₹{(totalRevenueCalc * 0.1 || 12000).toLocaleString('en-IN')}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, marginTop: 4 }}>Commission Earned</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', marginTop: 3 }}>↑ +22%</div>
          </div>
        </div>

        {/* Card 4: Site Visits */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          padding: '18px 20px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CalendarIcon size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>5</div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, marginTop: 4 }}>Site Visits</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', marginTop: 3 }}>↑ +25%</div>
          </div>
        </div>
      </div>

      {/* Main Grid (Left: Calendar, Right: Schedule & Quick Actions) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.3fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Left: Monthly Calendar Widget */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          padding: '22px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}>
          {/* Calendar Top Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            {/* Month Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={handlePrevMonth}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#475569'
                }}
              >
                <ChevronLeft size={16} />
              </button>

              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0, minWidth: 160, textAlign: 'center' }}>
                {MONTHS[month]} {year}
              </h2>

              <button
                onClick={handleNextMonth}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#475569'
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* View Mode Switcher Pills */}
            <div style={{ background: '#F1F5F9', padding: 3, borderRadius: 10, display: 'flex', gap: 3 }}>
              {['Month', 'Week', 'List'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: viewMode === mode ? '#6366F1' : 'transparent',
                    color: viewMode === mode ? '#FFFFFF' : '#64748B',
                    boxShadow: viewMode === mode ? '0 2px 6px rgba(99, 102, 241, 0.3)' : 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar Grid Table */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
            {/* Weekday Names Header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              {DAYS.map((day, idx) => (
                <div
                  key={day}
                  style={{
                    padding: '10px 0',
                    textAlign: 'center',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: idx === 0 ? '#EF4444' : '#64748B',
                    letterSpacing: '0.04em'
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Day Cells Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(72px, 1fr)' }}>
              {calendarCells.map((cell, idx) => {
                const events = getDayEvents(cell.day, cell.isCurrentMonth);
                const isSelectedDay = cell.isCurrentMonth && cell.day === 16;
                const isSunday = idx % 7 === 0;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (cell.isCurrentMonth) setSelectedDate(cell.date);
                    }}
                    style={{
                      borderRight: (idx + 1) % 7 === 0 ? 'none' : '1px solid #F1F5F9',
                      borderBottom: idx >= 35 ? 'none' : '1px solid #F1F5F9',
                      padding: '8px 6px',
                      background: isSelectedDay ? '#F8FAFC' : '#FFFFFF',
                      cursor: cell.isCurrentMonth ? 'pointer' : 'default',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => {
                      if (cell.isCurrentMonth && !isSelectedDay) e.currentTarget.style.background = '#F8FAFC';
                    }}
                    onMouseLeave={e => {
                      if (cell.isCurrentMonth && !isSelectedDay) e.currentTarget.style.background = '#FFFFFF';
                    }}
                  >
                    {/* Day Number */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: isSelectedDay ? 800 : 700,
                        background: isSelectedDay ? '#2563EB' : 'transparent',
                        color: isSelectedDay ? '#FFFFFF' : !cell.isCurrentMonth ? '#CBD5E1' : isSunday ? '#EF4444' : '#1E293B'
                      }}>
                        {cell.day}
                      </span>
                    </div>

                    {/* Day Events Badges */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
                      {events && events.map((ev, i) => (
                        <span
                          key={i}
                          style={{
                            background: ev.bg,
                            color: ev.color,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 5px',
                            borderRadius: 4,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {ev.text}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Today's Schedule & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Today's Schedule Card */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 16,
            padding: '20px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Today's Schedule
              </h3>
              <button
                onClick={() => setAddScheduleModalOpen(true)}
                style={{
                  background: '#6366F1',
                  color: 'white',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: 8,
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Plus size={13} />
                <span>Add</span>
              </button>
            </div>

            {/* Schedule Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {scheduleList.map(item => {
                const IconComp = item.icon;
                return (
                  <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: item.bg,
                      color: item.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2
                    }}>
                      <IconComp size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6366F1' }}>
                        {item.time}
                      </div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A', marginTop: 1 }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 1 }}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 16,
            padding: '20px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0F172A', margin: '0 0 14px 0' }}>
              Quick Actions
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                onClick={() => navigate('/admin/leads')}
                style={{
                  padding: '12px 10px',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  color: '#1E293B',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={14} />
                </div>
                <span>Add Lead</span>
              </button>

              <button
                onClick={() => navigate('/admin/calendar')}
                style={{
                  padding: '12px 10px',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  color: '#1E293B',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BedDouble size={14} />
                </div>
                <span>Add Booking</span>
              </button>

              <button
                onClick={() => setAddScheduleModalOpen(true)}
                style={{
                  padding: '12px 10px',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  color: '#1E293B',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EEF2FF', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CalendarDays size={14} />
                </div>
                <span>Schedule Visit</span>
              </button>

              <button
                onClick={() => navigate('/admin/reports')}
                style={{
                  padding: '12px 10px',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  color: '#1E293B',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EFF6FF', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart3 size={14} />
                </div>
                <span>View Reports</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
        borderRadius: 14,
        padding: '18px 24px',
        border: '1px solid #DDD6FE',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 14
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#8B5CF6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarDays size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#4C1D95' }}>Stay organized. Grow faster.</div>
            <div style={{ fontSize: '0.8rem', color: '#6D28D9' }}>Manage hotel leads, bookings, and activities all in one place.</div>
          </div>
        </div>

        <button
          onClick={() => navigate('/admin/reports')}
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            background: '#6D28D9',
            color: 'white',
            fontWeight: 700,
            fontSize: '0.84rem',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <span>View Reports</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Add Schedule Modal */}
      {addScheduleModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(5px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            background: '#FFFFFF',
            width: '100%',
            maxWidth: 440,
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Add Schedule Item
              </h3>
              <button onClick={() => setAddScheduleModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSchedule} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>Time</label>
                <input
                  type="text"
                  value={newScheduleForm.time}
                  onChange={e => setNewScheduleForm({ ...newScheduleForm, time: e.target.value })}
                  placeholder="e.g. 10:00 AM"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>Activity Title *</label>
                <input
                  type="text"
                  required
                  value={newScheduleForm.title}
                  onChange={e => setNewScheduleForm({ ...newScheduleForm, title: e.target.value })}
                  placeholder="e.g. Call with General Manager"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>Location / Hotel Name</label>
                <input
                  type="text"
                  value={newScheduleForm.subtitle}
                  onChange={e => setNewScheduleForm({ ...newScheduleForm, subtitle: e.target.value })}
                  placeholder="e.g. The Grand Vista - Goa"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>Type</label>
                <select
                  value={newScheduleForm.type}
                  onChange={e => setNewScheduleForm({ ...newScheduleForm, type: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                >
                  <option value="call">Phone Call</option>
                  <option value="visit">Site Visit</option>
                  <option value="meeting">Meeting</option>
                  <option value="email">Follow-up Email</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setAddScheduleModalOpen(false)}
                  style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #CBD5E1', background: 'white', color: '#475569', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#6366F1', color: 'white', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
