import { useState } from 'react';
import { X, Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from './ConfirmationModal';

export default function CategoryModal({ categories, onClose }) {
  const [editingCategory, setEditingCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Outdoors',
    subCategories: '',
  });
  const [loading, setLoading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, categoryId: null, categoryName: '' });
  const { showSuccess, showError, showWarning } = useToast();

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      subCategories: category.subCategories ? category.subCategories.join(', ') : '',
    });
    setShowForm(true);
  };

  const handleDelete = (category) => {
    setDeleteConfirmation({
      isOpen: true,
      categoryId: category.id,
      categoryName: category.name
    });
  };

  const confirmDelete = async () => {
    try {
      await api.deleteCategory(deleteConfirmation.categoryId);
      showSuccess('Category deleted successfully');
      setDeleteConfirmation({ isOpen: false, categoryId: null, categoryName: '' });
      onClose();
    } catch (error) {
      console.error('Error deleting category:', error);
      showError('Failed to delete category');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.type) {
      showWarning('Name and type are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        type: formData.type,
      };

      if (formData.subCategories.trim()) {
        payload.subCategories = formData.subCategories
          .split(',')
          .map(s => s.trim())
          .filter(s => s);
      }

      if (editingCategory) {
        await api.updateCategory(editingCategory.id, payload);
        showSuccess('Category updated successfully!');
      } else {
        await api.createCategory(payload);
        showSuccess('Category created successfully!');
      }

      setShowForm(false);
      setEditingCategory(null);
      setFormData({ name: '', type: 'Outdoors', subCategories: '' });
      onClose();
    } catch (error) {
      console.error('Error saving category:', error);
      showError('Failed to save category');
    } finally {
      setLoading(false);
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
            <h3 className="text-xl font-bold text-gray-900">Manage Categories</h3>
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
                  Add New Category
                </button>

                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{category.name}</div>
                        <div className="text-sm text-gray-500">{category.type}</div>
                        {category.subCategories && category.subCategories.length > 0 && (
                          <div className="text-xs text-gray-400 mt-1">
                            Subs: {category.subCategories.join(', ')}
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
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Outdoor Adventures"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="Outdoors">Outdoors</option>
                    <option value="Indoors">Indoors</option>
                    <option value="Home">Home</option>
                    <option value="Trip">Trip</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sub-Categories (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.subCategories}
                    onChange={(e) => setFormData({ ...formData, subCategories: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Movies, Board Games, Cooking (comma separated)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate multiple sub-categories with commas
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
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
                    {loading ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteConfirmation.categoryName}"? Date ideas using this category will need to be reassigned.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmation({ isOpen: false, categoryId: null, categoryName: '' })}
      />
    </>
  );
}
