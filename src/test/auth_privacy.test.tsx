import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider, DEMO_USERS } from '../context/AuthContext';
import { QueueProvider } from '../context/QueueContext';
import { Header } from '../components/layout/Header';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { AdminScreen } from '../screens/AdminScreen';
import { ReceptionScreen } from '../screens/ReceptionScreen';
import { MyStatusScreen } from '../screens/MyStatusScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { maskName, maskPhone, canViewCustomerDetails } from '../utils/privacy';

const renderWithAuth = (
  ui: React.ReactElement,
  {
    initialRoute = '/',
    initialUser = null,
  }: {
    initialRoute?: string;
    initialUser?: any;
  } = {}
) => {
  return render(
    <LanguageProvider>
      <AuthProvider initialUser={initialUser}>
        <QueueProvider>
          <MemoryRouter initialEntries={[initialRoute]}>
            <Header />
            <Routes>
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reception"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
                    <ReceptionScreen />
                  </ProtectedRoute>
                }
              />
              <Route path="/status/:id" element={<MyStatusScreen />} />
              <Route path="/login" element={<AuthScreen />} />
              <Route path="*" element={ui} />
            </Routes>
          </MemoryRouter>
        </QueueProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

describe('AUTHENTICATION & ROLE-BASED PRIVACY AUDIT', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // =========================================================================
  // 1. ADMIN PANEL HIDDEN FROM GUESTS AND REGULAR CUSTOMERS
  // =========================================================================
  it('hides Admin link from Header navigation for unauthenticated guests and customers', () => {
    // 1. Guest
    const { unmount } = renderWithAuth(<div>Home Page</div>, { initialRoute: '/' });
    expect(screen.queryByRole('link', { name: /^Admin$/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    unmount();

    // 2. Logged in as regular customer
    renderWithAuth(<div>Home Page</div>, {
      initialRoute: '/',
      initialUser: DEMO_USERS.customer,
    });
    expect(screen.queryByRole('link', { name: /^Admin$/i })).not.toBeInTheDocument();
    expect(screen.getByText(/customer/i)).toBeInTheDocument();
  });

  it('blocks direct navigation to /admin or /owner for unauthorized visitors and renders Access Restricted guard', () => {
    // Direct navigate to /admin as guest
    renderWithAuth(<div />, { initialRoute: '/admin' });

    expect(screen.getByText(/Access Restricted/i)).toBeInTheDocument();
    expect(screen.getByText(/Restricted Admin Console/i)).toBeInTheDocument();
    expect(screen.getByText(/This panel contains sensitive salon operational settings/i)).toBeInTheDocument();
    // Admin operational controls must NOT be visible
    expect(screen.queryByText(/Owner Operations Console/i)).not.toBeInTheDocument();
  });

  // =========================================================================
  // 2. RECEPTION QUEUE HIDDEN FROM GUESTS AND REGULAR CUSTOMERS
  // =========================================================================
  it('hides Reception link from Header navigation for unauthenticated guests and customers', () => {
    // Guest
    const { unmount } = renderWithAuth(<div>Home Page</div>, { initialRoute: '/' });
    expect(screen.queryByRole('link', { name: /^Reception$/i })).not.toBeInTheDocument();
    unmount();

    // Customer
    renderWithAuth(<div>Home Page</div>, {
      initialRoute: '/',
      initialUser: DEMO_USERS.customer,
    });
    expect(screen.queryByRole('link', { name: /^Reception$/i })).not.toBeInTheDocument();
  });

  it('blocks direct navigation to /reception for guests and customers to prevent viewing whole queue without signing in', () => {
    // Customer tries to open /reception
    renderWithAuth(<div />, {
      initialRoute: '/reception',
      initialUser: DEMO_USERS.customer,
    });

    expect(screen.getByText(/Access Restricted/i)).toBeInTheDocument();
    expect(screen.getByText(/Staff Access Only/i)).toBeInTheDocument();
    expect(screen.getByText(/The full customer queue and desk actions are reserved for salon personnel/i)).toBeInTheDocument();
    // Desk action buttons must NOT be visible
    expect(screen.queryByText(/Add Walk-In Patron/i)).not.toBeInTheDocument();
  });

  // =========================================================================
  // 3. ADMIN ACCESS WHEN SIGNED IN
  // =========================================================================
  it('allows Admin to see Admin and Reception links and access /admin dashboard', () => {
    renderWithAuth(<div />, {
      initialRoute: '/admin',
      initialUser: DEMO_USERS.admin,
    });

    // Both Admin and Reception links are now visible in navigation
    expect(screen.getByRole('link', { name: /^Admin$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Reception$/i })).toBeInTheDocument();
    // Admin console unlocked
    expect(screen.getByText(/Owner Settings & Operations/i)).toBeInTheDocument();
  });

  // =========================================================================
  // 4. RECEPTIONIST ACCESS WHEN SIGNED IN
  // =========================================================================
  it('allows Receptionist to view Reception queue but keeps Admin panel hidden and restricted', () => {
    const { unmount } = renderWithAuth(<div />, {
      initialRoute: '/reception',
      initialUser: DEMO_USERS.receptionist,
    });

    // Reception link visible, Admin link HIDDEN
    expect(screen.getByRole('link', { name: /^Reception$/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Admin$/i })).not.toBeInTheDocument();
    // Full queue management console unlocked
    expect(screen.getByText(/Reception Command Hub/i)).toBeInTheDocument();
    unmount();

    // Receptionist tries to visit /admin
    renderWithAuth(<div />, {
      initialRoute: '/admin',
      initialUser: DEMO_USERS.receptionist,
    });
    expect(screen.getByText(/Restricted Admin Console/i)).toBeInTheDocument();
  });

  // =========================================================================
  // 5. CUSTOMER INFORMATION PRIVACY & DATA MASKING
  // =========================================================================
  it('masks phone numbers for unauthorized viewers viewing digital passes on My Status', () => {
    // S-1 belongs to phone 9825011111
    // Stranger (or unauthenticated visitor) visits /status/S-1
    renderWithAuth(<div />, {
      initialRoute: '/status/S-1',
      initialUser: null,
    });

    // Full 10-digit phone must NOT be displayed
    expect(screen.queryByText('+91 9825011111')).not.toBeInTheDocument();
    // Masked phone format must be displayed
    expect(screen.getByText(/\+91 98250 •••••/i)).toBeInTheDocument();
    expect(screen.getByText(/Privacy Protected Pass/i)).toBeInTheDocument();
  });

  it('reveals full phone number only to the authenticated customer who owns the pass', () => {
    // S-1 customer phone is 9825011111, which matches DEMO_USERS.customer
    renderWithAuth(<div />, {
      initialRoute: '/status/S-1',
      initialUser: DEMO_USERS.customer,
    });

    // Verified owner sees unmasked phone
    expect(screen.getByText(/\+91 9825011111/i)).toBeInTheDocument();
    expect(screen.queryByText(/Privacy Protected Pass/i)).not.toBeInTheDocument();
  });

  it('validates privacy masking helper functions', () => {
    expect(maskName('Rajesh Patel')).toBe('Rajesh P.');
    expect(maskName('Aarav Mehta')).toBe('Aarav M.');
    expect(maskName('Vikram')).toBe('Vikram');

    expect(maskPhone('9825012345')).toBe('98250 •••••');
    expect(maskPhone('9898011223')).toBe('98980 •••••');

    const sampleToken: any = { customerPhone: '9825012345' };
    const matchingCustomer: any = { role: 'customer', phone: '9825012345' };
    const otherCustomer: any = { role: 'customer', phone: '9825099999' };
    const staffUser: any = { role: 'receptionist' };

    expect(canViewCustomerDetails(matchingCustomer, sampleToken)).toBe(true);
    expect(canViewCustomerDetails(otherCustomer, sampleToken)).toBe(false);
    expect(canViewCustomerDetails(staffUser, sampleToken)).toBe(true);
    expect(canViewCustomerDetails(null, sampleToken)).toBe(false);
  });

  // =========================================================================
  // 6. SIGN UP & FAST DEMO LOGINS
  // =========================================================================
  it('allows registering a new customer account and signing in', async () => {
    renderWithAuth(<AuthScreen />, { initialRoute: '/login' });

    // Switch to Create Account tab
    const createAccountTab = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(createAccountTab);

    const nameInput = screen.getByPlaceholderText(/e\.g\. Rajesh Patel/i);
    const phoneInput = screen.getByPlaceholderText('9825012345');
    const emailInput = screen.getByPlaceholderText('rajesh@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /Create Account & Sign In/i });

    fireEvent.change(nameInput, { target: { value: 'New Test User' } });
    fireEvent.change(phoneInput, { target: { value: '9825055555' } });
    fireEvent.change(emailInput, { target: { value: 'newuser@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'secret123' } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      // User is logged in and header shows user avatar/name chip
      expect(screen.getByText('New')).toBeInTheDocument();
      expect(screen.getAllByText(/customer/i)[0]).toBeInTheDocument();
    });
  });

  it('allows typing credentials to log in as admin and sign out', async () => {
    renderWithAuth(<AuthScreen />, { initialRoute: '/login' });

    // Type Admin credentials
    const identifierInput = screen.getByPlaceholderText(/e\.g\. admin@royaltouch\.com/i);
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /Sign In Securely/i });

    fireEvent.change(identifierInput, { target: { value: 'admin@royaltouch.com' } });
    fireEvent.change(passwordInput, { target: { value: 'admin123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Vikramaditya')).toBeInTheDocument();
      expect(screen.getAllByText(/admin/i).length).toBeGreaterThanOrEqual(1);
    });

    // Click Sign Out button in header
    const signOutBtn = screen.getByLabelText(/Sign Out/i);
    fireEvent.click(signOutBtn);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Sign In/i })[0]).toBeInTheDocument();
    });
  });
});
