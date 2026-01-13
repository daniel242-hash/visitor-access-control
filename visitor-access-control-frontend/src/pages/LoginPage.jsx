import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import useAuthStore from '../store/authStore';
import Input from '../components/shared/Input';
import Button from '../components/shared/Button';

const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

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
      const response = await authService.login(formData.email, formData.password);
      
      console.log('Login response:', response);
      
      if (response.success) {
        const { user, tokens } = response.data;
        
        setAuth(user, tokens.accessToken, tokens.refreshToken);
        localStorage.setItem('resident_accessToken', tokens.accessToken);
        localStorage.setItem('resident_refreshToken', tokens.refreshToken);
        localStorage.setItem('resident_user', JSON.stringify(user));
        
        toast.success('Login successful!');
        
        if (user.role === 'resident') {
          navigate('/resident/dashboard');
        } else if (user.role === 'admin') {
          navigate('/admin/dashboard');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-primary-600 text-white rounded-2xl mb-3 sm:mb-4 shadow-lg">
            <Shield size={28} className="sm:w-8 sm:h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              icon={Mail}
              placeholder="your@email.com"
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

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 dark:bg-gray-700"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              icon={LogIn}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                Register here
              </Link>
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <Link
              to="/security/login"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 inline-flex items-center justify-center gap-2"
            >
              <Shield size={16} />
              Security Personnel Login
            </Link>
          </div>
        </div>

        {/* Mobile App Hint */}
        <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
          <p>Access from anywhere on any device</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;