import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, LogIn, Monitor, Smartphone, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import useAuthStore from '../store/authStore';
import Input from '../components/shared/Input';
import Button from '../components/shared/Button';

const SecurityLoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  // Device detection
  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent);
      const screenWidth = window.innerWidth;
      
      // Consider as desktop only if:
      // 1. Not a mobile/tablet user agent
      // 2. Screen width is at least 1024px
      const desktop = !isMobile && !isTablet && screenWidth >= 1024;
      setIsDesktop(desktop);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Double-check device before submission
    if (!isDesktop) {
      toast.error('Security login is only available on desktop/laptop computers');
      return;
    }
    
    setLoading(true);

    try {
      const response = await authService.securityLogin(
        formData.identifier,
        formData.password
      );
      
      console.log('Security login response:', response);
      
      if (response.success) {
        const data = response.data;
        
        const securityUser = {
          role: data.role || 'security',
          estate: data.estate || {},
        };
        
        console.log('Security user object:', securityUser);
        
        const accessToken = data.tokens?.accessToken || data.accessToken;
        const refreshToken = data.tokens?.refreshToken || data.refreshToken;
        
        console.log('Tokens:', { accessToken, refreshToken });
        
        setAuth(securityUser, accessToken, refreshToken);
        localStorage.setItem('security_accessToken', accessToken);
        localStorage.setItem('security_refreshToken', refreshToken);
        localStorage.setItem('security_user', JSON.stringify(securityUser));
        
        toast.success(`Welcome to ${data.estate?.name || 'the estate'}!`);
        
        setTimeout(() => {
          navigate('/security/dashboard', { replace: true });
        }, 100);
      }
    } catch (error) {
      console.error('Security login error:', error);
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Show restriction message for non-desktop devices
  if (!isDesktop) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-red-200 dark:border-red-900">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl mb-4">
                <AlertCircle size={32} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Desktop Access Only
              </h1>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <Smartphone className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-900 dark:text-red-300 mb-1">
                    Mobile/Tablet Detected
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    Security personnel login is restricted to desktop and laptop computers for enhanced security and workflow requirements.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                    Access Requirements
                  </p>
                  <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                    <li>• Desktop or laptop computer</li>
                    <li>• Minimum screen width: 1024px</li>
                    <li>• Modern web browser</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Please use a desktop or laptop computer to access the security portal.
              </p>
              
              <Link
                to="/login"
                className="block w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-center font-medium transition-colors"
              >
                Go to Resident Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop view - normal login form
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 text-white rounded-2xl mb-4 shadow-lg">
            <Shield size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Security Login
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in with your estate credentials
          </p>
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
            <Monitor size={14} />
            Desktop Access Verified
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Estate Code or Username"
              type="text"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              icon={Shield}
              placeholder="EST-12345 or oakwood_security"
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              icon={Lock}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              icon={LogIn}
            >
              Sign In as Security
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <Link
              to="/login"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              ← Back to regular login
            </Link>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
          <p>🔒 Secure connection • Desktop access required</p>
        </div>
      </div>
    </div>
  );
};

export default SecurityLoginPage;