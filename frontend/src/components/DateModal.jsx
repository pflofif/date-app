import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../utils/api';

export default function DateModal({ date, categories, currentUser, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subCategory: '',
    author: currentUser,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (date) {
      setFormData({
        title: date.title,
        description: date.description,
        category: date.category,
        subCategory: date.subCategory || '',
        author: date.author,
      });
    }
  }, [date]);

  const selectedCategory = categories.find(c => c.id === formData.category);
  const showSubCategory = selectedCategory?.subCategories?.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category) {
      alert('Title and category are required');
      return;
    }

    setLoading(true);
    try {
      if (date) {
        await api.updateDate(date.id, formData);
      } else {
        await api.createDate(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving date:', error);
      alert('Failed to save date idea');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">
            {date ? 'Edit Date Idea' : 'New Date Idea'}
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
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              placeholder="e.g., Picnic at Central Park"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              rows="4"
              placeholder="Add details, links, costs, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value, subCategory: '' })}
              className="input-field"
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {showSubCategory && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sub-Category
              </label>
              <select
                value={formData.subCategory}
                onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                className="input-field"
              >
                <option value="">Select sub-category (optional)</option>
                {selectedCategory.subCategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Added By *
            </label>
            <select
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className="input-field"
              required
            >
              <option value="User 1">User 1</option>
              <option value="User 2">User 2</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? 'Saving...' : date ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
