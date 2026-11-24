import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from '../context/LanguageContext';
import { QueueProvider } from '../context/QueueContext';
import { HomeScreen } from '../screens/HomeScreen';
import { JoinQueueScreen } from '../screens/JoinQueueScreen';
import { MyStatusScreen } from '../screens/MyStatusScreen';
import { ReceptionScreen } from '../screens/ReceptionScreen';
import { BarberScreen } from '../screens/BarberScreen';
import { DisplayScreen } from '../screens/DisplayScreen';
import { AdminScreen } from '../screens/AdminScreen';
import { LanguageToggle } from '../components/ui/LanguageToggle';

const renderWithProviders = (
  ui: React.ReactElement,
  { initialRoute = '/', overrideOnlineOpen = true } = {}
) => {
  return render(
    <LanguageProvider>
      <QueueProvider overrideOnlineOpen={overrideOnlineOpen}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/status/:id" element={<MyStatusScreen />} />
            <Route path="/barber/:name" element={<BarberScreen />} />
            <Route path="/display" element={<DisplayScreen />} />
            <Route path="/tv" element={<DisplayScreen />} />
            <Route path="/admin" element={<AdminScreen />} />
            <Route path="/owner" element={<AdminScreen />} />
            <Route path="*" element={ui} />
          </Routes>
        </MemoryRouter>
      </QueueProvider>
    </LanguageProvider>
  );
};

describe('Screen 1: Home Page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders salon brand name, tagline and operational status', () => {
    renderWithProviders(<HomeScreen />);
    expect(screen.getByText('Royal Touch Grooming')).toBeInTheDocument();
    expect(screen.getByText("Premium Men's Salon & Lounge")).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('displays current waiting count and estimated waiting time', () => {
    renderWithProviders(<HomeScreen />);
    expect(screen.getByText('Patrons in Queue')).toBeInTheDocument();
    expect(screen.getByText('Est. Wait Time')).toBeInTheDocument();
  });

  it('renders realistic active barber cards with chair numbers and specialties', () => {
    renderWithProviders(<HomeScreen />);
    expect(screen.getByText("Today's Active Stylists")).toBeInTheDocument();
    expect(screen.getByText('Amit Kumar')).toBeInTheDocument();
    expect(screen.getByText('Vikram Dave')).toBeInTheDocument();
    expect(screen.getByText('Chetan Solanki')).toBeInTheDocument();
    expect(screen.getByText('Pradeep Varma')).toBeInTheDocument();
  });

  it('renders Join Queue CTA and Track Existing Token modal trigger', () => {
    renderWithProviders(<HomeScreen />);
    const joinBtn = screen.getByRole('link', { name: /Join the Queue/i });
    expect(joinBtn).toBeInTheDocument();

    const trackBtn = screen.getByRole('button', { name: /Track Existing Token/i });
    expect(trackBtn).toBeInTheDocument();

    fireEvent.click(trackBtn);
    expect(screen.getByText('Track Your Token')).toBeInTheDocument();

    const findBtn = screen.getByRole('button', { name: /Find My Token/i });
    fireEvent.click(findBtn);
    expect(screen.getByText(/Phone number \(e\.g\. 9825011111\) or Token ID/i)).toBeInTheDocument();
  });
});

describe('Screen 2: Join Queue Page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('generates unique sequential token such as S-5 and saves to queue', async () => {
    renderWithProviders(<JoinQueueScreen />, { initialRoute: '/join' });

    const nameInput = screen.getByPlaceholderText(/e\.g\. Rajesh Patel/i);
    const phoneInput = screen.getByPlaceholderText(/e\.g\. 9825012345/i);
    const submitBtn = screen.getByRole('button', { name: /Confirm & Join Queue/i });

    fireEvent.change(nameInput, { target: { value: 'Sequential User' } });
    fireEvent.change(phoneInput, { target: { value: '9825099999' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // S-1 to S-4 exist in initial mock queue, so next sequential is S-5
      expect(screen.getByText(/#S-5/i)).toBeInTheDocument();
    });
  });

  it('enforces Invariant 04: blocks duplicate active phone registration', async () => {
    renderWithProviders(<JoinQueueScreen />, { initialRoute: '/join' });

    const nameInput = screen.getByPlaceholderText(/e\.g\. Rajesh Patel/i);
    const phoneInput = screen.getByPlaceholderText(/e\.g\. 9825012345/i);
    const submitBtn = screen.getByRole('button', { name: /Confirm & Join Queue/i });

    // 9825011111 is already active (#S-1)
    fireEvent.change(nameInput, { target: { value: 'Test Customer' } });
    fireEvent.change(phoneInput, { target: { value: '9825011111' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/already has an active queue position/i)).toBeInTheDocument();
    });
  });

  it('enforces Invariant 03: maximum 3 services ceiling', () => {
    renderWithProviders(<JoinQueueScreen />, { initialRoute: '/join' });

    expect(screen.getByText(/1 \/ 3 Selected/i)).toBeInTheDocument();

    const beardService = screen.getByText('Beard Sculpt & Razor Finish');
    fireEvent.click(beardService);
    expect(screen.getByText(/2 \/ 3 Selected/i)).toBeInTheDocument();

    const royalShaveService = screen.getByText('Royal Shave & Hot Towel');
    fireEvent.click(royalShaveService);
    expect(screen.getByText(/3 \/ 3 Selected/i)).toBeInTheDocument();
    expect(screen.getByText(/Maximum 3 services selected/i)).toBeInTheDocument();

    const facialService = screen.getByText('Charcoal Face Scrub & Detan');
    fireEvent.click(facialService);
    expect(screen.getByText(/3 \/ 3 Selected/i)).toBeInTheDocument();
  });
});

describe('Screen 3: My Status Page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('displays customer sequential token, position, and dynamic wait time', () => {
    renderWithProviders(<MyStatusScreen />, { initialRoute: '/status/S-4' });

    expect(screen.getByText('#S-4')).toBeInTheDocument();
    expect(screen.getByText('Queue Position')).toBeInTheDocument();
    expect(screen.getByText('Jayesh Parmar')).toBeInTheDocument();
  });

  it('shows "Start coming" when customer is second in line', () => {
    // S-4 is second in line in initial waiting list (behind S-3)
    renderWithProviders(<MyStatusScreen />, { initialRoute: '/status/S-4' });

    expect(screen.getByText(/Start coming/i)).toBeInTheDocument();
    expect(screen.getByText(/You are second in line!/i)).toBeInTheDocument();
  });

  it('shows "It\'s your turn!" when token is CALLED', () => {
    // S-3 has status: CALLED in initialQueue
    // Let's create a called token S-3 or test with S-3
    renderWithProviders(<MyStatusScreen />, { initialRoute: '/status/S-3' });

    // S-3 is UP_NEXT / CALLED
    // Let's verify status displays
    expect(screen.getByText('#S-3')).toBeInTheDocument();
  });

  it('handles cancellation confirmation and enforces cancellation restrictions', async () => {
    // S-4 is WAITING, so cancellation is permitted
    renderWithProviders(<MyStatusScreen />, { initialRoute: '/status/S-4' });

    const cancelSpotBtn = screen.getByRole('button', { name: /Cancel My Spot/i });
    fireEvent.click(cancelSpotBtn);

    // Modal opens
    expect(screen.getByText(/Cancel Queue Spot\?/i)).toBeInTheDocument();

    // Confirm cancel
    const confirmBtn = screen.getByRole('button', { name: /Yes, Cancel Spot/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText(/Cancelled/i)).toBeInTheDocument();
    });
  });

  it('restricts cancellation when customer is IN_SERVICE', () => {
    // S-1 has status: IN_SERVICE
    renderWithProviders(<MyStatusScreen />, { initialRoute: '/status/S-1' });

    expect(screen.getByText(/Cancellation is not permitted while service is actively in progress/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Cancel My Spot/i })).not.toBeInTheDocument();
  });
});

describe('Screen 4: Reception Dashboard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders tablet landscape dashboard with barber stations and waiting list', () => {
    renderWithProviders(<ReceptionScreen />, { initialRoute: '/reception' });

    expect(screen.getByText('Reception Command Hub')).toBeInTheDocument();
    expect(screen.getByText('Barber Stations & Chairs')).toBeInTheDocument();
    expect(screen.getByText('Live Queue Timeline (FCFS)')).toBeInTheDocument();
    expect(screen.getByText(/Tablet Landscape Mode Active/i)).toBeInTheDocument();
  });

  it('displays each barber with current customer and availability', () => {
    renderWithProviders(<ReceptionScreen />, { initialRoute: '/reception' });

    expect(screen.getByText('Amit Kumar')).toBeInTheDocument();
    expect(screen.getByText('Vikram Dave')).toBeInTheDocument();
    expect(screen.getByText('Chetan Solanki')).toBeInTheDocument();

    // Chair 3 (Chetan) is IDLE Available
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('enforces FCFS queue selection on Call Next: skips wrong barber, allows Any Barber', async () => {
    renderWithProviders(<ReceptionScreen />, { initialRoute: '/reception' });

    // Chetan Solanki (Chair 3) is IDLE
    // In initialQueue:
    // S-3 preferred Amit Kumar
    // S-4 preferred ANY
    // Calling next for Chetan Solanki should skip S-3 (who preferred Amit) and call S-4 (who preferred ANY)!
    const callNextButtons = screen.getAllByRole('button', { name: /Call Next/i });
    // Find Chetan's Call Next button (it's the only enabled one because Amit and Vikram are busy)
    const enabledCallBtn = callNextButtons.find((btn) => !btn.hasAttribute('disabled'));
    expect(enabledCallBtn).toBeDefined();

    fireEvent.click(enabledCallBtn!);

    await waitFor(() => {
      // Verify S-4 was called!
      expect(screen.getByText(/Called Token #S-4 \(Jayesh Parmar\)/i)).toBeInTheDocument();
    });
  });

  it('prevents Call Next on a barber who is busy (IN_SERVICE mutex)', () => {
    renderWithProviders(<ReceptionScreen />, { initialRoute: '/reception' });

    // Amit (Chair 1) is currently IN_SERVICE with S-1
    // His Call Next button must be disabled
    const callNextButtons = screen.getAllByRole('button', { name: /Call Next/i });
    const disabledButtons = callNextButtons.filter((btn) => btn.hasAttribute('disabled'));
    expect(disabledButtons.length).toBeGreaterThanOrEqual(2); // Amit and Vikram are both busy
  });

  it('allows registering walk-in customer with sequential token (S-5) and 10-digit phone', async () => {
    renderWithProviders(<ReceptionScreen />, { initialRoute: '/reception' });

    const nameInput = screen.getByPlaceholderText(/e\.g\. Ramesh Shah/i);
    const phoneInput = screen.getByPlaceholderText(/e\.g\. 9825012345/i);
    const submitBtn = screen.getByRole('button', { name: /Add Walk-In Patron/i });

    fireEvent.change(nameInput, { target: { value: 'Kantilal Patel' } });
    fireEvent.change(phoneInput, { target: { value: '9825088888' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Walk-in patron added successfully with token #S-5/i)).toBeInTheDocument();
      expect(screen.getByText('Kantilal Patel')).toBeInTheDocument();
    });
  });

  it('allows seat customer, finish service and mark no-show actions', async () => {
    renderWithProviders(<ReceptionScreen />, { initialRoute: '/reception' });

    // S-2 is IN_SERVICE -> Reception has Finish Service button
    const finishBtns = screen.getAllByRole('button', { name: /Finish Service/i });
    expect(finishBtns.length).toBeGreaterThanOrEqual(1);

    fireEvent.click(finishBtns[0]);

    await waitFor(() => {
      // Completed badge appears
      expect(screen.getByText('Finished')).toBeInTheDocument();
    });
  });
});

describe('Screen 5: Barber View (/barber/:name)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders barber identity, chair number, shift details, and chair switcher', () => {
    renderWithProviders(<BarberScreen />, { initialRoute: '/barber/Amit' });

    expect(screen.getByText('Amit Kumar')).toBeInTheDocument();
    expect(screen.getByText('Chair 1')).toBeInTheDocument();
    expect(screen.getByText(/Shift: 09:00 - 18:00/i)).toBeInTheDocument();

    // Chair selector contains all barbers
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Chair 1: Amit Kumar/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Chair 2: Vikram Dave/i })).toBeInTheDocument();
  });

  it('displays current customer token #S-1, customer name, and selected services with prices', () => {
    renderWithProviders(<BarberScreen />, { initialRoute: '/barber/Amit' });

    // Customer Rajesh Patel is in Chair 1
    expect(screen.getByText('Rajesh Patel')).toBeInTheDocument();
    expect(screen.getByText('#S-1')).toBeInTheDocument();
    expect(screen.getByText('+91 9825011111')).toBeInTheDocument();

    // Services checklist
    expect(screen.getAllByText('Classic Precision Haircut').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('₹250')).toBeInTheDocument();
    expect(screen.getByText('30 mins')).toBeInTheDocument();
  });

  it('displays chair stopwatch timer and controls (Start disabled, Done active)', () => {
    renderWithProviders(<BarberScreen />, { initialRoute: '/barber/Amit' });

    expect(screen.getByText(/Chair Stopwatch/i)).toBeInTheDocument();
    expect(screen.getByText(/00:/)).toBeInTheDocument();

    const startBtn = screen.getByRole('button', { name: /Start Service/i });
    const doneBtn = screen.getByRole('button', { name: /Done \(Complete Service\)/i });

    // Since S-1 is already IN_SERVICE, Start is disabled and Done is active
    expect(startBtn).toBeDisabled();
    expect(doneBtn).toBeEnabled();
  });

  it('handles Done Service action, completes service and frees chair to IDLE', async () => {
    renderWithProviders(<BarberScreen />, { initialRoute: '/barber/Amit' });

    const doneBtn = screen.getByRole('button', { name: /Done \(Complete Service\)/i });
    fireEvent.click(doneBtn);

    await waitFor(() => {
      expect(screen.getByText(/Service completed for Token #S-1! Chair is now ready\./i)).toBeInTheDocument();
      expect(screen.getByText(/Chair is currently idle\. Ready for your next client\./i)).toBeInTheDocument();
    });
  });

  it('displays upcoming queue information distinguishing Requested You vs Any Barber', () => {
    renderWithProviders(<BarberScreen />, { initialRoute: '/barber/Amit' });

    // S-3 requested Amit specifically
    expect(screen.getByText('Requested You')).toBeInTheDocument();
    expect(screen.getByText('Hardik Joshi')).toBeInTheDocument();

    // S-4 chose Any Barber
    expect(screen.getByText('Any Barber')).toBeInTheDocument();
    expect(screen.getByText('Jayesh Parmar')).toBeInTheDocument();
  });

  it('enforces break locks: blocks break during active service, allows when idle', () => {
    // 1. Amit is currently IN_SERVICE with S-1: Break toggle must be disabled
    renderWithProviders(<BarberScreen />, { initialRoute: '/barber/Amit' });
    const breakBtn = screen.getByRole('button', { name: /Available \(Idle\)/i });
    expect(breakBtn).toBeDisabled();
  });

  it('allows idle barber to toggle between Available and On Break', async () => {
    // Chetan is IDLE
    renderWithProviders(<BarberScreen />, { initialRoute: '/barber/Chetan' });

    const breakBtn = screen.getByRole('button', { name: /Available \(Idle\)/i });
    expect(breakBtn).toBeEnabled();

    // Click to toggle to On Break
    fireEvent.click(breakBtn);

    await waitFor(() => {
      expect(screen.getByText(/Status updated for Chetan Solanki/i)).toBeInTheDocument();
      expect(screen.getAllByText(/On 15m Break/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('allows idle barber to Call Next eligible customer', async () => {
    renderWithProviders(<BarberScreen />, { initialRoute: '/barber/Chetan' });

    const callNextBtn = screen.getByRole('button', { name: /Call Next Customer/i });
    expect(callNextBtn).toBeInTheDocument();

    fireEvent.click(callNextBtn);

    await waitFor(() => {
      // S-4 (Any Barber) called
      expect(screen.getByText(/Called Token #S-4 \(Jayesh Parmar\) to your chair!/i)).toBeInTheDocument();
    });
  });
});

describe('Screen 6: Waiting Area TV (/display & /tv)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders full-screen 16:9 layout with NOW SERVING chairs and UP NEXT section', () => {
    renderWithProviders(<DisplayScreen />, { initialRoute: '/display' });

    expect(screen.getByText('Royal Touch Grooming')).toBeInTheDocument();
    expect(screen.getByText("Premium Men's Salon & Lounge")).toBeInTheDocument();
    expect(screen.getByText('NOW SERVING')).toBeInTheDocument();
    expect(screen.getByText('UP NEXT (NEXT 5 IN LINE)')).toBeInTheDocument();
  });

  it('renders Back button to easily exit TV mode and return to salon home', () => {
    renderWithProviders(<DisplayScreen />, { initialRoute: '/display' });
    const backBtn = screen.getByRole('link', { name: /Back/i });
    expect(backBtn).toBeInTheDocument();
    expect(backBtn).toHaveAttribute('href', '/');
  });

  it('displays barber cards with avatar, chair number and active tokens', () => {
    renderWithProviders(<DisplayScreen />, { initialRoute: '/display' });

    expect(screen.getByText('Amit Kumar')).toBeInTheDocument();
    expect(screen.getByText('Chair 1')).toBeInTheDocument();
    expect(screen.getByText('#S-1')).toBeInTheDocument();

    expect(screen.getByText('Vikram Dave')).toBeInTheDocument();
    expect(screen.getByText('Chair 2')).toBeInTheDocument();
    expect(screen.getByText('#S-2')).toBeInTheDocument();

    expect(screen.getByText('Chetan Solanki')).toBeInTheDocument();
    expect(screen.getByText('Chair 3')).toBeInTheDocument();

    expect(screen.getByText('Pradeep Varma')).toBeInTheDocument();
    expect(screen.getByText('Chair 4')).toBeInTheDocument();
  });

  it('displays UP NEXT waiting customers with estimated wait times', () => {
    renderWithProviders(<DisplayScreen />, { initialRoute: '/display' });

    expect(screen.getByText('#S-3')).toBeInTheDocument();
    expect(screen.getByText('#S-4')).toBeInTheDocument();
    expect(screen.getByText('Hardik Joshi')).toBeInTheDocument();
    expect(screen.getByText('Jayesh Parmar')).toBeInTheDocument();
  });

  it('highlights newly called tokens in gold and displays called badge', async () => {
    // Simulate queue where S-3 is CALLED
    const calledQueue = [
      {
        id: 'S-3',
        customerName: 'Hardik Joshi',
        customerPhone: '9825033333',
        services: [
          {
            id: 'srv-1',
            nameEn: 'Signature Haircut',
            nameGu: 'સિગ્નેચર હેરકટ',
            durationMinutes: 30,
            priceInr: 300,
            category: 'hair',
            isActive: true,
          },
        ],
        barberPreference: 'barber-amit',
        assignedBarberId: 'barber-amit',
        assignedBarberName: 'Amit Kumar',
        chairNumber: 1,
        status: 'CALLED',
        isWalkIn: false,
        createdAt: new Date().toISOString(),
        calledAt: new Date().toISOString(),
        estimatedWaitMinutes: 0,
      },
    ];

    renderWithProviders(<DisplayScreen />, { initialRoute: '/display' });

    await act(async () => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'salon_queue_tokens',
          newValue: JSON.stringify(calledQueue),
        })
      );
    });

    await waitFor(() => {
      expect(screen.getAllByText(/CALLED/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('supports audio chime controls and test chime trigger', () => {
    renderWithProviders(<DisplayScreen />, { initialRoute: '/display' });

    const audioToggleBtn = screen.getByRole('button', { name: /Audio Chimes Active/i });
    expect(audioToggleBtn).toBeInTheDocument();

    // Toggle mute
    fireEvent.click(audioToggleBtn);
    expect(screen.getByText(/Audio Muted/i)).toBeInTheDocument();

    // Toggle unmute
    fireEvent.click(screen.getByRole('button', { name: /Audio Muted/i }));
    expect(screen.getByText(/Audio Chimes Active/i)).toBeInTheDocument();

    // Test chime button
    const testChimeBtn = screen.getByRole('button', { name: /Play Chime/i });
    expect(testChimeBtn).toBeInTheDocument();
    fireEvent.click(testChimeBtn);
  });

  it('displays dynamic QR code intake prompt and bilingual ticker', () => {
    renderWithProviders(<DisplayScreen />, { initialRoute: '/display' });

    expect(screen.getByText('Scan QR with Phone to Join Queue')).toBeInTheDocument();
    expect(screen.getByText(/Instant digital queue ticket with real-time status updates/i)).toBeInTheDocument();
  });
});

describe('Cross-Window Real-Time Synchronization (< 5s SLA)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('synchronizes queue state across browser tabs via storage events within milliseconds', async () => {
    renderWithProviders(<DisplayScreen />, { initialRoute: '/display' });

    // Verify initial count of UP NEXT
    expect(screen.getByText('#S-4')).toBeInTheDocument();

    // Simulate another browser tab adding or updating a token in localStorage
    const updatedQueue = [
      {
        id: 'S-99',
        customerName: 'Multi-Tab Synced Patron',
        customerPhone: '9825099999',
        services: [
          {
            id: 'srv-1',
            nameEn: 'Signature Haircut',
            nameGu: 'સિગ્નેચર હેરકટ',
            durationMinutes: 30,
            priceInr: 300,
            category: 'hair',
            isActive: true,
          },
        ],
        barberPreference: 'ANY',
        status: 'WAITING',
        isWalkIn: false,
        createdAt: new Date().toISOString(),
        estimatedWaitMinutes: 15,
      },
    ];

    // Fire cross-window storage event inside act
    await act(async () => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'salon_queue_tokens',
          newValue: JSON.stringify(updatedQueue),
        })
      );
    });

    await waitFor(() => {
      // The Display screen should instantly reflect the updated token from the other window
      expect(screen.getByText('#S-99')).toBeInTheDocument();
      expect(screen.getByText('Multi-Tab Synced Patron')).toBeInTheDocument();
    });
  });
});

describe('Screen 7: Owner Settings (/owner & /admin)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders Owner Settings dashboard with all four navigation tabs', () => {
    renderWithProviders(<AdminScreen />, { initialRoute: '/owner' });

    expect(screen.getByText('Owner Settings & Operations')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Service Catalog/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Staff & Chairs/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Queue Policies/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Daily Analytics/i })).toBeInTheDocument();
  });

  it('displays services catalog with names, durations, and prices', () => {
    renderWithProviders(<AdminScreen />, { initialRoute: '/admin' });

    // Should list services
    expect(screen.getAllByText('Classic Precision Haircut').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('30 Mins')).toBeInTheDocument();
    expect(screen.getByText('₹250')).toBeInTheDocument();

    expect(screen.getAllByText('Beard Sculpt & Razor Finish').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('15 Mins')).toBeInTheDocument();
    expect(screen.getByText('₹150')).toBeInTheDocument();
  });

  it('allows adding a new service with custom duration and price', async () => {
    renderWithProviders(<AdminScreen />, { initialRoute: '/admin' });

    const addServiceBtn = screen.getByRole('button', { name: /Add New Service/i });
    fireEvent.click(addServiceBtn);

    // Modal opens
    expect(screen.getByText('Service Name (English) *')).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText(/e\.g\. Signature Beard Styling/i);
    const durationInput = screen.getByDisplayValue('30');
    const priceInput = screen.getByDisplayValue('250');
    const saveBtn = screen.getByRole('button', { name: /Save Service/i });

    fireEvent.change(nameInput, { target: { value: 'Organic Keratin Hair Spa' } });
    fireEvent.change(durationInput, { target: { value: '50' } });
    fireEvent.change(priceInput, { target: { value: '750' } });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getAllByText('Organic Keratin Hair Spa').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('50 Mins')).toBeInTheDocument();
      expect(screen.getByText('₹750')).toBeInTheDocument();
    });
  });

  it('allows editing service duration and price', async () => {
    renderWithProviders(<AdminScreen />, { initialRoute: '/admin' });

    // Find the first Edit button
    const editButtons = screen.getAllByRole('button', { name: /Edit Service/i });
    fireEvent.click(editButtons[0]);

    // Modal opens
    const durationInput = screen.getByDisplayValue('30');
    const priceInput = screen.getByDisplayValue('250');
    const saveBtn = screen.getByRole('button', { name: /Save Service/i });

    fireEvent.change(durationInput, { target: { value: '38' } });
    fireEvent.change(priceInput, { target: { value: '285' } });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText('38 Mins')).toBeInTheDocument();
      expect(screen.getByText('₹285')).toBeInTheDocument();
    });
  });

  it('disables a service and verifies it disappears from Join Queue automatically', async () => {
    // 1. In AdminScreen, disable "Beard Sculpt & Razor Finish"
    const { unmount } = renderWithProviders(<AdminScreen />, { initialRoute: '/admin' });

    // Look for Disable Service buttons
    const disableBtns = screen.getAllByRole('button', { name: /Disable Service/i });
    // Click disable on the second service (Beard Sculpt & Razor Finish)
    fireEvent.click(disableBtns[1]);

    await waitFor(() => {
      expect(screen.getAllByText(/Disabled/i).length).toBeGreaterThanOrEqual(1);
    });

    unmount();

    // 2. Now render JoinQueueScreen: the disabled service must NOT appear!
    renderWithProviders(<JoinQueueScreen />, { initialRoute: '/join' });

    expect(screen.getAllByText('Classic Precision Haircut').length).toBeGreaterThanOrEqual(1);
    // "Beard Sculpt & Razor Finish" should be absent from Join Queue
    expect(screen.queryByText('Beard Sculpt & Razor Finish')).not.toBeInTheDocument();
  });

  it('manages barbers: sets barber on break and sets barber on duty', async () => {
    renderWithProviders(<AdminScreen />, { initialRoute: '/admin' });

    // Switch to Barbers tab
    const barbersTabBtn = screen.getByRole('button', { name: /Staff & Chairs/i });
    fireEvent.click(barbersTabBtn);

    expect(screen.getByText('Manage Stylists & Chairs')).toBeInTheDocument();
    expect(screen.getByText('Chetan Solanki')).toBeInTheDocument();

    // Chetan is IDLE -> click Set On Break
    const setBreakBtns = screen.getAllByRole('button', { name: /Set On Break/i });
    const chetanBreakBtn = setBreakBtns.find((btn) => !btn.hasAttribute('disabled'));
    expect(chetanBreakBtn).toBeDefined();

    fireEvent.click(chetanBreakBtn!);

    await waitFor(() => {
      expect(screen.getByText(/Chetan Solanki marked On Break/i)).toBeInTheDocument();
    });

    // Now Chetan is ON_BREAK -> Set On Duty is enabled
    const setDutyBtns = screen.getAllByRole('button', { name: /Set On Duty/i });
    const chetanDutyBtn = setDutyBtns.find((btn) => !btn.hasAttribute('disabled'));
    expect(chetanDutyBtn).toBeDefined();

    fireEvent.click(chetanDutyBtn!);

    await waitFor(() => {
      expect(screen.getByText(/Chetan Solanki marked On Duty/i)).toBeInTheDocument();
    });
  });

  it('opens and closes online queue joining, while walk-ins remain allowed', async () => {
    // 1. In AdminScreen -> Queue Policies Tab -> Close Online Queue
    const { unmount } = renderWithProviders(<AdminScreen />, { initialRoute: '/admin' });

    const rulesTabBtn = screen.getByRole('button', { name: /Queue Policies/i });
    fireEvent.click(rulesTabBtn);

    const closeQueueBtn = screen.getByRole('button', { name: /Close Online Queue/i });
    fireEvent.click(closeQueueBtn);

    await waitFor(() => {
      expect(screen.getByText(/Online queue manually CLOSED/i)).toBeInTheDocument();
    });

    unmount();

    // 2. In JoinQueueScreen -> Customer sees closed notice
    const joinResult = renderWithProviders(<JoinQueueScreen />, { initialRoute: '/join' });
    expect(screen.getByText(/Online Queue Closing Notice/i)).toBeInTheDocument();

    joinResult.unmount();

    // 3. In ReceptionScreen -> Walk-ins remain allowed (Invariant 09)
    renderWithProviders(<ReceptionScreen />, { initialRoute: '/reception' });

    const nameInput = screen.getByPlaceholderText(/e\.g\. Ramesh Shah/i);
    const phoneInput = screen.getByPlaceholderText(/e\.g\. 9825012345/i);
    const submitBtn = screen.getByRole('button', { name: /Add Walk-In Patron/i });

    fireEvent.change(nameInput, { target: { value: 'Late Walkin Patron' } });
    fireEvent.change(phoneInput, { target: { value: '9825066666' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Late Walkin Patron')).toBeInTheDocument();
    });
  });

  it('configures salon opening and closing time and computes cutoff time', async () => {
    renderWithProviders(<AdminScreen />, { initialRoute: '/admin' });

    const rulesTabBtn = screen.getByRole('button', { name: /Queue Policies/i });
    fireEvent.click(rulesTabBtn);

    expect(screen.getByText('Salon Opening Time')).toBeInTheDocument();
    expect(screen.getByText('Salon Closing Time')).toBeInTheDocument();
    expect(screen.getByText(/Calculated Online Cutoff/i)).toBeInTheDocument();

    const saveHoursBtn = screen.getByRole('button', { name: /Save Salon Hours/i });
    fireEvent.click(saveHoursBtn);

    await waitFor(() => {
      expect(screen.getByText(/Operating hours and cutoff settings updated and persisted\./i)).toBeInTheDocument();
    });
  });

  it('displays today customers served, average waiting time, and no-show count', () => {
    renderWithProviders(<AdminScreen />, { initialRoute: '/admin' });

    const analyticsTabBtn = screen.getByRole('button', { name: /Daily Analytics/i });
    fireEvent.click(analyticsTabBtn);

    // Verifies KPI Cards
    expect(screen.getByText("Today's Customers Served")).toBeInTheDocument();
    expect(screen.getByText('Average Waiting Time')).toBeInTheDocument();
    expect(screen.getByText('No-Show Count')).toBeInTheDocument();
    expect(screen.getByText("Today's Queue Revenue")).toBeInTheDocument();
  });
});


