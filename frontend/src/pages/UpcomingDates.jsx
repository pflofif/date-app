import { useState, useEffect } from 'react';
import { Calendar, Check, CalendarClock, Pencil, X } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import ScheduleDateModal from '../components/ScheduleDateModal';
import ConfirmationModal from '../components/ConfirmationModal';

export default function UpcomingDates() {
  const { t, getLocalizedField, language } = useLanguage();
  const [plannedDates, setPlannedDates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDate, setEditingDate] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    type: null, // 'complete' or 'cancel'
    dateId: null,
    dateTitle: ''
  });
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [datesData, categoriesData] = await Promise.all([
        api.getDates({ status: 'planned' }),
        api.getCategories(),
      ]);

      // Sort by scheduled date (soonest first)
      const sorted = datesData.sort((a, b) => {
        if (!a.scheduledDate) return 1;
        if (!b.scheduledDate) return -1;
        return new Date(a.scheduledDate) - new Date(b.scheduledDate);
      });

      setPlannedDates(sorted);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsDone = (date) => {
    setConfirmationModal({
      isOpen: true,
      type: 'complete',
      dateId: date.id,
      dateTitle: getLocalizedField(date, 'title')
    });
  };

  const handleCancelSchedule = (date) => {
    setConfirmationModal({
      isOpen: true,
      type: 'cancel',
      dateId: date.id,
      dateTitle: getLocalizedField(date, 'title')
    });
  };

  const confirmAction = async () => {
    try {
      if (confirmationModal.type === 'complete') {
        await api.updateDate(confirmationModal.dateId, { status: 'completed' });
        showSuccess(t('toast.dateMarkedComplete'));
      } else if (confirmationModal.type === 'cancel') {
        await api.updateDate(confirmationModal.dateId, { status: 'idle', scheduledDate: null });
        showSuccess(t('toast.dateCanceled'));
      }
      setConfirmationModal({ isOpen: false, type: null, dateId: null, dateTitle: '' });
      loadData();
    } catch (error) {
      console.error('Error updating date:', error);
      showError(confirmationModal.type === 'complete' ? t('errors.failedToUpdate') : t('errors.failedToUpdate'));
    }
  };

  const handleEditSchedule = (date) => {
    setEditingDate(date);
    setShowScheduleModal(true);
  };

  const handleReschedule = async (scheduledDateTime) => {
    try {
      await api.updateDate(editingDate.id, {
        scheduledDate: scheduledDateTime
      });
      showSuccess(t('toast.dateRescheduledSuccess'));
      setEditingDate(null);
      setShowScheduleModal(false);
      loadData();
    } catch (error) {
      console.error('Error rescheduling date:', error);
      showError(t('errors.failedToReschedule'));
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return { dateStr: t('upcomingDates.notScheduled'), timeStr: '', badge: '', isPast: false };

    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

    const locale = language === 'uk' ? 'uk-UA' : 'en-US';
    const dateStr = date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });

    const timeStr = date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit'
    });

    let badge = '';
    if (diffDays === 0) badge = t('upcomingDates.today');
    else if (diffDays === 1) badge = t('upcomingDates.tomorrow');
    else if (diffDays > 1 && diffDays < 7) badge = `${t('upcomingDates.inDays')} ${diffDays} ${t('upcomingDates.days')}`;
    else if (diffDays < 0) badge = t('upcomingDates.overdue');

    return { dateStr, timeStr, badge, isPast: diffDays < 0 };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('upcomingDates.title')}</h2>
        <p className="text-gray-600">{t('upcomingDates.subtitle')}</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : plannedDates.length === 0 ? (
        <div className="text-center py-12">
          <CalendarClock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">{t('upcomingDates.noUpcomingDates')}</p>
          <p className="text-sm text-gray-400 mt-2">{t('upcomingDates.useRandomizer')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plannedDates.map((date) => {
            const category = categories.find(c => c.id === date.category);
            const { dateStr, timeStr, badge, isPast } = formatDateTime(date.scheduledDate);

            return (
              <div
                key={date.id}
                className={`card hover:shadow-md transition-shadow ${isPast ? 'border-l-4 border-red-500' : 'border-l-4 border-primary-500'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      <Calendar className={`w-5 h-5 mt-0.5 ${isPast ? 'text-red-600' : 'text-primary-600'}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {getLocalizedField(date, 'title')}
                          </h3>
                          {badge && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isPast ? 'bg-red-100 text-red-700' : 'bg-primary-100 text-primary-700'
                              }`}>
                              {badge}
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-gray-600 mb-2">
                          <div className="font-medium">{dateStr} {timeStr && `- ${timeStr}`}</div>
                        </div>

                        {getLocalizedField(date, 'description') && (
                          <p className="text-sm text-gray-600 mb-3">
                            {getLocalizedField(date, 'description')}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full">
                            {getLocalizedField(category, 'name') || t('categoryModal.other')}
                          </span>
                          {getLocalizedField(date, 'subCategory') && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                              {getLocalizedField(date, 'subCategory')}
                            </span>
                          )}
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                            {date.author}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditSchedule(date)}
                      className="btn-secondary flex items-center gap-2 whitespace-nowrap"
                      title={t('upcomingDates.reschedule')}
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="hidden sm:inline">{t('upcomingDates.reschedule')}</span>
                    </button>
                    <button
                      onClick={() => handleCancelSchedule(date)}
                      className="btn-secondary flex items-center gap-2 whitespace-nowrap"
                      title={t('upcomingDates.cancelSchedule')}
                    >
                      <X className="w-4 h-4" />
                      <span className="hidden sm:inline">{t('upcomingDates.cancelSchedule')}</span>
                    </button>
                    <button
                      onClick={() => handleMarkAsDone(date)}
                      className="btn-primary flex items-center gap-2 whitespace-nowrap"
                    >
                      <Check className="w-4 h-4" />
                      <span className="hidden sm:inline">{t('upcomingDates.markDone')}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showScheduleModal && editingDate && (
        <ScheduleDateModal
          date={editingDate}
          onSchedule={handleReschedule}
          onClose={() => {
            setShowScheduleModal(false);
            setEditingDate(null);
          }}
        />
      )}

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        title={confirmationModal.type === 'complete' ? t('confirmationModal.markAsCompleted') : t('confirmationModal.cancelScheduledDate')}
        message={
          confirmationModal.type === 'complete'
            ? `${t('confirmation.markAsCompletedConfirm')} "${confirmationModal.dateTitle}"`
            : `${t('confirmationModal.cancelScheduledDate')} "${confirmationModal.dateTitle}" ${t('confirmation.cancelScheduledConfirm')}`
        }
        confirmText={confirmationModal.type === 'complete' ? t('confirmationModal.markComplete') : t('upcomingDates.cancelSchedule')}
        cancelText={t('confirmationModal.goBack')}
        variant="warning"
        onConfirm={confirmAction}
        onCancel={() => setConfirmationModal({ isOpen: false, type: null, dateId: null, dateTitle: '' })}
      />
    </div>
  );
}
