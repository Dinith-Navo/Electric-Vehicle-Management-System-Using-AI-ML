import { useState, useEffect } from 'react';

export function create<T>(createState: (set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void, get: () => T) => T) {
  let state: T;
  const listeners = new Set<(state: T) => void>();

  const setState = (partial: Partial<T> | ((s: T) => Partial<T>)) => {
    const nextState = typeof partial === 'function' ? (partial as any)(state) : partial;
    if (nextState && typeof nextState === 'object') {
      state = { ...state, ...nextState };
      listeners.forEach((listener) => listener(state));
    }
  };

  const getState = () => state;
  state = createState(setState, getState);

  const useStore = (selector: (s: T) => any = (s) => s) => {
    const [slice, setSlice] = useState(() => selector(state));
    useEffect(() => {
      const listener = (newState: T) => {
        setSlice(selector(newState));
      };
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }, [selector]);
    return slice;
  };

  Object.assign(useStore, {
    getState,
    setState,
    subscribe: (listener: (state: T) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  });

  return useStore as any;
}
