import React, { createContext, useContext, useState } from 'react';

interface AppContextType {
  favorites: string[];
  reminders: string[];
  toggleFavorite: (id: string) => void;
  toggleReminder: (id: string) => void;
  isFavorite: (id: string) => boolean;
  hasReminder: (id: string) => boolean;
}

const AppContext = createContext<AppContextType>({
  favorites: [],
  reminders: [],
  toggleFavorite: () => {},
  toggleReminder: () => {},
  isFavorite: () => false,
  hasReminder: () => false,
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [reminders, setReminders] = useState<string[]>([]);

  function toggleFavorite(id: string) {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function toggleReminder(id: string) {
    setReminders(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  return (
    <AppContext.Provider value={{
      favorites,
      reminders,
      toggleFavorite,
      toggleReminder,
      isFavorite: (id) => favorites.includes(id),
      hasReminder: (id) => reminders.includes(id),
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
