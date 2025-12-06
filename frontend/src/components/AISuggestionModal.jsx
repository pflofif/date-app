import { useState } from 'react';
import { X, Sparkles, Loader2, Heart, RefreshCw, Plus } from 'lucide-react';
import { api } from '../utils/api';
import { useUser } from '../context/UserContext';

export default function AISuggestionModal({ categories, onClose, onSelectDate, onDatesAdded }) {
  const { currentUser } = useUser();
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
    { value: 'low', label: 'Low energy (cozy & chill)' },
    { value: 'moderate', label: 'Moderate (balanced)' },
    { value: 'high', label: 'High energy (active & exciting)' },
  ];

  const budgets = [
    { value: 'free', label: 'Free' },
    { value: 'low', label: 'Budget-friendly ($)' },
    { value: 'moderate', label: 'Moderate ($$)' },
    { value: 'high', label: 'Splurge ($$$)' },
  ];

  const settings = [
    { value: 'home', label: '🏡 At Home' },
    { value: 'outdoors', label: '🌳 Outdoors' },
    { value: 'any', label: '🌍 Anywhere' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.mood) {
      setError('Please select your current mood');
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
      setError(err.message || 'Failed to get AI suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSuggestionSelection = (index) => {
    const suggestion = suggestions.suggestions[index];
    // Only allow selecting new dates (not from library)
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
      alert('Please select at least one date to add');
      return;
    }

    setAddingDates(true);
    try {
      const selectedItems = Array.from(selectedSuggestions)
        .map(index => suggestions.suggestions[index])
        .filter(s => !s.isFromLibrary); // Only add new dates

      for (const suggestion of selectedItems) {
        // Create new date in library
        // Find the best matching category based on setting
        let categoryId = categories[0]?.id;

        if (suggestion.categoryId) {
          categoryId = suggestion.categoryId;
        } else if (formData.setting) {
          // Try to match setting to category type
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

      alert(`Added ${selectedItems.length} date(s) to your library!`);
      setSelectedSuggestions(new Set());
      setSuggestions(null);

      // Call the callback to refresh data in parent
      if (onDatesAdded) {
        onDatesAdded();
      }

      onClose();
    } catch (error) {
      console.error('Error adding dates:', error);
      alert('Failed to add some dates. Please try again.');
    } finally {
      setAddingDates(false);
    }
  };

  const handleReset = () => {
    setSuggestions(null);
    setError(null);
    setSelectedSuggestions(new Set());
  };

  // Count how many new dates are available to add
  const newDatesCount = suggestions?.suggestions?.filter(s => !s.isFromLibrary).length || 0;
  const selectedNewDatesCount = Array.from(selectedSuggestions).filter(
    index => !suggestions.suggestions[index].isFromLibrary
  ).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-pink-500 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-white" />
            <h3 className="text-xl font-bold text-white">AI Date Suggester</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {!suggestions ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <p className="text-gray-600 text-sm">
              Tell us about your mood and preferences, and we'll suggest the perfect date from your library or new ideas!
            </p>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Mood Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What's your mood today? *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {moods.map((mood) => (
                  <button
                    key={mood.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, mood: mood.value })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${formData.mood === mood.value
                      ? 'bg-primary-100 border-2 border-primary-500 text-primary-700'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100 text-gray-700'
                      }`}
                  >
                    {mood.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Activity Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Energy level preference
              </label>
              <select
                value={formData.activityLevel}
                onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value })}
                className="input-field"
              >
                {activityLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget
              </label>
              <select
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="input-field"
              >
                {budgets.map((budget) => (
                  <option key={budget.value} value={budget.value}>
                    {budget.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Setting Preference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred setting
              </label>
              <div className="grid grid-cols-2 gap-2">
                {settings.map((setting) => (
                  <button
                    key={setting.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, setting: setting.value })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${formData.setting === setting.value
                      ? 'bg-primary-100 border-2 border-primary-500 text-primary-700'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100 text-gray-700'
                      } ${setting.value === 'any' ? 'col-span-2' : ''}`}
                  >
                    {setting.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Any specific interests today?
              </label>
              <input
                type="text"
                value={formData.interests}
                onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                className="input-field"
                placeholder="e.g., nature, music, food, art..."
              />
            </div>

            {/* Special Occasion */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special occasion? (optional)
              </label>
              <input
                type="text"
                value={formData.specialOccasion}
                onChange={(e) => setFormData({ ...formData, specialOccasion: e.target.value })}
                className="input-field"
                placeholder="e.g., anniversary, birthday, just because..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Finding perfect dates...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Get AI Suggestions
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">AI Recommendations</h4>
              <button
                onClick={handleReset}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Try again
              </button>
            </div>

            {suggestions.message && (
              <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">
                {suggestions.message}
              </p>
            )}

            <div className="space-y-3">
              {suggestions.suggestions?.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => toggleSuggestionSelection(index)}
                  className={`border rounded-lg p-4 transition-all ${suggestion.isFromLibrary
                    ? 'cursor-not-allowed opacity-75 border-gray-200 bg-gray-50'
                    : selectedSuggestions.has(index)
                      ? 'cursor-pointer border-primary-500 bg-primary-50'
                      : 'cursor-pointer border-gray-200 hover:border-primary-300 hover:bg-primary-50/30'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    {!suggestion.isFromLibrary && (
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${selectedSuggestions.has(index)
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300'
                        }`}>
                        {selectedSuggestions.has(index) && (
                          <span className="text-white text-sm">✓</span>
                        )}
                      </div>
                    )}
                    {suggestion.isFromLibrary && (
                      <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-400">ℹ️</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{suggestion.title}</h5>
                      {suggestion.description && (
                        <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                      )}
                      {suggestion.reason && (
                        <p className="text-xs text-primary-600 mt-2 italic">
                          ✨ {suggestion.reason}
                        </p>
                      )}
                      {suggestion.isFromLibrary && (
                        <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Already in your library
                        </span>
                      )}
                      {!suggestion.isFromLibrary && (
                        <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Plus className="w-3 h-3" />
                          New - tap to select
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {newDatesCount > 0 && selectedNewDatesCount > 0 && (
              <button
                onClick={handleAddSelectedDates}
                disabled={addingDates}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2"
              >
                {addingDates ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Adding dates...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Add {selectedNewDatesCount} {selectedNewDatesCount === 1 ? 'Date' : 'Dates'}
                  </>
                )}
              </button>
            )}

            {newDatesCount === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                All suggestions are already in your library. Great collection! 🎉
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full btn-secondary py-2"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
