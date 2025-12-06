import { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../utils/api';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const { i18n, t } = useTranslation();
  const [loading, setLoading] = useState(true);

  const language = i18n.language?.split('-')[0] || 'en';

  useEffect(() => {
    loadLanguagePreference();
  }, []);

  const loadLanguagePreference = async () => {
    try {
      const settings = await api.getSettings();
      const savedLang = settings.language || 'en';
      if (savedLang !== i18n.language) {
        await i18n.changeLanguage(savedLang);
      }
    } catch (error) {
      console.error('Failed to load language preference:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = async (newLang) => {
    try {
      await i18n.changeLanguage(newLang);
      await api.updateSettings({ language: newLang });
    } catch (error) {
      console.error('Failed to update language:', error);
    }
  };

  // Helper function to get the right field based on current language
  // Used for dynamic database content (dates, categories)
  const getLocalizedField = (obj, fieldName) => {
    if (!obj) return '';
    const langField = `${fieldName}_${language}`;
    return obj[langField] || obj[`${fieldName}_en`] || obj[fieldName] || '';
  };

  // Helper to get localized array field
  const getLocalizedArray = (obj, fieldName) => {
    if (!obj) return [];
    const langField = `${fieldName}_${language}`;
    return obj[langField] || obj[`${fieldName}_en`] || obj[fieldName] || [];
  };

  const value = {
    language,
    changeLanguage,
    t, // Pass through i18next's t function
    getLocalizedField,
    getLocalizedArray,
    loading
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};