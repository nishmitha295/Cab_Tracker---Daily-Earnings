import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, History, LogOut, Sun, Moon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase, DailyEntry, totalExpense, formatCurrency, formatDate, todayISO } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

type Screen = 'dashboard' | 'add-income' | 'add-expense' | 'history' | 'reports';
type Props = { onNavigate: (screen: Screen) => void };

export default function Dashboard({ onNavigate }: Props) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const [entry, setEntry] = useState<DailyEntry | null>(null);
  const [todayIncome, setTodayIncome] = useState(0);
  const [weekSummary, setWeekSummary] = useState({ income: 0, expenses: 0, profit: 0 });
  const [monthlyChart, setMonthlyChart] = useState<{ day: string; income: number; expenses: number; profit: number }[]>([]);
  const [chartMetric, setChartMetric] = useState<ChartMetric>('income');
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!user) return; fetchData(); }, [user]);

  async function fetchData() {
    setLoading(true);
    const today = todayISO();
    const weekStart = getWeekStart();

    const [expenseRes, incomeToday, incomeWeek] = await Promise.all([
      supabase.from('daily_entries').select('*').eq('user_id', user!.id).eq('date', today).maybeSingle(),
      supabase.from('income_entries').select('amount').eq('user_id', user!.id).eq('date', today),
      supabase.from('income_entries').select('amount,date').eq('user_id', user!.id).gte('date', weekStart).lte('date', today),
    ]);

    if (expenseRes.data) setEntry(expenseRes.data);

    const todayInc = (incomeToday.data || []).reduce((s, e) => s + Number(e.amount), 0);
    setTodayIncome(todayInc);

    const weekInc = (incomeWeek.data || []).reduce((s, e) => s + Number(e.amount), 0);

    // fetch week expenses
    const { data: weekExpenses } = await supabase
      .from('daily_entries').select('*').eq('user_id', user!.id).gte('date', weekStart).lte('date', today);
    const weekExp = (weekExpenses || []).reduce((s, e) => s + totalExpense(e), 0);
    setWeekSummary({ income: weekInc, expenses: weekExp, profit: weekInc - weekExp });

    // monthly line chart data
    const monthStart = today.slice(0, 7) + '-01';
    const [monthIncRes, monthExpRes] = await Promise.all([
      supabase.from('income_entries').select('date,amount').eq('user_id', user!.id).gte('date', monthStart).lte('date', today),
      supabase.from('daily_entries').select('date,diesel,food,parking,repair,service,other').eq('user_id', user!.id).gte('date', monthStart).lte('date', today),
    ]);
    const incByDay: Record<string, number> = {};
    (monthIncRes.data || []).forEach(e => { incByDay[e.date] = (incByDay[e.date] || 0) + Number(e.amount); });
    const expByDay: Record<string, number> = {};
    (monthExpRes.data || []).forEach(e => { expByDay[e.date] = totalExpense(e); });
    const allDays = [...new Set([...Object.keys(incByDay), ...Object.keys(expByDay)])].sort();
    setMonthlyChart(allDays.map(d => {
      const inc = incByDay[d] || 0;
      const exp = expByDay[d] || 0;
      return { day: String(new Date(d + 'T00:00:00').getDate()), income: inc, expenses: exp, profit: inc - exp };
    }));

    setLoading(false);
  }

  function getWeekStart() {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  }

  const todayExpenses = entry ? totalExpense(entry) : 0;
  const todayProfit = todayIncome - todayExpenses;
  const dateLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm px-5 pt-12 pb-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">Good {getGreeting()},</p>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center active:bg-gray-200">
              {dark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-500" />}
            </button>
            <button onClick={logout} className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center active:bg-red-100">
              <LogOut className="w-5 h-5 text-red-500" />
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <p className="text-xs text-gray-500 dark:text-gray-400">{dateLabel}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-28 dark:bg-gray-900">
        <div className="mt-5">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Today's Summary</h2>
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

        <div className="mt-5">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Quick Actions</h2>
          <div className="flex gap-3">
            <ActionButton icon={<TrendingUp className="w-6 h-6" />} label="Add Income" color="green" onClick={() => onNavigate('add-income')} />
            <ActionButton icon={<TrendingDown className="w-6 h-6" />} label="Add Expense" color="red" onClick={() => onNavigate('add-expense')} />
            <ActionButton icon={<History className="w-6 h-6" />} label="History" color="blue" onClick={() => onNavigate('history')} />
          </div>
        </div>

        {entry && (
          <div className="mt-4 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Today's Expenses</p>
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
                <div key={label} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-2">
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{formatCurrency(Number(val))}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly Line Chart */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">This Month</h2>
            <select
              value={chartMetric}
              onChange={e => setChartMetric(e.target.value as ChartMetric)}
              className="text-xs font-semibold border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 outline-none bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              <option value="income">Income</option>
              <option value="expenses">Expenses</option>
              <option value="profit">Profit</option>
            </select>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            {monthlyChart.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No data this month yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyChart} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                  <Line
                    type="monotone"
                    dataKey={chartMetric}
                    name={chartMetric.charAt(0).toUpperCase() + chartMetric.slice(1)}
                    stroke={chartMetric === 'income' ? '#10b981' : chartMetric === 'expenses' ? '#ef4444' : '#3b82f6'}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="mt-5">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">This Week</h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
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

type ChartMetric = 'income' | 'expenses' | 'profit';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = { green: 'bg-green-50 text-green-600', red: 'bg-red-50 text-red-500', blue: 'bg-blue-50 text-blue-600' };
  const valueMap: Record<string, string> = { green: 'text-green-700', red: 'text-red-600', blue: 'text-blue-700' };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-2">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colorMap[color]}`}>{icon}</div>
      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-bold leading-tight ${valueMap[color]}`}>{value}</p>
    </div>
  );
}

function ActionButton({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
  const colorMap: Record<string, string> = { green: 'bg-green-500 hover:bg-green-600', red: 'bg-red-500 hover:bg-red-600', blue: 'bg-blue-500 hover:bg-blue-600' };
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
