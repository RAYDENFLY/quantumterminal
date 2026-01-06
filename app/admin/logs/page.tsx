'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHistory, 
  faSignOut, 
  faSearch,
  faFilter,
  faChevronLeft,
  faChevronRight,
  faUser,
  faCalendarAlt,
  faInfoCircle,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';

interface AuditLog {
  _id: string;
  adminId: string;
  adminEmail: string;
  action: 'approve' | 'reject' | 'delete' | 'create' | 'update';
  targetType: string;
  targetId: string;
  targetTitle: string;
  reason: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface AuditStats {
  totalLogs: number;
  actionCounts: {
    approve: number;
    reject: number;
    delete: number;
    create: number;
    update: number;
  };
}

export default function AdminLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterTargetType, setFilterTargetType] = useState('');
  const [filterAdmin, setFilterAdmin] = useState('');

  useEffect(() => {
    loadAuditLogs();
  }, [currentPage, filterAction, filterTargetType, filterAdmin, searchTerm]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });

      if (filterAction) params.append('action', filterAction);
      if (filterTargetType) params.append('targetType', filterTargetType);
      if (filterAdmin) params.append('adminEmail', filterAdmin);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.data.logs);
        setStats(data.data.stats);
        setTotalPages(data.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
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

  const getActionColor = (action: string) => {
    switch (action) {
      case 'approve': return 'text-green-400';
      case 'reject': return 'text-red-400';
      case 'delete': return 'text-red-500';
      case 'create': return 'text-blue-400';
      case 'update': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approve': return '✓';
      case 'reject': return '✗';
      case 'delete': return '🗑';
      case 'create': return '+';
      case 'update': return '✏';
      default: return '•';
    }
  };

  const clearFilters = () => {
    setFilterAction('');
    setFilterTargetType('');
    setFilterAdmin('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen bg-terminal-bg text-terminal-accent flex items-center justify-center">
        <div className="text-xl">Loading audit logs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-accent">
      {/* Header */}
      <div className="bg-terminal-panel border-b border-terminal-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="px-3 py-2 bg-terminal-accent text-terminal-bg rounded hover:bg-terminal-accent/90 transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
              Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold flex items-center">
              <FontAwesomeIcon icon={faHistory} className="w-6 h-6 mr-3" />
              Admin Audit Logs
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            <FontAwesomeIcon icon={faSignOut} className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && stats.actionCounts && (
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4">
              <div className="text-2xl font-bold text-terminal-accent">{stats.totalLogs}</div>
              <div className="text-sm text-gray-400">Total Logs</div>
            </div>
            <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">{stats.actionCounts.approve || 0}</div>
              <div className="text-sm text-gray-400">Approvals</div>
            </div>
            <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4">
              <div className="text-2xl font-bold text-red-400">{stats.actionCounts.reject || 0}</div>
              <div className="text-sm text-gray-400">Rejections</div>
            </div>
            <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4">
              <div className="text-2xl font-bold text-red-500">{stats.actionCounts.delete || 0}</div>
              <div className="text-sm text-gray-400">Deletions</div>
            </div>
            <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">{stats.actionCounts.create || 0}</div>
              <div className="text-sm text-gray-400">Creations</div>
            </div>
            <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-400">{stats.actionCounts.update || 0}</div>
              <div className="text-sm text-gray-400">Updates</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="px-6 pb-6">
        <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faSearch} className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title or admin email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 bg-terminal-bg border border-terminal-border rounded text-terminal-accent placeholder-gray-500 focus:outline-none focus:border-terminal-accent"
              />
            </div>
            
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-2 bg-terminal-bg border border-terminal-border rounded text-terminal-accent focus:outline-none focus:border-terminal-accent"
            >
              <option value="">All Actions</option>
              <option value="approve">Approve</option>
              <option value="reject">Reject</option>
              <option value="delete">Delete</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
            </select>

            <select
              value={filterTargetType}
              onChange={(e) => setFilterTargetType(e.target.value)}
              className="px-3 py-2 bg-terminal-bg border border-terminal-border rounded text-terminal-accent focus:outline-none focus:border-terminal-accent"
            >
              <option value="">All Types</option>
              <option value="research">Research</option>
              <option value="learning">Learning</option>
              <option value="academy">Academy</option>
              <option value="market-update">Market Update</option>
              <option value="trading-signal">Trading Signal</option>
            </select>

            <input
              type="text"
              placeholder="Filter by admin email..."
              value={filterAdmin}
              onChange={(e) => setFilterAdmin(e.target.value)}
              className="px-3 py-2 bg-terminal-bg border border-terminal-border rounded text-terminal-accent placeholder-gray-500 focus:outline-none focus:border-terminal-accent"
            />

            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Audit Logs List */}
      <div className="px-6 pb-6">
        <div className="bg-terminal-panel border border-terminal-border rounded-lg overflow-hidden">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No audit logs found
            </div>
          ) : (
            <div className="divide-y divide-terminal-border">
              {logs.map((log) => (
                <div key={log._id} className="p-4 hover:bg-terminal-bg/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-lg">{getActionIcon(log.action)}</span>
                        <span className={`font-semibold ${getActionColor(log.action)}`}>
                          {log.action.toUpperCase()}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-terminal-accent font-medium">
                          {log.targetType.replace('-', ' ').toUpperCase()}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-300">
                          {log.targetTitle}
                        </span>
                      </div>
                      
                      <div className="mb-2">
                        <span className="text-sm text-gray-400">Reason: </span>
                        <span className="text-sm text-gray-300">{log.reason}</span>
                      </div>

                      {log.details && (
                        <div className="mb-2">
                          <span className="text-sm text-gray-400">Details: </span>
                          <span className="text-sm text-gray-300">{log.details}</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <FontAwesomeIcon icon={faUser} className="w-3 h-3" />
                          <span>{log.adminEmail}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3" />
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                        {log.ipAddress && (
                          <div className="flex items-center space-x-1">
                            <FontAwesomeIcon icon={faInfoCircle} className="w-3 h-3" />
                            <span>IP: {log.ipAddress}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-6">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent hover:bg-terminal-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
            </button>
            
            <span className="px-4 py-2 text-terminal-accent">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent hover:bg-terminal-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
