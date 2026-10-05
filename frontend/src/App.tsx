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
          <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
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
            <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-400">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                <p>© {new Date().getFullYear()} FitLite - Todos los derechos reservados.</p>
                <p className="text-slate-400">
                  Desarrollado con <span className="text-emerald-400 font-semibold">Spring Boot & React</span>
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
