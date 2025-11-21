import { useState, useEffect } from 'react';
import { Plus, Filter, Settings, Pencil, Trash2 } from 'lucide-react';
import { api } from '../utils/api';
import { useUser } from '../context/UserContext';
import DateModal from '../components/DateModal';
import CategoryModal from '../components/CategoryModal';

export default function DateLibrary() {
  const { currentUser } = useUser();
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
    if (!confirm('Are you sure you want to delete this date idea?')) return;
    
    try {
      await api.deleteDate(id);
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
        <h2 className="text-2xl font-bold text-gray-900">Date Library</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Categories
          </button>
          <button
            onClick={() => setShowDateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Date
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="input-field"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Author
            </label>
            <select
              value={filters.author}
              onChange={(e) => setFilters({ ...filters, author: e.target.value })}
              className="input-field"
            >
              <option value="">Both Users</option>
              <option value="User 1">User 1</option>
              <option value="User 2">User 2</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-field"
            >
              <option value="">All</option>
              <option value="idle">Available</option>
              <option value="planned">Scheduled</option>
              <option value="completed">Completed</option>
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
          <p className="text-gray-500">No date ideas found. Add your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDates.map((date) => {
            const category = categories.find(c => c.id === date.category);
            return (
              <div key={date.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg text-gray-900 flex-1">
                    {date.title}
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
                
                {date.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {date.description}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-2 text-xs">
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
                  {date.status === 'planned' && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      Scheduled
                    </span>
                  )}
                  {date.status === 'completed' && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                      Completed
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
    </div>
  );
}
