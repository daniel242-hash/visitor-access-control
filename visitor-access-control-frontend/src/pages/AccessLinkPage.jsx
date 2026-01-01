import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, RefreshCw, Copy, Check, Clock, Home, User, MapPin, AlertCircle } from 'lucide-react';
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
      // Set initial time remaining
      setTimeRemaining(data.access.timeRemaining);

      // Start countdown timer (updates every second)
      countdownRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // When countdown reaches 0, refresh the code
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

  // Calculate progress percentage for visual countdown
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
        <div className="card max-w-md w-full text-center">
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 p-4">
      <div className="max-w-lg mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 text-white rounded-2xl mb-4">
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Estate Access Code
          </h1>
          <p className="text-gray-600">
            Show this code to security for entry
          </p>
        </div>

        {/* Contact Info Card */}
        <div className="card mb-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white border-0">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl font-bold">
              {data.contact.fullName.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold">{data.contact.fullName}</h2>
              <p className="text-primary-100">{data.contact.relationship}</p>
            </div>
          </div>
          
          <div className="space-y-2 pt-4 border-t border-white/20">
            <div className="flex items-center gap-2 text-primary-50">
              <User size={16} />
              <span className="text-sm">Visiting: {data.resident.fullName}</span>
            </div>
            <div className="flex items-center gap-2 text-primary-50">
              <Home size={16} />
              <span className="text-sm">{data.resident.homeAddress}</span>
            </div>
            <div className="flex items-center gap-2 text-primary-50">
              <MapPin size={16} />
              <span className="text-sm">{data.estate.name}</span>
            </div>
          </div>
        </div>

        {/* TOTP Code Card */}
        <div className="card mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">Your Access Code</p>
            
            {/* Large TOTP Code */}
            <div className="relative mb-6">
              <div className="text-6xl font-bold text-primary-600 tracking-wider font-mono">
                {data.access.currentCode.match(/.{1,3}/g).join(' ')}
              </div>
              <button
                onClick={copyCode}
                className="absolute -right-2 top-1/2 -translate-y-1/2 p-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
              >
                {copied ? (
                  <Check size={20} className="text-accent-600" />
                ) : (
                  <Copy size={20} className="text-primary-600" />
                )}
              </button>
            </div>

            {/* Countdown Timer with Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Clock size={18} className={timeRemaining <= 5 ? 'text-red-500' : 'text-gray-400'} />
                <p className="text-lg font-semibold">
                  <span className={timeRemaining <= 5 ? 'text-red-600 animate-pulse' : 'text-primary-600'}>
                    {timeRemaining}s
                  </span>
                  <span className="text-gray-500 text-sm ml-2">remaining</span>
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
            <div className="bg-gray-50 rounded-xl p-6 inline-block">
              <img
                src={data.access.qrCode}
                alt="QR Code"
                className="w-48 h-48 mx-auto"
              />
              <p className="text-xs text-gray-500 mt-3">
                Or scan this QR code
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Shield size={20} className="text-blue-600" />
            How to Use
          </h3>
          <ol className="space-y-2 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span>Show this 6-digit code to security at the gate</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>Or let them scan the QR code above</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>Code refreshes automatically every 30 seconds</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                4
              </span>
              <span>The resident will be notified of your arrival</span>
            </li>
          </ol>
        </div>

        {/* Usage Stats */}
        {data.access.usageCount > 0 && (
          <div className="card mt-6 bg-gray-50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Visits:</span>
              <span className="font-semibold text-gray-900">{data.access.usageCount}</span>
            </div>
            {data.access.lastUsed && (
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600">Last Visit:</span>
                <span className="text-gray-900">
                  {new Date(data.access.lastUsed).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Keep this link private and secure</p>
          <p className="mt-1">Powered by Visitor Access Control</p>
        </div>
      </div>
    </div>
  );
};

export default AccessLinkPage;