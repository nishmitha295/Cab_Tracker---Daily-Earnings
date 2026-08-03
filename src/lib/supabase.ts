import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export type IncomeEntry = {
  id: string;
  user_id: string;
  date: string;
  amount: number;
  notes: string;
  created_at: string;
};

export type CabUser = {
  id: string;
  name: string;
  phone: string;
  pin: string;
  created_at: string;
};

export type DailyEntry = {
  id: string;
  user_id: string;
  date: string;
  income: number;
  diesel: number;
  food: number;
  parking: number;
  repair: number;
  service: number;
  other: number;
  notes: string;
  created_at: string;
  updated_at: string;
};

export function totalExpense(entry: Pick<DailyEntry, 'diesel' | 'food' | 'parking' | 'repair' | 'service' | 'other'>): number {
  return entry.diesel + entry.food + entry.parking + entry.repair + entry.service + entry.other;
}

export function profit(entry: Pick<DailyEntry, 'income' | 'diesel' | 'food' | 'parking' | 'repair' | 'service' | 'other'>): number {
  return entry.income - totalExpense(entry);
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}
