import React from 'react';

export type BadgeVariant = 'draft' | 'published' | 'archived' | 'default';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
  dot = false,
}) => {
  return (
    <span className={`status-badge ${variant} ${className}`}>
      {dot && <span className="w-2 h-2 rounded-full bg-current" />}
      {children}
    </span>
  );
};
