'use client';

import { useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignal, faTimes, faPlus, faSearch, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import useSWR from 'swr';
import { fetchLearning, fetchAcademy } from '@/lib/api-fallback';

const fetcherLearning = (url: string) => fetchLearning(url).then((res) => res.json());
const fetcherAcademy = (url: string) => fetchAcademy(url).then((res) => res.json());

export default function LearningPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Learning form state
  const [learningForm, setLearningForm] = useState({ link: '', author: '', messageId: '', description: '' });
  const [learningSubmitting, setLearningSubmitting] = useState(false);
  const [learningSubmitMessage, setLearningSubmitMessage] = useState('');
  const [learningSubmitError, setLearningSubmitError] = useState(false);

  // Academy form state
  const [academyForm, setAcademyForm] = useState({ link: '', author: '', deskripsi: '', messageId: '' });
  const [academySubmitting, setAcademySubmitting] = useState(false);
  const [academySubmitMessage, setAcademySubmitMessage] = useState('');
  const [academySubmitError, setAcademySubmitError] = useState(false);
  const [isAcademyModalOpen, setIsAcademyModalOpen] = useState(false);

  // Fetch learning items
  const { data: learningData, error: learningError, mutate: mutateLearning } = useSWR('learning', fetcherLearning);

  // Fetch academy items
  const { data: academyData, error: academyError, mutate: mutateAcademy } = useSWR('academy', fetcherAcademy);

  // Filtered and paginated learning data
  const filteredLearningData = useMemo(() => {
    if (!learningData?.data) return [];
    return learningData.data.filter((item: any) =>
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.author?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [learningData, searchTerm]);

  const totalPages = Math.ceil(filteredLearningData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLearningData = filteredLearningData.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Handle learning form submission
  const handleLearningSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLearningSubmitting(true);
    setLearningSubmitMessage('');
    setLearningSubmitError(false);

    try {
      const response = await fetchLearning('', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(learningForm),
      });

      if (response.ok) {
        setLearningSubmitMessage('Learning resource added successfully!');
        setLearningForm({ link: '', author: '', messageId: '', description: '' });
        mutateLearning(); // Refresh the learning list
        setIsModalOpen(false); // Close modal on success
      } else {
        throw new Error('Failed to add learning resource');
      }
    } catch (error) {
      setLearningSubmitError(true);
      setLearningSubmitMessage('Error adding learning resource. Please try again.');
    } finally {
      setLearningSubmitting(false);
    }
  };

  // Handle academy form submission
  const handleAcademySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAcademySubmitting(true);
    setAcademySubmitMessage('');
    setAcademySubmitError(false);

    try {
      const response = await fetchAcademy('', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(academyForm),
      });

      if (response.ok) {
        setAcademySubmitMessage('Academy resource added successfully!');
        setAcademyForm({ link: '', author: '', deskripsi: '', messageId: '' });
        mutateAcademy(); // Refresh the academy list
        setIsAcademyModalOpen(false); // Close modal on success
      } else {
        throw new Error('Failed to add academy resource');
      }
    } catch (error) {
      setAcademySubmitError(true);
      setAcademySubmitMessage('Error adding academy resource. Please try again.');
    } finally {
      setAcademySubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="terminal-panel mb-6">
        <h2 className="terminal-header text-2xl">🎓 Learning Center</h2>
        <p className="text-gray-400 text-sm mt-2">
          Educational resources, tutorials, and courses on cryptocurrency, blockchain, and trading
        </p>
      </div>

      {/* Add Learning Resource Button */}
      <div className="mb-6">
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-terminal-accent text-black font-medium rounded hover:bg-terminal-accent/80 transition-colors flex items-center space-x-2"
        >
          <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
          <span>Add Learning Resource</span>
        </button>
      </div>

      {/* Learning Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-terminal-bg rounded-lg border border-terminal-border p-4 text-center">
          <div className="text-2xl mb-2">🌱</div>
          <h3 className="text-sm font-semibold text-terminal-accent mb-1">Beginner</h3>
          <p className="text-xs text-gray-400">Crypto basics, wallet setup, first investments</p>
          <div className="mt-3 text-xs text-green-400">12 courses available</div>
        </div>

        <div className="bg-terminal-bg rounded-lg border border-terminal-border p-4 text-center">
          <div className="text-2xl mb-2">📈</div>
          <h3 className="text-sm font-semibold text-terminal-accent mb-1">Intermediate</h3>
          <p className="text-xs text-gray-400">Technical analysis, DeFi, trading strategies</p>
          <div className="mt-3 text-xs text-yellow-400">8 courses available</div>
        </div>

        <div className="bg-terminal-bg rounded-lg border border-terminal-border p-4 text-center">
          <div className="text-2xl mb-2">🚀</div>
          <h3 className="text-sm font-semibold text-terminal-accent mb-1">Advanced</h3>
          <p className="text-xs text-gray-400">On-chain analysis, quantitative trading, research</p>
          <div className="mt-3 text-xs text-red-400">5 courses available</div>
        </div>
      </div>

      {/* User Submitted Learning Resources */}
      {Array.isArray(learningData?.data) && learningData.data.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-terminal-accent mb-4">📚 Submitted Resources</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {learningData.data.map((item: any, idx: number) => {
              const title = item.title || item.link || `Learning Resource #${idx + 1}`;
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
                        🔗 View Resource
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Featured Courses */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-terminal-accent mb-4">⭐ Featured Courses</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Course 1 */}
          <div className="bg-terminal-bg rounded-lg border border-terminal-border overflow-hidden">
            <div className="aspect-video bg-terminal-panel flex items-center justify-center">
              <div className="text-center">
                <FontAwesomeIcon icon={faSignal} className="w-12 h-12 text-terminal-accent mb-2" />
                <div className="text-sm text-gray-400">Course Preview</div>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Beginner</span>
                <span className="text-xs text-gray-500">2h 30m</span>
              </div>
              <h4 className="text-sm font-semibold text-terminal-accent mb-2">
                Cryptocurrency Fundamentals
              </h4>
              <p className="text-xs text-gray-400 mb-3">
                Learn the basics of cryptocurrency, blockchain technology, and how digital assets work
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <FontAwesomeIcon icon={faSignal} className="w-3 h-3 text-terminal-accent" />
                  <span className="text-xs text-terminal-accent">By Azis Maulana</span>
                </div>
                <button className="px-3 py-1 bg-terminal-accent text-black text-xs font-medium rounded hover:bg-terminal-accent/80 transition-colors">
                  ▶️ Start Learning
                </button>
              </div>
            </div>
          </div>

          {/* Course 2 */}
          <div className="bg-terminal-bg rounded-lg border border-terminal-border overflow-hidden">
            <div className="aspect-video bg-terminal-panel flex items-center justify-center">
              <div className="text-center">
                <FontAwesomeIcon icon={faSignal} className="w-12 h-12 text-terminal-accent mb-2" />
                <div className="text-sm text-gray-400">Course Preview</div>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">Intermediate</span>
                <span className="text-xs text-gray-500">4h 15m</span>
              </div>
              <h4 className="text-sm font-semibold text-terminal-accent mb-2">
                Technical Analysis Mastery
              </h4>
              <p className="text-xs text-gray-400 mb-3">
                Master chart reading, candlestick patterns, indicators, and trading strategies
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <FontAwesomeIcon icon={faSignal} className="w-3 h-3 text-terminal-accent" />
                  <span className="text-xs text-terminal-accent">By Azis Maulana</span>
                </div>
                <button className="px-3 py-1 bg-terminal-accent text-black text-xs font-medium rounded hover:bg-terminal-accent/80 transition-colors">
                  ▶️ Start Learning
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Library with Search and Pagination */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-terminal-accent">📚 Course Library</h3>
          <div className="relative">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent placeholder-gray-500 focus:outline-none focus:border-terminal-accent text-sm"
            />
          </div>
        </div>

        {/* Pagination Info */}
        {filteredLearningData.length > 0 && (
          <div className="flex items-center justify-between mb-4 text-sm text-gray-400">
            <span>Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredLearningData.length)} of {filteredLearningData.length} courses</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 text-gray-400 hover:text-terminal-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
              </button>
              <span className="text-terminal-accent">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1 text-gray-400 hover:text-terminal-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedLearningData.length > 0 ? (
            paginatedLearningData.map((item: any, idx: number) => {
              const title = item.title || item.link || `Course #${startIndex + idx + 1}`;
              const description = item.description || item.message || '';
              const author = item.author || 'Unknown';

              return (
                <div key={item.messageId || idx} className="bg-terminal-bg rounded-lg border border-terminal-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">Course</span>
                    <span className="text-xs text-gray-500">By {author}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-terminal-accent mb-2">{title}</h4>
                  {description && <p className="text-xs text-gray-400 mb-3">{description}</p>}
                  <button className="w-full px-3 py-2 bg-terminal-accent text-black text-xs font-medium rounded hover:bg-terminal-accent/80 transition-colors">
                    ▶️ Start Course
                  </button>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-400 text-sm">
                {searchTerm ? 'No courses found matching your search.' : 'No courses available yet.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Learning Resources */}
      <div className="bg-terminal-bg rounded-lg border border-terminal-border p-6 mb-8">
        <h3 className="text-lg font-semibold text-terminal-accent mb-4">📖 Additional Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-terminal-accent">📚 Recommended Books</h4>
            <div className="space-y-2 text-xs text-gray-400">
              <div>• "The Bitcoin Standard" by Saifedean Ammous</div>
              <div>• "Cryptoassets" by Chris Burniske</div>
              <div>• "Digital Gold" by Nathaniel Popper</div>
              <div>• "Mastering Bitcoin" by Antonopoulos</div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-terminal-accent">🔗 Useful Links</h4>
            <div className="space-y-2 text-xs text-gray-400">
              <div>• CoinMarketCap Academy</div>
              <div>• Binance Academy</div>
              <div>• Ethereum.org Documentation</div>
              <div>• DeFi Pulse Guides</div>
            </div>
          </div>
        </div>
      </div>

      {/* Academy Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-terminal-accent">🎓 Academy</h3>
          <button
            onClick={() => setIsAcademyModalOpen(true)}
            className="px-4 py-2 bg-terminal-accent text-black font-medium rounded hover:bg-terminal-accent/80 transition-colors flex items-center space-x-2"
          >
            <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
            <span>Add Academy Resource</span>
          </button>
        </div>

        {/* Academy Resources - Two Rows */}
        <div className="space-y-4">
          {Array.isArray(academyData?.data) && academyData.data.length > 0 ? (
            <>
              {/* First Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {academyData.data.slice(0, 4).map((item: any, idx: number) => {
                  const title = item.title || item.link || `Academy Resource #${idx + 1}`;
                  const description = item.deskripsi || item.description || '';
                  const author = item.author || 'Unknown';

                  return (
                    <div key={item.messageId || idx} className="bg-terminal-bg rounded-lg border border-terminal-border p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">Academy</span>
                        <span className="text-xs text-gray-500">By {author}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-terminal-accent mb-2">{title}</h4>
                      {description && <p className="text-xs text-gray-400 mb-3 line-clamp-2">{description}</p>}
                      <a
                        href={item.link || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full px-3 py-2 bg-terminal-accent text-black text-xs font-medium rounded hover:bg-terminal-accent/80 transition-colors inline-block text-center"
                      >
                        🔗 View Resource
                      </a>
                    </div>
                  );
                })}
              </div>

              {/* Second Row */}
              {academyData.data.length > 4 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {academyData.data.slice(4, 8).map((item: any, idx: number) => {
                    const title = item.title || item.link || `Academy Resource #${idx + 5}`;
                    const description = item.deskripsi || item.description || '';
                    const author = item.author || 'Unknown';

                    return (
                      <div key={item.messageId || idx + 4} className="bg-terminal-bg rounded-lg border border-terminal-border p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">Academy</span>
                          <span className="text-xs text-gray-500">By {author}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-terminal-accent mb-2">{title}</h4>
                        {description && <p className="text-xs text-gray-400 mb-3 line-clamp-2">{description}</p>}
                        <a
                          href={item.link || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full px-3 py-2 bg-terminal-accent text-black text-xs font-medium rounded hover:bg-terminal-accent/80 transition-colors inline-block text-center"
                        >
                          🔗 View Resource
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">No academy resources available yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-terminal-bg rounded-lg border border-terminal-border p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-terminal-accent">📤 Add Learning Resource</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-terminal-accent"
              >
                <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleLearningSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-terminal-accent mb-2">Resource Link (URL)</label>
                <input
                  type="url"
                  value={learningForm.link}
                  onChange={(e) => setLearningForm({ ...learningForm, link: e.target.value })}
                  className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent placeholder-gray-500 focus:outline-none focus:border-terminal-accent"
                  placeholder="https://example.com/learning-resource"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-terminal-accent mb-2">Author</label>
                <input
                  type="text"
                  value={learningForm.author}
                  onChange={(e) => setLearningForm({ ...learningForm, author: e.target.value })}
                  className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent placeholder-gray-500 focus:outline-none focus:border-terminal-accent"
                  placeholder="Author name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-terminal-accent mb-2">Message ID</label>
                <input
                  type="text"
                  value={learningForm.messageId}
                  onChange={(e) => setLearningForm({ ...learningForm, messageId: e.target.value })}
                  className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent placeholder-gray-500 focus:outline-none focus:border-terminal-accent"
                  placeholder="Unique message ID"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-terminal-accent mb-2">Description (Optional)</label>
                <textarea
                  value={learningForm.description}
                  onChange={(e) => setLearningForm({ ...learningForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent placeholder-gray-500 focus:outline-none focus:border-terminal-accent resize-none"
                  placeholder="Brief description of the learning resource"
                  rows={3}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={learningSubmitting}
                  className="flex-1 px-4 py-2 bg-terminal-accent text-black font-medium rounded hover:bg-terminal-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {learningSubmitting ? 'Submitting...' : 'Add Resource'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-terminal-panel border border-terminal-border text-terminal-accent rounded hover:bg-terminal-border transition-colors"
                >
                  Cancel
                </button>
              </div>
              {learningSubmitMessage && (
                <p className={`text-sm ${learningSubmitError ? 'text-red-400' : 'text-green-400'}`}>
                  {learningSubmitMessage}
                </p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Academy Modal */}
      {isAcademyModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-terminal-bg rounded-lg border border-terminal-border p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-terminal-accent">🎓 Add Academy Resource</h3>
              <button
                onClick={() => setIsAcademyModalOpen(false)}
                className="text-gray-400 hover:text-terminal-accent"
              >
                <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAcademySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-terminal-accent mb-2">Resource Link (URL)</label>
                <input
                  type="url"
                  value={academyForm.link}
                  onChange={(e) => setAcademyForm({ ...academyForm, link: e.target.value })}
                  className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent placeholder-gray-500 focus:outline-none focus:border-terminal-accent"
                  placeholder="https://example.com/academy-resource"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-terminal-accent mb-2">Author</label>
                <input
                  type="text"
                  value={academyForm.author}
                  onChange={(e) => setAcademyForm({ ...academyForm, author: e.target.value })}
                  className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent placeholder-gray-500 focus:outline-none focus:border-terminal-accent"
                  placeholder="Author name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-terminal-accent mb-2">Description</label>
                <textarea
                  value={academyForm.deskripsi}
                  onChange={(e) => setAcademyForm({ ...academyForm, deskripsi: e.target.value })}
                  className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent placeholder-gray-500 focus:outline-none focus:border-terminal-accent resize-none"
                  placeholder="Description of the academy resource"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-terminal-accent mb-2">Message ID</label>
                <input
                  type="text"
                  value={academyForm.messageId}
                  onChange={(e) => setAcademyForm({ ...academyForm, messageId: e.target.value })}
                  className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent placeholder-gray-500 focus:outline-none focus:border-terminal-accent"
                  placeholder="Unique message ID"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={academySubmitting}
                  className="flex-1 px-4 py-2 bg-terminal-accent text-black font-medium rounded hover:bg-terminal-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {academySubmitting ? 'Submitting...' : 'Add Resource'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAcademyModalOpen(false)}
                  className="px-4 py-2 bg-terminal-panel border border-terminal-border text-terminal-accent rounded hover:bg-terminal-border transition-colors"
                >
                  Cancel
                </button>
              </div>
              {academySubmitMessage && (
                <p className={`text-sm ${academySubmitError ? 'text-red-400' : 'text-green-400'}`}>
                  {academySubmitMessage}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
