import { useState, useEffect } from 'react';
import { Calendar, Check, CalendarClock, Pencil, X } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import ScheduleDateModal from '../components/ScheduleDateModal';
import ConfirmationModal from '../components/ConfirmationModal';

export default function UpcomingDates() {
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
      dateTitle: date.title
    });
  };

  const handleCancelSchedule = (date) => {
    setConfirmationModal({
      isOpen: true,
      type: 'cancel',
      dateId: date.id,
      dateTitle: date.title
    });
  };

  const confirmAction = async () => {
    try {
      if (confirmationModal.type === 'complete') {
        await api.updateDate(confirmationModal.dateId, { status: 'completed' });
        showSuccess('Date marked as completed!');
      } else if (confirmationModal.type === 'cancel') {
        await api.updateDate(confirmationModal.dateId, { status: 'idle', scheduledDate: null });
        showSuccess('Date canceled and returned to library');
      }
      setConfirmationModal({ isOpen: false, type: null, dateId: null, dateTitle: '' });
      loadData();
    } catch (error) {
      console.error('Error updating date:', error);
      showError(`Failed to ${confirmationModal.type === 'complete' ? 'mark date as completed' : 'cancel scheduled date'}`);
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
      showSuccess('Date rescheduled successfully!');
      setEditingDate(null);
      setShowScheduleModal(false);
      loadData();
    } catch (error) {
      console.error('Error rescheduling date:', error);
      showError('Failed to reschedule date');
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not scheduled';

    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    let badge = '';
    if (diffDays === 0) badge = '🔥 Today';
    else if (diffDays === 1) badge = '⭐ Tomorrow';
    else if (diffDays < 7) badge = `📅 In ${diffDays} days`;
    else if (diffDays < 0) badge = '⚠️ Overdue';

    return { dateStr, timeStr, badge, isPast: diffDays < 0 };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upcoming Dates</h2>
        <p className="text-gray-600">Your scheduled date adventures</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : plannedDates.length === 0 ? (
        <div className="text-center py-12">
          <CalendarClock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No upcoming dates scheduled yet.</p>
          <p className="text-sm text-gray-400 mt-2">Use the Randomizer to select and schedule dates!</p>
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
                            {date.title}
                          </h3>
                          {badge && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isPast ? 'bg-red-100 text-red-700' : 'bg-primary-100 text-primary-700'
                              }`}>
                              {badge}
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-gray-600 mb-2">
                          <div className="font-medium">{dateStr} at {timeStr}</div>
                        </div>

                        {date.description && (
                          <p className="text-sm text-gray-600 mb-3">
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
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditSchedule(date)}
                      className="btn-secondary flex items-center gap-2 whitespace-nowrap"
                      title="Change date/time"
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="hidden sm:inline">Reschedule</span>
                    </button>
                    <button
                      onClick={() => handleCancelSchedule(date)}
                      className="btn-secondary flex items-center gap-2 whitespace-nowrap"
                      title="Cancel and move back to available"
                    >
                      <X className="w-4 h-4" />
                      <span className="hidden sm:inline">Cancel</span>
                    </button>
                    <button
                      onClick={() => handleMarkAsDone(date)}
                      className="btn-primary flex items-center gap-2 whitespace-nowrap"
                    >
                      <Check className="w-4 h-4" />
                      <span className="hidden sm:inline">Done</span>
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
        title={confirmationModal.type === 'complete' ? 'Mark as Completed' : 'Cancel Scheduled Date'}
        message={
          confirmationModal.type === 'complete'
            ? `Mark "${confirmationModal.dateTitle}" as completed? It will be moved to your history.`
            : `Cancel "${confirmationModal.dateTitle}" and return it to the available pool?`
        }
        confirmText={confirmationModal.type === 'complete' ? 'Mark Complete' : 'Cancel Date'}
        cancelText="Go Back"
        variant={confirmationModal.type === 'complete' ? 'warning' : 'warning'}
        onConfirm={confirmAction}
        onCancel={() => setConfirmationModal({ isOpen: false, type: null, dateId: null, dateTitle: '' })}
      />
    </div>
  );
}
