import { useState } from 'react';
import { X, Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { translateToBothLanguages } from '../utils/translate';
import ConfirmationModal from './ConfirmationModal';

export default function CategoryModal({ categories, onClose }) {
  const { t, getLocalizedField } = useLanguage();
  const [editingCategory, setEditingCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Outdoors',
    subCategories: '',
  });
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, categoryId: null, categoryName: '' });
  const { showSuccess, showError, showWarning } = useToast();

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name_en || category.name_uk || '',
      type: category.type,
      subCategories: (category.subCategories_en || category.subCategories_uk || []).join(', '),
    });
    setShowForm(true);
  };

  const handleDelete = (category) => {
    setDeleteConfirmation({
      isOpen: true,
      categoryId: category.id,
      categoryName: getLocalizedField(category, 'name')
    });
  };

  const confirmDelete = async () => {
    try {
      await api.deleteCategory(deleteConfirmation.categoryId);
      showSuccess(t('toast.categoryDeleted'));
      setDeleteConfirmation({ isOpen: false, categoryId: null, categoryName: '' });
      onClose();
    } catch (error) {
      console.error('Error deleting category:', error);
      showError(t('errors.failedToDelete'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.type) {
      showWarning(t('errors.nameAndTypeRequired'));
      return;
    }

    setTranslating(true);
    try {
      // Auto-translate name
      const nameTranslations = await translateToBothLanguages(formData.name);

      const payload = {
        name_en: nameTranslations.en,
        name_uk: nameTranslations.uk,
        type: formData.type,
      };

      // Auto-translate subcategories
      if (formData.subCategories.trim()) {
        const subCatList = formData.subCategories
          .split(',')
          .map(s => s.trim())
          .filter(s => s);

        const translatedSubCats = await Promise.all(
          subCatList.map(sub => translateToBothLanguages(sub))
        );

        payload.subCategories_en = translatedSubCats.map(t => t.en);
        payload.subCategories_uk = translatedSubCats.map(t => t.uk);
      }

      setTranslating(false);
      setLoading(true);

      if (editingCategory) {
        await api.updateCategory(editingCategory.id, payload);
        showSuccess(t('toast.categoryUpdated'));
      } else {
        await api.createCategory(payload);
        showSuccess(t('toast.categoryCreated'));
      }

      setShowForm(false);
      setEditingCategory(null);
      setFormData({ name: '', type: 'Outdoors', subCategories: '' });
      onClose();
    } catch (error) {
      console.error('Error saving category:', error);
      showError(t('errors.failedToCreate'));
    } finally {
      setLoading(false);
      setTranslating(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ name: '', type: 'Outdoors', subCategories: '' });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">{t('categoryModal.manageCategories')}</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {!showForm ? (
              <>
                <button
                  onClick={() => setShowForm(true)}
                  className="btn-primary w-full mb-4 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  {t('categoryModal.addNewCategory')}
                </button>

                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{getLocalizedField(category, 'name')}</div>
                        <div className="text-sm text-gray-500">{category.type}</div>
                        {(category.subCategories_en?.length > 0 || category.subCategories_uk?.length > 0) && (
                          <div className="text-xs text-gray-400 mt-1">
                            Subs: {getLocalizedField(category, 'subCategories')?.join(', ') ||
                              (category.subCategories_en || category.subCategories_uk || []).join(', ')}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 text-gray-600 hover:text-primary-600 rounded"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className="p-2 text-gray-600 hover:text-red-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('categoryModal.categoryName')} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Outdoor Adventures / Пригоди на природі"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('categoryModal.type')} *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="Outdoors">{t('categoryModal.outdoors')}</option>
                    <option value="Indoors">{t('categoryModal.indoors')}</option>
                    <option value="Home">{t('categoryModal.home')}</option>
                    <option value="Trip">{t('categoryModal.trip')}</option>
                    <option value="Other">{t('categoryModal.other')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('categoryModal.subCategories')}
                  </label>
                  <input
                    type="text"
                    value={formData.subCategories}
                    onChange={(e) => setFormData({ ...formData, subCategories: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Movies, Board Games, Cooking"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('categoryModal.subCategoriesHint')}
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
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
                    {translating ? t('categoryModal.translating') : loading ? t('categoryModal.saving') : editingCategory ? t('categoryModal.update') : t('categoryModal.create')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        title={t('categoryModal.deleteCategory')}
        message={`${t('confirmation.areYouSureDelete')} "${deleteConfirmation.categoryName}"? ${t('categoryModal.deleteCategoryConfirm')}`}
        confirmText={t('confirmation.delete')}
        cancelText={t('confirmation.cancel')}
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmation({ isOpen: false, categoryId: null, categoryName: '' })}
      />
    </>
  );
}
