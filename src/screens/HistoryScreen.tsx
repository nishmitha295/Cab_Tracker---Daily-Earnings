import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { supabase, DailyEntry, totalExpense, profit, formatCurrency, formatDate } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type Props = { onBack: () => void };

export default function HistoryScreen({ onBack }: Props) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DailyEntry | null>(null);

  useEffect(() => {
    fetchEntries();
  }, []);

  async function fetchEntries() {
    setLoading(true);
    const { data } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', user!.id)
      .order('date', { ascending: false });
    setEntries(data || []);
    setLoading(false);
  }

  if (selected) {
    return <EntryDetail entry={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center active:bg-gray-200">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">History</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {loading ? (
          <div className="mt-5 space-y-3">
            {[0,1,2,3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />)}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Calendar className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400 text-sm">No entries yet</p>
            <p className="text-gray-300 text-xs mt-1">Add income and expenses to see history</p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {entries.map(entry => {
              const exp = totalExpense(entry);
              const pft = profit(entry);
              return (
                <button
                  key={entry.id}
                  onClick={() => setSelected(entry)}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 active:bg-gray-50 transition-colors text-left"
                >
                  {/* Date badge */}
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-blue-700">{new Date(entry.date + 'T00:00:00').getDate()}</span>
                    <span className="text-[9px] text-blue-500 uppercase">{new Date(entry.date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' })}</span>
                  </div>

                  {/* Stats */}
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-xs text-gray-400">Income</span>
                      <span className="text-sm font-semibold text-green-600">{formatCurrency(Number(entry.income))}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-xs text-gray-400">Expense</span>
                      <span className="text-sm font-semibold text-red-500">{formatCurrency(exp)}</span>
                    </div>
                  </div>

                  {/* Profit */}
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

function EntryDetail({ entry, onBack }: { entry: DailyEntry; onBack: () => void }) {
  const exp = totalExpense(entry);
  const pft = profit(entry);

  const items = [
    { label: 'Diesel', val: entry.diesel, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Food', val: entry.food, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Parking', val: entry.parking, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Repair', val: entry.repair, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Car Service', val: entry.service, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Other', val: entry.other, color: 'text-gray-500', bg: 'bg-gray-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white shadow-sm px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center active:bg-gray-200">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">{formatDate(entry.date)}</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {/* Summary cards */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
            <TrendingUp className="w-5 h-5 text-green-500 mb-1" />
            <p className="text-[10px] text-gray-400 uppercase">Income</p>
            <p className="text-sm font-bold text-green-600">{formatCurrency(Number(entry.income))}</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
            <TrendingDown className="w-5 h-5 text-red-400 mb-1" />
            <p className="text-[10px] text-gray-400 uppercase">Expense</p>
            <p className="text-sm font-bold text-red-500">{formatCurrency(exp)}</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
            <DollarSign className={`w-5 h-5 mb-1 ${pft >= 0 ? 'text-blue-500' : 'text-red-500'}`} />
            <p className="text-[10px] text-gray-400 uppercase">Profit</p>
            <p className={`text-sm font-bold ${pft >= 0 ? 'text-blue-600' : 'text-red-500'}`}>{formatCurrency(pft)}</p>
          </div>
        </div>

        {/* Expense breakdown */}
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mt-6 mb-3">Expense Breakdown</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {items.map((item, idx) => (
            <div key={item.label} className={`flex items-center px-4 py-3.5 ${idx < items.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <div className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center mr-3`}>
                <span className={`text-sm font-bold ${item.color}`}>₹</span>
              </div>
              <span className="flex-1 text-sm text-gray-700">{item.label}</span>
              <span className="text-sm font-semibold text-gray-800">{formatCurrency(Number(item.val))}</span>
            </div>
          ))}
        </div>

        {/* Notes */}
        {entry.notes && (
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Notes</h2>
            <p className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-sm text-gray-600 italic">"{entry.notes}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
