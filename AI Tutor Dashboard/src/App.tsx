import { useState, useEffect } from 'react';
import { User, Session } from './types';
import { getCurrentUser, login as authLogin, logout as authLogout, signup as authSignup } from './lib/auth';
import { getSession, getSessionsByOrganizer } from './lib/sessionApi';
import { isTokenExpired } from './lib/tokenUtils';
import { Landing } from './components/Landing';
import { LoginForm } from './components/LoginForm';
import { Header } from './components/Header';
import { OrganizerDashboard } from './components/OrganizerDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { SessionView } from './components/SessionView';

type View = 'landing' | 'login-organizer' | 'login-student' | 'dashboard' | 'session';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);

  useEffect(() => {
    // Load current user from localStorage
    const currentUser = getCurrentUser();
    const token = localStorage.getItem('token');
    
    if (currentUser && token) {
      // Check if token is expired
      if (isTokenExpired(token)) {
        console.log('Token expired, logging out');
        handleLogout();
        return;
      }
      
      setUser(currentUser);
      loadSessions(currentUser);
      
      // Проверка URL для прямого перехода к сессии
      const path = window.location.pathname;
      const sessionMatch = path.match(/\/session\/(.+)/);
      if (sessionMatch) {
        const sessionId = sessionMatch[1];
        loadSession(sessionId);
      } else if (path === '/main' || path === '/dashboard') {
        // Если пользователь есть и URL /main или /dashboard, показываем dashboard
        setCurrentView('dashboard');
      } else {
        // Перенаправляем на /main
        setCurrentView('dashboard');
        window.history.replaceState({}, '', '/main');
      }
    } else {
      // Если нет пользователя или токена, очищаем localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      setCurrentView('landing');
      if (window.location.pathname !== '/') {
        window.history.replaceState({}, '', '/');
      }
    }
  }, []);
  
  const loadSessions = async (currentUser: User) => {
    if (currentUser.role === 'organizer' && currentUser.id) {
      try {
        const loadedSessions = await getSessionsByOrganizer(currentUser.id);
        setSessions(loadedSessions);
      } catch (error) {
        console.error('Failed to load sessions:', error);
      }
    }
  };
  
  const loadSession = async (sessionId: string) => {
    try {
      const session = await getSession(sessionId);
      setCurrentSession(session);
      setCurrentSessionId(sessionId);
      setCurrentView('session');
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  const handleQuickLogin = (role: 'organizer' | 'student') => {
    // Быстрый вход без формы
    const mockUser: User = {
      id: role === 'organizer' ? '1' : Date.now().toString(), // Используем фиксированный ID '1' для организатора
      email: `${role}@example.com`,
      name: role === 'organizer' ? 'Александр Петров' : 'Ученик',
      role
    };
    setUser(mockUser);
    setCurrentView('dashboard');
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await authLogin({ email, password });
      setUser(response.user);
      await loadSessions(response.user);
      setCurrentView('dashboard');
      window.history.pushState({}, '', '/main');
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const handleSignup = async (email: string, name: string, password: string, role: 'organizer' | 'student') => {
    try {
      const response = await authSignup({ 
        email, 
        name, 
        password,
        role: role.toUpperCase() as 'ORGANIZER' | 'STUDENT'
      });
      setUser(response.user);
      await loadSessions(response.user);
      setCurrentView('dashboard');
      window.history.pushState({}, '', '/main');
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const handleLogout = () => {
    authLogout();
    setUser(null);
    setCurrentView('landing');
    window.history.pushState({}, '', '/');
  };

  const refreshSessions = async () => {
    if (user && user.role === 'organizer' && user.id) {
      await loadSessions(user);
    }
  };

  const handleSessionComplete = () => {
    if (user) {
      setCurrentView('dashboard');
      setCurrentSessionId(null);
      window.history.pushState({}, '', '/main');
    } else {
      setCurrentView('landing');
      setCurrentSessionId(null);
      window.history.pushState({}, '', '/');
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <Landing onNavigate={setCurrentView} />;

      case 'login-organizer':
        return (
          <LoginForm
            role="organizer"
            onLogin={handleLogin}
            onSignup={(email: string, name: string, password: string) => 
              handleSignup(email, name, password, 'organizer')
            }
            onBack={() => setCurrentView('landing')}
          />
        );

      case 'login-student':
        return (
          <LoginForm
            role="student"
            onLogin={handleLogin}
            onSignup={(email: string, name: string, password: string) => 
              handleSignup(email, name, password, 'student')
            }
            onBack={() => setCurrentView('landing')}
          />
        );

      case 'dashboard':
        if (!user) return <Landing onNavigate={setCurrentView} />;
        
        return user.role === 'organizer' ? (
          <OrganizerDashboard 
            user={user} 
            sessions={sessions}
            onRefresh={refreshSessions}
            onOpenSession={async (sessionId) => {
              await loadSession(sessionId);
            }}
          />
        ) : (
          <StudentDashboard 
            user={user}
            onOpenSession={async (sessionId) => {
              await loadSession(sessionId);
            }}
          />
        );

      case 'session':
        if (!currentSession) {
          setCurrentView('landing');
          return null;
        }
        return (
          <SessionView
            session={currentSession}
            user={user}
            onComplete={handleSessionComplete}
            onBack={() => {
              if (user) {
                setCurrentView('dashboard');
                window.history.pushState({}, '', '/main');
              } else {
                setCurrentView('landing');
                window.history.pushState({}, '', '/');
              }
            }}
          />
        );

      default:
        return <Landing onNavigate={setCurrentView} />;
    }
  };

  return <div className="min-h-screen">
    {/* Show Header when user is logged in and not on landing or login screens */}
    {user && currentView !== 'landing' && currentView !== 'login-organizer' && currentView !== 'login-student' && (
      <Header user={user} onLogout={handleLogout} />
    )}
    {renderView()}
  </div>;
}