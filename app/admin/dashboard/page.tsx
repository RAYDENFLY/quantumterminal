'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDashboard, 
  faSignOut, 
  faCheck, 
  faTimes, 
  faEye,
  faSearch,
  faFilter,
  faChevronLeft,
  faChevronRight,
  faFileAlt,
  faGraduationCap,
  faUniversity,
  faNewspaper,
  faChartLine,
  faTrash,
  faHandHoldingDollar
} from '@fortawesome/free-solid-svg-icons';

interface DashboardStats {
  pending: {
    research: number;
    learning: number;
    academy: number;
    marketUpdate: number;
    tradingSignal: number;
    total: number;
  };
  approved: {
    research: number;
    learning: number;
    academy: number;
    marketUpdate: number;
    tradingSignal: number;
    total: number;
  };
}

interface SubmissionItem {
  _id: string;
  title: string;
  description?: string;
  content?: string;
  deskripsi?: string;
  author: string;
  status: 'pending' | 'approved' | 'rejected';
  type: string;
  priority?: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [items, setItems] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<SubmissionItem | null>(null);
  const [showApproveModal, setShowApproveModal] = useState<string | null>(null);
  const [approvalReason, setApprovalReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [signalStatus, setSignalStatus] = useState('active'); // For trading signals
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    loadDashboard();
  }, [selectedType, selectedStatus, currentPage]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/login');
      if (response.ok) {
        const data = await response.json();
        setUser(data.data.user);
      } else {
        router.push('/admin');
      }
    } catch (error) {
      router.push('/admin');
    }
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: selectedStatus,
        page: currentPage.toString(),
        limit: '10'
      });
      
      if (selectedType) {
        params.append('type', selectedType);
      }

      const response = await fetch(`/api/admin/dashboard?${params}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.data.stats);
        setItems(data.data.items);
        if (data.data.pagination) {
          setTotalPages(data.data.pagination.pages);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/login', { method: 'DELETE' });
      router.push('/admin');
    } catch (error) {
      router.push('/admin');
    }
  };

  const handleApprove = async (id: string, type: string) => {
    if (!approvalReason.trim()) {
      alert('Please provide an approval reason');
      return;
    }

    try {
      setActionLoading(id);
      
      // Prepare request body
      const requestBody: any = { 
        id, 
        type, 
        action: 'approve',
        reason: approvalReason 
      };

      // Add signalStatus for trading signals
      if (type === 'trading-signal') {
        requestBody.signalStatus = signalStatus;
      }

      const response = await fetch('/api/admin/dashboard', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        setShowApproveModal(null);
        setApprovalReason('');
        setSignalStatus('active'); // Reset to default
        loadDashboard();
      }
    } catch (error) {
      console.error('Error approving item:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string, type: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(id);
      const response = await fetch('/api/admin/dashboard', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          type, 
          action: 'reject',
          reason: rejectionReason 
        })
      });

      if (response.ok) {
        setShowRejectModal(null);
        setRejectionReason('');
        loadDashboard();
      }
    } catch (error) {
      console.error('Error rejecting item:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!deleteReason.trim()) {
      alert('Please provide a deletion reason');
      return;
    }

    // Find the item to get its type
    const item = items.find(item => item._id === itemId);
    if (!item) {
      alert('Item not found');
      return;
    }

    try {
      setActionLoading(itemId);
      const response = await fetch('/api/admin/dashboard', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: itemId, 
          type: item.type,
          reason: deleteReason 
        })
      });

      if (response.ok) {
        setShowDeleteModal(null);
        setDeleteReason('');
        loadDashboard();
      } else {
        alert('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item');
    } finally {
      setActionLoading(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'research': return faFileAlt;
      case 'learning': return faGraduationCap;
      case 'academy': return faUniversity;
      case 'market-update': return faNewspaper;
      case 'trading-signals': return faChartLine;
      default: return faFileAlt;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'approved': return 'text-green-400';
      case 'rejected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-terminal-panel flex items-center justify-center">
        <div className="text-terminal-accent">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-terminal-panel">
      {/* Header */}
      <div className="bg-terminal-bg border-b border-terminal-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FontAwesomeIcon icon={faDashboard} className="w-6 h-6 text-terminal-accent" />
              <h1 className="text-xl font-bold text-terminal-accent">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">Welcome, {user?.email}</span>
              <button
                onClick={() => router.push('/admin/donation-logs')}
                className="px-3 py-1 bg-terminal-accent text-terminal-bg rounded hover:bg-terminal-accent/90 transition-colors text-sm"
                title="Manage donation transparency logs"
              >
                <FontAwesomeIcon icon={faHandHoldingDollar} className="w-4 h-4 mr-1" />
                Donation Logs
              </button>
              <button
                onClick={() => router.push('/admin/logs')}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
              >
                <FontAwesomeIcon icon={faEye} className="w-4 h-4 mr-1" />
                View Logs
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
              >
                <FontAwesomeIcon icon={faSignOut} className="w-4 h-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-terminal-bg rounded-lg border border-terminal-border p-4">
              <div className="text-2xl font-bold text-yellow-400 mb-1">{stats.pending.total}</div>
              <div className="text-sm text-gray-400">Pending Approval</div>
            </div>
            <div className="bg-terminal-bg rounded-lg border border-terminal-border p-4">
              <div className="text-2xl font-bold text-green-400 mb-1">{stats.approved.total}</div>
              <div className="text-sm text-gray-400">Approved</div>
            </div>
            <div className="bg-terminal-bg rounded-lg border border-terminal-border p-4">
              <div className="text-2xl font-bold text-blue-400 mb-1">{stats.pending.research}</div>
              <div className="text-sm text-gray-400">Research Pending</div>
            </div>
            <div className="bg-terminal-bg rounded-lg border border-terminal-border p-4">
              <div className="text-2xl font-bold text-purple-400 mb-1">{stats.pending.marketUpdate}</div>
              <div className="text-sm text-gray-400">Market Updates Pending</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-terminal-bg rounded-lg border border-terminal-border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-terminal-accent mb-2">Content Type</label>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent"
              >
                <option value="">All Types</option>
                <option value="research">Research</option>
                <option value="learning">Learning</option>
                <option value="academy">Academy</option>
                <option value="market-update">Market Updates</option>
                <option value="trading-signals">Trading Signals</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-terminal-accent mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-terminal-bg rounded-lg border border-terminal-border">
          <div className="p-4 border-b border-terminal-border">
            <h2 className="text-lg font-semibold text-terminal-accent">
              {selectedType ? selectedType.charAt(0).toUpperCase() + selectedType.slice(1) : 'All'} Submissions
            </h2>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading submissions...</div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No submissions found</div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item._id} className="border border-terminal-border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <FontAwesomeIcon 
                            icon={getTypeIcon(item.type)} 
                            className="w-4 h-4 text-terminal-accent" 
                          />
                          <span className="text-sm font-medium text-terminal-accent uppercase">
                            {item.type}
                          </span>
                          <span className={`text-sm font-medium ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                          {item.priority && (
                            <span className={`text-xs ${getPriorityColor(item.priority)}`}>
                              {item.priority} priority
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-terminal-accent mb-1">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-400 mb-2">
                          {item.description || item.content || item.deskripsi || 'No description'}
                        </p>
                        <div className="text-xs text-gray-500">
                          By {item.author} • {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {/* Delete button only */}
                        <button
                          onClick={() => setShowDeleteModal(item)}
                          disabled={actionLoading === item._id}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                        </button>
                        
                        {/* Approve/Reject only for pending items */}
                        {item.status === 'pending' && (
                          <>
                            <button
                              onClick={() => setShowApproveModal(item._id)}
                              disabled={actionLoading === item._id}
                              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
                              title="Approve"
                            >
                              <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setShowRejectModal(item._id)}
                              disabled={actionLoading === item._id}
                              className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors disabled:opacity-50"
                              title="Reject"
                            >
                              <FontAwesomeIcon icon={faTimes} className="w-3 h-3" />
                            </button>
                          </>
                        )}
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
                  className="px-3 py-1 bg-terminal-panel border border-terminal-border rounded disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="w-3 h-3" />
                </button>
                <span className="text-sm text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-terminal-panel border border-terminal-border rounded disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-terminal-bg rounded-lg border border-terminal-border p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-terminal-accent mb-4">Reject Submission</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-terminal-accent mb-2">
                Rejection Reason
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent placeholder-gray-500 focus:outline-none focus:border-terminal-accent h-24 resize-none"
                placeholder="Please provide a reason for rejection..."
                required
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  const item = items.find(i => i._id === showRejectModal);
                  if (item) handleReject(item._id, item.type);
                }}
                disabled={!rejectionReason.trim() || actionLoading === showRejectModal}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 bg-terminal-panel border border-terminal-border text-terminal-accent rounded hover:bg-terminal-border transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-terminal-bg rounded-lg border border-terminal-border p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-green-400 mb-4">Approve Submission</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-terminal-accent mb-2">
                Approval Reason *
              </label>
              <textarea
                value={approvalReason}
                onChange={(e) => setApprovalReason(e.target.value)}
                className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent placeholder-gray-500 focus:outline-none focus:border-terminal-accent h-20 resize-none"
                placeholder="Please provide a reason for approval..."
                required
              />
            </div>

            {/* Signal Status for Trading Signals */}
            {(() => {
              const item = items.find(i => i._id === showApproveModal);
              return item?.type === 'trading-signal' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-terminal-accent mb-2">
                    Signal Status
                  </label>
                  <select
                    value={signalStatus}
                    onChange={(e) => setSignalStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent focus:outline-none focus:border-terminal-accent"
                  >
                    <option value="active">Active</option>
                    <option value="sl">Stop Loss Hit</option>
                    <option value="tp1">Take Profit 1 Hit</option>
                    <option value="tp2">Take Profit 2 Hit</option>
                    <option value="tp3">Take Profit 3 Hit</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              );
            })()}

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  const item = items.find(i => i._id === showApproveModal);
                  if (item) handleApprove(item._id, item.type);
                }}
                disabled={!approvalReason.trim() || actionLoading === showApproveModal}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  setShowApproveModal(null);
                  setApprovalReason('');
                  setSignalStatus('active');
                }}
                className="px-4 py-2 bg-terminal-panel border border-terminal-border text-terminal-accent rounded hover:bg-terminal-border transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal with Reason */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-terminal-bg rounded-lg border border-terminal-border p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-red-400 mb-4">Delete Item</h3>
            <p className="text-gray-300 mb-4">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-terminal-accent mb-2">
                Reason for deletion *
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Enter reason for deletion..."
                className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent placeholder-gray-500 focus:outline-none focus:border-terminal-accent h-20 resize-none"
                required
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => handleDelete(showDeleteModal._id)}
                disabled={actionLoading === showDeleteModal._id}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(null);
                  setDeleteReason('');
                }}
                className="px-4 py-2 bg-terminal-panel border border-terminal-border text-terminal-accent rounded hover:bg-terminal-border transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
