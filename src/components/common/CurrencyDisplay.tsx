import React from 'react';
import { formatCurrency } from '@/lib/currency';

interface CurrencyDisplayProps {
  amount: number | undefined | null;
  currency: string;
  className?: string;
  highlightStatus?: 'neutral' | 'paid' | 'pending' | 'overpaid' | 'love' | 'gold' | 'foam' | 'iris';
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  currency,
  className = '',
  highlightStatus = 'neutral',
}) => {
  const formatted = formatCurrency(amount, currency);

  let colorClass = 'text-text';
  if (highlightStatus === 'paid' || highlightStatus === 'foam') {
    colorClass = 'text-foam font-semibold';
  } else if (highlightStatus === 'pending' || highlightStatus === 'love') {
    colorClass = 'text-love font-semibold';
  } else if (highlightStatus === 'overpaid' || highlightStatus === 'iris') {
    colorClass = 'text-iris font-semibold';
  } else if (highlightStatus === 'gold') {
    colorClass = 'text-gold font-semibold';
  }

  return (
    <span className={`font-mono tracking-tight ${colorClass} ${className}`}>
      {formatted}
    </span>
  );
};
