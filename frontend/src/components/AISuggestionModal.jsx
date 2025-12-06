import { useState } from 'react';
import { X, Sparkles, Loader2, RefreshCw, Plus } from 'lucide-react';
import { api } from '../utils/api';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { translateToBothLanguages } from '../utils/translate';

export default function AISuggestionModal({ categories, onClose, onSelectDate, onDatesAdded }) {
  const { currentUser } = useUser();
  const { t, language, getLocalizedField } = useLanguage();
  const { showSuccess, showError, showWarning } = useToast();
  const [formData, setFormData] = useState({
    mood: '',
    activityLevel: 'moderate',
    budget: 'moderate',
    setting: '',
    interests: '',
    specialOccasion: '',
  });
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [error, setError] = useState(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState(new Set());
  const [addingDates, setAddingDates] = useState(false);

  const moods = [
    { value: 'romantic', label: t('moods.romantic') },
    { value: 'adventurous', label: t('moods.adventurous') },
    { value: 'relaxed', label: t('moods.relaxed') },
    { value: 'playful', label: t('moods.playful') },
    { value: 'creative', label: t('moods.creative') },
    { value: 'hungry', label: t('moods.foodie') },
  ];

  const activityLevels = [
    { value: 'low', label: t('activityLevels.justChilling'), description: t('activityLevels.lowEnergy') },
    { value: 'moderate', label: t('activityLevels.normalDay'), description: t('activityLevels.balancedEnergy') },
    { value: 'high', label: t('activityLevels.letsGo'), description: t('activityLevels.highEnergy') },
  ];

  const budgets = [
    { value: 'free', label: t('budgets.free') },
    { value: 'low', label: t('budgets.budgetFriendly') },
    { value: 'moderate', label: t('budgets.moderate') },
    { value: 'high', label: t('budgets.goBig') },
  ];

  const settings = [
    { value: 'home', label: t('aiModal.homeSetting') },
    { value: 'outdoors', label: t('aiModal.outside') },
    { value: 'any', label: t('aiModal.anywhere') },
  ];

  const handleGetSuggestions = async () => {
    if (!formData.mood) {
      setError(t('errors.selectMood'));
      return;
    }

    setLoading(true);
    setError(null);
    setSuggestions(null);

    try {
      const preferences = {
        ...formData,
        categories: categories.map(c => ({ id: c.id, name: getLocalizedField(c, 'name'), type: c.type })),
        language // Pass current language to backend for AI response
      };

      const result = await api.getAISuggestion(preferences);
      setSuggestions(result);
      setSelectedSuggestions(new Set());
    } catch (err) {
      console.error('AI suggestion error:', err);
      setError(err.message || t('errors.failedToCreate'));
    } finally {
      setLoading(false);
    }
  };

  const toggleSuggestionSelection = (index) => {
    const suggestion = suggestions.suggestions[index];
    if (suggestion.isFromLibrary) {
      return;
    }

    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSuggestions(newSelected);
  };

  const handleAddSelectedDates = async () => {
    if (selectedSuggestions.size === 0) {
      showWarning(t('errors.pickAtLeastOne'));
      return;
    }

    setAddingDates(true);
    try {
      const selectedItems = Array.from(selectedSuggestions)
        .map(index => suggestions.suggestions[index])
        .filter(s => !s.isFromLibrary);

      for (const suggestion of selectedItems) {
        let categoryId = categories[0]?.id;

        if (suggestion.categoryId) {
          categoryId = suggestion.categoryId;
        } else if (formData.setting) {
          const settingMap = {
            'home': 'Home',
            'outdoors': 'Outdoors',
          };
          const matchingCategory = categories.find(
            c => c.type === settingMap[formData.setting]
          );
          if (matchingCategory) categoryId = matchingCategory.id;
        }

        // Auto-translate title and description
        const titleTranslations = await translateToBothLanguages(suggestion.title);
        const descriptionTranslations = await translateToBothLanguages(suggestion.description || '');

        await api.createDate({
          title_en: titleTranslations.en,
          title_uk: titleTranslations.uk,
          description_en: descriptionTranslations.en,
          description_uk: descriptionTranslations.uk,
          category: categoryId,
          subCategory_en: '',
          subCategory_uk: '',
          author: currentUser,
        });
      }

      showSuccess(`${selectedItems.length} ${t('toast.datesAdded')}`);
      setSelectedSuggestions(new Set());
      setSuggestions(null);

      if (onDatesAdded) {
        onDatesAdded();
      }

      onClose();
    } catch (error) {
      console.error('Error adding dates:', error);
      showError(t('errors.failedToAdd'));
    } finally {
      setAddingDates(false);
    }
  };

  const handleReset = () => {
    setSuggestions(null);
    setError(null);
    setSelectedSuggestions(new Set());
  };

  const newDatesCount = suggestions?.suggestions?.filter(s => !s.isFromLibrary).length || 0;
  const selectedNewDatesCount = Array.from(selectedSuggestions).filter(
    index => !suggestions.suggestions[index].isFromLibrary
  ).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-pink-500 px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-5 h-5 text-white flex-shrink-0" />
            <h3 className="text-lg sm:text-xl font-bold text-white truncate">{t('aiModal.title')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0 ml-2"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!suggestions ? (
            <form onSubmit={(e) => { e.preventDefault(); handleGetSuggestions(); }} className="p-4 sm:p-6 space-y-5">
              <p className="text-gray-600 text-sm">
                {t('aiModal.tellUsYourFeeling')}
              </p>

              {error && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-200">
                  {error}
                </div>
              )}

              {/* Mood */}
              <fieldset>
                <legend className="block text-sm font-semibold text-gray-900 mb-3">
                  {t('aiModal.whatsYourVibe')} *
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  {moods.map((mood) => (
                    <button
                      key={mood.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, mood: mood.value })}
                      className={`p-3 rounded-lg text-center text-sm font-medium transition-all ${formData.mood === mood.value
                        ? 'bg-primary-100 border-2 border-primary-600 text-primary-900'
                        : 'bg-gray-100 border-2 border-transparent hover:bg-gray-200 text-gray-700'
                        }`}
                    >
                      <div className="text-lg mb-1">{mood.label.split(' ')[0]}</div>
                      <div className="text-xs">{mood.label.split(' ').slice(1).join(' ')}</div>
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Energy Level */}
              <fieldset>
                <legend className="block text-sm font-semibold text-gray-900 mb-3">
                  {t('aiModal.howsYourEnergy')}
                </legend>
                <div className="space-y-2">
                  {activityLevels.map((level) => (
                    <label
                      key={level.value}
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.activityLevel === level.value
                        ? 'bg-primary-50 border-primary-600'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <input
                        type="radio"
                        name="activityLevel"
                        value={level.value}
                        checked={formData.activityLevel === level.value}
                        onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value })}
                        className="w-4 h-4 text-primary-600 cursor-pointer"
                      />
                      <div className="ml-3">
                        <div className="font-medium text-gray-900 text-sm">{level.label}</div>
                        <div className="text-xs text-gray-600">{level.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Budget */}
              <fieldset>
                <legend className="block text-sm font-semibold text-gray-900 mb-3">
                  {t('aiModal.budget')}
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {budgets.map((budget) => (
                    <button
                      key={budget.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, budget: budget.value })}
                      className={`p-3 rounded-lg text-sm font-medium transition-all text-center ${formData.budget === budget.value
                        ? 'bg-primary-100 border-2 border-primary-600 text-primary-900'
                        : 'bg-gray-100 border-2 border-transparent hover:bg-gray-200 text-gray-700'
                        }`}
                    >
                      <div>{budget.label.split(' ')[0]}</div>
                      <div className="text-xs">{budget.label.split(' ').slice(1).join(' ')}</div>
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Setting */}
              <fieldset>
                <legend className="block text-sm font-semibold text-gray-900 mb-3">
                  {t('aiModal.where')}
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  {settings.map((setting) => (
                    <button
                      key={setting.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, setting: setting.value })}
                      className={`p-3 rounded-lg text-sm font-medium transition-all text-center ${formData.setting === setting.value
                        ? 'bg-primary-100 border-2 border-primary-600 text-primary-900'
                        : 'bg-gray-100 border-2 border-transparent hover:bg-gray-200 text-gray-700'
                        }`}
                    >
                      <div className="text-lg mb-1">{setting.label.split(' ')[0]}</div>
                      <div className="text-xs">{setting.label.split(' ').slice(1).join(' ')}</div>
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Interests */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('aiModal.interests')}
                </label>
                <input
                  type="text"
                  value={formData.interests}
                  onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                  className="input-field text-sm"
                  placeholder={language === 'uk' ? "напр., природа, музика, їжа..." : "e.g., nature, music, food..."}
                />
              </div>

              {/* Special Occasion */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('aiModal.specialOccasion')}
                </label>
                <input
                  type="text"
                  value={formData.specialOccasion}
                  onChange={(e) => setFormData({ ...formData, specialOccasion: e.target.value })}
                  className="input-field text-sm"
                  placeholder={language === 'uk' ? "напр., річниця, день народження..." : "e.g., anniversary, birthday..."}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-base font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('aiModal.findingIdeas')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>{t('aiModal.getSuggestions')}</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">{t('aiModal.ideasForYou')}</h4>
                <button
                  onClick={handleReset}
                  className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium"
                >
                  <RefreshCw className="w-3 h-3" />
                  {t('aiModal.newSearch')}
                </button>
              </div>

              {suggestions.message && (
                <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg border border-gray-200">
                  {suggestions.message}
                </p>
              )}

              <div className="space-y-3">
                {suggestions.suggestions?.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => toggleSuggestionSelection(index)}
                    className={`border rounded-xl p-4 transition-all ${suggestion.isFromLibrary
                      ? 'cursor-not-allowed opacity-60 border-gray-200 bg-gray-50'
                      : selectedSuggestions.has(index)
                        ? 'cursor-pointer border-primary-500 bg-primary-50 shadow-md'
                        : 'cursor-pointer border-gray-200 hover:border-primary-300 hover:shadow-sm active:bg-primary-50/30'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      {!suggestion.isFromLibrary && (
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all mt-1 ${selectedSuggestions.has(index)
                            ? 'border-primary-500 bg-primary-500'
                            : 'border-gray-300'
                            }`}
                        >
                          {selectedSuggestions.has(index) && (
                            <span className="text-white text-xs">✓</span>
                          )}
                        </div>
                      )}
                      {suggestion.isFromLibrary && (
                        <div className="text-lg mt-1 flex-shrink-0">ℹ️</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-gray-900 break-words">{suggestion.title}</h5>
                        {suggestion.description && (
                          <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                        )}
                        {suggestion.reason && (
                          <p className="text-xs text-primary-600 mt-2">✨ {suggestion.reason}</p>
                        )}
                        <div className="mt-2">
                          {suggestion.isFromLibrary && (
                            <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                              {t('aiModal.inYourLibrary')}
                            </span>
                          )}
                          {!suggestion.isFromLibrary && (
                            <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                              {t('aiModal.new')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {newDatesCount > 0 && selectedNewDatesCount > 0 && (
                <button
                  onClick={handleAddSelectedDates}
                  disabled={addingDates}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-base font-semibold mt-6"
                >
                  {addingDates ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t('aiModal.adding')}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span>{t('aiModal.addDates')} {selectedNewDatesCount}</span>
                    </>
                  )}
                </button>
              )}

              {newDatesCount === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 text-center">
                  <p className="font-medium">{t('aiModal.greatCollection')}</p>
                  <p className="text-xs mt-1">{t('aiModal.allInLibrary')}</p>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full btn-secondary py-2 text-sm font-medium"
              >
                {t('aiModal.close')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
