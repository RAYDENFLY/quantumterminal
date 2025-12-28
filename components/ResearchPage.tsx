'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignal, faTimes, faPlus } from '@fortawesome/free-solid-svg-icons';
import useSWR from 'swr';
import { fetchResearch } from '@/lib/api-fallback';

const fetcher = (url: string) => fetchResearch(url).then((res) => res.json());

export default function ResearchPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Research form state
  const [researchForm, setResearchForm] = useState({ link: '', author: '', messageId: '' });
  const [researchSubmitting, setResearchSubmitting] = useState(false);
  const [researchSubmitMessage, setResearchSubmitMessage] = useState('');
  const [researchSubmitError, setResearchSubmitError] = useState(false);

  // Fetch research items
  const { data: researchData, error: researchError, mutate: mutateResearch } = useSWR('research', fetcher);

  // Handle research form submission
  const handleResearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResearchSubmitting(true);
    setResearchSubmitMessage('');
    setResearchSubmitError(false);

    try {
      const response = await fetchResearch('', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(researchForm),
      });

      if (response.ok) {
        setResearchSubmitMessage('Research added successfully!');
        setResearchForm({ link: '', author: '', messageId: '' });
        mutateResearch(); // Refresh the research list
        setIsModalOpen(false); // Close modal on success
      } else {
        throw new Error('Failed to add research');
      }
    } catch (error) {
      setResearchSubmitError(true);
      setResearchSubmitMessage('Error adding research. Please try again.');
    } finally {
      setResearchSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="terminal-panel mb-6">
        <h2 className="terminal-header text-2xl">📚 Research Papers</h2>
        <p className="text-gray-400 text-sm mt-2">
          Academic papers, DeFi research, blockchain analysis, and market studies
        </p>
      </div>

      {/* Add Research Button */}
      <div className="mb-6">
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-terminal-accent text-black font-medium rounded hover:bg-terminal-accent/80 transition-colors flex items-center space-x-2"
        >
          <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
          <span>Add New Research</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Loading placeholders */}
        {!researchData && !researchError && (
          <>
            <div className="bg-terminal-bg rounded-lg border border-terminal-border overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-terminal-accent mb-1">Bitcoin Network Analysis 2025</h3>
                    <p className="text-xs text-gray-400 mb-2">Comprehensive analysis of Bitcoin's network health, adoption metrics, and future projections</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500"><span>📅 Dec 2025</span><span>•</span><span>🔬 Technical</span></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1"><FontAwesomeIcon icon={faSignal} className="w-3 h-3 text-terminal-accent" /><span className="text-xs text-terminal-accent">By Azis Maulana</span></div>
                  <button className="px-3 py-1 bg-terminal-accent text-black text-xs font-medium rounded hover:bg-terminal-accent/80 transition-colors">📄 View PDF</button>
                </div>
              </div>
            </div>
            <div className="bg-terminal-bg rounded-lg border border-terminal-border overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-terminal-accent mb-1">DeFi Protocol Comparison Study</h3>
                    <p className="text-xs text-gray-400 mb-2">In-depth comparison of major DeFi protocols including TVL analysis, yield strategies, and risk assessment</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500"><span>📅 Nov 2025</span><span>•</span><span>💰 DeFi</span></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1"><FontAwesomeIcon icon={faSignal} className="w-3 h-3 text-terminal-accent" /><span className="text-xs text-terminal-accent">By Azis Maulana</span></div>
                  <button className="px-3 py-1 bg-terminal-accent text-black text-xs font-medium rounded hover:bg-terminal-accent/80 transition-colors">📄 View PDF</button>
                </div>
              </div>
            </div>
          </>
        )}

        {(researchError || !Array.isArray(researchData?.data) || researchData?.data?.length === 0) && (
          <div className="col-span-1 text-sm text-gray-400">No research items available.</div>
        )}

        {Array.isArray(researchData?.data) && researchData.data.map((item: any, idx: number) => {
          const title = item.title || item.link || `Research #${idx + 1}`;
          const description = item.description || item.message || '';
          const date = item.date || item.createdAt || '';
          const category = item.category || '';

          return (
            <div key={item.messageId || idx} className="bg-terminal-bg rounded-lg border border-terminal-border overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-terminal-accent mb-1">{title}</h3>
                    {description && <p className="text-xs text-gray-400 mb-2">{description}</p>}
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      {date && <span>📅 {date}</span>}
                      {date && <span>•</span>}
                      {category && <span>{category}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <FontAwesomeIcon icon={faSignal} className="w-3 h-3 text-terminal-accent" />
                    <span className="text-xs text-terminal-accent">{item.author || 'Unknown'}</span>
                  </div>
                  <a
                    href={item.link || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-terminal-accent text-black text-xs font-medium rounded hover:bg-terminal-accent/80 transition-colors"
                  >
                    📄 View PDF
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-terminal-bg rounded-lg border border-terminal-border p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-terminal-accent">📤 Add New Research</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-terminal-accent"
              >
                <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleResearchSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-terminal-accent mb-2">Research Link (URL)</label>
                <input
                  type="url"
                  value={researchForm.link}
                  onChange={(e) => setResearchForm({ ...researchForm, link: e.target.value })}
                  className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent placeholder-gray-500 focus:outline-none focus:border-terminal-accent"
                  placeholder="https://example.com/research.pdf"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-terminal-accent mb-2">Author</label>
                <input
                  type="text"
                  value={researchForm.author}
                  onChange={(e) => setResearchForm({ ...researchForm, author: e.target.value })}
                  className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent placeholder-gray-500 focus:outline-none focus:border-terminal-accent"
                  placeholder="Author name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-terminal-accent mb-2">Message ID</label>
                <input
                  type="text"
                  value={researchForm.messageId}
                  onChange={(e) => setResearchForm({ ...researchForm, messageId: e.target.value })}
                  className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent placeholder-gray-500 focus:outline-none focus:border-terminal-accent"
                  placeholder="Unique message ID"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={researchSubmitting}
                  className="flex-1 px-4 py-2 bg-terminal-accent text-black font-medium rounded hover:bg-terminal-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {researchSubmitting ? 'Submitting...' : 'Add Research'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-terminal-panel border border-terminal-border text-terminal-accent rounded hover:bg-terminal-border transition-colors"
                >
                  Cancel
                </button>
              </div>
              {researchSubmitMessage && (
                <p className={`text-sm ${researchSubmitError ? 'text-red-400' : 'text-green-400'}`}>
                  {researchSubmitMessage}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
