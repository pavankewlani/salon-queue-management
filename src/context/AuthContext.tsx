import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, UserRole } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isCustomer: boolean;
  login: (credentials: {
    emailOrPhone: string;
    password: string;
  }) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  signup: (data: {
    name: string;
    phone: string;
    email: string;
    password: string;
    role?: UserRole;
  }) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  quickDemoLogin: (role: UserRole) => void;
  logout: () => void;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup';
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
}

const STORAGE_KEY_AUTH_USER = 'royaltouch_auth_user';
const STORAGE_KEY_USERS = 'royaltouch_registered_users';

export const DEMO_USERS: Record<UserRole, AuthUser & { password: string }> = {
  admin: {
    id: 'user-admin',
    name: 'Vikramaditya (Owner)',
    email: 'admin@royaltouch.com',
    phone: '9825000001',
    role: 'admin',
    password: 'admin123',
    avatar: '👑',
    createdAt: new Date().toISOString(),
  },
  receptionist: {
    id: 'user-reception',
    name: 'Pooja Sharma (Front Desk)',
    email: 'reception@royaltouch.com',
    phone: '9825000002',
    role: 'receptionist',
    password: 'staff123',
    avatar: '📋',
    createdAt: new Date().toISOString(),
  },
  barber: {
    id: 'user-barber',
    name: 'Amit Kumar (Master Barber)',
    email: 'barber@royaltouch.com',
    phone: '9825000003',
    role: 'barber',
    password: 'barber123',
    avatar: '✂️',
    createdAt: new Date().toISOString(),
  },
  customer: {
    id: 'user-customer',
    name: 'Rajesh Patel',
    email: 'customer@royaltouch.com',
    phone: '9825011111',
    role: 'customer',
    password: 'customer123',
    avatar: '👤',
    createdAt: new Date().toISOString(),
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode; initialUser?: AuthUser | null }> = ({
  children,
  initialUser = null,
}) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (initialUser !== undefined && initialUser !== null) return initialUser;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading auth user from localStorage', e);
    }
    return null;
  });

  const [registeredUsers, setRegisteredUsers] = useState<Array<AuthUser & { password: string }>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading registered users from localStorage', e);
    }
    return Object.values(DEMO_USERS);
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  // Persist user and registered users to localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY_AUTH_USER);
      }
    } catch (e) {
      console.error('Error saving auth user to localStorage', e);
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(registeredUsers));
    } catch (e) {
      console.error('Error saving registered users to localStorage', e);
    }
  }, [registeredUsers]);

  const openAuthModal = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = async ({
    emailOrPhone,
    password,
  }: {
    emailOrPhone: string;
    password: string;
  }): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
    const cleanInput = emailOrPhone.trim().toLowerCase();
    const cleanDigits = emailOrPhone.trim().replace(/\D/g, '');

    const found = registeredUsers.find(
      (u) =>
        (u.email.toLowerCase() === cleanInput ||
          (cleanDigits.length === 10 && u.phone?.replace(/\D/g, '') === cleanDigits)) &&
        u.password === password
    );

    if (!found) {
      return {
        success: false,
        error: 'Invalid email/phone or password. Please try again or use a demo account.',
      };
    }

    const authUser: AuthUser = {
      id: found.id,
      name: found.name,
      email: found.email,
      phone: found.phone,
      role: found.role,
      avatar: found.avatar,
      createdAt: found.createdAt,
    };

    setUser(authUser);
    closeAuthModal();
    return { success: true, user: authUser };
  };

  const signup = async ({
    name,
    phone,
    email,
    password,
    role: _role = 'customer',
  }: {
    name: string;
    phone: string;
    email: string;
    password: string;
    role?: UserRole;
  }): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
    if (!name || name.trim().length < 2) {
      return { success: false, error: 'Please enter a valid full name (at least 2 characters).' };
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return { success: false, error: 'Please enter a valid 10-digit Indian mobile number.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    // Check duplicate email or phone
    const exists = registeredUsers.some(
      (u) =>
        u.email.toLowerCase() === cleanEmail ||
        (u.phone && u.phone.replace(/\D/g, '') === cleanPhone)
    );

    if (exists) {
      return {
        success: false,
        error: 'An account with this email or phone number already exists. Please log in.',
      };
    }

    // Public registrations are strictly customer accounts; staff accounts are pre-provisioned
    const assignedRole: UserRole = 'customer';

    const newUser: AuthUser & { password: string } = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      password,
      role: assignedRole,
      avatar: '👤',
      createdAt: new Date().toISOString(),
    };

    setRegisteredUsers((prev) => [...prev, newUser]);

    const authUser: AuthUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      avatar: newUser.avatar,
      createdAt: newUser.createdAt,
    };

    setUser(authUser);
    closeAuthModal();
    return { success: true, user: authUser };
  };

  const quickDemoLogin = (role: UserRole) => {
    const demo = DEMO_USERS[role];
    const authUser: AuthUser = {
      id: demo.id,
      name: demo.name,
      email: demo.email,
      phone: demo.phone,
      role: demo.role,
      avatar: demo.avatar,
      createdAt: demo.createdAt,
    };
    setUser(authUser);
    closeAuthModal();
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY_AUTH_USER);
  };

  const isAuthenticated = Boolean(user);
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'admin' || user?.role === 'receptionist' || user?.role === 'barber';
  const isCustomer = user?.role === 'customer';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        isStaff,
        isCustomer,
        login,
        signup,
        quickDemoLogin,
        logout,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const defaultAuthContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  isStaff: false,
  isCustomer: false,
  login: async () => ({ success: false, error: 'AuthProvider not initialized' }),
  signup: async () => ({ success: false, error: 'AuthProvider not initialized' }),
  quickDemoLogin: () => {},
  logout: () => {},
  isAuthModalOpen: false,
  authModalMode: 'login',
  openAuthModal: () => {},
  closeAuthModal: () => {},
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    return defaultAuthContext;
  }
  return context;
};
