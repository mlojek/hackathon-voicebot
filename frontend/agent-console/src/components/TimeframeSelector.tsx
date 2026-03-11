import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export type Timeframe = 'all' | 'year' | 'month' | 'week' | 'day';

interface TimeframeSelectorProps {
  onChange: (timeframe: Timeframe) => void;
  defaultValue?: Timeframe;
}

export function TimeframeSelector({ onChange, defaultValue = 'all' }: TimeframeSelectorProps) {
  const { translate } = useLanguage();
  const [timeframe, setTimeframe] = useState<Timeframe>(defaultValue);

  // Set initial value on mount
  useEffect(() => {
    onChange(defaultValue);
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as Timeframe;
    setTimeframe(value);
    onChange(value);
    console.log('Timeframe changed:', value); // Debug log
  };

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="timeframe-selector" className="text-[11px] font-medium text-white/40 uppercase tracking-widest">
        {translate('timeframe.label')}
      </label>
      <select
        id="timeframe-selector"
        className="py-2.5 px-4 cursor-pointer appearance-none bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 focus:bg-white/[0.06] text-white rounded-xl transition-all duration-200"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='white' stroke-opacity='0.5' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 1rem center',
          paddingRight: '3rem'
        }}
        value={timeframe}
        onChange={handleChange}
      >
        <option value="all">{translate('timeframe.allTime')}</option>
        <option value="year">{translate('timeframe.thisYear')}</option>
        <option value="month">{translate('timeframe.thisMonth')}</option>
        <option value="week">{translate('timeframe.thisWeek')}</option>
        <option value="day">{translate('timeframe.thisDay')}</option>
      </select>
    </div>
  );
}