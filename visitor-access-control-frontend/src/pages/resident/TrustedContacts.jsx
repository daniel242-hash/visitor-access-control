import { useState, useEffect } from 'react';
import { Users, Plus, Link as LinkIcon, Trash2, ExternalLink } from 'lucide-react';
import { residentService } from '../../services/residentService';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

const TrustedContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAccessLinkModal, setShowAccessLinkModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await residentService.getTrustedContacts();
      if (response.success) {
        const mappedContacts = response.data.contacts.map(contact => ({
          ...contact,
          id: contact._id || contact.id
        }));
        setContacts(mappedContacts);
      }
    } catch (error) {
      toast.error('Failed to fetch contacts');
      console.error('Fetch contacts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this trusted contact?')) {
      return;
    }

    try {
      const response = await residentService.deleteTrustedContact(id);
      if (response.success) {
        toast.success('Contact removed successfully');
        fetchContacts();
      }
    } catch (error) {
      console.error('Delete error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to remove contact';
      toast.error(errorMessage);
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Trusted Contacts</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            People who can visit without prior registration
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors shadow-sm w-full sm:w-auto"
        >
          <Plus size={20} />
          <span>Add Contact</span>
        </button>
      </div>

      {/* Contacts List - Mobile Responsive */}
      {contacts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={24} className="sm:w-8 sm:h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No trusted contacts yet
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 px-4">
            Add family members, friends, or regular visitors for easy access
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors shadow-sm w-full sm:w-auto"
          >
            <Plus size={20} />
            <span>Add Your First Contact</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {contacts.map((contact) => (
            <div key={contact.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-base sm:text-lg flex-shrink-0">
                    {contact.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">{contact.fullName}</h3>
                    <span className="text-[10px] sm:text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 sm:py-1 rounded-full inline-block mt-1">
                      {contact.relationship}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium whitespace-nowrap">Phone:</span>
                  <span className="truncate">{contact.phone}</span>
                </div>
                {contact.email && (
                  <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium whitespace-nowrap">Email:</span>
                    <span className="truncate">{contact.email}</span>
                  </div>
                )}
                {contact.notes && (
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Notes:</span>
                    <p className="mt-1 line-clamp-2">{contact.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-700 gap-2">
                <button
                  onClick={() => {
                    setSelectedContact(contact);
                    setShowAccessLinkModal(true);
                  }}
                  className="flex items-center gap-1 text-xs sm:text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                >
                  <LinkIcon size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Access Link</span>
                  <span className="sm:hidden">Link</span>
                </button>
                <button
                  onClick={() => handleDelete(contact.id)}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <AddContactModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchContacts();
          }}
        />
      )}

      {/* Access Link Modal */}
      {showAccessLinkModal && selectedContact && (
        <AccessLinkModal
          contact={selectedContact}
          onClose={() => {
            setShowAccessLinkModal(false);
            setSelectedContact(null);
          }}
        />
      )}
    </div>
  );
};

// Add Contact Modal Component - Mobile Responsive
const AddContactModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    relationship: 'Family',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [accessLink, setAccessLink] = useState(null);

  const relationships = ['Family', 'Friend', 'Worker', 'Driver', 'Delivery Person', 'Service Provider', 'Other'];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await residentService.addTrustedContact(formData);
      if (response.success) {
        setAccessLink(response.data.contact.accessLink || response.data.setup?.accessLink);
        toast.success('Trusted contact added successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add contact');
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(accessLink);
    toast.success('Access link copied!');
  };

  if (accessLink) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-4 sm:p-6 my-8">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">
            ✅ Contact Added Successfully!
          </h3>
          
          <div className="bg-accent-50 dark:bg-accent-900/30 border border-accent-200 dark:border-accent-800 rounded-xl p-3 sm:p-4 mb-4">
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-3">
              Share this access link with <strong>{formData.fullName}</strong>:
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={accessLink}
                readOnly
                className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-xs sm:text-sm text-gray-900 dark:text-white"
              />
              <button
                onClick={copyLink}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
              >
                <LinkIcon size={16} />
                <span>Copy</span>
              </button>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3 sm:p-4 mb-4">
            <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              How it works:
            </p>
            <ul className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• They open link to see 6-digit code</li>
              <li>• Code refreshes every 30 seconds</li>
              <li>• Show code to security for entry</li>
            </ul>
          </div>

          <button
            onClick={onSuccess}
            className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-4 sm:p-6 my-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Add Trusted Contact</h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-2"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="John Smith"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="08012345678"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email (Optional)
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Relationship *
              </label>
              <select
                name="relationship"
                value={formData.relationship}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                required
              >
                {relationships.map((rel) => (
                  <option key={rel} value={rel}>
                    {rel}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                rows="3"
                placeholder="Any additional information..."
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4 sm:mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Adding...</span>
                </>
              ) : (
                <span>Add Contact</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Access Link Modal Component - Mobile Responsive
const AccessLinkModal = ({ contact, onClose }) => {
  const accessLink = `${window.location.origin}/access/${contact.accessToken || contact.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(accessLink);
    toast.success('Access link copied!');
  };

  const shareViaWhatsApp = () => {
    const message = `Hi ${contact.fullName}! Here's your access link to visit me: ${accessLink}\n\nOpen this link anytime to see your entry code.`;
    window.open(`https://wa.me/${contact.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-4 sm:p-6 my-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Access Link</h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-2"
          >
            ✕
          </button>
        </div>

        <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-xl p-3 sm:p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-600 dark:bg-primary-700 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0">
              {contact.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">{contact.fullName}</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{contact.relationship}</p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Share this link:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={accessLink}
              readOnly
              className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-xs sm:text-sm text-gray-900 dark:text-white"
            />
            <button
              onClick={copyLink}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors w-full sm:w-auto"
            >
              <LinkIcon size={16} />
              <span>Copy</span>
            </button>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3 sm:p-4 mb-4">
          <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-2">How it works:</p>
          <ul className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Opens to show a 6-digit code</li>
            <li>• Code changes every 30 seconds</li>
            <li>• Show to security for instant entry</li>
            <li>• Works anytime, no pre-registration</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
          <button
            onClick={shareViaWhatsApp}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            <ExternalLink size={16} />
            <span>Share via WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrustedContacts;