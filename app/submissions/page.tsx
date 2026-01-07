'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileAlt, 
  faGraduationCap, 
  faUniversity, 
  faNewspaper,
  faChartLine,
  faCheck,
  faTimes,
  faClock,
  faSearch,
  faFilter,
  faChevronLeft,
  faChevronRight,
  faEye
} from '@fortawesome/free-solid-svg-icons';

interface Submission {
  _id: string;
  title: string;
  description?: string;
  author: string;
  status: 'pending' | 'approved' | 'rejected';
  type: string;
  createdAt: string;
  approvedAt?: string;
  rejectedReason?: string;
  approvedBy?: string;
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchSubmissions();
  }, [currentPage, statusFilter, typeFilter]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });
      
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/submissions?${params}`);
      const data = await response.json();

      if (data.success) {
        setSubmissions(data.data.items);
        setTotalPages(data.data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    fetchSubmissions();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return faCheck;
      case 'rejected': return faTimes;
      case 'pending': return faClock;
      default: return faClock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400 bg-green-500/20';
      case 'rejected': return 'text-red-400 bg-red-500/20';
      case 'pending': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'research': return faFileAlt;
      case 'learning': return faGraduationCap;
      case 'academy': return faUniversity;
      case 'market-update': return faNewspaper;
  case 'trading-signal': return faChartLine;
      default: return faFileAlt;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'research': return 'text-blue-400 bg-blue-500/20';
      case 'learning': return 'text-green-400 bg-green-500/20';
      case 'academy': return 'text-purple-400 bg-purple-500/20';
      case 'market-update': return 'text-orange-400 bg-orange-500/20';
  case 'trading-signal': return 'text-cyan-300 bg-cyan-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const filteredSubmissions = submissions.filter(submission => 
    !searchTerm || 
    submission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="terminal-panel mb-6">
        <h1 className="terminal-header text-2xl">📋 My Submissions</h1>
        <p className="text-gray-400 text-sm mt-2">
          Track the status of all your submitted content across Research, Learning, Academy, and Market Updates
        </p>
      </div>

      {/* Filters */}
      <div className="bg-terminal-bg rounded-lg border border-terminal-border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-terminal-accent mb-2">Search</label>
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search submissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent placeholder-gray-500 focus:outline-none focus:border-terminal-accent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-terminal-accent mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent focus:outline-none focus:border-terminal-accent"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-terminal-accent mb-2">Content Type</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent focus:outline-none focus:border-terminal-accent"
            >
              <option value="">All Types</option>
              <option value="research">Research</option>
              <option value="learning">Learning</option>
              <option value="academy">Academy</option>
              <option value="market-update">Market Updates</option>
              <option value="trading-signal">Trading Signals</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full px-4 py-2 bg-terminal-accent text-black font-medium rounded hover:bg-terminal-accent/80 transition-colors"
            >
              <FontAwesomeIcon icon={faSearch} className="w-4 h-4 mr-2" />
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-terminal-bg rounded-lg border border-terminal-border">
        <div className="p-4 border-b border-terminal-border">
          <h2 className="text-lg font-semibold text-terminal-accent">Submission History</h2>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-terminal-accent">Loading submissions...</div>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">📝</div>
              <p className="text-gray-400">No submissions found</p>
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('');
                    setTypeFilter('');
                    handleSearch();
                  }}
                  className="mt-2 text-terminal-accent hover:underline text-sm"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => (
                <div key={submission._id} className="border border-terminal-border rounded-lg p-4 hover:border-terminal-accent/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        {/* Type Badge */}
                        <span className={`px-2 py-1 text-xs rounded flex items-center space-x-1 ${getTypeColor(submission.type)}`}>
                          <FontAwesomeIcon icon={getTypeIcon(submission.type)} className="w-3 h-3" />
                          <span className="capitalize">{submission.type}</span>
                        </span>
                        
                        {/* Status Badge */}
                        <span className={`px-2 py-1 text-xs rounded flex items-center space-x-1 ${getStatusColor(submission.status)}`}>
                          <FontAwesomeIcon icon={getStatusIcon(submission.status)} className="w-3 h-3" />
                          <span className="capitalize">{submission.status}</span>
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-terminal-accent mb-2">
                        {submission.title}
                      </h3>
                      
                      {submission.description && (
                        <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                          {submission.description}
                        </p>
                      )}
                      
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>By {submission.author} • Submitted {new Date(submission.createdAt).toLocaleDateString()}</div>
                        
                        {submission.status === 'approved' && submission.approvedAt && (
                          <div className="text-green-400">
                            ✅ Approved {new Date(submission.approvedAt).toLocaleDateString()}
                            {submission.approvedBy && ` by ${submission.approvedBy}`}
                          </div>
                        )}
                        
                        {submission.status === 'rejected' && submission.rejectedReason && (
                          <div className="text-red-400">
                            ❌ Rejection reason: {submission.rejectedReason}
                          </div>
                        )}
                        
                        {submission.status === 'pending' && (
                          <div className="text-yellow-400">
                            ⏳ Waiting for admin review
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-4 text-right">
                      <div className="text-xs text-gray-500 mb-1">
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-terminal-panel border border-terminal-border rounded disabled:opacity-50 hover:border-terminal-accent transition-colors"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="w-3 h-3" />
              </button>
              <span className="text-sm text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-terminal-panel border border-terminal-border rounded disabled:opacity-50 hover:border-terminal-accent transition-colors"
              >
                <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
