import { useState } from 'react';
import { Shield, Search, CheckCircle, XCircle, User, Phone, Clock, MapPin, QrCode, Camera, Calendar } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const VerifyVisitor = () => {
  const [activeTab, setActiveTab] = useState('totp');
  const [loading, setLoading] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  
  // TOTP verification state
  const [totpToken, setTotpToken] = useState('');
  const [totpResult, setTotpResult] = useState(null);

  // Search state
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  // Log entry modal state
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [logData, setLogData] = useState({
    carPlateNumber: '',
    numberOfPeople: 1,
    notes: '',
  });

  const handleQRScan = async (qrData) => {
    try {
      setLoading(true);
      setShowQRScanner(false);

      const token = qrData.trim();
      
      if (!/^\d{6}$/.test(token)) {
        toast.error('Invalid QR code format. Expected 6-digit TOTP.');
        return;
      }

      setTotpToken(token);
      
      const response = await api.post('/security/verify-totp', { token });

      if (response.data.success) {
        setTotpResult(response.data.data);
        toast.success('TOTP verified successfully!');
      }
    } catch (error) {
      console.error('QR verification error:', error);
      toast.error(error.response?.data?.message || 'Invalid TOTP code');
      setTotpResult({ valid: false });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTotp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTotpResult(null);

    try {
      const response = await api.post('/security/verify-totp', {
        token: totpToken,
      });

      if (response.data.success) {
        setTotpResult(response.data.data);
        toast.success('TOTP verified successfully!');
      }
    } catch (error) {
      console.error('TOTP verification error:', error);
      toast.error(error.response?.data?.message || 'Invalid TOTP code');
      setTotpResult({ valid: false });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchVisitor = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSearchResults(null);

    try {
      const response = await api.post('/security/search-visitor', {
        phone: searchPhone,
      });

      if (response.data.success) {
        // ✅ FIXED: Backend returns { visitors: [...] }, not { found, visitor }
        const visitors = response.data.data.visitors;
        
        if (visitors && visitors.length > 0) {
          // Use the first visitor found
          setSearchResults({
            found: true,
            visitor: visitors[0],
          });
          toast.success('Visitor found!');
        } else {
          setSearchResults({ found: false });
          toast.error('No visitor found with this phone number');
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error.response?.data?.message || 'Failed to search visitor');
      setSearchResults({ found: false });
    } finally {
      setLoading(false);
    }
  };

  const openLogModal = (visitor, verificationType) => {
    // ✅ For pre-registered visitors, log entry directly
    if (verificationType === 'pre-registered') {
      // Make sure we have the correct structure
      const visitorForLog = {
        id: visitor.id,
        visitorName: visitor.visitorName,
        visitorPhone: visitor.visitorPhone,
        carPlateNumber: visitor.carPlateNumber || '',
        numberOfPeople: visitor.numberOfPeople || 1,
        additionalNotes: visitor.additionalNotes || '',
        residentName: visitor.residentName,
        residentAddress: visitor.residentAddress,
        verificationType: 'pre-registered'
      };
      
      console.log('🔍 Opening log for pre-registered visitor:', visitorForLog);
      handleLogEntry(visitorForLog, 'pre-registered');
    } else {
      // For TOTP/trusted contacts, show modal for additional details
      setSelectedVisitor({ ...visitor, verificationType });
      setShowLogModal(true);
    }
  };

  const handleLogEntry = async (visitor = null, verificationType = null) => {
    setLoading(true);

    try {
      // Use passed visitor or modal selectedVisitor
      const visitorData = visitor || selectedVisitor;
      const verifyType = verificationType || visitorData.verificationType;

      // Build entry payload with proper field mapping
      const entryPayload = {
        visitorType: verifyType === 'totp' ? 'trusted' : 'pre-registered',
        visitorName: visitorData.visitorName || visitorData.fullName || '',
        visitorPhone: visitorData.visitorPhone || visitorData.phone || '',
        verificationMethod: verifyType === 'totp' ? 'totp' : 'pre-registration',
        carPlateNumber: visitorData.carPlateNumber || '',
        numberOfPeople: parseInt(visitorData.numberOfPeople) || 1,
        notes: visitorData.additionalNotes || visitorData.notes || '',
      };

      // Add type-specific IDs
      if (verifyType === 'totp') {
        entryPayload.trustedContactId = visitorData.trustedContactId;
        entryPayload.totpUsed = totpToken;
      } else {
        // Ensure we're sending the MongoDB _id
        entryPayload.preRegisteredVisitorId = visitorData.id || visitorData._id;
      }

      // Debug logs
      console.log('📤 Visitor data:', visitorData);
      console.log('📤 Final payload:', entryPayload);

      // Validate required fields before sending
      if (!entryPayload.visitorName) {
        toast.error('Visitor name is missing');
        setLoading(false);
        return;
      }
      if (!entryPayload.visitorPhone) {
        toast.error('Visitor phone is missing');
        setLoading(false);
        return;
      }

      const response = await api.post('/security/log-entry', entryPayload);

      if (response.data.success) {
        toast.success('Visitor entry logged successfully! Resident has been notified.');
        setShowLogModal(false);
        setTotpResult(null);
        setSearchResults(null);
        setTotpToken('');
        setSearchPhone('');
        setLogData({ carPlateNumber: '', numberOfPeople: 1, notes: '' });
      }
    } catch (error) {
      console.error('Log entry error:', error);
      toast.error(error.response?.data?.message || 'Failed to log entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Verify Visitor</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Verify visitors using TOTP code or search by phone</p>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('totp')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'totp'
                  ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Shield size={18} />
                <span>TOTP Code</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'qr'
                  ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <QrCode size={18} />
                <span>Scan QR Code</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'search'
                  ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Search size={18} />
                <span>Search Visitor</span>
              </div>
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'totp' ? (
            // TOTP Verification Tab
            <div className="max-w-md mx-auto">
              <form onSubmit={handleVerifyTotp} className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-900 dark:text-blue-200 font-medium mb-1">
                    How to verify TOTP:
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Ask the visitor to show their 6-digit code from the access link sent to them. The code refreshes every 30 seconds.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    6-Digit TOTP Code
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                    <input
                      type="text"
                      value={totpToken}
                      onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      maxLength={6}
                      required
                      autoFocus
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <Button type="submit" fullWidth loading={loading}>
                  Verify TOTP
                </Button>
              </form>

              {/* TOTP Result */}
              {totpResult && (
                <div className={`mt-6 p-4 rounded-lg border-2 ${
                  totpResult.valid 
                    ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    {totpResult.valid ? (
                      <CheckCircle className="text-green-600 dark:text-green-400" size={32} />
                    ) : (
                      <XCircle className="text-red-600 dark:text-red-400" size={32} />
                    )}
                    <div>
                      <p className={`font-semibold ${
                        totpResult.valid ? 'text-green-900 dark:text-green-200' : 'text-red-900 dark:text-red-200'
                      }`}>
                        {totpResult.valid ? 'Valid TOTP Code' : 'Invalid TOTP Code'}
                      </p>
                      <p className={`text-sm ${
                        totpResult.valid ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                      }`}>
                        {totpResult.valid 
                          ? 'Visitor can proceed' 
                          : 'Access denied - code is incorrect or expired'}
                      </p>
                    </div>
                  </div>

                  {totpResult.valid && (
                    <>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Visitor:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {totpResult.visitorName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Phone:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {totpResult.visitorPhone}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Visiting:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {totpResult.residentName} - {totpResult.residentAddress}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => openLogModal(totpResult, 'totp')}
                        variant="primary"
                        fullWidth
                        className="mt-4"
                      >
                        Log Entry
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : activeTab === 'qr' ? (
            // QR Scanner Tab
            <div className="max-w-md mx-auto">
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900 dark:text-blue-200 font-medium mb-1">
                  How to scan QR code:
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Click the button below to activate your camera. Ask the visitor to show their QR code from the access link.
                </p>
              </div>

              {!showQRScanner ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <QrCode size={48} className="text-teal-600 dark:text-teal-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Ready to Scan
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Position the QR code within the camera frame
                  </p>
                  <Button
                    onClick={() => setShowQRScanner(true)}
                    variant="primary"
                    icon={Camera}
                  >
                    Activate Camera
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-900 rounded-lg p-4 aspect-square flex items-center justify-center">
                    <div className="text-center">
                      <Camera size={64} className="text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 text-sm">Camera feed would appear here</p>
                      <p className="text-gray-500 text-xs mt-2">
                        (QR Scanner requires additional library like react-qr-scanner)
                      </p>
                    </div>
                  </div>

                  {/* Manual Entry Fallback */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 text-center">
                      Or enter the code manually:
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                        6-Digit Code
                      </label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                        <input
                          type="text"
                          value={totpToken}
                          onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="123456"
                          maxLength={6}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        if (totpToken.length === 6) {
                          handleQRScan(totpToken);
                        } else {
                          toast.error('Please enter a 6-digit code');
                        }
                      }}
                      variant="primary"
                      fullWidth
                      className="mt-3"
                      loading={loading}
                    >
                      Verify Code
                    </Button>
                  </div>

                  <Button
                    onClick={() => setShowQRScanner(false)}
                    variant="outline"
                    fullWidth
                  >
                    Cancel Scanning
                  </Button>
                </div>
              )}

              {/* QR Scan Result */}
              {totpResult && activeTab === 'qr' && (
                <div className={`mt-6 p-4 rounded-lg border-2 ${
                  totpResult.valid 
                    ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    {totpResult.valid ? (
                      <CheckCircle className="text-green-600 dark:text-green-400" size={32} />
                    ) : (
                      <XCircle className="text-red-600 dark:text-red-400" size={32} />
                    )}
                    <div>
                      <p className={`font-semibold ${
                        totpResult.valid ? 'text-green-900 dark:text-green-200' : 'text-red-900 dark:text-red-200'
                      }`}>
                        {totpResult.valid ? 'Valid QR Code' : 'Invalid QR Code'}
                      </p>
                      <p className={`text-sm ${
                        totpResult.valid ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                      }`}>
                        {totpResult.valid 
                          ? 'Visitor can proceed' 
                          : 'Access denied - code is incorrect or expired'}
                      </p>
                    </div>
                  </div>

                  {totpResult.valid && (
                    <>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Visitor:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {totpResult.visitorName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Phone:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {totpResult.visitorPhone}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Visiting:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {totpResult.residentName} - {totpResult.residentAddress}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => openLogModal(totpResult, 'totp')}
                        variant="primary"
                        fullWidth
                        className="mt-4"
                      >
                        Log Entry
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Search Tab - ✅ FIXED THIS SECTION
            <div className="max-w-md mx-auto">
              <form onSubmit={handleSearchVisitor} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Search by Phone Number
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                    <input
                      type="tel"
                      value={searchPhone}
                      onChange={(e) => setSearchPhone(e.target.value)}
                      placeholder="08012345678"
                      required
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <Button type="submit" fullWidth loading={loading}>
                  Search Visitor
                </Button>
              </form>

              {/* Search Results - ✅ COMPLETELY FIXED */}
              {searchResults && (
                <div className="mt-6">
                  {searchResults.found ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-teal-300 dark:border-teal-700 p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <CheckCircle className="text-teal-600 dark:text-teal-400" size={32} />
                        <div>
                          <p className="font-semibold text-teal-900 dark:text-teal-200">Visitor Found</p>
                          <p className="text-sm text-teal-700 dark:text-teal-300">Pre-registered visitor</p>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Visitor:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {searchResults.visitor.visitorName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Phone:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {searchResults.visitor.visitorPhone}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Visiting:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {searchResults.visitor.resident.fullName} - {searchResults.visitor.resident.homeAddress}
                          </span>
                        </div>
                        {/* ✅ FIXED: Use expectedArrivalDate and show "All Day" */}
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Expected:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {format(new Date(searchResults.visitor.expectedArrivalDate), 'MMM dd, yyyy')}
                            <span className="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded-full">
                              All Day
                            </span>
                          </span>
                        </div>
                        {searchResults.visitor.carPlateNumber && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Car Plate:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {searchResults.visitor.carPlateNumber}
                            </span>
                          </div>
                        )}
                        {searchResults.visitor.purpose && (
                          <div className="pt-2 border-t border-gray-200 dark:border-gray-600 mt-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Purpose:</span>
                            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                              {searchResults.visitor.purpose}
                            </p>
                          </div>
                        )}
                        {searchResults.visitor.additionalNotes && (
                          <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Notes:</span>
                            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                              {searchResults.visitor.additionalNotes}
                            </p>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => {
                          const visitorForLog = {
                            id: searchResults.visitor.id,
                            visitorName: searchResults.visitor.visitorName,
                            visitorPhone: searchResults.visitor.visitorPhone,
                            carPlateNumber: searchResults.visitor.carPlateNumber || '',
                            numberOfPeople: searchResults.visitor.numberOfPeople || 1,
                            additionalNotes: searchResults.visitor.additionalNotes || '',
                            residentName: searchResults.visitor.resident.fullName,
                            residentAddress: searchResults.visitor.resident.homeAddress,
                            verificationType: 'pre-registered'
                          };
                          console.log('🎯 Button clicked - calling handleLogEntry with:', visitorForLog);
                          handleLogEntry(visitorForLog, 'pre-registered');
                        }}
                        variant="primary"
                        fullWidth
                      >
                        Log Entry
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-800 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <XCircle className="text-red-600 dark:text-red-400" size={32} />
                        <div>
                          <p className="font-semibold text-red-900 dark:text-red-200">No Visitor Found</p>
                          <p className="text-sm text-red-700 dark:text-red-300">
                            No pre-registered visitor with this phone number
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Log Entry Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Log Visitor Entry</h3>
            
            <div className="bg-teal-50 dark:bg-teal-900/30 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedVisitor?.visitorName || selectedVisitor?.fullName}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Visiting: {selectedVisitor?.residentName}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Car Plate Number (Optional)
                </label>
                <input
                  type="text"
                  value={logData.carPlateNumber}
                  onChange={(e) => setLogData(prev => ({ ...prev, carPlateNumber: e.target.value.toUpperCase() }))}
                  placeholder="ABC-123XY"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Number of People
                </label>
                <input
                  type="number"
                  min="1"
                  value={logData.numberOfPeople}
                  onChange={(e) => setLogData(prev => ({ ...prev, numberOfPeople: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={logData.notes}
                  onChange={(e) => setLogData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  rows="3"
                  placeholder="Any additional notes..."
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => setShowLogModal(false)}
                  variant="outline"
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleLogEntry()}
                  variant="primary"
                  fullWidth
                  loading={loading}
                >
                  Confirm Entry
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyVisitor;