import { useState, useEffect } from 'react';
import { RotateCcw, Calendar } from 'lucide-react';
import { api } from '../utils/api';

export default function DateHistory() {
  const [usedDates, setUsedDates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [datesData, categoriesData] = await Promise.all([
        api.getDates({ isUsed: true }),
        api.getCategories(),
      ]);
      setUsedDates(datesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (id) => {
    if (!confirm('Reset this date back to available pool?')) return;

    try {
      await api.updateDate(id, { isUsed: false });
      loadData();
    } catch (error) {
      console.error('Error resetting date:', error);
      alert('Failed to reset date');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Date History</h2>
        <p className="text-gray-600">Your completed date adventures</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : usedDates.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No completed dates yet. Start spinning!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {usedDates.map((date) => {
            const category = categories.find(c => c.id === date.category);
            return (
              <div key={date.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg text-gray-900 flex-1">
                    {date.title}
                  </h3>
                  <button
                    onClick={() => handleReset(date.id)}
                    className="p-1.5 text-gray-600 hover:text-primary-600 rounded ml-2"
                    title="Reset to available"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
                
                {date.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {date.description}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-2 text-xs mb-3">
                  <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full">
                    {category?.name || 'Unknown'}
                  </span>
                  {date.subCategory && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                      {date.subCategory}
                    </span>
                  )}
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {date.author}
                  </span>
                </div>
                
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Added {formatDate(date.createdAt)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
