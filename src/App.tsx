import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import LoginScreen from '@/screens/LoginScreen';
import Dashboard from '@/screens/Dashboard';
import AddIncomeScreen from '@/screens/AddIncomeScreen';
import AddExpenseScreen from '@/screens/AddExpenseScreen';
import HistoryScreen from '@/screens/HistoryScreen';
import ReportsScreen from '@/screens/ReportsScreen';
import BottomNav, { Tab } from '@/components/BottomNav';

type Screen = 'dashboard' | 'add-income' | 'add-expense' | 'history' | 'reports';

function MainApp() {
  const { user } = useAuth();
  const [screen, setScreen] = useState<Screen>('dashboard');

  if (!user) return <LoginScreen />;

  // Add income / expense are full-screen overlays
  if (screen === 'add-income') return <AddIncomeScreen onBack={() => setScreen('dashboard')} />;
  if (screen === 'add-expense') return <AddExpenseScreen onBack={() => setScreen('dashboard')} />;

  const activeTab: Tab = screen === 'history' ? 'history' : screen === 'reports' ? 'reports' : 'dashboard';

  return (
    <div className="min-h-screen bg-gray-50">
      {screen === 'dashboard' && <Dashboard onNavigate={setScreen} />}
      {screen === 'history' && <HistoryScreen onBack={() => setScreen('dashboard')} />}
      {screen === 'reports' && <ReportsScreen onBack={() => setScreen('dashboard')} />}
      <BottomNav
        active={activeTab}
        onChange={(tab) => setScreen(tab)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
