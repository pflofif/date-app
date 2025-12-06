// Free Google Translate API (no API key required)
export const translateText = async (text, targetLang) => {
  if (!text || !text.trim()) return '';
  
  const sourceLang = targetLang === 'uk' ? 'en' : 'uk';
  
  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
    );
    
    if (!response.ok) {
      console.error('Translation failed');
      return text; // Return original text if translation fails
    }
    
    const data = await response.json();
    // Google returns nested array: [[["translated text", "original text", ...]]]
    const translated = data[0]?.map(item => item[0]).join('') || text;
    return translated;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text on error
  }
};

// Detect if text is likely Ukrainian (contains Cyrillic characters)
export const detectLanguage = (text) => {
  if (!text) return 'en';
  // Check for Ukrainian-specific or Cyrillic characters
  const cyrillicPattern = /[\u0400-\u04FF]/;
  return cyrillicPattern.test(text) ? 'uk' : 'en';
};

// Translate and return both language versions
export const translateToBothLanguages = async (text) => {
  if (!text || !text.trim()) {
    return { en: '', uk: '' };
  }
  
  const detectedLang = detectLanguage(text);
  
  if (detectedLang === 'uk') {
    const translatedEn = await translateText(text, 'en');
    return { en: translatedEn, uk: text };
  } else {
    const translatedUk = await translateText(text, 'uk');
    return { en: text, uk: translatedUk };
  }
};
