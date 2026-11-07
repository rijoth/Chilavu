import React from 'react';
import { formatCurrencyParts } from '@/lib/currency';

export interface CurrencyDisplayProps {
  amount: number | undefined | null;
  currency: string;
  className?: string;
  highlightStatus?: 'neutral' | 'paid' | 'pending' | 'overpaid' | 'love' | 'gold' | 'foam' | 'iris';
  hideDecimalsIfWhole?: boolean;
  muteDecimals?: boolean;
  style?: React.CSSProperties;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  currency,
  className = '',
  highlightStatus = 'neutral',
  hideDecimalsIfWhole = false,
  muteDecimals = false,
  style,
}) => {
  const parts = formatCurrencyParts(amount, currency, { hideDecimalsIfWhole });

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
    <span
      style={style}
      className={`font-mono tracking-tight ${colorClass} ${className}`}
    >
      {parts.main}
      {parts.decimal && (
        <span
          className={
            muteDecimals
              ? 'text-[0.78em] opacity-75 font-normal tracking-normal'
              : undefined
          }
        >
          {parts.decimal}
        </span>
      )}
      {parts.suffix}
    </span>
  );
};
