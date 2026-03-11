import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { SessionList } from './pages/SessionList';
import { SessionDetail } from './pages/SessionDetail';
import { NotificationBell } from './components/NotificationBell';
import { useWebSocket, WebSocketMessage } from './hooks/useWebSocket';
import { api } from './services/api';

// Create a context for metrics updates
export const MetricsContext = createContext<{
  refreshMetrics: () => Promise<void>;
}>({
  refreshMetrics: async () => {}
});

function Navigation() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="bg-white/[0.02] backdrop-blur-xl sticky top-0 z-50 border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3">
              <div className="accent-dot"></div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">super kitties</h1>
                <p className="text-xs text-white/60">Agent Console</p>
              </div>
            </Link>

            <div className="flex gap-2">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActive('/')
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'text-white/70 hover:text-white hover:bg-white/10 border border-transparent'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/sessions"
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActive('/sessions')
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'text-white/70 hover:text-white hover:bg-white/10 border border-transparent'
                }`}
              >
                Sessions
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="text-right">
                <p className="text-sm font-medium text-white">Agent User</p>
                <p className="text-xs text-white/60">Consultant</p>
              </div>
              <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                <span className="text-white font-semibold">AU</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative">
      {/* Ambient glow particles */}
      <div className="fixed top-1/4 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-[glowFloat_6s_ease-in-out_infinite] pointer-events-none" />
      <div className="fixed top-1/3 right-1/4 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-[glowFloat_8s_ease-in-out_infinite_1s] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/3 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-[glowFloat_10s_ease-in-out_infinite_2s] pointer-events-none" />

      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {children}
      </main>
      <footer className="bg-white/[0.02] backdrop-blur-xl border-t border-white/[0.08] mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-white/50">
            Agent Console - Voice AI Management System
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  // Implement metrics refresh function
  const [lastMetricsUpdate, setLastMetricsUpdate] = useState(Date.now());

  // Handle WebSocket messages to trigger metrics updates
  const handleWebSocketMessage = (message: WebSocketMessage) => {
    console.log('WebSocket message received:', message.type);
    // When a session is updated, created, or completed, refresh metrics
    if (['session_update', 'new_escalation', 'session_completed'].includes(message.type)) {
      refreshMetrics();
    }
  };

  const { connected } = useWebSocket(handleWebSocketMessage);

  // Function to refresh metrics that can be called from anywhere in the app
  const refreshMetrics = async () => {
    console.log('Refreshing metrics due to session change');
    // We don't actually need to do anything here since the Dashboard
    // component already periodically refreshes metrics. We just need to
    // update the timestamp to trigger re-renders when necessary.
    setLastMetricsUpdate(Date.now());
  };

  // Log WebSocket connection status
  useEffect(() => {
    console.log('WebSocket connected:', connected);
  }, [connected]);

  return (
    <MetricsContext.Provider value={{ refreshMetrics }}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard key={lastMetricsUpdate} />} />
            <Route path="/sessions" element={<SessionList />} />
            <Route path="/sessions/:sessionId" element={<SessionDetail />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </MetricsContext.Provider>
  );
}

export default App;
