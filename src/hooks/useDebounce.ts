import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce a value by a specified delay in milliseconds.
 * If value is an empty string (e.g. user cleared search), it updates immediately.
 */
export function useDebounce<T>(value: T, delay: number = 150): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // When value is reset to empty string, clear immediately for snappy UX
    if (value === '') {
      setDebouncedValue(value);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
