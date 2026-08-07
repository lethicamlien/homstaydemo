import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { CustomerOnlyRoute, RequireRole } from './components/ProtectedRoutes';
import { AuthProvider } from '@/lib/AuthContext';
import HomePage from './pages/HomePage';
import RoomsPage from './pages/RoomsPage';
import RoomDetailPage from './pages/RoomDetailPage';
import BookingPage from './pages/BookingPage';
import SuccessPage from './pages/SuccessPage';
import HistoryPage from './pages/HistoryPage';
import AuthPage from './pages/AuthPage';
import AdminPage from './pages/AdminPage';
import ReceptionPage from './pages/ReceptionPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<CustomerOnlyRoute><HomePage /></CustomerOnlyRoute>} />
          <Route path="/rooms" element={<CustomerOnlyRoute><RoomsPage /></CustomerOnlyRoute>} />
          <Route path="/rooms/:id" element={<CustomerOnlyRoute><RoomDetailPage /></CustomerOnlyRoute>} />
          <Route path="/booking" element={<CustomerOnlyRoute><BookingPage /></CustomerOnlyRoute>} />
          <Route path="/success/:id" element={<CustomerOnlyRoute><SuccessPage /></CustomerOnlyRoute>} />
          <Route path="/lich-su" element={<CustomerOnlyRoute><HistoryPage /></CustomerOnlyRoute>} />
          <Route path="/auth" element={<CustomerOnlyRoute><AuthPage /></CustomerOnlyRoute>} />
          <Route path="/admin" element={<RequireRole allowedRoles={['admin']}><AdminPage /></RequireRole>} />
          <Route path="/reception" element={<RequireRole allowedRoles={['receptionist']}><ReceptionPage /></RequireRole>} />
          <Route path="/gioi-thieu" element={<CustomerOnlyRoute><HomePage /></CustomerOnlyRoute>} />
          <Route path="/lien-he" element={<CustomerOnlyRoute><HomePage /></CustomerOnlyRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
