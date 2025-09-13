import { useState, useEffect } from 'react';

// Simple shim for color scheme (light/dark/system)
export function useColorSchemeShim() {
  const [mode, setMode] = useState('light');
  const [systemMode, setSystemMode] = useState('light');

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setSystemMode(mq.matches ? 'dark' : 'light');
    handleChange();
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  return { mode, systemMode, setMode };
}