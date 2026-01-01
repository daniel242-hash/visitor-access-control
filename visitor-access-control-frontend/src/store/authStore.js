import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      
      setAuth: (user, accessToken, refreshToken) => {
        // Store with role-specific keys
        const rolePrefix = user.role || 'user';
        localStorage.setItem(`${rolePrefix}_accessToken`, accessToken);
        localStorage.setItem(`${rolePrefix}_refreshToken`, refreshToken);
        localStorage.setItem(`${rolePrefix}_user`, JSON.stringify(user));
        
        set({ user, accessToken, refreshToken });
      },
      
      logout: () => {
        // Clear all possible role tokens
        const roles = ['resident', 'security', 'admin'];
        roles.forEach(role => {
          localStorage.removeItem(`${role}_accessToken`);
          localStorage.removeItem(`${role}_refreshToken`);
          localStorage.removeItem(`${role}_user`);
        });
        
        // Also clear old non-prefixed keys
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        set({ user: null, accessToken: null, refreshToken: null });
      },
      
      updateUser: (userData) =>
        set((state) => ({ user: { ...state.user, ...userData } })),
    }),
    {
      name: 'auth-storage',
      // Custom storage to handle role-specific keys
      getStorage: () => ({
        getItem: (name) => {
          const stored = localStorage.getItem(name);
          if (!stored) return null;
          
          const data = JSON.parse(stored);
          if (data?.state?.user?.role) {
            const role = data.state.user.role;
            // Try to restore from role-specific storage
            const roleToken = localStorage.getItem(`${role}_accessToken`);
            const roleRefreshToken = localStorage.getItem(`${role}_refreshToken`);
            const roleUser = localStorage.getItem(`${role}_user`);
            
            if (roleToken && roleUser) {
              return JSON.stringify({
                state: {
                  user: JSON.parse(roleUser),
                  accessToken: roleToken,
                  refreshToken: roleRefreshToken,
                }
              });
            }
          }
          
          return stored;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, value);
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      }),
    }
  )
);

export default useAuthStore;