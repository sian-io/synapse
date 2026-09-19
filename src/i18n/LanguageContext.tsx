import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations, TranslationKeys } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function detectUserLanguage(): Language {
  // 1. If the user previously made an explicit choice, honor it
  const saved = localStorage.getItem('synapse_language');
  if (saved === 'en' || saved === 'pt') {
    return saved;
  }

  // 2. Automatically detect based on browser locale / location
  try {
    const browserLangs = navigator.languages ? [...navigator.languages] : [navigator.language];
    for (const lang of browserLangs) {
      if (!lang) continue;
      const lower = lang.toLowerCase();
      if (lower.startsWith('pt')) {
        return 'pt';
      }
    }

    // Secondary location check via timezone
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const ptTimeZones = [
      'Sao_Paulo',
      'Fortaleza',
      'Belem',
      'Manaus',
      'Recife',
      'Cuiaba',
      'Porto_Velho',
      'Boa_Vista',
      'Campo_Grande',
      'Maceio',
      'Bahia',
      'Noronha',
      'Lisbon',
      'Madeira',
      'Azores',
    ];
    if (ptTimeZones.some((tz) => timeZone.includes(tz))) {
      return 'pt';
    }
  } catch (e) {
    console.warn('Locale detection error:', e);
  }

  // Default language is English
  return 'en';
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(detectUserLanguage);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('synapse_language', lang);
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = translations[language].app.title;
  }, [language]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language] as unknown as TranslationKeys,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
