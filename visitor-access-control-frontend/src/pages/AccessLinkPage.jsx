import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, Copy, Check, Clock, Home, User, MapPin, AlertCircle } from 'lucide-react';
import { accessService } from '../services/accessService';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

const AccessLinkPage = () => {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);

  useEffect(() => {
    fetchAccessDetails();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [token]);

  useEffect(() => {
    if (data) {
      setTimeRemaining(data.access.timeRemaining);

      countdownRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            refreshCode();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
      };
    }
  }, [data]);

  const fetchAccessDetails = async () => {
    try {
      const response = await accessService.getAccessDetails(token);
      if (response.success) {
        setData(response.data);
        setError(null);
      }
    } catch (error) {
      console.error('Fetch access details error:', error);
      setError(error.response?.data?.message || 'Invalid or expired access link');
    } finally {
      setLoading(false);
    }
  };

  const refreshCode = async () => {
    try {
      const response = await accessService.refreshCode(token);
      if (response.success) {
        setData((prev) => ({
          ...prev,
          access: {
            ...prev.access,
            currentCode: response.data.currentCode,
            timeRemaining: response.data.timeRemaining,
            qrCode: response.data.qrCode,
          },
        }));
        setTimeRemaining(response.data.timeRemaining);
      }
    } catch (error) {
      console.error('Refresh code error:', error);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(data.access.currentCode);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const progress = (timeRemaining / 30) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-2xl mx-auto py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-primary-600 text-white rounded-2xl mb-3 sm:mb-4">
            <Shield size={28} className="sm:hidden" />
            <Shield size={32} className="hidden sm:block" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
            Estate Access Code
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Show this code to security for entry
          </p>
        </div>

        {/* Contact Info Card */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-lg sm:text-2xl font-bold flex-shrink-0">
              {data.contact.fullName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold truncate">{data.contact.fullName}</h2>
              <p className="text-sm sm:text-base text-primary-100 truncate">{data.contact.relationship}</p>
            </div>
          </div>
          
          <div className="space-y-2 pt-3 sm:pt-4 border-t border-white/20">
            <div className="flex items-start gap-2 text-primary-50">
              <User size={16} className="flex-shrink-0 mt-0.5" />
              <span className="text-xs sm:text-sm break-words">Visiting: {data.resident.fullName}</span>
            </div>
            <div className="flex items-start gap-2 text-primary-50">
              <Home size={16} className="flex-shrink-0 mt-0.5" />
              <span className="text-xs sm:text-sm break-words">{data.resident.homeAddress}</span>
            </div>
            <div className="flex items-start gap-2 text-primary-50">
              <MapPin size={16} className="flex-shrink-0 mt-0.5" />
              <span className="text-xs sm:text-sm break-words">{data.estate.name}</span>
            </div>
          </div>
        </div>

        {/* TOTP Code Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Your Access Code</p>
            
            {/* Large TOTP Code */}
            <div className="relative mb-4 sm:mb-6">
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary-600 tracking-wider font-mono break-all">
                {data.access.currentCode.match(/.{1,3}/g).join(' ')}
              </div>
              <button
                onClick={copyCode}
                className="mt-3 sm:mt-0 sm:absolute sm:-right-2 sm:top-1/2 sm:-translate-y-1/2 p-2.5 sm:p-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors w-full sm:w-auto"
              >
                <span className="flex items-center justify-center gap-2">
                  {copied ? (
                    <>
                      <Check size={18} className="text-accent-600" />
                      <span className="text-sm sm:hidden text-accent-600 font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={18} className="text-primary-600" />
                      <span className="text-sm sm:hidden text-primary-600 font-medium">Copy Code</span>
                    </>
                  )}
                </span>
              </button>
            </div>

            {/* Countdown Timer with Progress Bar */}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
                <Clock size={16} className={timeRemaining <= 5 ? 'text-red-500' : 'text-gray-400'} />
                <p className="text-base sm:text-lg font-semibold">
                  <span className={timeRemaining <= 5 ? 'text-red-600 animate-pulse' : 'text-primary-600'}>
                    {timeRemaining}s
                  </span>
                  <span className="text-gray-500 text-xs sm:text-sm ml-2">remaining</span>
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ease-linear ${
                    timeRemaining <= 5 ? 'bg-red-500' : 'bg-accent-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              {timeRemaining <= 5 && (
                <p className="text-xs text-red-600 mt-2 animate-pulse font-medium">
                  Code refreshing soon...
                </p>
              )}
            </div>

            {/* QR Code */}
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6 inline-block w-full sm:w-auto">
              <img
                src={data.access.qrCode}
                alt="QR Code"
                className="w-40 h-40 sm:w-48 sm:h-48 mx-auto"
              />
              <p className="text-xs text-gray-500 mt-2 sm:mt-3">
                Or scan this QR code
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
            <Shield size={18} className="text-blue-600 flex-shrink-0" />
            How to Use
          </h3>
          <ol className="space-y-2 text-xs sm:text-sm text-gray-700">
            <li className="flex gap-2 sm:gap-3">
              <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span>Show this 6-digit code to security at the gate</span>
            </li>
            <li className="flex gap-2 sm:gap-3">
              <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>Or let them scan the QR code above</span>
            </li>
            <li className="flex gap-2 sm:gap-3">
              <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>Code refreshes automatically every 30 seconds</span>
            </li>
            <li className="flex gap-2 sm:gap-3">
              <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                4
              </span>
              <span>The resident will be notified of your arrival</span>
            </li>
          </ol>
        </div>

        {/* Usage Stats */}
        {data.access.usageCount > 0 && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
              <span className="text-gray-600">Total Visits:</span>
              <span className="font-semibold text-gray-900">{data.access.usageCount}</span>
            </div>
            {data.access.lastUsed && (
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Last Visit:</span>
                <span className="text-gray-900">
                  {new Date(data.access.lastUsed).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs sm:text-sm text-gray-500 space-y-1">
          <p>Keep this link private and secure</p>
          <p>Powered by Visitor Access Control</p>
        </div>
      </div>
    </div>
  );
};

export default AccessLinkPage;