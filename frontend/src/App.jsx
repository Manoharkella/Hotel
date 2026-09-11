import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import NotificationListener from './components/NotificationListener';

import AuthPage from './pages/AuthPage';

// Customer
import CustomerLayout from './pages/customer/CustomerLayout';
import CustomerHome from './pages/customer/CustomerHome';
import FindHotel from './pages/customer/FindHotel';
import HotelDetail from './pages/customer/HotelDetail';
import MyTrips from './pages/customer/MyTrips';
import OnlineCheckIn from './pages/customer/OnlineCheckIn';
import QRPass from './pages/customer/QRPass';
import CustomerProfile from './pages/customer/CustomerProfile';
import Wishlist from './pages/customer/Wishlist';
import RewardsStore from './pages/customer/RewardsStore';
import NotificationsPage from './pages/customer/NotificationsPage';

// Hotel Manager
import HotelLayout from './pages/hotel/HotelLayout';
import HotelDashboard from './pages/hotel/HotelDashboard';
import LeadsInbox from './pages/hotel/LeadsInbox';
import CreditWallet from './pages/hotel/CreditWallet';
import HotelBookings from './pages/hotel/HotelBookings';
import HotelRoomCalendar from './pages/hotel/HotelRoomCalendar';
import AdminCalendar from './pages/admin/AdminCalendar';
import QRScanner from './pages/hotel/QRScanner';
import HotelProperty from './pages/hotel/HotelProperty';

// Admin
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminHotelMap from './pages/admin/AdminHotelMap';
import AdminUsers from './pages/admin/AdminUsers';
import AdminHotels from './pages/admin/AdminHotels';
import AdminLeads from './pages/admin/AdminLeads';
import AdminCredits from './pages/admin/AdminCredits';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';

function ProtectedRoute({ children, allowedRole }) {
  const { user } = useAuth();
  const loginPath = allowedRole === 'hotel' ? '/hotel_login' : allowedRole === 'admin' ? '/admin_login' : '/customer_login';
  if (!user) return <Navigate to={loginPath} replace />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to={loginPath} replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Dedicated Login Routes for each user role */}
      <Route path="/customer_login" element={<AuthPage initialRole="customer" />} />
      <Route path="/customer-login" element={<Navigate to="/customer_login" replace />} />
      <Route path="/hotel_login" element={<AuthPage initialRole="hotel" />} />
      <Route path="/hotel-login" element={<Navigate to="/hotel_login" replace />} />
      <Route path="/admin_login" element={<AuthPage initialRole="admin" />} />
      <Route path="/admin-login" element={<Navigate to="/admin_login" replace />} />
      <Route path="/auth" element={<Navigate to="/customer_login" replace />} />

      {/* Customer Routes */}
      <Route path="/customer" element={<CustomerLayout />}>
        <Route index element={<CustomerHome />} />
        <Route path="find" element={<FindHotel />} />
        <Route path="hotel/:id" element={<HotelDetail />} />
        <Route path="trips" element={<ProtectedRoute allowedRole="customer"><MyTrips /></ProtectedRoute>} />
        <Route path="wishlist" element={<ProtectedRoute allowedRole="customer"><Wishlist /></ProtectedRoute>} />
        <Route path="rewards" element={<ProtectedRoute allowedRole="customer"><RewardsStore /></ProtectedRoute>} />
        <Route path="checkin/:id" element={<ProtectedRoute allowedRole="customer"><OnlineCheckIn /></ProtectedRoute>} />
        <Route path="qr/:id" element={<ProtectedRoute allowedRole="customer"><QRPass /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute allowedRole="customer"><CustomerProfile /></ProtectedRoute>} />
        <Route path="notifications" element={<ProtectedRoute allowedRole="customer"><NotificationsPage /></ProtectedRoute>} />
      </Route>

      {/* Hotel Manager Routes */}
      <Route path="/hotel" element={<ProtectedRoute allowedRole="hotel"><HotelLayout /></ProtectedRoute>}>
        <Route index element={<HotelDashboard />} />
        <Route path="calendar" element={<HotelRoomCalendar />} />
        <Route path="leads" element={<LeadsInbox />} />
        <Route path="wallet" element={<CreditWallet />} />
        <Route path="bookings" element={<HotelBookings />} />
        <Route path="scanner" element={<QRScanner />} />
        <Route path="property" element={<HotelProperty />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="calendar" element={<AdminCalendar />} />
        <Route path="map" element={<AdminHotelMap />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="hotels" element={<AdminHotels />} />
        <Route path="leads" element={<AdminLeads />} />
        <Route path="credits" element={<AdminCredits />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Alias for /lead */}
      <Route path="/lead" element={
        user ? (
          <Navigate to={user.role === 'hotel' ? '/hotel/leads' : user.role === 'admin' ? '/admin/leads' : '/customer'} replace />
        ) : (
          <Navigate to="/customer_login" replace />
        )
      } />

      {/* Root route */}
      <Route path="/" element={
        user ? (
          <Navigate to={user.role === 'customer' ? '/customer' : user.role === 'hotel' ? '/hotel' : '/admin'} replace />
        ) : (
          <Navigate to="/customer" replace />
        )
      } />

      {/* Default redirect for unknown paths */}
      <Route path="*" element={
        user ? (
          <Navigate to={user.role === 'customer' ? '/customer' : user.role === 'hotel' ? '/hotel' : '/admin'} replace />
        ) : (
          <Navigate to="/customer" replace />
        )
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
        <AppProvider>
          <ToastProvider>
            <NotificationListener />
            <AppRoutes />
          </ToastProvider>
        </AppProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
