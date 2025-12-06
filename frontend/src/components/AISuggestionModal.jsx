import { useState } from 'react';
import { X, Sparkles, Loader2, RefreshCw, Plus } from 'lucide-react';
import { api } from '../utils/api';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';

export default function AISuggestionModal({ categories, onClose, onSelectDate, onDatesAdded }) {
  const { currentUser } = useUser();
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
    { value: 'romantic', label: '💕 Romantic' },
    { value: 'adventurous', label: '🎢 Adventurous' },
    { value: 'relaxed', label: '😌 Relaxed' },
    { value: 'playful', label: '🎮 Playful' },
    { value: 'creative', label: '🎨 Creative' },
    { value: 'hungry', label: '🍽️ Foodie' },
  ];

  const activityLevels = [
    { value: 'low', label: '😴 Just chilling', description: 'Low energy, cozy vibes' },
    { value: 'moderate', label: '😊 Normal day', description: 'Balanced energy' },
    { value: 'high', label: '⚡ Let\'s go!', description: 'High energy, exciting' },
  ];

  const budgets = [
    { value: 'free', label: '🆓 Free' },
    { value: 'low', label: '💰 Budget-friendly' },
    { value: 'moderate', label: '💵 Moderate' },
    { value: 'high', label: '💎 Go big!' },
  ];

  const settings = [
    { value: 'home', label: '🏡 Home' },
    { value: 'outdoors', label: '🌳 Outside' },
    { value: 'any', label: '🌍 Anywhere' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.mood) {
      setError('Pick a mood to get started!');
      return;
    }

    setLoading(true);
    setError(null);
    setSuggestions(null);

    try {
      const result = await api.getAISuggestion({
        ...formData,
        categories: categories.map(c => ({ id: c.id, name: c.name, type: c.type })),
      });
      setSuggestions(result);
      setSelectedSuggestions(new Set());
    } catch (err) {
      console.error('AI suggestion error:', err);
      setError(err.message || 'Failed to get suggestions. Try again?');
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
      showWarning('Pick at least one date to add');
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

        await api.createDate({
          title: suggestion.title,
          description: suggestion.description || '',
          category: categoryId,
          subCategory: '',
          author: currentUser,
        });
      }

      showSuccess(`Added ${selectedItems.length} date${selectedItems.length !== 1 ? 's' : ''}!`);
      setSelectedSuggestions(new Set());
      setSuggestions(null);

      if (onDatesAdded) {
        onDatesAdded();
      }

      onClose();
    } catch (error) {
      console.error('Error adding dates:', error);
      showError('Oops, couldn\'t add those. Try again?');
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
            <h3 className="text-lg sm:text-xl font-bold text-white truncate">AI Date Suggester</h3>
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
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
              <p className="text-gray-600 text-sm">
                Tell us what you're feeling, and we'll find the perfect date 💭
              </p>

              {error && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-200">
                  {error}
                </div>
              )}

              {/* Mood */}
              <fieldset>
                <legend className="block text-sm font-semibold text-gray-900 mb-3">
                  What's your vibe? *
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
                  How's your energy?
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
                  Budget
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
                  Where?
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
                  Interests (optional)
                </label>
                <input
                  type="text"
                  value={formData.interests}
                  onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                  className="input-field text-sm"
                  placeholder="e.g., nature, music, food..."
                />
              </div>

              {/* Special Occasion */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Special occasion? (optional)
                </label>
                <input
                  type="text"
                  value={formData.specialOccasion}
                  onChange={(e) => setFormData({ ...formData, specialOccasion: e.target.value })}
                  className="input-field text-sm"
                  placeholder="e.g., anniversary, birthday..."
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
                    <span>Finding ideas...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Get Suggestions</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">Ideas for you</h4>
                <button
                  onClick={handleReset}
                  className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium"
                >
                  <RefreshCw className="w-3 h-3" />
                  New search
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
                              In your library
                            </span>
                          )}
                          {!suggestion.isFromLibrary && (
                            <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                              ✚ New
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
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span>Add {selectedNewDatesCount} {selectedNewDatesCount === 1 ? 'Date' : 'Dates'}</span>
                    </>
                  )}
                </button>
              )}

              {newDatesCount === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 text-center">
                  <p className="font-medium">Great collection! 🎉</p>
                  <p className="text-xs mt-1">All suggestions are already in your library</p>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full btn-secondary py-2 text-sm font-medium"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
