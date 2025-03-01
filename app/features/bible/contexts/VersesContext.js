import { createContext, useContext, useState, useCallback } from 'react';

const VersesContext = createContext(null);

export function VersesProvider({ children }) {
  const [verses, setVerses] = useState([]);
  const [currentVerse, setCurrentVerse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateVerses = useCallback((newVerses) => {
    setVerses(newVerses);
    setCurrentVerse(null); // Reset current verse when verses change
  }, []);

  const selectVerse = useCallback((verseId) => {
    const verse = verses.find(v => v.id === verseId);
    setCurrentVerse(verse);
  }, [verses]);

  const value = {
    verses,
    currentVerse,
    loading,
    error,
    updateVerses,
    selectVerse
  };

  return (
    <VersesContext.Provider value={value}>
      {children}
    </VersesContext.Provider>
  );
}

export function useVerses() {
  const context = useContext(VersesContext);
  if (!context) {
    throw new Error('useVerses must be used within a VersesProvider');
  }
  return context;
}

export default VersesContext; 