import { useState, useEffect } from 'react';
import { Shuffle, Check, X, Sparkles } from 'lucide-react';
import { api } from '../utils/api';

export default function Randomizer() {
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [randomDate, setRandomDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);

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
      alert('Please select at least one category');
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
        alert(error.message || 'No available dates found with selected categories');
      } finally {
        setLoading(false);
        setSpinning(false);
      }
    }, 1000);
  };

  const handleAccept = async () => {
    if (!randomDate) return;

    try {
      await api.updateDate(randomDate.id, { isUsed: true });
      alert('Great! This date has been marked as used and moved to history.');
      setRandomDate(null);
      setSelectedCategories([]);
    } catch (error) {
      console.error('Error accepting date:', error);
      alert('Failed to mark date as used');
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
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Date Randomizer</h2>
        <p className="text-gray-600">Select categories and spin for a surprise!</p>
      </div>

      {!randomDate ? (
        <>
          {/* Category Selection */}
          <div className="card mb-6">
            <h3 className="font-semibold text-lg mb-4 text-gray-900">
              Select Categories
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedCategories.includes(cat.id)
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{cat.name}</div>
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
                  Spinning...
                </>
              ) : (
                <>
                  <Shuffle className="w-6 h-6" />
                  Spin the Wheel!
                </>
              )}
            </button>
            <p className="text-sm text-gray-500 mt-3">
              {selectedCategories.length} {selectedCategories.length === 1 ? 'category' : 'categories'} selected
            </p>
          </div>
        </>
      ) : (
        /* Result Card */
        <div className="card text-center animate-fadeIn">
          <div className="mb-4">
            <Sparkles className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {randomDate.title}
            </h3>
            
            {randomDate.description && (
              <p className="text-gray-600 mb-4 whitespace-pre-wrap">
                {randomDate.description}
              </p>
            )}
            
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                {category?.name || 'Unknown'}
              </span>
              {randomDate.subCategory && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  {randomDate.subCategory}
                </span>
              )}
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                By {randomDate.author}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleAccept}
              className="btn-primary flex items-center justify-center gap-2 flex-1 sm:flex-initial"
            >
              <Check className="w-5 h-5" />
              Accept & Mark as Used
            </button>
            <button
              onClick={handleReroll}
              className="btn-secondary flex items-center justify-center gap-2 flex-1 sm:flex-initial"
            >
              <Shuffle className="w-5 h-5" />
              Reroll
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
