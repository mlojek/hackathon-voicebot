import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-ink-light" />
      <div className="inline-flex rounded-md border border-border-light bg-white">
        <button
          onClick={() => setLanguage('pl')}
          className={`px-3 py-1 text-sm font-medium transition-all ${
            language === 'pl'
              ? 'bg-ink text-white'
              : 'text-ink-medium hover:text-ink'
          }`}
        >
          PL
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1 text-sm font-medium transition-all ${
            language === 'en'
              ? 'bg-ink text-white'
              : 'text-ink-medium hover:text-ink'
          }`}
        >
          EN
        </button>
      </div>
    </div>
  );
};
