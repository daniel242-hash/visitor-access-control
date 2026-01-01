import { useState, useEffect } from 'react';
import { ClipboardList, Search, Calendar, Filter, User, Phone, MapPin, Clock, LogIn, LogOut, Car } from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

const EntryLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'trusted', 'pre-registered', 'walk-in'
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'yesterday', '7days', '30days', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/security/recent-entries?page=${page}&limit=20`);
      
      if (response.data.success) {
        setLogs(response.data.data.entries);
        setHasMore(response.data.data.pagination.hasMore);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load entry logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  };

  const calculateDuration = (entryTime, exitTime) => {
    if (!exitTime) return 'Still on premises';
    
    const entry = new Date(entryTime);
    const exit = new Date(exitTime);
    const diffInMinutes = Math.floor((exit - entry) / 60000);

    if (diffInMinutes < 60) return `${diffInMinutes} min`;
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  // Filter logs by date
  const filterByDate = (log) => {
    const logDate = new Date(log.entryTime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (dateFilter) {
      case 'today':
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);
        return logDate >= today && logDate <= todayEnd;

      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setHours(23, 59, 59, 999);
        return logDate >= yesterday && logDate < today;

      case '7days':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return logDate >= sevenDaysAgo;

      case '30days':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return logDate >= thirtyDaysAgo;

      case 'custom':
        if (!customStartDate && !customEndDate) return true;
        
        const start = customStartDate ? new Date(customStartDate) : new Date('1970-01-01');
        start.setHours(0, 0, 0, 0);
        
        const end = customEndDate ? new Date(customEndDate) : new Date();
        end.setHours(23, 59, 59, 999);
        
        return logDate >= start && logDate <= end;

      case 'all':
      default:
        return true;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.visitorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.visitorPhone?.includes(searchQuery) ||
      log.resident?.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' || log.visitorType === filterType;
    const matchesDate = filterByDate(log);
    
    return matchesSearch && matchesFilter && matchesDate;
  });

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Entry Logs</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">View and search visitor entry records</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by visitor name, phone, or resident..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Visitor Type Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Visitors</option>
              <option value="trusted">Trusted Contacts</option>
              <option value="pre-registered">Pre-registered</option>
              <option value="walk-in">Walk-in</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range */}
        {dateFilter === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                End Date
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {(dateFilter !== 'all' || filterType !== 'all' || searchQuery) && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
              
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 text-sm rounded-full">
                  Search: "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-1 hover:text-teal-900 dark:hover:text-teal-100"
                  >
                    ✕
                  </button>
                </span>
              )}
              
              {filterType !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full">
                  Type: {filterType}
                  <button
                    onClick={() => setFilterType('all')}
                    className="ml-1 hover:text-blue-900 dark:hover:text-blue-100"
                  >
                    ✕
                  </button>
                </span>
              )}
              
              {dateFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-sm rounded-full">
                  Date: {dateFilter === 'custom' ? 'Custom Range' : dateFilter}
                  <button
                    onClick={() => {
                      setDateFilter('all');
                      setCustomStartDate('');
                      setCustomEndDate('');
                    }}
                    className="ml-1 hover:text-purple-900 dark:hover:text-purple-100"
                  >
                    ✕
                  </button>
                </span>
              )}

              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                  setDateFilter('all');
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      {filteredLogs.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredLogs.length} {filteredLogs.length === 1 ? 'result' : 'results'}
        </div>
      )}

      {/* Logs List */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <ClipboardList size={64} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {searchQuery || filterType !== 'all' || dateFilter !== 'all' ? 'No logs found' : 'No entry logs yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery || filterType !== 'all' || dateFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Entry logs will appear here when visitors are logged'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log) => {
            const entry = formatDateTime(log.entryTime);
            const exit = log.exitTime ? formatDateTime(log.exitTime) : null;

            return (
              <div
                key={log.id || log._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  {/* Visitor Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold text-lg">
                      {log.visitorName?.charAt(0) || 'V'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{log.visitorName || 'Unknown Visitor'}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{log.visitorPhone || 'No phone'}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex flex-col items-end gap-2">
                    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                      log.visitorType === 'trusted'
                        ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                        : log.visitorType === 'pre-registered'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>
                      {log.visitorType === 'trusted' ? 'Trusted Contact' : 
                       log.visitorType === 'pre-registered' ? 'Pre-registered' : 'Walk-in'}
                    </span>
                    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                      log.exitTime
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    }`}>
                      {log.exitTime ? 'Exited' : 'On Premises'}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    {log.resident && (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <User size={16} className="text-gray-500 dark:text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">Visiting:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{log.resident.fullName}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <MapPin size={16} className="text-gray-500 dark:text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">Address:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{log.resident.homeAddress}</span>
                        </div>
                      </>
                    )}
                    
                    {log.preRegisteredVisitor && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Purpose:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{log.preRegisteredVisitor.purpose}</span>
                      </div>
                    )}

                    {log.carPlateNumber && (
                      <div className="flex items-center gap-2 text-sm">
                        <Car size={16} className="text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">Vehicle:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{log.carPlateNumber}</span>
                      </div>
                    )}

                    {log.numberOfPeople > 1 && (
                      <div className="flex items-center gap-2 text-sm">
                        <User size={16} className="text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">People:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{log.numberOfPeople}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <LogIn size={16} className="text-green-600 dark:text-green-400" />
                      <span className="text-gray-600 dark:text-gray-400">Entry:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {entry.date} at {entry.time}
                      </span>
                    </div>

                    {log.exitTime && (
                      <div className="flex items-center gap-2 text-sm">
                        <LogOut size={16} className="text-orange-600 dark:text-orange-400" />
                        <span className="text-gray-600 dark:text-gray-400">Exit:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {exit.date} at {exit.time}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={16} className="text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                      <span className={`font-medium ${log.exitTime ? 'text-gray-900 dark:text-white' : 'text-teal-600 dark:text-teal-400'}`}>
                        {calculateDuration(log.entryTime, log.exitTime)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Method:</span>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {log.verificationMethod === 'totp' ? 'TOTP Code' :
                         log.verificationMethod === 'pre-registration' ? 'Pre-registered' : 'Manual'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {log.notes && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Notes: </span>
                    <span className="text-gray-900 dark:text-white">{log.notes}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {filteredLogs.length > 0 && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!hasMore}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default EntryLogs;