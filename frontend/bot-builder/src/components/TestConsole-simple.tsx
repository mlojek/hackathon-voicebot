import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface Props {
  flow: any;
  prompt: string;
  fields: any[];
}

const TestConsole: React.FC<Props> = ({ flow, prompt, fields }) => {
  const { t } = useLanguage();

  return (
    <div className="max-w-5xl mx-auto py-4 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="w-1 h-1 rounded-full bg-white/60"></div>
        <h2 className="text-2xl font-semibold text-white tracking-tight">{t('test.title')}</h2>
      </div>
      <p className="text-white/60 text-sm mb-6 -mt-4 ml-5">
        {t('test.subtitle')}
      </p>

      {/* Coming soon card */}
      <div className="relative overflow-visible p-12 text-center">
        {/* Ambient glow particles */}
        <div className="absolute top-1/4 left-1/4 w-8 h-8 bg-white/30 rounded-full blur-xl animate-[glowFloat_3s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-white/20 rounded-full blur-2xl animate-[glowFloat_4s_ease-in-out_infinite_0.5s]" />

        <div className="relative">
          <div className="w-2 h-2 rounded-full bg-white/40 mx-auto mb-4"></div>
          <p className="text-white text-lg mb-2 font-medium">{t('test.comingSoon')}</p>
          <p className="text-sm text-white/60">
            {t('test.comingSoon.hint')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestConsole;
