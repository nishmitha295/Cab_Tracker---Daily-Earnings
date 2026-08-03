import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, History, Bell, LogOut } from 'lucide-react';
import { supabase, DailyEntry, totalExpense, profit, formatCurrency, formatDate, todayISO } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type Screen = 'dashboard' | 'add-income' | 'add-expense' | 'history' | 'reports';

type Props = {
  onNavigate: (screen: Screen) => void;
};

export default function Dashboard({ onNavigate }: Props) {
  const { user, logout } = useAuth();
  const [entry, setEntry] = useState<DailyEntry | null>(null);
  const [weekSummary, setWeekSummary] = useState({ income: 0, expenses: 0, profit: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  async function fetchData() {
    setLoading(true);
    const today = todayISO();

    const [todayRes, weekRes] = await Promise.all([
      supabase.from('daily_entries').select('*').eq('user_id', user!.id).eq('date', today).maybeSingle(),
      supabase.from('daily_entries').select('*').eq('user_id', user!.id)
        .gte('date', getWeekStart()).lte('date', today),
    ]);

    if (todayRes.data) setEntry(todayRes.data);

    if (weekRes.data && weekRes.data.length > 0) {
      const inc = weekRes.data.reduce((s, e) => s + Number(e.income), 0);
      const exp = weekRes.data.reduce((s, e) => s + totalExpense(e), 0);
      setWeekSummary({ income: inc, expenses: exp, profit: inc - exp });
    }
    setLoading(false);
  }

  function getWeekStart() {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    return mon.toISOString().split('T')[0];
  }

  const todayIncome = entry ? Number(entry.income) : 0;
  const todayExpenses = entry ? totalExpense(entry) : 0;
  const todayProfit = todayIncome - todayExpenses;
  const today = new Date();
  const dateLabel = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-5 pt-12 pb-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">Good {getGreeting()},</p>
            <h1 className="text-xl font-bold text-gray-900">{user?.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-gray-500" />
            </button>
            <button onClick={logout} className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center active:bg-red-100">
              <LogOut className="w-5 h-5 text-red-500" />
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <p className="text-xs text-gray-500">{dateLabel}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-28">
        {/* Today's Summary Cards */}
        <div className="mt-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Today's Summary</h2>
          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              {[0,1,2].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Income" value={formatCurrency(todayIncome)} icon={<TrendingUp className="w-4 h-4" />} color="green" />
              <StatCard label="Expenses" value={formatCurrency(todayExpenses)} icon={<TrendingDown className="w-4 h-4" />} color="red" />
              <StatCard label="Profit" value={formatCurrency(todayProfit)} icon={<DollarSign className="w-4 h-4" />} color={todayProfit >= 0 ? 'blue' : 'red'} />
            </div>
          )}
        </div>

         {/* Quick Actions */}
        <div className="mt-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h2>
          <div className="flex gap-3">
            <ActionButton
              icon={<TrendingUp className="w-6 h-6" />}
              label="Add Income"
              color="green"
              onClick={() => onNavigate('add-income')}
            />
            <ActionButton
              icon={<TrendingDown className="w-6 h-6" />}
              label="Add Expense"
              color="red"
              onClick={() => onNavigate('add-expense')}
            />
            <ActionButton
              icon={<History className="w-6 h-6" />}
              label="History"
              color="blue"
              onClick={() => onNavigate('history')}
            />
          </div>
        </div>

        {/* Today's entry detail */}
        {entry && (
          <div className="mt-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700">Today's Entry</p>
              <span className="text-xs text-gray-400">{formatDate(entry.date)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Diesel', val: entry.diesel },
                { label: 'Food', val: entry.food },
                { label: 'Parking', val: entry.parking },
                { label: 'Repair', val: entry.repair },
                { label: 'Service', val: entry.service },
                { label: 'Other', val: entry.other },
              ].map(({ label, val }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-2">
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-bold text-gray-700">{formatCurrency(Number(val))}</p>
                </div>
              ))}
            </div>
            {entry.notes && (
              <p className="mt-3 text-xs text-gray-500 italic bg-gray-50 rounded-xl px-3 py-2">"{entry.notes}"</p>
            )}
          </div>
        )}

      

        {/* This Week Summary */}
        <div className="mt-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">This Week</h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between">
              <WeekStat label="Income" value={formatCurrency(weekSummary.income)} color="text-green-600" />
              <WeekStat label="Expenses" value={formatCurrency(weekSummary.expenses)} color="text-red-500" />
              <WeekStat label="Profit" value={formatCurrency(weekSummary.profit)} color={weekSummary.profit >= 0 ? 'text-blue-600' : 'text-red-500'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-500',
    blue: 'bg-blue-50 text-blue-600',
  };
  const valueMap: Record<string, string> = {
    green: 'text-green-700',
    red: 'text-red-600',
    blue: 'text-blue-700',
  };
  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col gap-2">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-bold leading-tight ${valueMap[color]}`}>{value}</p>
    </div>
  );
}

function ActionButton({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-500 hover:bg-green-600',
    red: 'bg-red-500 hover:bg-red-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
  };
  return (
    <button onClick={onClick} className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl text-white transition-all active:scale-95 shadow-sm ${colorMap[color]}`}>
      {icon}
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}

function WeekStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}
