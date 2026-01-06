'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faHandHoldingDollar,
  faSave,
  faPlus,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';

type DonationCategory = 'project' | 'social' | 'dev_support' | 'exchange_transfer';

type DonationOutgoing = {
  txHash: string;
  date: string; // ISO string for form
  amountBNB: number;
  category: DonationCategory;
  purpose: string;
  counterparty?: string;
};

type DonationLog = {
  _id?: string;
  period: string;
  network: 'BSC';
  donationWallet: string;
  summary?: {
    startingBalanceBNB?: number;
    totalInBNB?: number;
    totalOutBNB?: number;
    endingBalanceBNB?: number;
    statement?: string;
  };
  outgoing: DonationOutgoing[];
  incoming?: {
    mode: 'summary' | 'detailed';
    explorerUrl?: string;
    txHashes?: string[];
  };
  notes?: string;
  publishedAt?: string;
  updatedAt?: string;
};

const DONATION_WALLET_DEFAULT = '0xD4233500BAE4973782c5eaA427A667ABd6FE9e5f';

function nowISODateOnly() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

function toInputDatetimeLocal(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toISOStringFromLocal(value: string) {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export default function AdminDonationLogsPage() {
  const router = useRouter();

  const [logs, setLogs] = useState<DonationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedPeriod, setSelectedPeriod] = useState<string>(nowISODateOnly());

  const selectedLog = useMemo(() => logs.find((l) => l.period === selectedPeriod) ?? null, [logs, selectedPeriod]);

  const [form, setForm] = useState<DonationLog>({
    period: nowISODateOnly(),
    network: 'BSC',
    donationWallet: DONATION_WALLET_DEFAULT,
    summary: {
      statement: 'Totals are verifiable via tx hashes + explorer history. This log adds spending categories and purpose descriptions.',
    },
    outgoing: [],
    incoming: {
      mode: 'summary',
      explorerUrl: `https://bscscan.com/address/${DONATION_WALLET_DEFAULT}`,
    },
    notes: '',
  });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // When logs loaded/period changed, load into form.
    if (selectedLog) {
      setForm({
        ...selectedLog,
        // normalize dates for inputs
        publishedAt: selectedLog.publishedAt ? toInputDatetimeLocal(selectedLog.publishedAt) : '',
        outgoing: (selectedLog.outgoing ?? []).map((o) => ({
          ...o,
          date: o.date ? toInputDatetimeLocal(o.date) : '',
        })),
      });
      return;
    }

    // New entry template for the selected period
    setForm((prev) => ({
      ...prev,
      period: selectedPeriod,
    }));
  }, [selectedPeriod, selectedLog]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/donation-logs');
      if (!res.ok) {
        setError('Unauthorized or failed to load donation logs');
        return;
      }
      const json = await res.json();
      if (json?.success) {
        setLogs(json.data || []);
        if (Array.isArray(json.data) && json.data.length > 0) {
          setSelectedPeriod(json.data[0].period);
        }
      } else {
        setError(json?.error ?? 'Failed to load donation logs');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load donation logs');
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        ...form,
        period: form.period,
        donationWallet: form.donationWallet,
        publishedAt: toISOStringFromLocal(form.publishedAt ?? ''),
        outgoing: (form.outgoing ?? []).map((o) => ({
          ...o,
          date: toISOStringFromLocal(o.date ?? '') ?? o.date,
        })),
      };

      const res = await fetch('/api/admin/donation-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error ?? 'Failed to save donation log');
        return;
      }

      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save donation log');
    } finally {
      setSaving(false);
    }
  };

  const addOutgoing = () => {
    setForm((prev) => ({
      ...prev,
      outgoing: [
        ...(prev.outgoing ?? []),
        {
          txHash: '',
          date: '',
          amountBNB: 0,
          category: 'project',
          purpose: '',
          counterparty: '',
        },
      ],
    }));
  };

  const removeOutgoing = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      outgoing: prev.outgoing.filter((_, i) => i !== idx),
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-terminal-bg text-terminal-accent flex items-center justify-center">
        <div className="text-xl">Loading donation logs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-accent">
      <div className="bg-terminal-panel border-b border-terminal-border p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="px-3 py-2 bg-terminal-accent text-terminal-bg rounded hover:bg-terminal-accent/90 transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
              Back
            </button>
            <h1 className="text-2xl font-bold flex items-center">
              <FontAwesomeIcon icon={faHandHoldingDollar} className="w-6 h-6 mr-3" />
              Donation Logs
            </h1>
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 bg-terminal-accent text-terminal-bg rounded hover:bg-terminal-accent/90 transition-colors disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faSave} className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="p-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4">
          <div className="text-sm font-semibold mb-3">Periode</div>

          <div className="flex gap-2">
            <input
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              placeholder="YYYY-MM"
              className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded text-terminal-accent placeholder-gray-500 focus:outline-none focus:border-terminal-accent"
            />
            <button
              onClick={() => {
                setLogs((prev) => {
                  if (prev.some((l) => l.period === selectedPeriod)) return prev;
                  return [
                    {
                      period: selectedPeriod,
                      network: 'BSC',
                      donationWallet: DONATION_WALLET_DEFAULT,
                      summary: {
                        statement:
                          'Totals are verifiable via tx hashes + explorer history. This log adds spending categories and purpose descriptions.',
                      },
                      outgoing: [],
                      incoming: {
                        mode: 'summary',
                        explorerUrl: `https://bscscan.com/address/${DONATION_WALLET_DEFAULT}`,
                      },
                      notes: '',
                    },
                    ...prev,
                  ];
                });
              }}
              className="px-3 py-2 bg-terminal-bg border border-terminal-border rounded hover:border-terminal-accent transition-colors"
              title="New period"
            >
              <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 max-h-[60vh] overflow-auto">
            <ul className="space-y-2">
              {logs.map((l) => (
                <li key={l.period}>
                  <button
                    onClick={() => setSelectedPeriod(l.period)}
                    className={`w-full text-left px-3 py-2 rounded border transition-colors ${
                      selectedPeriod === l.period
                        ? 'border-terminal-accent bg-terminal-bg'
                        : 'border-terminal-border bg-terminal-panel hover:border-terminal-accent'
                    }`}
                  >
                    <div className="text-sm font-semibold text-terminal-accent">{l.period}</div>
                    <div className="text-xs text-gray-400">
                      updated {l.updatedAt ? new Date(l.updatedAt).toLocaleDateString() : '-'}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4">
          {error ? (
            <div className="mb-4 rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs text-gray-400">Period (YYYY-MM)</label>
              <input
                value={form.period}
                onChange={(e) => setForm((p) => ({ ...p, period: e.target.value }))}
                className="mt-1 w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded text-terminal-accent focus:outline-none focus:border-terminal-accent"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Donation Wallet</label>
              <input
                value={form.donationWallet}
                onChange={(e) => setForm((p) => ({ ...p, donationWallet: e.target.value }))}
                className="mt-1 w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded text-terminal-accent focus:outline-none focus:border-terminal-accent"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs text-gray-400">Starting Balance (BNB)</label>
              <input
                type="number"
                value={form.summary?.startingBalanceBNB ?? ''}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    summary: { ...p.summary, startingBalanceBNB: Number(e.target.value) },
                  }))
                }
                className="mt-1 w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded text-terminal-accent focus:outline-none focus:border-terminal-accent"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Ending Balance (BNB)</label>
              <input
                type="number"
                value={form.summary?.endingBalanceBNB ?? ''}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    summary: { ...p.summary, endingBalanceBNB: Number(e.target.value) },
                  }))
                }
                className="mt-1 w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded text-terminal-accent focus:outline-none focus:border-terminal-accent"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Total In (BNB)</label>
              <input
                type="number"
                value={form.summary?.totalInBNB ?? ''}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    summary: { ...p.summary, totalInBNB: Number(e.target.value) },
                  }))
                }
                className="mt-1 w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded text-terminal-accent focus:outline-none focus:border-terminal-accent"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Total Out (BNB)</label>
              <input
                type="number"
                value={form.summary?.totalOutBNB ?? ''}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    summary: { ...p.summary, totalOutBNB: Number(e.target.value) },
                  }))
                }
                className="mt-1 w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded text-terminal-accent focus:outline-none focus:border-terminal-accent"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="text-xs text-gray-400">Published At</label>
            <input
              type="datetime-local"
              value={form.publishedAt ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, publishedAt: e.target.value }))}
              className="mt-1 w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded text-terminal-accent focus:outline-none focus:border-terminal-accent"
            />
          </div>

          <div className="mt-4">
            <label className="text-xs text-gray-400">Notes</label>
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={3}
              className="mt-1 w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded text-terminal-accent focus:outline-none focus:border-terminal-accent"
            />
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm font-semibold">Outgoing (categorized)</div>
            <button
              onClick={addOutgoing}
              className="px-3 py-2 bg-terminal-bg border border-terminal-border rounded hover:border-terminal-accent transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="w-4 h-4 mr-2" />
              Add
            </button>
          </div>

          {form.outgoing.length === 0 ? (
            <div className="mt-3 text-sm text-gray-400">No outgoing entries yet.</div>
          ) : (
            <div className="mt-3 space-y-3">
              {form.outgoing.map((o, idx) => (
                <div key={idx} className="rounded border border-terminal-border bg-terminal-bg p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400">Entry #{idx + 1}</div>
                    <button
                      onClick={() => removeOutgoing(idx)}
                      className="text-red-300 hover:text-red-200"
                      title="Remove"
                    >
                      <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="text-xs text-gray-400">Tx Hash</label>
                      <input
                        value={o.txHash}
                        onChange={(e) =>
                          setForm((p) => {
                            const copy = [...p.outgoing];
                            copy[idx] = { ...copy[idx], txHash: e.target.value };
                            return { ...p, outgoing: copy };
                          })
                        }
                        className="mt-1 w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent focus:outline-none focus:border-terminal-accent"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Date</label>
                      <input
                        type="datetime-local"
                        value={o.date}
                        onChange={(e) =>
                          setForm((p) => {
                            const copy = [...p.outgoing];
                            copy[idx] = { ...copy[idx], date: e.target.value };
                            return { ...p, outgoing: copy };
                          })
                        }
                        className="mt-1 w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent focus:outline-none focus:border-terminal-accent"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Amount (BNB)</label>
                      <input
                        type="number"
                        value={o.amountBNB}
                        onChange={(e) =>
                          setForm((p) => {
                            const copy = [...p.outgoing];
                            copy[idx] = { ...copy[idx], amountBNB: Number(e.target.value) };
                            return { ...p, outgoing: copy };
                          })
                        }
                        className="mt-1 w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent focus:outline-none focus:border-terminal-accent"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Category</label>
                      <select
                        value={o.category}
                        onChange={(e) =>
                          setForm((p) => {
                            const copy = [...p.outgoing];
                            copy[idx] = { ...copy[idx], category: e.target.value as DonationCategory };
                            return { ...p, outgoing: copy };
                          })
                        }
                        className="mt-1 w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent focus:outline-none focus:border-terminal-accent"
                      >
                        <option value="project">project</option>
                        <option value="social">social</option>
                        <option value="dev_support">dev_support</option>
                        <option value="exchange_transfer">exchange_transfer</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="text-xs text-gray-400">Purpose</label>
                    <input
                      value={o.purpose}
                      onChange={(e) =>
                        setForm((p) => {
                          const copy = [...p.outgoing];
                          copy[idx] = { ...copy[idx], purpose: e.target.value };
                          return { ...p, outgoing: copy };
                        })
                      }
                      className="mt-1 w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent focus:outline-none focus:border-terminal-accent"
                    />
                  </div>

                  <div className="mt-3">
                    <label className="text-xs text-gray-400">Counterparty (optional)</label>
                    <input
                      value={o.counterparty ?? ''}
                      onChange={(e) =>
                        setForm((p) => {
                          const copy = [...p.outgoing];
                          copy[idx] = { ...copy[idx], counterparty: e.target.value };
                          return { ...p, outgoing: copy };
                        })
                      }
                      className="mt-1 w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent focus:outline-none focus:border-terminal-accent"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
