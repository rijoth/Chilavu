import React from 'react';

interface ChilavuLogoProps {
  /**
   * Size variant for the logo container
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * If true, displays the "Chilavu" brand name alongside the standalone ചി mark
   * @default false
   */
  showWordmark?: boolean;
  /**
   * Subtitle displayed under the wordmark when showWordmark is true
   */
  subtitle?: string;
  /**
   * Additional wrapper class names
   */
  className?: string;
}

const sizeConfig = {
  xs: {
    box: 'w-7 h-7 rounded-lg',
    glyph: 'text-base font-bold leading-none',
    wordmark: 'text-sm font-black',
    subtitle: 'text-[10px]',
    offset: 'translate-y-[-0.5px]',
  },
  sm: {
    box: 'w-8 h-8 rounded-xl',
    glyph: 'text-lg font-bold leading-none',
    wordmark: 'text-base font-black',
    subtitle: 'text-[10px]',
    offset: 'translate-y-[-0.5px]',
  },
  md: {
    box: 'w-10 h-10 rounded-2xl',
    glyph: 'text-2xl font-bold leading-none',
    wordmark: 'text-xl font-black',
    subtitle: 'text-[11px]',
    offset: 'translate-y-[-1px]',
  },
  lg: {
    box: 'w-12 h-12 rounded-2xl',
    glyph: 'text-3xl font-bold leading-none',
    wordmark: 'text-2xl font-black',
    subtitle: 'text-xs',
    offset: 'translate-y-[-1px]',
  },
  xl: {
    box: 'w-16 h-16 rounded-3xl',
    glyph: 'text-4xl font-bold leading-none',
    wordmark: 'text-3xl font-black',
    subtitle: 'text-sm',
    offset: 'translate-y-[-2px]',
  },
};

export const ChilavuLogo: React.FC<ChilavuLogoProps> = ({
  size = 'md',
  showWordmark = false,
  subtitle,
  className = '',
}) => {
  const current = sizeConfig[size];

  const logoMark = (
    <div
      className={`relative shrink-0 ${current.box} bg-gradient-to-br from-pine via-pine to-[#245970] flex items-center justify-center text-white shadow-md shadow-pine/25 border border-foam/20 select-none overflow-hidden`}
      aria-label="Chilavu Logo"
    >
      {/* Top subtle highlight */}
      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />

      {/* Standalone Malayalam Symbol: ചി */}
      <span
        lang="ml"
        className={`font-['Manjari','Noto_Sans_Malayalam',sans-serif] ${current.glyph} ${current.offset} tracking-normal text-white drop-shadow-xs`}
        style={{ fontFamily: "'Manjari', 'Noto Sans Malayalam', sans-serif" }}
      >
        ചി
      </span>
    </div>
  );

  if (!showWordmark) {
    return <div className={`inline-flex items-center ${className}`}>{logoMark}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {logoMark}
      <div className="min-w-0">
        <span className={`block ${current.wordmark} text-text tracking-tight font-sans`}>
          Chilavu
        </span>
        {subtitle && (
          <span className={`block ${current.subtitle} text-subtle font-medium truncate`}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
