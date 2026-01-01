import { useState, useEffect } from 'react';
import { UserPlus, Calendar, Trash2, AlertCircle, Clock } from 'lucide-react';

const PreRegisterVisitor = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchVisitors();
  }, []);

  const fetchVisitors = async () => {
    try {
      const token = localStorage.getItem('resident_accessToken');
      const response = await fetch('/api/v1/resident/visitors/pre-registered?page=1&limit=50&status=pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setVisitors(data.data.visitors);
      }
    } catch (error) {
      console.error('Fetch visitors error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this visitor registration?')) {
      return;
    }

    try {
      const token = localStorage.getItem('resident_accessToken');
      const response = await fetch(`/api/v1/resident/visitors/pre-registered/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        alert('Visitor registration cancelled');
        fetchVisitors();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to cancel registration');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      alert('Failed to cancel registration');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Pre-Register Visitor</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Register expected visitors in advance
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap"
        >
          <UserPlus size={20} />
          <span className="sm:inline">Register Visitor</span>
        </button>
      </div>

      {/* Pending Visitors List - Mobile Responsive */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6 transition-colors duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Pending Visitors</h2>
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            {visitors.length} {visitors.length === 1 ? 'visitor' : 'visitors'}
          </span>
        </div>

        {visitors.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus size={24} className="sm:w-8 sm:h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No pending visitors
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 px-4">
              Register visitors you're expecting for faster security clearance
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors mx-auto text-sm sm:text-base"
            >
              <UserPlus size={20} />
              Register Your First Visitor
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {visitors.map((visitor) => (
              <div
                key={visitor._id}
                className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-4 hover:border-primary-300 dark:hover:border-primary-700 transition-colors bg-white dark:bg-gray-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent-100 dark:bg-accent-900/30 rounded-full flex items-center justify-center text-accent-600 dark:text-accent-400 font-bold text-base sm:text-lg flex-shrink-0">
                        {visitor.visitorName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                          {visitor.visitorName}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{visitor.visitorPhone}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mb-3">
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Calendar size={14} className="sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400 truncate">
                          {formatDate(visitor.expectedArrivalDate)}
                        </span>
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-[10px] sm:text-xs rounded-full font-medium whitespace-nowrap">
                          All Day
                        </span>
                      </div>
                      {visitor.numberOfPeople > 1 && (
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">People:</span> {visitor.numberOfPeople}
                        </div>
                      )}
                      {visitor.allowEarlyArrival && (
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                          <Clock size={14} className="sm:w-4 sm:h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            Early arrival
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                      {visitor.carPlateNumber && (
                        <div className="truncate">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Car:</span>{' '}
                          <span className="text-gray-600 dark:text-gray-400">{visitor.carPlateNumber}</span>
                        </div>
                      )}
                      {visitor.complexion && (
                        <div className="truncate">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Complexion:</span>{' '}
                          <span className="text-gray-600 dark:text-gray-400">{visitor.complexion}</span>
                        </div>
                      )}
                      <div className="sm:col-span-2 truncate">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Purpose:</span>{' '}
                        <span className="text-gray-600 dark:text-gray-400">{visitor.purpose}</span>
                      </div>
                    </div>

                    {visitor.additionalNotes && (
                      <div className="mt-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-xs sm:text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Notes:</span>{' '}
                        <span className="text-gray-600 dark:text-gray-400">{visitor.additionalNotes}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleCancel(visitor._id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                  >
                    <Trash2 size={18} className="sm:w-5 sm:h-5" />
                  </button>
                </div>

                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                    <span className="px-2 sm:px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full font-medium">
                      Pending
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      Valid until {formatTime(visitor.validUntil)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Card - Mobile Responsive */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-4 sm:p-6 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 dark:bg-blue-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <AlertCircle size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white mb-2">How Pre-Registration Works</h3>
            <ul className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 space-y-1.5 sm:space-y-2">
              <li>• Register visitors you're expecting in advance</li>
              <li>• Visitors are valid for the entire day (12:00 AM - 11:59 PM)</li>
              <li>• Enable "Early Arrival" for flexibility</li>
              <li>• Security verifies via phone number search</li>
              <li>• You'll be notified when they arrive</li>
              <li>• Auto-expires at end of day</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add Visitor Modal */}
      {showAddModal && (
        <AddVisitorModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchVisitors();
          }}
        />
      )}
    </div>
  );
};

const AddVisitorModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    visitorName: '',
    visitorPhone: '',
    carPlateNumber: '',
    numberOfPeople: 1,
    complexion: '',
    purpose: 'Personal Visit',
    additionalNotes: '',
    expectedArrivalDate: '',
    allowEarlyArrival: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const purposes = ['Personal Visit', 'Delivery', 'Service/Repair', 'Business', 'Event', 'Other'];
  const complexions = ['Fair', 'Light', 'Medium', 'Dark'];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : (name === 'numberOfPeople' ? parseInt(value) || 1 : value),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('resident_accessToken');
      
      if (!token) {
        setError('No authentication token found. Please log in again.');
        return;
      }
      
      const response = await fetch('/api/v1/resident/visitors/pre-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const responseText = await response.text();
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        setError(`Server error: Invalid response format. Status: ${response.status}`);
        return;
      }

      if (response.status === 401) {
        setError('Session expired. Please log out and log back in.');
        return;
      }

      if (response.ok && data.success) {
        alert('Visitor registered successfully! Valid all day.');
        onSuccess();
      } else {
        const errorMsg = data.message || `Registration failed (Status: ${response.status})`;
        setError(errorMsg);
        
        if (data.errors && Array.isArray(data.errors)) {
          const errorDetails = data.errors.map(err => `${err.field}: ${err.message}`).join('\n');
          setError(`${errorMsg}\n\n${errorDetails}`);
        }
      }
    } catch (error) {
      setError(`Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl p-4 sm:p-6 my-8 transition-colors duration-200">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Register Visitor</h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-2"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300 text-xs sm:text-sm whitespace-pre-line">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="sm:col-span-2 sm:grid sm:grid-cols-2 sm:gap-4 space-y-3 sm:space-y-0">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Visitor Name *
                </label>
                <input
                  type="text"
                  name="visitorName"
                  value={formData.visitorName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent outline-none"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="visitorPhone"
                  value={formData.visitorPhone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent outline-none"
                  placeholder="08012345678"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expected Arrival Date *
              </label>
              <input
                type="date"
                name="expectedArrivalDate"
                value={formData.expectedArrivalDate}
                onChange={handleChange}
                min={today}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent outline-none"
                required
              />
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                ✓ Valid for entire day (12:00 AM - 11:59 PM)
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="flex items-start gap-3 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                <input
                  type="checkbox"
                  name="allowEarlyArrival"
                  checked={formData.allowEarlyArrival}
                  onChange={handleChange}
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-2 focus:ring-primary-500 mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="sm:w-[18px] sm:h-[18px] text-blue-600 dark:text-blue-400" />
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                      Allow early arrival
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Enable if visitor may arrive earlier than expected date
                  </p>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Car Plate
              </label>
              <input
                type="text"
                name="carPlateNumber"
                value={formData.carPlateNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent outline-none"
                placeholder="ABC123XY"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                People
              </label>
              <input
                type="number"
                name="numberOfPeople"
                value={formData.numberOfPeople}
                onChange={handleChange}
                min="1"
                max="50"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Complexion
              </label>
              <select
                name="complexion"
                value={formData.complexion}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent outline-none"
              >
                <option value="">Select</option>
                {complexions.map((comp) => (
                  <option key={comp} value={comp}>{comp}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Purpose *
              </label>
              <select
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent outline-none"
                required
              >
                {purposes.map((purpose) => (
                  <option key={purpose} value={purpose}>{purpose}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 sm:mt-4">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Notes
            </label>
            <textarea
              name="additionalNotes"
              value={formData.additionalNotes}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent outline-none resize-none"
              rows="3"
              placeholder="Any additional information..."
            />
          </div>

          <div className="mt-4 sm:mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] sm:text-sm text-blue-900 dark:text-blue-300">
                Visitor will be valid all day and auto-removed after 11:59 PM
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-4 sm:mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 sm:px-6 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-2 text-sm sm:text-base bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                  <span className="hidden sm:inline">Registering...</span>
                </>
              ) : (
                <>
                  <UserPlus size={18} className="sm:w-5 sm:h-5" />
                  Register
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PreRegisterVisitor;