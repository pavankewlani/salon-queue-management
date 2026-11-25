import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { QueueProvider } from './context/QueueContext';
import { AppLayout } from './components/layout/AppLayout';
import { HomeScreen } from './screens/HomeScreen';
import { JoinQueueScreen } from './screens/JoinQueueScreen';
import { MyStatusScreen } from './screens/MyStatusScreen';
import { ReceptionScreen } from './screens/ReceptionScreen';
import { BarberScreen } from './screens/BarberScreen';
import { DisplayScreen } from './screens/DisplayScreen';
import { AdminScreen } from './screens/AdminScreen';
import { AuthScreen } from './screens/AuthScreen';
import { AuthModal } from './components/auth/AuthModal';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

const AppRoutes: React.FC = () => {
  const location = useLocation();
  const isTvDisplay = location.pathname === '/display' || location.pathname === '/tv';

  return (
    <AppLayout showNav={!isTvDisplay}>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/join" element={<JoinQueueScreen />} />
        <Route path="/status/:id" element={<MyStatusScreen />} />
        <Route
          path="/reception"
          element={
            <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
              <ReceptionScreen />
            </ProtectedRoute>
          }
        />
        <Route path="/barber" element={<Navigate to="/barber/Amit" replace />} />
        <Route path="/barber/:name" element={<BarberScreen />} />
        <Route path="/display" element={<DisplayScreen />} />
        <Route path="/tv" element={<DisplayScreen />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminScreen />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<AuthScreen />} />
        <Route path="/signup" element={<AuthScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AuthModal />
    </AppLayout>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <QueueProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </QueueProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
