import { useEffect } from 'react';

interface Hotkey {
  key: string;
  action: () => void;
}

export function useHotkeys(hotkeys: Hotkey[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = `${event.altKey ? 'Alt+' : ''}${event.ctrlKey ? 'Ctrl+' : ''}${event.shiftKey ? 'Shift+' : ''}${event.key}`;
      
      const hotkey = hotkeys.find(h => h.key === key);
      if (hotkey) {
        event.preventDefault();
        hotkey.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hotkeys]);
}
