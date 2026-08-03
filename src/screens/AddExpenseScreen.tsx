import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, CheckCircle, Fuel, Utensils, ParkingCircle, Wrench, Car, CircleDollarSign } from 'lucide-react';
import { supabase, DailyEntry, totalExpense, formatCurrency, todayISO } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { LucideIcon } from 'lucide-react';

type Props = { onBack: () => void };

type ExpenseField = {
  key: keyof Pick<DailyEntry, 'diesel' | 'food' | 'parking' | 'repair' | 'service' | 'other'>;
  label: string;
  icon: LucideIcon;
  color: string;
};

const EXPENSE_FIELDS: ExpenseField[] = [
  { key: 'diesel', label: 'Diesel', icon: Fuel, color: 'text-orange-500' },
  { key: 'food', label: 'Food', icon: Utensils, color: 'text-yellow-500' },
  { key: 'parking', label: 'Parking', icon: ParkingCircle, color: 'text-blue-500' },
  { key: 'repair', label: 'Repair', icon: Wrench, color: 'text-red-500' },
  { key: 'service', label: 'Car Service', icon: Car, color: 'text-purple-500' },
  { key: 'other', label: 'Other', icon: CircleDollarSign, color: 'text-gray-500' },
];

type ExpenseState = Record<ExpenseField['key'], string>;

export default function AddExpenseScreen({ onBack }: Props) {
  const { user } = useAuth();
  const [date, setDate] = useState(todayISO());
  const [expenses, setExpenses] = useState<ExpenseState>({
    diesel: '', food: '', parking: '', repair: '', service: '', other: '',
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [existing, setExisting] = useState<DailyEntry | null>(null);

  useEffect(() => {
    fetchExisting();
  }, [date]);

  async function fetchExisting() {
    const { data } = await supabase.from('daily_entries').select('*').eq('user_id', user!.id).eq('date', date).maybeSingle();
    if (data) {
      setExisting(data);
      setExpenses({
        diesel: data.diesel > 0 ? String(data.diesel) : '',
        food: data.food > 0 ? String(data.food) : '',
        parking: data.parking > 0 ? String(data.parking) : '',
        repair: data.repair > 0 ? String(data.repair) : '',
        service: data.service > 0 ? String(data.service) : '',
        other: data.other > 0 ? String(data.other) : '',
      });
    } else {
      setExisting(null);
      setExpenses({ diesel: '', food: '', parking: '', repair: '', service: '', other: '' });
    }
  }

  function numVal(k: ExpenseField['key']) { return parseFloat(expenses[k]) || 0; }

  const total = EXPENSE_FIELDS.reduce((s, f) => s + numVal(f.key), 0);

  async function handleSave() {
    setLoading(true);
    const vals = {
      diesel: numVal('diesel'), food: numVal('food'), parking: numVal('parking'),
      repair: numVal('repair'), service: numVal('service'), other: numVal('other'),
    };

    let err;
    if (existing) {
      const res = await supabase.from('daily_entries').update(vals).eq('id', existing.id);
      err = res.error;
    } else {
      const res = await supabase.from('daily_entries').insert({ ...vals, income: 0, notes: '', user_id: user!.id, date });
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
        <div>
          <h1 className="text-lg font-bold text-gray-900">Add Expenses</h1>
          <p className="text-xs text-gray-400">Enter all expenses at once</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {/* Date */}
        <div className="mt-5">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
          <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 gap-3 focus-within:border-red-400 transition-colors shadow-sm">
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

        {/* Expense Fields */}
        <div className="mt-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Expenses</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {EXPENSE_FIELDS.map((field, idx) => {
              const Icon = field.icon;
              return (
                <div key={field.key} className={`flex items-center px-4 py-3.5 gap-4 ${idx < EXPENSE_FIELDS.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div className={`w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${field.color}`} />
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-700">{field.label}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400 text-sm">₹</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      className="w-24 text-right text-sm font-bold text-gray-800 outline-none bg-transparent border-b-2 border-gray-100 focus:border-red-400 transition-colors py-1"
                      placeholder="0"
                      value={expenses[field.key]}
                      onChange={e => setExpenses(prev => ({ ...prev, [field.key]: e.target.value }))}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total */}
        <div className="mt-4 bg-red-50 rounded-2xl px-5 py-4 flex items-center justify-between border border-red-100">
          <span className="text-sm font-semibold text-red-700">Total Expense</span>
          <span className="text-xl font-bold text-red-600">{formatCurrency(total)}</span>
        </div>

        {existing && (
          <p className="text-center text-xs text-gray-400 mt-2">Updating existing entry for this date</p>
        )}
      </div>

      {/* Save Button */}
      <div className="px-5 pb-10 pt-4 bg-gray-50">
        <button
          onClick={handleSave}
          disabled={loading || saved}
          className={`w-full py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 ${saved ? 'bg-red-400' : 'bg-red-500 hover:bg-red-600'} disabled:opacity-70`}
        >
          {saved ? (
            <><CheckCircle className="w-5 h-5" /> Saved!</>
          ) : loading ? 'Saving...' : 'Save Expenses'}
        </button>
      </div>
    </div>
  );
}
