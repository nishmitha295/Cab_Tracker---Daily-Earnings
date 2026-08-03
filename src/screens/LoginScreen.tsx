import { useState } from 'react';
import { Car, Lock, Phone, User, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type Mode = 'login' | 'register';

export default function LoginScreen() {
  const { login } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (pin.length !== 4) { setError('Enter your 4-digit PIN'); return; }
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('cab_users')
      .select('*')
      .eq('pin', pin)
      .maybeSingle();
    setLoading(false);
    if (err) { setError('Something went wrong. Try again.'); return; }
    if (!data) { setError('Wrong PIN. Try again.'); return; }
    login(data);
  }

  async function handleRegister() {
    if (!name.trim()) { setError('Enter your name'); return; }
    if (pin.length !== 4) { setError('PIN must be exactly 4 digits'); return; }
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('cab_users')
      .insert({ name: name.trim(), phone: phone.trim(), pin })
      .select()
      .single();
    setLoading(false);
    if (err) { setError('Could not create account. Try again.'); return; }
    login(data);
  }

  function handlePinKey(val: string) {
    if (val === 'del') { setPin(p => p.slice(0, -1)); return; }
    if (pin.length < 4) setPin(p => p + val);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-800 flex flex-col items-center justify-center px-6 py-10">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4">
          <Car className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-white text-2xl font-bold tracking-tight">Cab Tracker</h1>
        <p className="text-green-100 text-sm mt-1">Your daily earnings, simplified</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          {(['login', 'register'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setPin(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === m ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}
            >
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {mode === 'register' && (
          <>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Your Name</label>
              <div className="flex items-center border border-gray-200 rounded-xl px-3 gap-2 focus-within:border-green-400 transition-colors">
                <User className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  className="flex-1 py-3 text-sm outline-none bg-transparent"
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Phone (optional)</label>
              <div className="flex items-center border border-gray-200 rounded-xl px-3 gap-2 focus-within:border-green-400 transition-colors">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  className="flex-1 py-3 text-sm outline-none bg-transparent"
                  placeholder="9876543210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  type="tel"
                  inputMode="numeric"
                />
              </div>
            </div>
          </>
        )}

        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">4-Digit PIN</label>
          <div className="flex items-center border border-gray-200 rounded-xl px-3 gap-2 focus-within:border-green-400 transition-colors">
            <Lock className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              className="flex-1 py-3 text-sm outline-none bg-transparent tracking-widest font-bold"
              placeholder="● ● ● ●"
              value={showPin ? pin : pin.replace(/./g, '●')}
              readOnly
              style={{ letterSpacing: '0.4em' }}
            />
            <button type="button" onClick={() => setShowPin(s => !s)} className="text-gray-400">
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* PIN Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {['1','2','3','4','5','6','7','8','9','','0','del'].map((k, i) => (
            <button
              key={i}
              onClick={() => k !== '' && handlePinKey(k)}
              className={`h-12 rounded-xl text-lg font-semibold transition-all active:scale-95 ${
                k === '' ? 'invisible' :
                k === 'del' ? 'bg-red-50 text-red-500 hover:bg-red-100' :
                'bg-gray-100 text-gray-800 hover:bg-green-50 hover:text-green-700'
              }`}
            >
              {k === 'del' ? '⌫' : k}
            </button>
          ))}
        </div>

        {/* PIN dots */}
        <div className="flex justify-center gap-3 mb-6">
          {[0,1,2,3].map(i => (
            <div key={i} className={`w-3 h-3 rounded-full transition-all ${i < pin.length ? 'bg-green-500 scale-110' : 'bg-gray-200'}`} />
          ))}
        </div>

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        <button
          onClick={mode === 'login' ? handleLogin : handleRegister}
          disabled={loading}
          className="w-full py-3.5 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold rounded-xl transition-all disabled:opacity-60 text-sm uppercase tracking-wider"
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Enter App' : 'Create Account'}
        </button>
      </div>
    </div>
  );
}
