import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { AuthProvider } from './contexts/AuthContext';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SecurityLoginPage from './pages/SecurityLoginPage';
import AccessLinkPage from './pages/AccessLinkPage';
import ResidentLayout from './layouts/ResidentLayout';
import SecurityLayout from './layouts/SecurityLayout';
import DashboardOverview from './pages/resident/DashboardOverview';
import TrustedContacts from './pages/resident/TrustedContacts';
import PreRegisterVisitor from './pages/resident/PreRegisterVisitor';
import VisitorHistory from './pages/resident/VisitorHistory';
import Settings from './pages/resident/Settings';
import SecurityDashboard from './pages/security/SecurityDashboard';
import VerifyVisitor from './pages/security/VerifyVisitor';
import CurrentVisitors from './pages/security/CurrentVisitors';
import EntryLogs from './pages/security/EntryLogs';
import Statistics from './pages/security/Statistics';
import ProtectedRoute from './components/shared/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <DarkModeProvider>
        <Router>
          {/* Dark mode aware toaster */}
          <Toaster 
            position="top-right"
            toastOptions={{
              // Default options
              duration: 4000,
              // Light mode styles
              style: {
                background: '#fff',
                color: '#363636',
              },
              // Success toast
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              // Error toast
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
              // Dark mode overrides
              className: 'dark:bg-gray-800 dark:text-white',
            }}
          />
          
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/security/login" element={<SecurityLoginPage />} />
            
            {/* Public Access Link Route */}
            <Route path="/access/:token" element={<AccessLinkPage />} />
            
            {/* Resident Routes */}
            <Route
              path="/resident"
              element={
                <ProtectedRoute allowedRoles={['resident']}>
                  <ResidentLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/resident/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardOverview />} />
              <Route path="contacts" element={<TrustedContacts />} />
              <Route path="pre-register" element={<PreRegisterVisitor />} />
              <Route path="history" element={<VisitorHistory />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            {/* Security Routes */}
            <Route
              path="/security"
              element={
                <ProtectedRoute allowedRoles={['security']}>
                  <SecurityLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/security/dashboard" replace />} />
              <Route path="dashboard" element={<SecurityDashboard />} />
              <Route path="verify" element={<VerifyVisitor />} />
              <Route path="current" element={<CurrentVisitors />} />
              <Route path="logs" element={<EntryLogs />} />
              <Route path="statistics" element={<Statistics />} />
            </Route>
            
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>

          {/* PWA Install Prompt - Shows on mobile when app can be installed */}
          <PWAInstallPrompt />
        </Router>
      </DarkModeProvider>
    </AuthProvider>
  );
}

export default App;