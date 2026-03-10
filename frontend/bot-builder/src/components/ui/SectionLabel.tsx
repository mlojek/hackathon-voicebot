import React from 'react';

export interface SectionLabelProps {
  number: string | number;
  label: string;
  className?: string;
}

export const SectionLabel: React.FC<SectionLabelProps> = ({ number, label, className = '' }) => {
  const formattedNumber = typeof number === 'number' ? String(number).padStart(2, '0') : number;

  return (
    <div className={`section-label ${className}`}>
      {formattedNumber} / {label}
    </div>
  );
};
