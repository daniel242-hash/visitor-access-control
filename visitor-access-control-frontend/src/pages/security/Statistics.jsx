import { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Clock, Calendar, Shield, 
  UserCheck, UserPlus, Activity, BarChart3, PieChart,
  TrendingDown, Minus
} from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

const Statistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    fetchStatistics();
  }, [timeRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      console.log('Fetching statistics with range:', timeRange);
      const response = await api.get(`/security/statistics?range=${timeRange}`);
      
      console.log('Full API Response:', response);
      console.log('Response data:', response.data);
      
      if (response.data.success) {
        const statsData = response.data.data;
        console.log('Statistics data received:', statsData);
        
        // Check if we have valid data
        if (statsData && statsData.overview) {
          console.log('Setting stats with overview:', statsData.overview);
          setStats(statsData);
        } else {
          console.warn('Stats data missing overview:', statsData);
          setStats(null);
        }
      } else {
        console.error('API returned success: false', response.data);
        setStats(null);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (value, total) => {
    if (total === 0) return '0.0';
    return ((value / total) * 100).toFixed(1);
  };

  const getTrendIcon = (change) => {
    if (change > 0) return <TrendingUp size={16} className="text-green-600 dark:text-green-400" />;
    if (change < 0) return <TrendingDown size={16} className="text-red-600 dark:text-red-400" />;
    return <Minus size={16} className="text-gray-600 dark:text-gray-400" />;
  };

  const getTrendColor = (change) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <BarChart3 size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
        <p className="text-lg text-gray-600 dark:text-gray-400">No statistics available</p>
      </div>
    );
  }

  const totalVisitorTypes = stats.visitorTypes.trusted + 
                           stats.visitorTypes.preRegistered + 
                           stats.visitorTypes.walkIn;

  const maxPeakHour = Math.max(...stats.peakHours.map(h => h.count));
  const maxDailyVisits = Math.max(...stats.dailyTrend.map(d => d.visits));
  const maxMonthlyVisits = Math.max(...stats.monthlyTrend.map(m => m.visits));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive visitor analytics and insights
          </p>
        </div>
        
        {/* Time Range Filter */}
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
        </select>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Visits */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Activity className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <div className={`flex items-center gap-1 text-xs font-medium ${getTrendColor(stats.overview.growthMetrics.visitsChange)}`}>
              {getTrendIcon(stats.overview.growthMetrics.visitsChange)}
              {Math.abs(stats.overview.growthMetrics.visitsChange)}%
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Total Visits
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.overview.totalVisits.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {stats.overview.averageVisitsPerDay} avg/day
          </p>
        </div>

        {/* Unique Visitors */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Users className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
            <div className={`flex items-center gap-1 text-xs font-medium ${getTrendColor(stats.overview.growthMetrics.visitorsChange)}`}>
              {getTrendIcon(stats.overview.growthMetrics.visitorsChange)}
              {Math.abs(stats.overview.growthMetrics.visitorsChange)}%
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Unique Visitors
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.overview.totalVisitors.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {totalVisitorTypes > 0 ? ((stats.overview.totalVisitors / totalVisitorTypes) * 100).toFixed(0) : 0}% return rate
          </p>
        </div>

        {/* Average Duration */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
              <Clock className="text-orange-600 dark:text-orange-400" size={24} />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Avg. Visit Duration
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.overview.averageVisitDuration} <span className="text-lg">min</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {(stats.overview.averageVisitDuration / 60).toFixed(1)} hours
          </p>
        </div>

        {/* Currently On Premises */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <UserCheck className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            On Premises Now
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.overview.currentlyOnPremises}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Live count
          </p>
        </div>
      </div>

      {/* Visitor Type Distribution & Verification Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visitor Types Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="text-gray-600 dark:text-gray-400" size={20} />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Visitor Types
            </h2>
          </div>

          <div className="space-y-4">
            {/* Trusted Contacts */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Trusted Contacts
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {stats.visitorTypes.trusted} ({getPercentage(stats.visitorTypes.trusted, totalVisitorTypes)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-purple-600 dark:bg-purple-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${getPercentage(stats.visitorTypes.trusted, totalVisitorTypes)}%` }}
                ></div>
              </div>
            </div>

            {/* Pre-registered */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pre-registered
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {stats.visitorTypes.preRegistered} ({getPercentage(stats.visitorTypes.preRegistered, totalVisitorTypes)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-blue-600 dark:bg-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${getPercentage(stats.visitorTypes.preRegistered, totalVisitorTypes)}%` }}
                ></div>
              </div>
            </div>

            {/* Walk-in */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Walk-in
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {stats.visitorTypes.walkIn} ({getPercentage(stats.visitorTypes.walkIn, totalVisitorTypes)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gray-600 dark:bg-gray-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${getPercentage(stats.visitorTypes.walkIn, totalVisitorTypes)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Methods */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="text-gray-600 dark:text-gray-400" size={20} />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Verification Methods
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">TOTP Code</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.verificationMethods.totp}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getPercentage(stats.verificationMethods.totp, totalVisitorTypes)}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Pre-registration</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.verificationMethods.preRegistration}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getPercentage(stats.verificationMethods.preRegistration, totalVisitorTypes)}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Manual</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.verificationMethods.manual}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getPercentage(stats.verificationMethods.manual, totalVisitorTypes)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Peak Hours Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="text-gray-600 dark:text-gray-400" size={20} />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Peak Hours Analysis
          </h2>
        </div>

        <div className="space-y-3">
          {stats.peakHours.map((item, index) => (
            <div key={index} className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-16">
                {item.hour}
              </span>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-8 relative overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-teal-500 to-teal-600 h-8 rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                  style={{ width: `${maxPeakHour > 0 ? (item.count / maxPeakHour) * 100 : 0}%` }}
                >
                  {item.count > 0 && (
                    <span className="text-xs font-medium text-white">
                      {item.count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekday Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="text-gray-600 dark:text-gray-400" size={20} />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Weekday Distribution
          </h2>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {stats.weekdayDistribution.map((item, index) => {
            const maxVisits = Math.max(...stats.weekdayDistribution.map(d => d.visits));
            const heightPercentage = maxVisits > 0 ? (item.visits / maxVisits) * 100 : 0;
            
            return (
              <div key={index} className="flex flex-col items-center">
                <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg relative overflow-hidden flex items-end">
                  <div 
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-600 rounded-t-lg transition-all duration-500"
                    style={{ height: `${heightPercentage}%` }}
                  ></div>
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-2">
                  {item.day.slice(0, 3)}
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {item.visits}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily & Monthly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend (Last 7 Days) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="text-gray-600 dark:text-gray-400" size={20} />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Daily Trend (Last 7 Days)
            </h2>
          </div>

          <div className="space-y-3">
            {stats.dailyTrend.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-12">
                  {item.day}
                </span>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                    style={{ width: `${maxDailyVisits > 0 ? (item.visits / maxDailyVisits) * 100 : 0}%` }}
                  >
                    {item.visits > 0 && (
                      <span className="text-xs font-medium text-white">
                        {item.visits}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend (Last 6 Months) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="text-gray-600 dark:text-gray-400" size={20} />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Monthly Trend (Last 6 Months)
            </h2>
          </div>

          <div className="space-y-3">
            {stats.monthlyTrend.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-16">
                  {item.month}
                </span>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                    style={{ width: `${maxMonthlyVisits > 0 ? (item.visits / maxMonthlyVisits) * 100 : 0}%` }}
                  >
                    {item.visits > 0 && (
                      <span className="text-xs font-medium text-white">
                        {item.visits}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Residents */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <UserPlus className="text-gray-600 dark:text-gray-400" size={20} />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Most Visited Residents
          </h2>
        </div>

        <div className="space-y-4">
          {stats.topResidents.map((resident, index) => (
            <div 
              key={index}
              className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-teal-600 dark:text-teal-400">
                  #{index + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {resident.name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {resident.address}
                </p>
              </div>
              <div className="flex-shrink-0">
                <span className="inline-block px-3 py-1 bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 text-sm font-bold rounded-full">
                  {resident.visits}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Statistics;