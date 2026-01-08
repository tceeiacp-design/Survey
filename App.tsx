
import React, { useState, useEffect, Component, ErrorInfo } from 'react';
import { User } from './types';
import Login from './components/Login';
import SurveyorDashboard from './components/SurveyorDashboard';
import AdminDashboard from './components/AdminDashboard';
import Header from './components/Header';
import SurveyForm from './components/SurveyForm';
import AuditForm from './components/AuditForm';

// Simple Error Boundary to catch crashes during render
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center text-red-600 font-sans">
          <h1 className="text-xl font-bold mb-4">Something went wrong.</h1>
          <div className="bg-red-50 p-4 rounded text-xs text-left overflow-auto border border-red-200 mb-4 max-w-lg mx-auto">
            {this.state.error?.toString()}
          </div>
          <button onClick={() => window.location.reload()} className="bg-gray-800 text-white px-6 py-2 rounded-lg font-bold text-sm">
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('ecosurvey_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn("Failed to parse user from local storage");
      return null;
    }
  });
  const [activeView, setActiveView] = useState<'DASHBOARD' | 'SURVEY_FORM' | 'AUDIT_FORM'>('DASHBOARD');

  useEffect(() => {
    // App has mounted, remove the loader
    const loader = document.getElementById('app-loader');
    if (loader) {
       loader.style.opacity = '0';
       setTimeout(() => loader.style.display = 'none', 500);
    }

    try {
      if (user) {
        localStorage.setItem('ecosurvey_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('ecosurvey_user');
      }
    } catch (e) {
      console.warn("LocalStorage access failed");
    }
  }, [user]);

  const handleLogout = () => {
    setUser(null);
    setActiveView('DASHBOARD');
  };

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user} onLogout={handleLogout} onHome={() => setActiveView('DASHBOARD')} />
      
      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        {user.role === 'ADMIN' ? (
          <AdminDashboard />
        ) : (
          <>
            {activeView === 'DASHBOARD' && (
              <SurveyorDashboard 
                user={user} 
                onNewSurvey={() => setActiveView('SURVEY_FORM')}
                onNewAudit={() => setActiveView('AUDIT_FORM')}
              />
            )}
            {activeView === 'SURVEY_FORM' && (
              <SurveyForm 
                user={user} 
                onCancel={() => setActiveView('DASHBOARD')}
                onSuccess={() => setActiveView('DASHBOARD')}
              />
            )}
            {activeView === 'AUDIT_FORM' && (
              <AuditForm 
                user={user} 
                onCancel={() => setActiveView('DASHBOARD')}
                onSuccess={() => setActiveView('DASHBOARD')}
              />
            )}
          </>
        )}
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} EcoSurvey - Waste Management Portal
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;
