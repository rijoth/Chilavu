import React, { useRef } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search events',
  className = '',
  ariaLabel = 'Search events',
  autoFocus = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onClear();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape' && value) {
      e.preventDefault();
      handleClear();
    }
  };

  return (
    <div
      className={`group relative flex items-center rounded-2xl bg-surface border border-overlay shadow-2xs transition-all duration-150 focus-within:border-iris focus-within:ring-1 focus-within:ring-iris ${className}`}
    >
      {/* Left Search Icon */}
      <div className="absolute left-3.5 flex items-center pointer-events-none text-muted transition-colors group-focus-within:text-iris">
        <Search className="w-4 h-4 stroke-[2]" aria-hidden="true" />
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="search"
        role="searchbox"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
        spellCheck="false"
        className="w-full bg-transparent pl-10 pr-10 py-2.5 sm:py-2 text-base sm:text-sm text-text placeholder:text-muted focus:outline-none min-h-[44px] [appearance:textfield] [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
      />

      {/* Clear Button */}
      {value.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-0.5 p-2 text-subtle hover:text-text rounded-xl hover:bg-overlay/60 active:scale-90 transition min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-iris"
        >
          <X className="w-4 h-4 stroke-[2.2]" />
        </button>
      )}
    </div>
  );
};
