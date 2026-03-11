import React from 'react';

interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const statuses = [
  { value: 'all', label: 'All Sessions' },
  { value: 'active', label: 'Active' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'completed', label: 'Completed' },
  { value: 'resolved', label: 'Resolved' },
];

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <div className="flex gap-3">
      {statuses.map(status => (
        <button
          key={status.value}
          onClick={() => onChange(status.value)}
          className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
            value === status.value
              ? 'bg-white/[0.08] text-white border border-white/20'
              : 'bg-white/[0.02] text-white/60 border border-white/[0.06] hover:bg-white/[0.05] hover:text-white hover:border-white/10'
          }`}
        >
          {status.label}
        </button>
      ))}
    </div>
  );
}
