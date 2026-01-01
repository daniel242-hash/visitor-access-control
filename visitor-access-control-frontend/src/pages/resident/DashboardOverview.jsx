import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserPlus, History, TrendingUp } from 'lucide-react';
import { residentService } from '../../services/residentService';
import useAuthStore from '../../store/authStore';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import Button from '../../components/shared/Button';
import Toggle from '../../components/shared/Toggle';
import toast from 'react-hot-toast';

const DashboardOverview = () => {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    trustedContacts: 0,
    pendingVisitors: 0,
    totalVisits: 0,
  });

  const toggleAcceptingVisitors = async () => {
    setLoading(true);
    try {
      const response = await residentService.toggleVisitors();
      if (response.success) {
        updateUser({ acceptingVisitors: response.data.acceptingVisitors });
        toast.success(
          response.data.acceptingVisitors
            ? 'Now accepting visitors'
            : 'Visitor acceptance disabled'
        );
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contacts, visitors, logs] = await Promise.all([
          residentService.getTrustedContacts(),
          residentService.getPreRegisteredVisitors(1, 10, 'pending'),
          residentService.getVisitorLogs(1, 10),
        ]);

        setStats({
          trustedContacts: contacts.data.pagination.totalItems,
          pendingVisitors: visitors.data.pagination.totalItems,
          totalVisits: logs.data.pagination.totalItems,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    {
      title: 'Trusted Contacts',
      value: stats.trustedContacts,
      icon: Users,
      color: 'bg-blue-500',
      link: '/resident/contacts',
    },
    {
      title: 'Pending Visitors',
      value: stats.pendingVisitors,
      icon: UserPlus,
      color: 'bg-yellow-500',
      link: '/resident/pre-register',
    },
    {
      title: 'Total Visits',
      value: stats.totalVisits,
      icon: History,
      color: 'bg-green-500',
      link: '/resident/history',
    },
  ];

  return (
    <div>
      {/* Header - Mobile Responsive */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 transition-colors duration-200">
        <div className="flex flex-col gap-4">
          <div className="text-white">
            <h1 className="text-xl sm:text-2xl font-bold mb-1">
              Welcome back, {user?.fullName?.split(' ')[0] || 'User'}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-primary-100 dark:text-primary-200">
              {user?.estateName || 'Your Estate'} • {user?.homeAddress}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white/10 dark:bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl px-4 py-3 border border-white/20 dark:border-white/30">
            <div className="text-white flex-1">
              <p className="text-xs sm:text-sm font-medium">
                {user?.acceptingVisitors ? 'Accepting Visitors' : 'Not Accepting Visitors'}
              </p>
              <p className="text-[10px] sm:text-xs text-primary-100 dark:text-primary-200">Toggle to change status</p>
            </div>
            <Toggle
              enabled={user?.acceptingVisitors || false}
              onChange={toggleAcceptingVisitors}
              loading={loading}
              label="Toggle visitor acceptance"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards - Mobile Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {statCards.map((stat, index) => (
          <Link key={index} to={stat.link}>
            <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-md transition-all group cursor-pointer">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`${stat.color} w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                  <stat.icon size={20} className="sm:w-6 sm:h-6" />
                </div>
              </div>
              <div className="mt-3 sm:mt-4 flex items-center text-xs sm:text-sm text-primary-600 dark:text-primary-400">
                <TrendingUp size={14} className="sm:w-4 sm:h-4 mr-1" />
                <span>View details →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions - Mobile Responsive */}
      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-4 sm:mb-6 transition-colors duration-200">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Link to="/resident/contacts">
            <div className="p-3 sm:p-4 border-2 border-primary-100 dark:border-primary-900 rounded-lg sm:rounded-xl hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-600 dark:bg-primary-500 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                  <Users size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Add Trusted Contact</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Generate access link for family/friends</p>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/resident/pre-register">
            <div className="p-3 sm:p-4 border-2 border-accent-100 dark:border-accent-900 rounded-lg sm:rounded-xl hover:border-accent-300 dark:hover:border-accent-700 hover:bg-accent-50 dark:hover:bg-accent-900/20 transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-600 dark:bg-accent-500 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                  <UserPlus size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Pre-Register Visitor</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Register expected guest in advance</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Info Card - Mobile Responsive */}
      <div className="bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/30 dark:to-accent-900/30 rounded-lg sm:rounded-xl shadow-sm border border-primary-100 dark:border-primary-800 p-4 sm:p-6 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-600 dark:bg-primary-500 rounded-lg sm:rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <History size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white mb-2">Track All Your Visitors</h3>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-4">
              View complete history of all visitors who entered your home, including entry and exit times.
            </p>
            <Link to="/resident/history">
              <Button variant="primary" className="w-full sm:w-auto">
                View History
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;