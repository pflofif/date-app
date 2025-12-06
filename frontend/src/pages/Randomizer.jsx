import { useState, useEffect } from 'react';
import { Shuffle, Check, X, Sparkles } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import ScheduleDateModal from '../components/ScheduleDateModal';

export default function Randomizer() {
  const { t, getLocalizedField } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [randomDate, setRandomDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const { showSuccess, showError, showWarning } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const toggleCategory = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSpin = async () => {
    if (selectedCategories.length === 0) {
      showWarning(t('errors.selectAtLeastOneCategory'));
      return;
    }

    setLoading(true);
    setSpinning(true);
    setRandomDate(null);

    // Add a delay for dramatic effect
    setTimeout(async () => {
      try {
        const date = await api.getRandomDate(selectedCategories);
        setRandomDate(date);
      } catch (error) {
        showError(t('errors.noAvailableDates'));
      } finally {
        setLoading(false);
        setSpinning(false);
      }
    }, 1000);
  };

  const handleAccept = async () => {
    if (!randomDate) return;
    setShowScheduleModal(true);
  };

  const handleSchedule = async (scheduledDateTime) => {
    try {
      await api.updateDate(randomDate.id, {
        status: 'planned',
        scheduledDate: scheduledDateTime
      });
      showSuccess(t('toast.dateScheduledSuccess'));
      setRandomDate(null);
      setSelectedCategories([]);
      setShowScheduleModal(false);
    } catch (error) {
      console.error('Error scheduling date:', error);
      showError(t('errors.failedToSchedule'));
    }
  };

  const handleReroll = () => {
    setRandomDate(null);
    handleSpin();
  };

  const category = randomDate ? categories.find(c => c.id === randomDate.category) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('randomizer.title')}</h2>
        <p className="text-gray-600">{t('randomizer.selectCategories')}</p>
      </div>

      {!randomDate ? (
        <>
          {/* Category Selection */}
          <div className="card mb-6">
            <h3 className="font-semibold text-lg mb-4 text-gray-900">
              {t('randomizer.selectCategoriesPlaceholder')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${selectedCategories.includes(cat.id)
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{getLocalizedField(cat, 'name')}</div>
                      <div className="text-sm text-gray-500">{cat.type}</div>
                    </div>
                    {selectedCategories.includes(cat.id) && (
                      <Check className="w-5 h-5 text-primary-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Spin Button */}
          <div className="text-center">
            <button
              onClick={handleSpin}
              disabled={loading || selectedCategories.length === 0}
              className="btn-primary text-lg px-8 py-4 rounded-xl flex items-center gap-3 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {spinning ? (
                <>
                  <Sparkles className="w-6 h-6 animate-spin" />
                  {t('randomizer.spinning')}
                </>
              ) : (
                <>
                  <Shuffle className="w-6 h-6" />
                  {t('randomizer.spinTheWheel')}
                </>
              )}
            </button>
            <p className="text-sm text-gray-500 mt-3">
              {selectedCategories.length} {selectedCategories.length === 1 ? t('randomizer.categorySelected') : t('randomizer.categoriesSelected')}
            </p>
          </div>
        </>
      ) : (
        /* Result Card */
        <div className="card text-center animate-fadeIn">
          <div className="mb-4">
            <Sparkles className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {getLocalizedField(randomDate, 'title')}
            </h3>

            {getLocalizedField(randomDate, 'description') && (
              <p className="text-gray-600 mb-4 whitespace-pre-wrap">
                {getLocalizedField(randomDate, 'description')}
              </p>
            )}

            <div className="flex flex-wrap gap-2 justify-center mb-6">
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                {getLocalizedField(category, 'name') || t('categoryModal.other')}
              </span>
              {getLocalizedField(randomDate, 'subCategory') && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  {getLocalizedField(randomDate, 'subCategory')}
                </span>
              )}
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {randomDate.author}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleAccept}
              className="btn-primary flex items-center justify-center gap-2 flex-1 sm:flex-initial"
            >
              <Check className="w-5 h-5" />
              {t('randomizer.scheduleThisDate')}
            </button>
            <button
              onClick={handleReroll}
              className="btn-secondary flex items-center justify-center gap-2 flex-1 sm:flex-initial"
            >
              <Shuffle className="w-5 h-5" />
              {t('randomizer.reroll')}
            </button>
          </div>
        </div>
      )}

      {showScheduleModal && randomDate && (
        <ScheduleDateModal
          date={randomDate}
          onSchedule={handleSchedule}
          onClose={() => setShowScheduleModal(false)}
        />
      )}
    </div>
  );
}
