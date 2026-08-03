import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { supabase, DailyEntry, totalExpense, formatCurrency, formatDate } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type Props = { onBack: () => void };
type DayData = { date: string; income: number; expenses: number; entry: DailyEntry | null };

export default function HistoryScreen({ onBack }: Props) {
  const { user } = useAuth();
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DayData | null>(null);

  useEffect(() => { fetchEntries(); }, []);

  async function fetchEntries() {
    setLoading(true);
    const [expRes, incRes] = await Promise.all([
      supabase.from('daily_entries').select('*').eq('user_id', user!.id).order('date', { ascending: false }),
      supabase.from('income_entries').select('date,amount').eq('user_id', user!.id),
    ]);

    const expenses = expRes.data || [];
    const incomes = incRes.data || [];

    // collect all unique dates
    const allDates = [...new Set([
      ...expenses.map(e => e.date),
      ...incomes.map(e => e.date),
    ])].sort((a, b) => b.localeCompare(a));

    const result: DayData[] = allDates.map(date => {
      const entry = expenses.find(e => e.date === date) || null;
      const income = incomes.filter(e => e.date === date).reduce((s, e) => s + Number(e.amount), 0);
      const exp = entry ? totalExpense(entry) : 0;
      return { date, income, expenses: exp, entry };
    });

    setDays(result);
    setLoading(false);
  }

  if (selected) return <EntryDetail day={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="bg-white dark:bg-gray-800 shadow-sm px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center active:bg-gray-200">
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">History</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {loading ? (
          <div className="mt-5 space-y-3">
            {[0,1,2,3].map(i => <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />)}
          </div>
        ) : days.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Calendar className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400 text-sm">No entries yet</p>
            <p className="text-gray-300 text-xs mt-1">Add income and expenses to see history</p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {days.map(day => {
              const pft = day.income - day.expenses;
              return (
                <button
                  key={day.date}
                  onClick={() => setSelected(day)}
                  className="w-full bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3 active:bg-gray-50 text-left"
                >
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-blue-700">{new Date(day.date + 'T00:00:00').getDate()}</span>
                    <span className="text-[9px] text-blue-500 uppercase">{new Date(day.date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' })}</span>
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-xs text-gray-400">Income</span>
                      <span className="text-sm font-semibold text-green-600">{formatCurrency(day.income)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-xs text-gray-400">Expense</span>
                      <span className="text-sm font-semibold text-red-500">{formatCurrency(day.expenses)}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-xs text-gray-400">Profit</span>
                    <span className={`text-sm font-bold ${pft >= 0 ? 'text-blue-600' : 'text-red-500'}`}>{formatCurrency(pft)}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function EntryDetail({ day, onBack }: { day: DayData; onBack: () => void }) {
  const [incomeList, setIncomeList] = useState<{ id: string; amount: number; notes: string }[]>([]);
  const { user } = useAuth();
  const pft = day.income - day.expenses;

  useEffect(() => {
    supabase.from('income_entries').select('id,amount,notes').eq('user_id', user!.id).eq('date', day.date)
      .order('created_at', { ascending: true })
      .then(({ data }) => setIncomeList(data || []));
  }, [day.date]);

  const expItems = day.entry ? [
    { label: 'Diesel', val: day.entry.diesel, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Food', val: day.entry.food, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Parking', val: day.entry.parking, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Repair', val: day.entry.repair, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Car Service', val: day.entry.service, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Other', val: day.entry.other, color: 'text-gray-500', bg: 'bg-gray-50' },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="bg-white dark:bg-gray-800 shadow-sm px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center active:bg-gray-200">
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">{formatDate(day.date)}</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-gray-700">
            <TrendingUp className="w-5 h-5 text-green-500 mb-1" />
            <p className="text-[10px] text-gray-400 uppercase">Income</p>
            <p className="text-sm font-bold text-green-600">{formatCurrency(day.income)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-gray-700">
            <TrendingDown className="w-5 h-5 text-red-400 mb-1" />
            <p className="text-[10px] text-gray-400 uppercase">Expense</p>
            <p className="text-sm font-bold text-red-500">{formatCurrency(day.expenses)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-gray-700">
            <DollarSign className={`w-5 h-5 mb-1 ${pft >= 0 ? 'text-blue-500' : 'text-red-500'}`} />
            <p className="text-[10px] text-gray-400 uppercase">Profit</p>
            <p className={`text-sm font-bold ${pft >= 0 ? 'text-blue-600' : 'text-red-500'}`}>{formatCurrency(pft)}</p>
          </div>
        </div>

        {incomeList.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-6 mb-3">Income Breakdown</h2>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              {incomeList.map((inc, idx) => (
                <div key={inc.id} className={`flex items-center px-4 py-3.5 ${idx < incomeList.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-xs font-bold text-green-600">#{idx + 1}</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-green-600">{formatCurrency(Number(inc.amount))}</span>
                    {inc.notes && <p className="text-xs text-gray-400 mt-0.5">{inc.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {expItems.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-6 mb-3">Expense Breakdown</h2>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              {expItems.map((item, idx) => (
                <div key={item.label} className={`flex items-center px-4 py-3.5 ${idx < expItems.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center mr-3`}>
                    <span className={`text-sm font-bold ${item.color}`}>₹</span>
                  </div>
                  <span className="flex-1 text-sm text-gray-700">{item.label}</span>
                  <span className="text-sm font-semibold text-gray-800">{formatCurrency(Number(item.val))}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
