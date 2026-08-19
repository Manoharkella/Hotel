import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';

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

// Hotel Manager
import HotelLayout from './pages/hotel/HotelLayout';
import HotelDashboard from './pages/hotel/HotelDashboard';
import LeadsInbox from './pages/hotel/LeadsInbox';
import CreditWallet from './pages/hotel/CreditWallet';
import HotelBookings from './pages/hotel/HotelBookings';
import QRScanner from './pages/hotel/QRScanner';
import HotelProperty from './pages/hotel/HotelProperty';

// Admin
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminHotels from './pages/admin/AdminHotels';
import AdminLeads from './pages/admin/AdminLeads';
import AdminCredits from './pages/admin/AdminCredits';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';

function ProtectedRoute({ children, allowedRole }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/auth" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />

      {/* Customer Routes */}
      <Route path="/customer" element={<ProtectedRoute allowedRole="customer"><CustomerLayout /></ProtectedRoute>}>
        <Route index element={<CustomerHome />} />
        <Route path="find" element={<FindHotel />} />
        <Route path="hotel/:id" element={<HotelDetail />} />
        <Route path="trips" element={<MyTrips />} />
        <Route path="checkin/:id" element={<OnlineCheckIn />} />
        <Route path="qr/:id" element={<QRPass />} />
        <Route path="profile" element={<CustomerProfile />} />
      </Route>

      {/* Hotel Manager Routes */}
      <Route path="/hotel" element={<ProtectedRoute allowedRole="hotel"><HotelLayout /></ProtectedRoute>}>
        <Route index element={<HotelDashboard />} />
        <Route path="leads" element={<LeadsInbox />} />
        <Route path="wallet" element={<CreditWallet />} />
        <Route path="bookings" element={<HotelBookings />} />
        <Route path="scanner" element={<QRScanner />} />
        <Route path="property" element={<HotelProperty />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="hotels" element={<AdminHotels />} />
        <Route path="leads" element={<AdminLeads />} />
        <Route path="credits" element={<AdminCredits />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Default redirect */}
      <Route path="*" element={
        user ? (
          <Navigate to={user.role === 'customer' ? '/customer' : user.role === 'hotel' ? '/hotel' : '/admin'} replace />
        ) : (
          <Navigate to="/auth" replace />
        )
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
