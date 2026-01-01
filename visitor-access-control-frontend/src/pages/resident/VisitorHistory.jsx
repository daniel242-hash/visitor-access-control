import { useState, useEffect } from 'react';
import { History, Search, Calendar, Clock, User, Shield } from 'lucide-react';
import { residentService } from '../../services/residentService';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const VisitorHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLogs, setFilteredLogs] = useState([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = logs.filter(
        (log) =>
          log.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.visitorPhone.includes(searchTerm)
      );
      setFilteredLogs(filtered);
    } else {
      setFilteredLogs(logs);
    }
  }, [searchTerm, logs]);

  const fetchLogs = async () => {
    try {
      const response = await residentService.getVisitorLogs();
      if (response.success) {
        setLogs(response.data.logs);
        setFilteredLogs(response.data.logs);
      }
    } catch (error) {
      toast.error('Failed to fetch visitor history');
      console.error('Fetch logs error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVerificationMethodBadge = (method) => {
    const badges = {
      totp: { text: 'TOTP', color: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' },
      'pre-registration': { text: 'Pre-Reg', color: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' },
      manual: { text: 'Manual', color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' },
    };
    return badges[method] || badges.manual;
  };

  const getVisitorTypeBadge = (type) => {
    const badges = {
      trusted: { text: 'Trusted', color: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' },
      'pre-registered': { text: 'Pre-Reg', color: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' },
      'walk-in': { text: 'Walk-In', color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' },
    };
    return badges[type] || badges['walk-in'];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Header - Mobile Responsive */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Visitor History</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
          Complete record of all visitors
        </p>
      </div>

      {/* Search Bar - Mobile Responsive */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Stats Cards - Mobile Responsive */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Total</p>
              <p className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">{logs.length}</p>
            </div>
            <div className="hidden sm:flex w-12 h-12 bg-primary-600 dark:bg-primary-700 rounded-xl items-center justify-center text-white">
              <History size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Trusted</p>
              <p className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {logs.filter((log) => log.visitorType === 'trusted').length}
              </p>
            </div>
            <div className="hidden sm:flex w-12 h-12 bg-purple-500 dark:bg-purple-600 rounded-xl items-center justify-center text-white">
              <Shield size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Pre-Reg</p>
              <p className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {logs.filter((log) => log.visitorType === 'pre-registered').length}
              </p>
            </div>
            <div className="hidden sm:flex w-12 h-12 bg-blue-500 dark:bg-blue-600 rounded-xl items-center justify-center text-white">
              <User size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Visitor Logs - Mobile Responsive */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <History size={24} className="sm:w-8 sm:h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'No visitors found' : 'No visitor history yet'}
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {searchTerm
              ? 'Try adjusting your search term'
              : 'Visitor entries will appear here'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Visitor</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Verification</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Entry Time</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Exit Time</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Duration</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const typeBadge = getVisitorTypeBadge(log.visitorType);
                  const methodBadge = getVerificationMethodBadge(log.verificationMethod);

                  return (
                    <tr key={log._id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{log.visitorName}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{log.visitorPhone}</p>
                          {log.carPlateNumber && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              🚗 {log.carPlateNumber}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeBadge.color}`}>
                          {typeBadge.text}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${methodBadge.color}`}>
                          {methodBadge.text}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <Calendar size={14} className="text-gray-400 dark:text-gray-500" />
                          {format(new Date(log.entryTime), 'MMM dd, yyyy')}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <Clock size={14} className="text-gray-400 dark:text-gray-500" />
                          {format(new Date(log.entryTime), 'HH:mm')}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {log.exitTime ? (
                          <>
                            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <Calendar size={14} className="text-gray-400 dark:text-gray-500" />
                              {format(new Date(log.exitTime), 'MMM dd, yyyy')}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                              <Clock size={14} className="text-gray-400 dark:text-gray-500" />
                              {format(new Date(log.exitTime), 'HH:mm')}
                            </div>
                          </>
                        ) : (
                          <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                            On premises
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {log.visitDuration ? (
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {log.visitDuration} min
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-700">
            {filteredLogs.map((log) => {
              const typeBadge = getVisitorTypeBadge(log.visitorType);
              const methodBadge = getVerificationMethodBadge(log.verificationMethod);

              return (
                <div key={log._id} className="p-4">
                  {/* Visitor Info */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold flex-shrink-0">
                      {log.visitorName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{log.visitorName}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{log.visitorPhone}</p>
                      {log.carPlateNumber && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          🚗 {log.carPlateNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${typeBadge.color}`}>
                      {typeBadge.text}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${methodBadge.color}`}>
                      {methodBadge.text}
                    </span>
                  </div>

                  {/* Time Info */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Entry:</span>
                      <div className="text-right">
                        <div className="text-gray-900 dark:text-white font-medium">
                          {format(new Date(log.entryTime), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {format(new Date(log.entryTime), 'HH:mm')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Exit:</span>
                      {log.exitTime ? (
                        <div className="text-right">
                          <div className="text-gray-900 dark:text-white font-medium">
                            {format(new Date(log.exitTime), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">
                            {format(new Date(log.exitTime), 'HH:mm')}
                          </div>
                        </div>
                      ) : (
                        <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                          On premises
                        </span>
                      )}
                    </div>

                    {log.visitDuration && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {log.visitDuration} min
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorHistory;