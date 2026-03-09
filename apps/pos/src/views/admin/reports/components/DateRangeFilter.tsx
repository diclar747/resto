import { Calendar, ChevronDown } from 'lucide-react';
import { useState } from 'react';

type Preset = 'today' | 'week' | 'month' | 'custom';

interface DateRangeFilterProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

function getPresetDates(preset: Preset): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split('T')[0];

  switch (preset) {
    case 'today':
      return { from: to, to };
    case 'week': {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay() + 1);
      return { from: start.toISOString().split('T')[0], to };
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: start.toISOString().split('T')[0], to };
    }
    default:
      return { from: to, to };
  }
}

export function DateRangeFilter({ from, to, onChange }: DateRangeFilterProps) {
  const [activePreset, setActivePreset] = useState<Preset>('today');
  const [showCustom, setShowCustom] = useState(false);

  const presets: { id: Preset; label: string }[] = [
    { id: 'today', label: 'Hoy' },
    { id: 'week', label: 'Esta Semana' },
    { id: 'month', label: 'Este Mes' },
    { id: 'custom', label: 'Personalizado' },
  ];

  const handlePreset = (preset: Preset) => {
    setActivePreset(preset);
    if (preset === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      const dates = getPresetDates(preset);
      onChange(dates.from, dates.to);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex p-1 bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-2xl border border-white dark:border-white/10">
        {presets.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => handlePreset(id)}
            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${
              activePreset === id
                ? 'bg-primary text-white shadow-lg'
                : 'text-text-secondary hover:text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {showCustom && (
        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={14} />
            <input
              type="date"
              value={from}
              onChange={(e) => onChange(e.target.value, to)}
              className="pl-9 pr-3 py-2 bg-white dark:bg-surface border border-gray-100 dark:border-white/10 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
          <span className="text-text-secondary text-xs font-bold">—</span>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={14} />
            <input
              type="date"
              value={to}
              onChange={(e) => onChange(from, e.target.value)}
              className="pl-9 pr-3 py-2 bg-white dark:bg-surface border border-gray-100 dark:border-white/10 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
        </div>
      )}
    </div>
  );
}
