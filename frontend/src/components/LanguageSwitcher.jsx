import { useLanguage } from '../context/LanguageContext';

export default function LanguageSwitcher() {
  const { language, changeLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => changeLanguage('en')}
        className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${language === 'en'
          ? 'bg-white text-primary-600 shadow-sm'
          : 'text-gray-500 hover:text-gray-700'
          }`}
        aria-label="Switch to English"
      >
        <span className="mr-1">🇺🇸</span> EN
      </button>
      <button
        onClick={() => changeLanguage('uk')}
        className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${language === 'uk'
          ? 'bg-white text-primary-600 shadow-sm'
          : 'text-gray-500 hover:text-gray-700'
          }`}
        aria-label="Переключити на Українську"
      >
        <span className="mr-1">🇺🇦</span> УКР
      </button>
    </div>
  );
}