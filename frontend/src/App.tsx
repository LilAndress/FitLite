import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { RutinasPage } from './pages/RutinasPage';
import { ProgresoPage } from './pages/ProgresoPage';
import { UsuariosPage } from './pages/UsuariosPage';
import { AuthPage } from './pages/AuthPage';
import { CoachIaPage } from './pages/CoachIaPage';
import { CoachIaFloatingWidget } from './components/CoachIaFloatingWidget';

import { BienvenidaPage } from './pages/BienvenidaPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

// Protected route guard: requires activeUser and checks onboarding completion
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { activeUser } = useUser();
  if (!activeUser) {
    return <Navigate to="/login" replace />;
  }
  if (activeUser.onboardingCompletado === false) {
    return <Navigate to="/bienvenida" replace />;
  }
  return <>{children}</>;
}

function AppContent() {
  const location = useLocation();
  const { activeUser } = useUser();

  const isAuthRoute = location.pathname === '/login' || location.pathname === '/registro' || location.pathname === '/bienvenida';
  const isLandingRoute = location.pathname === '/landing' || (location.pathname === '/' && !activeUser);
  const hideAppNavbar = isAuthRoute || isLandingRoute;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col font-inter">
      {!hideAppNavbar && <Navbar />}
      <main className="flex-1 flex flex-col">
        <Routes>
          {/* Landing pública en '/' para visitantes sin sesión */}
          <Route 
            path="/" 
            element={
              !activeUser ? (
                <LandingPage />
              ) : activeUser.onboardingCompletado === false ? (
                <Navigate to="/bienvenida" replace />
              ) : (
                <DashboardPage />
              )
            } 
          />
          <Route path="/landing" element={<LandingPage />} />
          <Route 
            path="/bienvenida" 
            element={
              !activeUser ? (
                <Navigate to="/login" replace />
              ) : activeUser.onboardingCompletado !== false ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <BienvenidaPage />
              )
            } 
          />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/registro" element={<AuthPage />} />
          <Route path="/rutinas" element={<ProtectedRoute><RutinasPage /></ProtectedRoute>} />
          <Route path="/progreso" element={<ProtectedRoute><ProgresoPage /></ProtectedRoute>} />
          <Route path="/coach" element={<ProtectedRoute><CoachIaPage /></ProtectedRoute>} />
          <Route path="/usuarios" element={<ProtectedRoute><UsuariosPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isAuthRoute && <CoachIaFloatingWidget />}
      {!hideAppNavbar && (
        <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-5 text-center text-xs text-[var(--text-secondary)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="font-space font-medium text-[var(--text-secondary)]">
              FitLite Pro · © {new Date().getFullYear()} Plataforma deportiva inteligente
            </p>
            <p className="text-[var(--text-secondary)] font-inter">
              Sobrecarga progresiva · <span className="text-[var(--accent-primary)] font-semibold font-space">Spring Boot & React</span>
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
