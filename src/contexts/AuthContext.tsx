import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { toast } from "react-hot-toast";
import { useSelector, useDispatch } from "react-redux";

import { api } from "@/services/apiClient";
import { authActions, type RootState } from "@/store";

import type { User } from "@/types";

interface AuthContextValue {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;

  // Permissions
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organization?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading, error, token } = useSelector(
    (state: RootState) => state.auth,
  );

  // Initialize auth state from stored token
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("charlotte-econdev-token");

      if (storedToken && !user) {
        try {
          dispatch(authActions.setLoading(true));

          // Verify token and get user data
          const response = await api.get<User>("/auth/me");

          dispatch(
            authActions.loginSuccess({
              user: response.data,
              token: storedToken,
            }),
          );
        } catch (error) {
          console.error("Token verification failed:", error);
          dispatch(authActions.logout());
        }
      }
    };

    initializeAuth();
  }, [dispatch, user]);

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!token || !isAuthenticated) return;

    const refreshInterval = setInterval(
      async () => {
        try {
          await refreshToken();
        } catch (error) {
          console.error("Auto token refresh failed:", error);
        }
      },
      14 * 60 * 1000,
    ); // Refresh every 14 minutes

    return () => clearInterval(refreshInterval);
  }, [token, isAuthenticated]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        dispatch(authActions.loginStart());

        const response = await api.post<{
          user: User;
          token: string;
          refreshToken: string;
        }>("/auth/login", {
          email,
          password,
        });

        const { user, token: accessToken, refreshToken } = response.data;

        // Store tokens
        localStorage.setItem("charlotte-econdev-token", accessToken);
        localStorage.setItem("charlotte-econdev-refresh-token", refreshToken);

        dispatch(authActions.loginSuccess({ user, token: accessToken }));

        toast.success(`Welcome back, ${user.firstName}!`);
      } catch (error: any) {
        const message = error.response?.data?.error?.message || "Login failed";
        dispatch(authActions.loginFailure(message));
        throw error;
      }
    },
    [dispatch],
  );

  const logout = useCallback(async () => {
    try {
      // Notify server about logout
      await api.post("/auth/logout");
    } catch (error) {
      // Continue with logout even if server request fails
      console.warn("Server logout failed:", error);
    } finally {
      // Clear local state and storage
      dispatch(authActions.logout());
      localStorage.removeItem("charlotte-econdev-token");
      localStorage.removeItem("charlotte-econdev-refresh-token");

      toast.success("Logged out successfully");
    }
  }, [dispatch]);

  const register = useCallback(
    async (userData: RegisterData) => {
      try {
        dispatch(authActions.setLoading(true));

        const response = await api.post<{
          user: User;
          token: string;
          refreshToken: string;
        }>("/auth/register", userData);

        const { user, token: accessToken, refreshToken } = response.data;

        // Store tokens
        localStorage.setItem("charlotte-econdev-token", accessToken);
        localStorage.setItem("charlotte-econdev-refresh-token", refreshToken);

        dispatch(authActions.loginSuccess({ user, token: accessToken }));

        toast.success(`Welcome to Charlotte EconDev, ${user.firstName}!`);
      } catch (error: any) {
        const message =
          error.response?.data?.error?.message || "Registration failed";
        dispatch(authActions.loginFailure(message));
        throw error;
      }
    },
    [dispatch],
  );

  const updateProfile = useCallback(
    async (userData: Partial<User>) => {
      try {
        dispatch(authActions.setLoading(true));

        const response = await api.put<User>("/auth/profile", userData);

        dispatch(authActions.updateUser(response.data));
        dispatch(authActions.setLoading(false));

        toast.success("Profile updated successfully");
      } catch (error: any) {
        const message =
          error.response?.data?.error?.message || "Profile update failed";
        dispatch(authActions.loginFailure(message));
        throw error;
      }
    },
    [dispatch],
  );

  const refreshToken = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem(
      "charlotte-econdev-refresh-token",
    );

    if (!storedRefreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await api.post<{ token: string; refreshToken: string }>(
        "/auth/refresh",
        {
          refreshToken: storedRefreshToken,
        },
      );

      const { token: newAccessToken, refreshToken: newRefreshToken } =
        response.data;

      // Update stored tokens
      localStorage.setItem("charlotte-econdev-token", newAccessToken);
      localStorage.setItem("charlotte-econdev-refresh-token", newRefreshToken);

      // Update store (user data should remain the same)
      if (user) {
        dispatch(authActions.loginSuccess({ user, token: newAccessToken }));
      }
    } catch (error) {
      // Refresh failed, logout user
      dispatch(authActions.logout());
      throw error;
    }
  }, [dispatch, user]);

  const clearError = useCallback(() => {
    dispatch(authActions.clearError());
  }, [dispatch]);

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user?.permissions) return false;
      return (
        user.permissions.includes(permission) ||
        user.permissions.includes("admin")
      );
    },
    [user],
  );

  const hasRole = useCallback(
    (role: string) => {
      if (!user?.role) return false;
      return user.role === role || user.role === "admin";
    },
    [user],
  );

  const value: AuthContextValue = {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,

    // Actions
    login,
    logout,
    register,
    updateProfile,
    refreshToken,
    clearError,

    // Permissions
    hasPermission,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

// Hook for checking authentication status
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();

  return {
    isAuthenticated,
    isLoading,
    isReady: !isLoading,
  };
}

// Hook for permission checking
export function usePermissions() {
  const { hasPermission, hasRole, user } = useAuth();

  return {
    hasPermission,
    hasRole,
    permissions: user?.permissions || [],
    role: user?.role,
  };
}
