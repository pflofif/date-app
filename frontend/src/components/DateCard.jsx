import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import ConfirmationModal from './ConfirmationModal';

export default function DateCard({ date, categoryName, onEdit, onDelete, language }) {
  const { t } = useLanguage();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getStatusBadge = () => {
    const badges = {
      idle: { bg: 'bg-green-100', text: 'text-green-800', label: t('dateLibrary.available') },
      planned: { bg: 'bg-blue-100', text: 'text-blue-800', label: t('dateLibrary.scheduled') },
      completed: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('dateLibrary.completed') }
    };

    const badge = badges[date.status] || badges.idle;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getAuthorBadge = () => {
    const authors = {
      user1: { icon: '👤', label: t('settings.user1'), color: 'text-blue-600' },
      user2: { icon: '👥', label: t('settings.user2'), color: 'text-pink-600' }
    };

    const author = authors[date.author] || authors.user1;
    return (
      <span className={`text-xs font-medium ${author.color}`}>
        {author.icon} {author.label}
      </span>
    );
  };

  const title = language === 'uk' ? date.title_uk : date.title_en;
  const description = language === 'uk' ? date.description_uk : date.description_en;
  const subCategory = language === 'uk' ? date.subCategory_uk : date.subCategory_en;

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 border border-gray-200">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 mb-1">{title}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">{categoryName}</span>
              {subCategory && (
                <>
                  <span>•</span>
                  <span>{subCategory}</span>
                </>
              )}
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{description}</p>
        )}

        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          {getAuthorBadge()}
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(date)}
              className="px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            >
              ✏️ {t('dateLibrary.edit')}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              🗑️ {t('confirmation.delete')}
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmationModal
          title={t('confirmation.deleteDateIdea')}
          message={`${t('confirmation.areYouSureDelete')} "${title}"? ${t('confirmation.actionCannotBeUndone')}`}
          confirmText={t('confirmation.delete')}
          cancelText={t('confirmation.goBack')}
          onConfirm={() => {
            onDelete(date.id);
            setShowDeleteConfirm(false);
          }}
          onCancel={() => setShowDeleteConfirm(false)}
          type="danger"
        />
      )}
    </>
  );
}