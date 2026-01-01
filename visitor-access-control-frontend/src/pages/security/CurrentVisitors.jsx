import { useState, useEffect } from 'react';
import { Users, Search, LogOut, User, Phone, MapPin, Clock, Car } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/shared/Button';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

const CurrentVisitors = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showExitModal, setShowExitModal] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [exitLoading, setExitLoading] = useState(false);

  useEffect(() => {
    fetchCurrentVisitors();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchCurrentVisitors, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchCurrentVisitors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/security/current-visitors');
      
      if (response.data.success) {
        setVisitors(response.data.data.visitors);
      }
    } catch (error) {
      console.error('Error fetching current visitors:', error);
      toast.error('Failed to load current visitors');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const calculateDuration = (entryTime) => {
    const entry = new Date(entryTime);
    const now = new Date();
    const diffInMinutes = Math.floor((now - entry) / 60000);

    if (diffInMinutes < 60) return `${diffInMinutes} min`;
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const handleLogExit = async () => {
    setExitLoading(true);

    try {
      const response = await api.put(`/security/log-exit/${selectedVisitor._id}`);
      
      if (response.data.success) {
        toast.success('Visitor exit logged successfully!');
        setShowExitModal(false);
        setSelectedVisitor(null);
        fetchCurrentVisitors();
      }
    } catch (error) {
      console.error('Log exit error:', error);
      toast.error(error.response?.data?.message || 'Failed to log exit');
    } finally {
      setExitLoading(false);
    }
  };

  const filteredVisitors = visitors.filter(visitor =>
    visitor.visitorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    visitor.visitorPhone?.includes(searchQuery) ||
    visitor.residentName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Current Visitors</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Visitors currently on premises</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total On Premises</p>
            <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{visitors.length}</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
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
      </div>

      {/* Visitors List */}
      {filteredVisitors.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <Users size={64} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {searchQuery ? 'No visitors found' : 'No visitors on premises'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery 
              ? 'Try adjusting your search query' 
              : 'All visitors have exited or none have entered yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVisitors.map((visitor) => (
            <div
              key={visitor._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
            >
              {/* Visitor Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold text-lg">
                    {visitor.visitorName?.charAt(0) || 'V'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{visitor.visitorName}</h3>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      visitor.visitorType === 'trusted'
                        ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                        : visitor.visitorType === 'pre-registered'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>
                      {visitor.visitorType === 'trusted' ? 'Trusted' : 
                       visitor.visitorType === 'pre-registered' ? 'Pre-registered' : 'Walk-in'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Visitor Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={16} className="text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{visitor.visitorPhone}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={16} className="text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Visiting:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{visitor.residentName}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <User size={16} className="text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Address:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{visitor.residentAddress}</span>
                </div>

                {visitor.carPlateNumber && (
                  <div className="flex items-center gap-2 text-sm">
                    <Car size={16} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">Vehicle:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{visitor.carPlateNumber}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Clock size={16} className="text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Entry Time:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatTime(visitor.entryTime)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock size={16} className="text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                  <span className="font-medium text-teal-600 dark:text-teal-400">{calculateDuration(visitor.entryTime)}</span>
                </div>
              </div>

              {/* Log Exit Button */}
              <Button
                onClick={() => {
                  setSelectedVisitor(visitor);
                  setShowExitModal(true);
                }}
                variant="outline"
                fullWidth
                icon={LogOut}
              >
                Log Exit
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitModal && selectedVisitor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                <LogOut className="text-orange-600 dark:text-orange-400" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Log Visitor Exit</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Confirm visitor is leaving</p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Visitor:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedVisitor.visitorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Phone:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedVisitor.visitorPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Resident:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedVisitor.residentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Entry Time:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{formatTime(selectedVisitor.entryTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Duration:</span>
                  <span className="text-sm font-medium text-teal-600 dark:text-teal-400">{calculateDuration(selectedVisitor.entryTime)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowExitModal(false);
                  setSelectedVisitor(null);
                }}
                variant="outline"
                fullWidth
              >
                Cancel
              </Button>
              <Button
                onClick={handleLogExit}
                variant="primary"
                fullWidth
                loading={exitLoading}
              >
                Confirm Exit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentVisitors;