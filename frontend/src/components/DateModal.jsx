import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { translateToBothLanguages } from '../utils/translate';

export default function DateModal({ date, categories, currentUser, onClose }) {
  const { t, getLocalizedField, getLocalizedArray, language } = useLanguage();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subCategory: '',
    author: currentUser,
  });
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const { showSuccess, showError, showWarning } = useToast();

  useEffect(() => {
    if (date) {
      setFormData({
        title: language === 'uk' ? (date.title_uk || date.title_en || '') : (date.title_en || date.title_uk || ''),
        description: language === 'uk' ? (date.description_uk || date.description_en || '') : (date.description_en || date.description_uk || ''),
        category: date.category,
        subCategory: language === 'uk' ? (date.subCategory_uk || date.subCategory_en || '') : (date.subCategory_en || date.subCategory_uk || ''),
        author: date.author,
      });
    } else {
      setFormData(prev => ({ ...prev, author: currentUser }));
    }
  }, [date, language, currentUser]);

  const selectedCategory = categories.find(c => c.id === formData.category);
  const subCategories = getLocalizedArray(selectedCategory, 'subCategories');
  const showSubCategory = subCategories.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.category) {
      showWarning(t('errors.titleAndCategoryRequired'));
      return;
    }

    setTranslating(true);
    try {
      // Auto-translate title and description
      const titleTranslations = await translateToBothLanguages(formData.title);
      const descriptionTranslations = await translateToBothLanguages(formData.description);

      // Find matching subcategory in both languages
      let subCategory_en = '';
      let subCategory_uk = '';
      if (formData.subCategory && selectedCategory) {
        const subCategoriesEn = selectedCategory.subCategories_en || [];
        const subCategoriesUk = selectedCategory.subCategories_uk || [];
        const idx = subCategories.indexOf(formData.subCategory);
        if (idx >= 0) {
          subCategory_en = subCategoriesEn[idx] || formData.subCategory;
          subCategory_uk = subCategoriesUk[idx] || formData.subCategory;
        }
      }

      setTranslating(false);
      setLoading(true);

      // Always include both translations returned by translateToBothLanguages
      const payload = {
        title_en: titleTranslations.en || '',
        title_uk: titleTranslations.uk || '',
        description_en: descriptionTranslations.en || '',
        description_uk: descriptionTranslations.uk || '',
        category: formData.category,
        subCategory_en,
        subCategory_uk,
        author: formData.author,
      };

      if (date) {
        await api.updateDate(date.id, payload);
        showSuccess(t('toast.dateUpdated'));
      } else {
        await api.createDate(payload);
        showSuccess(t('toast.dateCreated'));
      }
      onClose();
    } catch (error) {
      console.error('Error saving date:', error);
      showError(t('errors.failedToCreate'));
    } finally {
      setLoading(false);
      setTranslating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">
            {date ? t('dateModal.editDateIdea') : t('dateModal.newDateIdea')}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('dateModal.title')} *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              placeholder={language === 'uk' ? "напр., Пікнік у парку" : "e.g., Picnic at Central Park"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('dateModal.description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              rows="3"
              placeholder={language === 'uk' ? "Додайте деталі, посилання, вартість тощо." : "Add details, links, costs, etc."}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('dateModal.category')} *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value, subCategory: '' })}
              className="input-field"
              required
            >
              <option value="">{t('dateModal.selectCategory')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {getLocalizedField(cat, 'name')}
                </option>
              ))}
            </select>
          </div>

          {showSubCategory && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('dateModal.subCategory')}
              </label>
              <select
                value={formData.subCategory}
                onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                className="input-field"
              >
                <option value="">{t('dateModal.selectSubCategory')}</option>
                {subCategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('dateModal.addedBy')} *
            </label>
            <select
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className="input-field"
              required
            >
              <option value="User 1">{t('settings.user1')}</option>
              <option value="User 2">{t('settings.user2')}</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading || translating}
            >
              {t('confirmation.cancel')}
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading || translating}
            >
              {translating ? t('dateModal.translating') : loading ? t('dateModal.saving') : date ? t('dateModal.update') : t('dateModal.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
