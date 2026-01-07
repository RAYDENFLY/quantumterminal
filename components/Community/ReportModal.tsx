'use client';

import { useEffect, useMemo, useState } from 'react';

export type ReportTargetType = 'post' | 'comment';
export type ReportReason = 'spam' | 'abuse' | 'misinformation' | 'scam' | 'copyright' | 'other';

const REASONS: Array<{ id: ReportReason; label: string; hint: string }> = [
  { id: 'spam', label: 'Spam', hint: 'Promotional spam, repetitive content.' },
  { id: 'abuse', label: 'Abuse / Harassment', hint: 'Hate speech, harassment, threats.' },
  { id: 'misinformation', label: 'Misinformation', hint: 'Clearly false or misleading claims.' },
  { id: 'scam', label: 'Scam / Fraud', hint: 'Phishing links, impersonation, rugpull promos.' },
  { id: 'copyright', label: 'Copyright', hint: 'Stolen content or DMCA-related.' },
  { id: 'other', label: 'Other', hint: 'Anything else.' },
];

export default function ReportModal(props: {
  open: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  contextLabel?: string;
  onReported?: () => void;
}) {
  const { open, onClose, targetType, targetId, contextLabel, onReported } = props;

  const [reason, setReason] = useState<ReportReason>('spam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hint = useMemo(() => REASONS.find((r) => r.id === reason)?.hint ?? '', [reason]);

  useEffect(() => {
    if (!open) return;
    // reset per open so it feels clean
    setReason('spam');
    setDetails('');
    setError(null);
    setSubmitting(false);
  }, [open]);

  async function submit() {
    if (!targetId) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/community/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          details: details.trim(),
        }),
      });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok || !json?.success) {
        setError(json?.error || 'Failed to submit report.');
        return;
      }
      onReported?.();
      onClose();
    } catch {
      setError('Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-xl border border-terminal-border bg-terminal-panel p-5 text-terminal-text">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">Report {targetType}</div>
            <div className="mt-1 text-xs text-gray-400">
              Help us keep the community clean. Reports are reviewed by admins.
              {contextLabel ? <span className="ml-1 text-gray-500">({contextLabel})</span> : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-terminal-border px-2 py-1 text-xs text-gray-200 hover:border-terminal-accent"
          >
            Close
          </button>
        </div>

        <div className="mt-4">
          <label className="text-xs text-gray-400">Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as ReportReason)}
            className="mt-1 w-full rounded-md border border-terminal-border bg-terminal-bg px-3 py-2 text-sm"
          >
            {REASONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          {hint ? <div className="mt-1 text-xs text-gray-500">{hint}</div> : null}
        </div>

        <div className="mt-4">
          <label className="text-xs text-gray-400">Details (optional)</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Add any helpful context (links, what happened, etc.)"
            maxLength={2000}
            className="mt-1 h-24 w-full rounded-md border border-terminal-border bg-terminal-bg px-3 py-2 text-sm"
          />
          <div className="mt-1 text-xs text-gray-500">{details.length}/2000</div>
        </div>

        {error ? <div className="mt-3 text-sm text-red-300">{error}</div> : null}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-terminal-border px-3 py-2 text-xs text-gray-200 hover:border-terminal-accent"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="rounded-md bg-terminal-accent px-4 py-2 text-xs font-semibold text-terminal-bg disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit report'}
          </button>
        </div>
      </div>
    </div>
  );
}
