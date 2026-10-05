import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { RutinasPage } from './pages/RutinasPage';
import { ProgresoPage } from './pages/ProgresoPage';
import { UsuariosPage } from './pages/UsuariosPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col font-inter">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/rutinas" element={<RutinasPage />} />
                <Route path="/progreso" element={<ProgresoPage />} />
                <Route path="/usuarios" element={<UsuariosPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
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
          </div>
        </BrowserRouter>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
