import { useCallback, useEffect, useState } from 'react';
import { readCollection, writeCollection, STORAGE_KEYS } from '@/utils/storage';

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export function useLocalStorage<T>(key: StorageKey, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    readCollection<T>(key, initialValue).then((storedValue) => {
      if (mounted) {
        setValue(storedValue);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [key, initialValue]);

  const updateValue = useCallback(
    async (nextValue: T) => {
      setValue(nextValue);
      await writeCollection<T>(key, nextValue);
    },
    [key],
  );

  return [value, updateValue, loading] as const;
}
