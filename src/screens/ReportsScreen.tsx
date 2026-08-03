import { useState, useEffect } from 'react';
import { ArrowLeft, BarChart2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase, DailyEntry, totalExpense, formatCurrency } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type Props = { onBack: () => void };
type Tab = 'weekly' | 'monthly';

export default function ReportsScreen({ onBack }: Props) {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('weekly');
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [incomeMap, setIncomeMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchEntries(); }, []);

  async function fetchEntries() {
    setLoading(true);
    const [expRes, incRes] = await Promise.all([
      supabase.from('daily_entries').select('*').eq('user_id', user!.id).order('date', { ascending: true }),
      supabase.from('income_entries').select('date,amount').eq('user_id', user!.id),
    ]);
    setEntries(expRes.data || []);
    setIncomeMap(
      (incRes.data || []).reduce((acc, e) => {
        acc[e.date] = (acc[e.date] || 0) + Number(e.amount);
        return acc;
      }, {} as Record<string, number>)
    );
    setLoading(false);
  }

  const weeklyData = groupByWeek(entries, incomeMap);
  const monthlyData = groupByMonth(entries, incomeMap);

  const chartData = tab === 'weekly' ? weeklyData : monthlyData;
  const totals = chartData.reduce((acc, d) => ({
    income: acc.income + d.income,
    expenses: acc.expenses + d.expenses,
    profit: acc.profit + d.profit,
  }), { income: 0, expenses: 0, profit: 0 });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="bg-white dark:bg-gray-800 shadow-sm px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center active:bg-gray-200">
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Reports</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {/* Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1 mt-5">
          {(['weekly', 'monthly'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-white dark:bg-gray-600 text-green-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
            >
              {t === 'weekly' ? 'Weekly' : 'Monthly'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-5">
            <div className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[0,1,2].map(i => <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />)}
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 text-center">
            <BarChart2 className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm">No data to report yet</p>
            <p className="text-gray-300 text-xs mt-1">Start adding entries to see reports</p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              <SummaryCard label="Income" value={formatCurrency(totals.income)} icon={<TrendingUp className="w-4 h-4" />} color="green" />
              <SummaryCard label="Expenses" value={formatCurrency(totals.expenses)} icon={<TrendingDown className="w-4 h-4" />} color="red" />
              <SummaryCard label="Profit" value={formatCurrency(totals.profit)} icon={<DollarSign className="w-4 h-4" />} color={totals.profit >= 0 ? 'blue' : 'red'} />
            </div>

            {/* Chart */}
            <div className="mt-5 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">{tab === 'weekly' ? 'Weekly Comparison' : 'Monthly Comparison'}</h2>
              <BarChartViz data={chartData} />
            </div>

            {/* Detailed list */}
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mt-5 mb-3">{tab === 'weekly' ? 'Week Breakdown' : 'Month Breakdown'}</h2>
            <div className="space-y-3">
              {chartData.map((d, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{d.label}</span>
                    <span className={`text-sm font-bold ${d.profit >= 0 ? 'text-blue-600' : 'text-red-500'}`}>{formatCurrency(d.profit)}</span>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <span className="text-green-600">Income: {formatCurrency(d.income)}</span>
                    <span className="text-red-500">Expenses: {formatCurrency(d.expenses)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BarChartViz({ data }: { data: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
        <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="income" name="Income" fill="#10b981" radius={[3, 3, 0, 0]} />
        <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[3, 3, 0, 0]} />
        <Bar dataKey="profit" name="Profit" fill="#3b82f6" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function SummaryCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
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

type ChartPoint = { label: string; income: number; expenses: number; profit: number };

function groupByWeek(entries: DailyEntry[], incomeMap: Record<string, number>): ChartPoint[] {
  const allDates = [...new Set([...entries.map(e => e.date), ...Object.keys(incomeMap)])];
  const weeks: Record<string, string[]> = {};
  allDates.forEach(date => {
    const weekStart = getWeekStart(date);
    if (!weeks[weekStart]) weeks[weekStart] = [];
    weeks[weekStart].push(date);
  });
  return Object.entries(weeks).sort((a, b) => a[0].localeCompare(b[0])).map(([start, dates]) => {
    const income = dates.reduce((s, d) => s + (incomeMap[d] || 0), 0);
    const expenses = entries.filter(e => dates.includes(e.date)).reduce((s, e) => s + totalExpense(e), 0);
    const startD = new Date(start + 'T00:00:00');
    const endD = new Date(startD); endD.setDate(startD.getDate() + 6);
    const label = `${startD.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${endD.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
    return { label, income, expenses, profit: income - expenses };
  });
}

function groupByMonth(entries: DailyEntry[], incomeMap: Record<string, number>): ChartPoint[] {
  const allDates = [...new Set([...entries.map(e => e.date), ...Object.keys(incomeMap)])];
  const months: Record<string, string[]> = {};
  allDates.forEach(date => {
    const key = date.slice(0, 7);
    if (!months[key]) months[key] = [];
    months[key].push(date);
  });
  return Object.entries(months).sort((a, b) => a[0].localeCompare(b[0])).map(([key, dates]) => {
    const income = dates.reduce((s, d) => s + (incomeMap[d] || 0), 0);
    const expenses = entries.filter(e => dates.includes(e.date)).reduce((s, e) => s + totalExpense(e), 0);
    const label = new Date(key + '-01T00:00:00').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    return { label, income, expenses, profit: income - expenses };
  });
}

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}
