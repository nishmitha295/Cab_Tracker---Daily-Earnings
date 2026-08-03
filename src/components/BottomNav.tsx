import { Home, History, BarChart2, Pencil } from 'lucide-react';

export type Tab = 'dashboard' | 'history' | 'reports' | 'edit';

type Props = {
  active: Tab;
  onChange: (tab: Tab) => void;
};

export default function BottomNav({ active, onChange }: Props) {
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { key: 'history', label: 'History', icon: <History className="w-5 h-5" /> },
    { key: 'edit', label: 'Edit', icon: <Pencil className="w-5 h-5" /> },
    { key: 'reports', label: 'Reports', icon: <BarChart2 className="w-5 h-5" /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] safe-bottom z-20">
      <div className="flex">
        {tabs.map(tab => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${isActive ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'}`}
            >
              <div className={`transition-transform ${isActive ? 'scale-110' : ''}`}>
                {tab.icon}
              </div>
              <span className="text-[11px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
