import { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function ScheduleDateModal({ date, onSchedule, onClose }) {
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const { showWarning } = useToast();

  useEffect(() => {
    // Pre-fill with existing scheduled date if editing
    if (date.scheduledDate) {
      const dateObj = new Date(date.scheduledDate);
      const dateStr = dateObj.toISOString().split('T')[0];
      const timeStr = dateObj.toTimeString().slice(0, 5);
      setScheduledDate(dateStr);
      setScheduledTime(timeStr);
    }
  }, [date]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!scheduledDate) {
      showWarning('Please select a date');
      return;
    }

    const dateTimeString = scheduledTime
      ? `${scheduledDate}T${scheduledTime}:00`
      : `${scheduledDate}T12:00:00`;

    onSchedule(new Date(dateTimeString).toISOString());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            <h3 className="text-xl font-bold text-gray-900">
              {date.scheduledDate ? 'Reschedule Date' : 'Schedule Date'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-primary-50 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-gray-900 mb-1">{date.title}</h4>
            {date.description && (
              <p className="text-sm text-gray-600">{date.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="input-field"
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time (optional)
            </label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
            >
              {date.scheduledDate ? 'Update' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
