import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider } from '@/lib/AuthContext';
import HomePage from './pages/HomePage';
import RoomsPage from './pages/RoomsPage';
import RoomDetailPage from './pages/RoomDetailPage';


function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
         <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/:id" element={<RoomDetailPage />} />
          <Route path="/gioi-thieu" element={<HomePage />} />
          <Route path="/lien-he" element={<HomePage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
