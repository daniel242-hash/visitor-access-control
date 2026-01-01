import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Shield, 
  Users, 
  ClipboardList,
  BarChart3,
  LogOut,
  Menu,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useAuth } from '../contexts/AuthContext';

const SecurityLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/security/login');
  };

  const navigationLinks = [
    {
      name: 'Dashboard',
      path: '/security/dashboard',
      icon: LayoutDashboard,
      description: 'Overview and quick stats'
    },
    {
      name: 'Verify Visitor',
      path: '/security/verify',
      icon: Shield,
      description: 'Verify TOTP or search visitor'
    },
    {
      name: 'Current Visitors',
      path: '/security/current',
      icon: Users,
      description: 'Visitors on premises'
    },
    {
      name: 'Entry Logs',
      path: '/security/logs',
      icon: ClipboardList,
      description: 'View all entry records'
    },
    {
      name: 'Statistics',
      path: '/security/statistics',
      icon: BarChart3,
      description: 'Analytics and insights'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation Bar - ✅ FIXED: Added fixed height h-[73px] */}
      <header className="h-[73px] bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 fixed top-0 left-0 right-0 z-30">
        <div className="flex items-center justify-between px-4 h-full">
          {/* Left side - Logo and Menu Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <Shield className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">FortiPass</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">Security Portal</p>
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* User Info */}
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-700">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.estate?.name || 'Security Personnel'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Security Guard</p>
              </div>
              <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold">
                {(user?.estate?.name || 'S').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen transition-transform bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 w-64
        `}
      >
        <div className="h-full overflow-y-auto">
          {/* Sidebar Logo/Header - ✅ FIXED: Added fixed height h-[73px] to match top header */}
          <div className="h-[73px] px-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <Shield className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">FortiPass</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">Security Portal</p>
              </div>
            </div>
          </div>

          <div className="px-3 pb-4">
            {/* Navigation Links */}
            <nav className="space-y-2 mt-4">
              {navigationLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive
                          ? 'bg-teal-600 text-white shadow-lg'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={20} className={isActive ? 'text-white' : ''} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{link.name}</p>
                          <p className={`text-xs ${isActive ? 'text-teal-100' : 'text-gray-500 dark:text-gray-400'}`}>
                            {link.description}
                          </p>
                        </div>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Estate Info */}
            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Current Estate</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {user?.estate?.name || 'Oakwood Gardens Estate'}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Code: {user?.estate?.code || 'OAK123'}
              </p>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full mt-4 flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut size={20} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-[73px]">
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SecurityLayout;