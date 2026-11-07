import React from 'react';
import { AlertCircle, Clock, CheckCircle2, Wallet } from 'lucide-react';
import type { PaymentStatus } from '@/types/expense';

interface ExpenseStatusBadgeProps {
  status: PaymentStatus;
  size?: 'sm' | 'md';
}

export const ExpenseStatusBadge: React.FC<ExpenseStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const isSm = size === 'sm';
  const iconClass = isSm ? 'w-3 h-3' : 'w-3.5 h-3.5';
  const textClass = isSm ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  switch (status) {
    case 'unpaid':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full bg-love/15 text-love border border-love/25 ${textClass}`}
        >
          <AlertCircle className={iconClass} />
          Unpaid
        </span>
      );

    case 'partial':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full bg-gold/15 text-gold border border-gold/25 ${textClass}`}
        >
          <Clock className={iconClass} />
          Partial
        </span>
      );

    case 'paid':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full bg-foam/15 text-foam border border-foam/25 ${textClass}`}
        >
          <CheckCircle2 className={iconClass} />
          Paid
        </span>
      );

    case 'overpaid':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full bg-iris/15 text-iris border border-iris/25 ${textClass}`}
        >
          <Wallet className={iconClass} />
          Overpaid
        </span>
      );
  }
};
