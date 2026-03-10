import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLanguage('pl')}
        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
          language === 'pl'
            ? 'bg-white/20 text-white border border-white/40'
            : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white/80'
        }`}
      >
        PL
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
          language === 'en'
            ? 'bg-white/20 text-white border border-white/40'
            : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white/80'
        }`}
      >
        EN
      </button>
    </div>
  );
};
