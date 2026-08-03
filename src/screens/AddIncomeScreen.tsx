import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { supabase, formatCurrency, todayISO } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type Props = { onBack: () => void };

type IncomeEntry = {
  id: string;
  amount: number;
  notes: string;
  created_at: string;
};

export default function AddIncomeScreen({ onBack }: Props) {
  const { user } = useAuth();
  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [entries, setEntries] = useState<IncomeEntry[]>([]);

  useEffect(() => { fetchEntries(); }, [date]);

  async function fetchEntries() {
    const { data } = await supabase
      .from('income_entries')
      .select('*')
      .eq('user_id', user!.id)
      .eq('date', date)
      .order('created_at', { ascending: true });
    setEntries(data || []);
  }

  async function handleAdd() {
    const num = parseFloat(amount) || 0;
    if (!num) return;
    setLoading(true);
    await supabase.from('income_entries').insert({ amount: num, notes, user_id: user!.id, date });
    setLoading(false);
    setSaved(true);
    setAmount('');
    setNotes('');
    fetchEntries();
    setTimeout(() => setSaved(false), 1000);
  }

  async function handleDelete(id: string) {
    await supabase.from('income_entries').delete().eq('id', id);
    fetchEntries();
  }

  const total = entries.reduce((s, e) => s + Number(e.amount), 0);

  function formatDisplayDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="bg-white dark:bg-gray-800 shadow-sm px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center active:bg-gray-200">
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Add Income</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {/* Date */}
        <div className="mt-5">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
          <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 gap-3 focus-within:border-green-400 shadow-sm">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="date"
              className="flex-1 py-3.5 text-sm text-gray-800 dark:text-gray-200 outline-none bg-transparent"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1 ml-1">{formatDisplayDate(date)}</p>
        </div>

        {/* Input */}
        <div className="mt-5 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Income Amount</label>
          <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-xl px-4 gap-3 focus-within:border-green-400 shadow-sm mb-3">
            <span className="text-green-600 font-bold text-lg shrink-0">₹</span>
            <input
              type="number" inputMode="decimal"
              className="flex-1 py-3.5 text-2xl font-bold text-green-700 outline-none bg-transparent"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
          <textarea
            className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 resize-none mb-3"
            placeholder="Notes (optional) — Airport trip, long route..."
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            maxLength={200}
          />
          <button
            onClick={handleAdd}
            disabled={loading || !amount}
            className={`w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${saved ? 'bg-green-500' : 'bg-green-600 hover:bg-green-700'} disabled:opacity-50`}
          >
            {saved ? <><CheckCircle className="w-4 h-4" /> Added!</> : loading ? 'Adding...' : <><Plus className="w-4 h-4" /> Add Income</>}
          </button>
        </div>

        {/* Entries list */}
        {entries.length > 0 && (
          <div className="mt-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {entries.length} {entries.length === 1 ? 'Entry' : 'Entries'} on {formatDisplayDate(date)}
            </h2>
            <div className="space-y-2">
              {entries.map((e, i) => (
                <div key={e.id} className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3.5 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-green-600">#{i + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-green-600">{formatCurrency(Number(e.amount))}</p>
                    {e.notes && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{e.notes}</p>}
                  </div>
                  <button onClick={() => handleDelete(e.id)} className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center active:bg-red-100">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-3 bg-green-50 rounded-2xl px-5 py-4 flex items-center justify-between border border-green-100">
              <span className="text-sm font-semibold text-green-700">Total Income</span>
              <span className="text-xl font-bold text-green-600">{formatCurrency(total)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
