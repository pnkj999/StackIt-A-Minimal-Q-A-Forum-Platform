import React, { useState } from 'react';

const reasons = [
  'Spam',
  'Abusive or Harassment',
  'Off-topic',
  'Plagiarism',
  'Other'
];

const ReportModal = ({ isOpen, onClose, onSubmit, targetType, targetId }) => {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return;
    setSubmitting(true);
    await onSubmit({ targetType, targetId, reason, details });
    setSubmitting(false);
    setReason('');
    setDetails('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Report {targetType === 'question' ? 'Question' : 'Answer'}</h2>
        <form onSubmit={handleSubmit}>
          <label className="block mb-2 font-medium">Reason</label>
          <select
            className="w-full border rounded p-2 mb-4"
            value={reason}
            onChange={e => setReason(e.target.value)}
            required
          >
            <option value="">Select a reason</option>
            {reasons.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <label className="block mb-2 font-medium">Details (optional)</label>
          <textarea
            className="w-full border rounded p-2 mb-4"
            value={details}
            onChange={e => setDetails(e.target.value)}
            rows={3}
            placeholder="Add more details (optional)"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              disabled={!reason || submitting}
            >
              {submitting ? 'Reporting...' : 'Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal; 