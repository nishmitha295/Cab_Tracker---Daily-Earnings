import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, CheckCircle } from 'lucide-react';
import { supabase, DailyEntry, formatCurrency, todayISO } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type Props = { onBack: () => void };

export default function AddIncomeScreen({ onBack }: Props) {
  const { user } = useAuth();
  const [date, setDate] = useState(todayISO());
  const [income, setIncome] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [existing, setExisting] = useState<DailyEntry | null>(null);

  useEffect(() => {
    fetchExisting();
  }, [date]);

  async function fetchExisting() {
    const { data } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', user!.id)
      .eq('date', date)
      .maybeSingle();
    if (data) {
      setExisting(data);
      setIncome(String(data.income));
      setNotes(data.notes || '');
    } else {
      setExisting(null);
      setIncome('');
      setNotes('');
    }
  }

  async function handleSave() {
    const incomeNum = parseFloat(income) || 0;
    setLoading(true);
    const base = { income: incomeNum, notes, user_id: user!.id, date };

    let err;
    if (existing) {
      const res = await supabase.from('daily_entries').update({ income: incomeNum, notes }).eq('id', existing.id);
      err = res.error;
    } else {
      const res = await supabase.from('daily_entries').insert({ ...base, diesel: 0, food: 0, parking: 0, repair: 0, service: 0, other: 0 });
      err = res.error;
    }
    setLoading(false);
    if (!err) { setSaved(true); setTimeout(() => { setSaved(false); onBack(); }, 1200); }
  }

  function formatDisplayDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center active:bg-gray-200">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Add Income</h1>
      </div>

      {/* Illustration area */}
      <div className="bg-white mx-5 mt-5 rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-2">
          <span className="text-4xl">💰</span>
        </div>
        <p className="text-gray-400 text-xs">Enter today's total earnings</p>
        {existing && (
          <p className="text-green-600 text-xs font-semibold mt-1">Updating existing entry</p>
        )}
      </div>

      <div className="px-5 mt-5 flex flex-col gap-4 flex-1">
        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
          <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 gap-3 focus-within:border-green-400 transition-colors shadow-sm">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="date"
              className="flex-1 py-3.5 text-sm text-gray-800 outline-none bg-transparent"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1 ml-1">{formatDisplayDate(date)}</p>
        </div>

        {/* Income Amount */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Today's Income</label>
          <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 gap-3 focus-within:border-green-400 transition-colors shadow-sm">
            <span className="text-green-600 font-bold text-lg shrink-0">₹</span>
            <input
              type="number"
              inputMode="decimal"
              className="flex-1 py-3.5 text-2xl font-bold text-green-700 outline-none bg-transparent"
              placeholder="0"
              value={income}
              onChange={e => setIncome(e.target.value)}
            />
          </div>
          {income && <p className="text-xs text-green-600 mt-1 ml-1 font-medium">{formatCurrency(parseFloat(income) || 0)}</p>}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes <span className="normal-case text-gray-400 font-normal">(optional)</span></label>
          <textarea
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-800 outline-none focus:border-green-400 transition-colors shadow-sm resize-none"
            placeholder="Airport trips today, long route..."
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            maxLength={200}
          />
          <p className="text-xs text-gray-400 text-right mt-1">{notes.length}/200</p>
        </div>
      </div>

      {/* Save Button */}
      <div className="px-5 pb-10 pt-4">
        <button
          onClick={handleSave}
          disabled={loading || saved}
          className={`w-full py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 ${saved ? 'bg-green-500' : 'bg-green-600 hover:bg-green-700'} disabled:opacity-70`}
        >
          {saved ? (
            <><CheckCircle className="w-5 h-5" /> Saved!</>
          ) : loading ? 'Saving...' : 'Save Income'}
        </button>
      </div>
    </div>
  );
}
