import { useState, useEffect } from 'react';
import { ChevronRight, TrendingUp, TrendingDown, Calendar, ArrowLeft, CheckCircle, Fuel, Utensils, ParkingCircle, Wrench, Car, CircleDollarSign, Trash2 } from 'lucide-react';
import { supabase, DailyEntry, totalExpense, formatCurrency, formatDate } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { LucideIcon } from 'lucide-react';

type Mode = 'list' | 'edit-income' | 'edit-expense';
type DayData = { date: string; income: number; expenses: number; entry: DailyEntry | null };

const EXPENSE_FIELDS: { key: keyof Pick<DailyEntry, 'diesel' | 'food' | 'parking' | 'repair' | 'service' | 'other'>; label: string; icon: LucideIcon; color: string }[] = [
  { key: 'diesel', label: 'Diesel', icon: Fuel, color: 'text-orange-500' },
  { key: 'food', label: 'Food', icon: Utensils, color: 'text-yellow-500' },
  { key: 'parking', label: 'Parking', icon: ParkingCircle, color: 'text-blue-500' },
  { key: 'repair', label: 'Repair', icon: Wrench, color: 'text-red-500' },
  { key: 'service', label: 'Car Service', icon: Car, color: 'text-purple-500' },
  { key: 'other', label: 'Other', icon: CircleDollarSign, color: 'text-gray-500' },
];

export default function EditScreen() {
  const { user } = useAuth();
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DayData | null>(null);
  const [mode, setMode] = useState<Mode>('list');

  useEffect(() => { fetchEntries(); }, []);

  async function fetchEntries() {
    setLoading(true);
    const [expRes, incRes] = await Promise.all([
      supabase.from('daily_entries').select('*').eq('user_id', user!.id).order('date', { ascending: false }),
      supabase.from('income_entries').select('date,amount').eq('user_id', user!.id),
    ]);
    const expenses = expRes.data || [];
    const incomes = incRes.data || [];
    const allDates = [...new Set([...expenses.map(e => e.date), ...incomes.map(e => e.date)])].sort((a, b) => b.localeCompare(a));
    setDays(allDates.map(date => {
      const entry = expenses.find(e => e.date === date) || null;
      const income = incomes.filter(e => e.date === date).reduce((s, e) => s + Number(e.amount), 0);
      return { date, income, expenses: entry ? totalExpense(entry) : 0, entry };
    }));
    setLoading(false);
  }

  function openEdit(day: DayData, m: 'edit-income' | 'edit-expense') { setSelected(day); setMode(m); }
  function handleBack() { setSelected(null); setMode('list'); fetchEntries(); }

  if (mode === 'edit-income' && selected) return <EditIncome day={selected} onBack={handleBack} />;
  if (mode === 'edit-expense' && selected) return <EditExpense day={selected} onBack={handleBack} />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="bg-white dark:bg-gray-800 shadow-sm px-5 pt-12 pb-4">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Edit Entries</h1>
        <p className="text-xs text-gray-400 mt-0.5">Select an entry to edit</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {loading ? (
          <div className="mt-5 space-y-3">
            {[0,1,2].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />)}
          </div>
        ) : days.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm">No entries to edit</p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {days.map(day => (
              <div key={day.date} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{formatDate(day.date)}</span>
                  <span className={`text-xs font-bold ${day.income - day.expenses >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                    Profit: {formatCurrency(day.income - day.expenses)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(day, 'edit-income')} className="flex-1 flex items-center justify-between bg-green-50 rounded-xl px-3 py-2.5 active:bg-green-100">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <div className="text-left">
                        <p className="text-[10px] text-gray-400">Income</p>
                        <p className="text-sm font-bold text-green-600">{formatCurrency(day.income)}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-green-400" />
                  </button>
                  <button onClick={() => openEdit(day, 'edit-expense')} className="flex-1 flex items-center justify-between bg-red-50 rounded-xl px-3 py-2.5 active:bg-red-100">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-400" />
                      <div className="text-left">
                        <p className="text-[10px] text-gray-400">Expense</p>
                        <p className="text-sm font-bold text-red-500">{formatCurrency(day.expenses)}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-red-300" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EditIncome({ day, onBack }: { day: DayData; onBack: () => void }) {
  const { user } = useAuth();
  const [incomeList, setIncomeList] = useState<{ id: string; amount: number; notes: string }[]>([]);

  useEffect(() => { fetchIncome(); }, []);

  async function fetchIncome() {
    const { data } = await supabase.from('income_entries').select('id,amount,notes')
      .eq('user_id', user!.id).eq('date', day.date).order('created_at', { ascending: true });
    setIncomeList(data || []);
  }

  async function handleDelete(id: string) {
    await supabase.from('income_entries').delete().eq('id', id);
    fetchIncome();
  }

  async function handleUpdate(id: string, amount: string, notes: string) {
    await supabase.from('income_entries').update({ amount: parseFloat(amount) || 0, notes }).eq('id', id);
    fetchIncome();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="bg-white dark:bg-gray-800 shadow-sm px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center active:bg-gray-200">
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Edit Income</h1>
          <p className="text-xs text-gray-400">{formatDate(day.date)}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-6 mt-5 space-y-3">
        {incomeList.map((inc, i) => (
          <IncomeEditRow key={inc.id} index={i} inc={inc} onDelete={handleDelete} onUpdate={handleUpdate} />
        ))}
        {incomeList.length === 0 && <p className="text-center text-gray-400 text-sm mt-10">No income entries for this date</p>}
      </div>
    </div>
  );
}

function IncomeEditRow({ index, inc, onDelete, onUpdate }: {
  index: number;
  inc: { id: string; amount: number; notes: string };
  onDelete: (id: string) => void;
  onUpdate: (id: string, amount: string, notes: string) => void;
}) {
  const [amount, setAmount] = useState(String(inc.amount));
  const [notes, setNotes] = useState(inc.notes);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    await onUpdate(inc.id, amount, notes);
    setSaved(true);
    setTimeout(() => setSaved(false), 1000);
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-green-600">#{index + 1}</span>
        <button onClick={() => onDelete(inc.id)} className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
        </button>
      </div>
      <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-xl px-3 gap-2 mb-2 focus-within:border-green-400">
        <span className="text-green-600 font-bold">₹</span>
        <input type="number" inputMode="decimal" className="flex-1 py-2.5 text-lg font-bold text-green-700 outline-none bg-transparent dark:bg-transparent"
          value={amount} onChange={e => setAmount(e.target.value)} />
      </div>
      <input type="text" className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-400 mb-2"
        placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
      <button onClick={handleSave} className={`w-full py-2.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-1 ${saved ? 'bg-green-500' : 'bg-green-600'}`}>
        {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : 'Update'}
      </button>
    </div>
  );
}

function EditExpense({ day, onBack }: { day: DayData; onBack: () => void }) {
  const entry = day.entry;
  if (!entry) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <p className="text-gray-400 text-sm">No expense entry for this date</p>
      <button onClick={onBack} className="mt-4 text-sm text-blue-500">Go back</button>
    </div>
  );

  const [expenses, setExpenses] = useState({
    diesel: String(entry.diesel), food: String(entry.food), parking: String(entry.parking),
    repair: String(entry.repair), service: String(entry.service), other: String(entry.other),
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const total = EXPENSE_FIELDS.reduce((s, f) => s + (parseFloat(expenses[f.key]) || 0), 0);

  async function handleSave() {
    setLoading(true);
    const vals = Object.fromEntries(EXPENSE_FIELDS.map(f => [f.key, parseFloat(expenses[f.key]) || 0]));
    await supabase.from('daily_entries').update(vals).eq('id', entry!.id);
    setLoading(false);
    setSaved(true);
    setTimeout(onBack, 1200);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="bg-white dark:bg-gray-800 shadow-sm px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center active:bg-gray-200">
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Edit Expenses</h1>
          <p className="text-xs text-gray-400">{formatDate(day.date)}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <div className="mt-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {EXPENSE_FIELDS.map((field, idx) => {
            const Icon = field.icon;
            return (
              <div key={field.key} className={`flex items-center px-4 py-3.5 gap-4 ${idx < EXPENSE_FIELDS.length - 1 ? 'border-b border-gray-50 dark:border-gray-700' : ''}`}>
                <div className="w-9 h-9 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className={`w-5 h-5 ${field.color}`} />
                </div>
                <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200">{field.label}</span>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 text-sm">₹</span>
                  <input
                    type="number" inputMode="decimal"
                    className="w-24 text-right text-sm font-bold text-gray-800 dark:text-gray-200 outline-none bg-transparent border-b-2 border-gray-100 dark:border-gray-600 focus:border-red-400 transition-colors py-1"
                    value={expenses[field.key]}
                    onChange={e => setExpenses(prev => ({ ...prev, [field.key]: e.target.value }))}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 bg-red-50 rounded-2xl px-5 py-4 flex items-center justify-between border border-red-100">
          <span className="text-sm font-semibold text-red-700">Total Expense</span>
          <span className="text-xl font-bold text-red-600">{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="px-5 pb-10 pt-4 bg-gray-50 dark:bg-gray-900">
        <button
          onClick={handleSave} disabled={loading || saved}
          className={`w-full py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 ${saved ? 'bg-red-400' : 'bg-red-500 hover:bg-red-600'} disabled:opacity-70`}
        >
          {saved ? <><CheckCircle className="w-5 h-5" /> Saved!</> : loading ? 'Saving...' : 'Update Expenses'}
        </button>
      </div>
    </div>
  );
}
