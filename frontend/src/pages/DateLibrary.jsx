import { useState, useEffect } from 'react';
import { Plus, Filter, Settings, Pencil, Trash2 } from 'lucide-react';
import { api } from '../utils/api';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../context/LanguageContext';
import DateModal from '../components/DateModal';
import CategoryModal from '../components/CategoryModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../context/ToastContext';

export default function DateLibrary() {
  const { currentUser } = useUser();
  const { t, getLocalizedField, language } = useLanguage();
  const { showSuccess } = useToast();
  const [dates, setDates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    author: '',
    status: '',
  });

  const [showDateModal, setShowDateModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingDate, setEditingDate] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, dateId: null, dateTitle: '' });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [datesData, categoriesData] = await Promise.all([
        api.getDates(filters),
        api.getCategories(),
      ]);
      setDates(datesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDate = async (id) => {
    const date = dates.find(d => d.id === id);
    setDeleteConfirmation({
      isOpen: true,
      dateId: id,
      dateTitle: getLocalizedField(date, 'title') || t('confirmationModal.deleteDateIdea')
    });
  };

  const confirmDelete = async () => {
    try {
      await api.deleteDate(deleteConfirmation.dateId);
      showSuccess(t('toast.dateDeleted'));
      setDeleteConfirmation({ isOpen: false, dateId: null, dateTitle: '' });
      loadData();
    } catch (error) {
      console.error('Error deleting date:', error);
    }
  };

  const handleEditDate = (date) => {
    setEditingDate(date);
    setShowDateModal(true);
  };

  const handleCloseModal = () => {
    setShowDateModal(false);
    setEditingDate(null);
    loadData();
  };

  const filteredDates = dates;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('dateLibrary.title')}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            {t('dateLibrary.categories')}
          </button>
          <button
            onClick={() => setShowDateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('dateLibrary.addDate')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">{t('dateLibrary.filters')}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('dateModal.category')}
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="input-field"
            >
              <option value="">{t('dateLibrary.allCategories')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {getLocalizedField(cat, 'name')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('dateModal.addedBy')}
            </label>
            <select
              value={filters.author}
              onChange={(e) => setFilters({ ...filters, author: e.target.value })}
              className="input-field"
            >
              <option value="">{t('dateLibrary.bothUsers')}</option>
              <option value="User 1">{t('header.user1')}</option>
              <option value="User 2">{t('header.user2')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('dateLibrary.filters')}
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-field"
            >
              <option value="">{t('dateLibrary.all')}</option>
              <option value="idle">{t('dateLibrary.available')}</option>
              <option value="planned">{t('dateLibrary.scheduled')}</option>
              <option value="completed">{t('dateLibrary.completed')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Date List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredDates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">{t('dateLibrary.noDatesFound')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDates.map((date) => {
            const category = categories.find(c => c.id === date.category);
            return (
              <div key={date.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg text-gray-900 flex-1">
                    {getLocalizedField(date, 'title')}
                  </h3>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => handleEditDate(date)}
                      className="p-1.5 text-gray-600 hover:text-primary-600 rounded"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDate(date.id)}
                      className="p-1.5 text-gray-600 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {getLocalizedField(date, 'description') && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {getLocalizedField(date, 'description')}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full">
                    {getLocalizedField(category, 'name') || t('categoryModal.other')}
                  </span>
                  {getLocalizedField(date, 'subCategory') && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                      {getLocalizedField(date, 'subCategory')}
                    </span>
                  )}
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {date.author}
                  </span>
                  {date.status === 'planned' && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      {t('dateLibrary.scheduled')}
                    </span>
                  )}
                  {date.status === 'completed' && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                      {t('dateLibrary.completed')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showDateModal && (
        <DateModal
          date={editingDate}
          categories={categories}
          currentUser={currentUser}
          onClose={handleCloseModal}
        />
      )}

      {showCategoryModal && (
        <CategoryModal
          categories={categories}
          onClose={() => {
            setShowCategoryModal(false);
            loadData();
          }}
        />
      )}

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        title={t('confirmationModal.deleteDateIdea')}
        message={`${t('confirmation.areYouSureDelete')} "${deleteConfirmation.dateTitle}"? ${t('confirmation.actionCannotBeUndone')}`}
        confirmText={t('confirmationModal.delete')}
        cancelText={t('dateModal.cancel')}
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmation({ isOpen: false, dateId: null, dateTitle: '' })}
      />
    </div>
  );
}
