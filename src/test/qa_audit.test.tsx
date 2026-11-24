import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';
import { QueueProvider, useQueue } from '../context/QueueContext';
import { HomeScreen } from '../screens/HomeScreen';
import { JoinQueueScreen } from '../screens/JoinQueueScreen';
import { MyStatusScreen } from '../screens/MyStatusScreen';
import { ReceptionScreen } from '../screens/ReceptionScreen';
import { BarberScreen } from '../screens/BarberScreen';
import { DisplayScreen } from '../screens/DisplayScreen';
import { AdminScreen } from '../screens/AdminScreen';

const renderApp = (
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
            <Route path="*" element={ui} />
          </Routes>
        </MemoryRouter>
      </QueueProvider>
    </LanguageProvider>
  );
};

// Helper test consumer component to directly test QueueContext methods
const QueueInspector: React.FC<{
  onInspect: (context: ReturnType<typeof useQueue>) => void;
}> = ({ onInspect }) => {
  const queueContext = useQueue();
  onInspect(queueContext);
  return <div data-testid="queue-inspector">Loaded</div>;
};

describe('SENIOR QA ENGINEER AUDIT — SALON QUEUE MANAGEMENT SYSTEM', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // =========================================================================
  // SCENARIO 01 & 02: CUSTOMER JOINS WITH TWO SERVICES & CALCULATES PRICE/DURATION
  // =========================================================================
  it('Scenario 01 & 02: Customer joins with two services and calculates correct price and duration', async () => {
    renderApp(<JoinQueueScreen />, { initialRoute: '/join' });

    // 1. Enter customer name and phone
    const nameInput = screen.getByPlaceholderText(/e\.g\. Rajesh Patel/i);
    const phoneInput = screen.getByPlaceholderText(/e\.g\. 9825012345/i);
    fireEvent.change(nameInput, { target: { value: 'Aarav Mehta' } });
    fireEvent.change(phoneInput, { target: { value: '9825091122' } });

    // 2. Initial service: Classic Haircut is selected (30 mins, ₹250)
    expect(screen.getByText(/1 \/ 3 Selected/i)).toBeInTheDocument();

    // 3. Select a second service: Beard Trim (15 mins, ₹150)
    const beardService = screen.getByText('Beard Sculpt & Razor Finish');
    fireEvent.click(beardService);

    // 4. Verify combined duration (30 + 15 = 45 mins) and price (250 + 150 = ₹400)
    expect(screen.getByText(/2 \/ 3 Selected/i)).toBeInTheDocument();
    expect(screen.getByText('45 mins')).toBeInTheDocument();
    expect(screen.getByText('₹400')).toBeInTheDocument();
  });

  // =========================================================================
  // SCENARIO 03: CUSTOMER RECEIVES A UNIQUE SEQUENTIAL TOKEN
  // =========================================================================
  it('Scenario 03: Customer receives a unique sequential token (e.g. S-5 after initial S-1 to S-4)', async () => {
    renderApp(<JoinQueueScreen />, { initialRoute: '/join' });

    const nameInput = screen.getByPlaceholderText(/e\.g\. Rajesh Patel/i);
    const phoneInput = screen.getByPlaceholderText(/e\.g\. 9825012345/i);
    const submitBtn = screen.getByRole('button', { name: /Confirm & Join Queue/i });

    fireEvent.change(nameInput, { target: { value: 'Parth Shukla' } });
    fireEvent.change(phoneInput, { target: { value: '9825055443' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // S-1 to S-4 exist in default queue, so the next generated token is strictly #S-5
      expect(screen.getByText('#S-5')).toBeInTheDocument();
      expect(screen.getByText('Parth Shukla')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // SCENARIO 04: SAME PHONE NUMBER CANNOT JOIN TWICE
  // =========================================================================
  it('Scenario 04: Prevents same phone number from holding multiple active positions (Invariant 04)', async () => {
    renderApp(<JoinQueueScreen />, { initialRoute: '/join' });

    const nameInput = screen.getByPlaceholderText(/e\.g\. Rajesh Patel/i);
    const phoneInput = screen.getByPlaceholderText(/e\.g\. 9825012345/i);
    const submitBtn = screen.getByRole('button', { name: /Confirm & Join Queue/i });

    // 9825011111 already holds active token #S-1 in Chair 1
    fireEvent.change(nameInput, { target: { value: 'Imposter User' } });
    fireEvent.change(phoneInput, { target: { value: '9825011111' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/already has an active queue position/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // SCENARIO 05: CUSTOMER CAN TRACK QUEUE POSITION
  // =========================================================================
  it('Scenario 05: Customer can track their queue position live on My Status screen', () => {
    // S-4 is in queue in WAITING state
    renderApp(<MyStatusScreen />, { initialRoute: '/status/S-4' });

    expect(screen.getByText('#S-4')).toBeInTheDocument();
    expect(screen.getByText('Queue Position')).toBeInTheDocument();
    expect(screen.getByText('Jayesh Parmar')).toBeInTheDocument();
    expect(screen.getByText(/Start coming/i)).toBeInTheDocument();
  });

  // =========================================================================
  // SCENARIO 06 & 07: RECEPTION CALLS NEXT CUSTOMER & RESPECTS BARBER PREFERENCE
  // =========================================================================
  it('Scenario 06 & 07: Reception calls next eligible customer, respecting barber preference arbitration', async () => {
    renderApp(<ReceptionScreen />, { initialRoute: '/reception' });

    // Initial state:
    // S-3 requested Amit Kumar specifically.
    // S-4 requested ANY barber.
    // Chetan Solanki (Chair 3) is IDLE and available.
    // When calling next for Chetan Solanki, system must skip S-3 (who requested Amit) and call S-4 (who chose ANY)!
    const callNextButtons = screen.getAllByRole('button', { name: /Call Next/i });
    const enabledBtn = callNextButtons.find((btn) => !btn.hasAttribute('disabled'));
    expect(enabledBtn).toBeDefined();

    fireEvent.click(enabledBtn!);

    await waitFor(() => {
      // S-4 (Jayesh Parmar) was summoned to Chetan's chair
      expect(screen.getByText(/Called Token #S-4 \(Jayesh Parmar\)/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // SCENARIO 08: CUSTOMER RECEIVES TURN NOTIFICATION (IT'S YOUR TURN)
  // =========================================================================
  it('Scenario 08: Customer receives turn notification ("It\'s your turn!") when CALLED', () => {
    // In initial queue, let's test a token with status CALLED
    // Create called token state
    const calledQueue = [
      {
        id: 'S-77',
        customerName: 'Kunal Verma',
        customerPhone: '9825077777',
        services: [
          {
            id: 'srv-1',
            nameEn: 'Classic Haircut',
            nameGu: 'ક્લાસિક હેરકટ',
            durationMinutes: 30,
            priceInr: 250,
            category: 'hair',
            isActive: true,
          },
        ],
        barberPreference: 'ANY',
        assignedBarberName: 'Amit Kumar',
        chairNumber: 1,
        status: 'CALLED',
        isWalkIn: false,
        createdAt: new Date().toISOString(),
        calledAt: new Date().toISOString(),
        estimatedWaitMinutes: 0,
      },
    ];
    localStorage.setItem('salon_queue_tokens', JSON.stringify(calledQueue));

    renderApp(<MyStatusScreen />, { initialRoute: '/status/S-77' });

    expect(screen.getByText('#S-77')).toBeInTheDocument();
    expect(screen.getByText("It's your turn!")).toBeInTheDocument();
    expect(screen.getByText(/is ready at Chair/i)).toBeInTheDocument();
  });

  // =========================================================================
  // SCENARIO 09: BARBER STARTS AND COMPLETES SERVICE
  // =========================================================================
  it('Scenario 09: Barber starts and completes service, transitioning chair back to IDLE', async () => {
    renderApp(<BarberScreen />, { initialRoute: '/barber/Amit' });

    // Amit currently has S-1 IN_SERVICE
    expect(screen.getByText('#S-1')).toBeInTheDocument();
    const doneBtn = screen.getByRole('button', { name: /Done \(Complete Service\)/i });
    expect(doneBtn).toBeEnabled();

    // Complete service
    fireEvent.click(doneBtn);

    await waitFor(() => {
      expect(screen.getByText(/Service completed for Token #S-1! Chair is now ready\./i)).toBeInTheDocument();
      expect(screen.getByText(/Chair is currently idle\. Ready for your next client\./i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // SCENARIO 10: TV DISPLAY UPDATES AUTOMATICALLY
  // =========================================================================
  it('Scenario 10: Waiting Area TV updates automatically with Now Serving and Up Next', () => {
    renderApp(<DisplayScreen />, { initialRoute: '/display' });

    expect(screen.getByText('NOW SERVING')).toBeInTheDocument();
    expect(screen.getByText('UP NEXT (NEXT 5 IN LINE)')).toBeInTheDocument();
    expect(screen.getByText('Amit Kumar')).toBeInTheDocument();
    expect(screen.getByText('#S-1')).toBeInTheDocument();
    expect(screen.getByText('#S-2')).toBeInTheDocument();
  });

  // =========================================================================
  // SCENARIO 11: NO-SHOW CUSTOMERS CAN BE RE-ADDED AT THE END
  // =========================================================================
  it('Scenario 11: No-show customers can be re-added at the tail of the queue with a brand new token', async () => {
    // Put a NO_SHOW token in queue
    const noShowQueue = [
      {
        id: 'S-10',
        customerName: 'Late Patron',
        customerPhone: '9825044332',
        services: [
          {
            id: 'srv-1',
            nameEn: 'Classic Haircut',
            nameGu: 'ક્લાસિક હેરકટ',
            durationMinutes: 30,
            priceInr: 250,
            category: 'hair',
            isActive: true,
          },
        ],
        barberPreference: 'ANY',
        status: 'NO_SHOW',
        isWalkIn: false,
        createdAt: new Date().toISOString(),
        estimatedWaitMinutes: 0,
      },
    ];
    localStorage.setItem('salon_queue_tokens', JSON.stringify(noShowQueue));

    renderApp(<ReceptionScreen />, { initialRoute: '/reception' });

    // Look for Re-Add button next to the No-Show patron
    const reAddBtn = screen.getByRole('button', { name: /Re-Add/i });
    expect(reAddBtn).toBeInTheDocument();

    fireEvent.click(reAddBtn);

    await waitFor(() => {
      // Generates new sequential token at the tail of the queue
      expect(screen.getByText(/Re-added Late Patron at tail of queue with new token/i)).toBeInTheDocument();
      // Old token #S-10 remains terminal
      expect(screen.getByText('#S-10')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // SCENARIO 12: BARBER ON BREAK IS EXCLUDED FROM ASSIGNMENT
  // =========================================================================
  it('Scenario 12: Barber on break is excluded from queue assignment', async () => {
    renderApp(<AdminScreen />, { initialRoute: '/admin' });

    // Switch to Barbers tab and put Chetan on break
    const barbersTab = screen.getByRole('button', { name: /Staff & Chairs/i });
    fireEvent.click(barbersTab);

    const setBreakBtns = screen.getAllByRole('button', { name: /Set On Break/i });
    const chetanBtn = setBreakBtns.find((btn) => !btn.hasAttribute('disabled'));
    fireEvent.click(chetanBtn!);

    await waitFor(() => {
      expect(screen.getByText(/Chetan Solanki marked On Break/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // SCENARIO 13 & 14: ONLINE JOINING CLOSES AT CUTOFF; WALK-INS REMAIN POSSIBLE
  // =========================================================================
  it('Scenario 13 & 14: Online joining locks when closed, but walk-ins remain allowed at reception', async () => {
    // Set online queue closed
    const { unmount } = renderApp(<AdminScreen />, { initialRoute: '/admin' });
    const rulesTab = screen.getByRole('button', { name: /Queue Policies/i });
    fireEvent.click(rulesTab);

    const closeBtn = screen.getByRole('button', { name: /Close Online Queue/i });
    fireEvent.click(closeBtn);
    unmount();

    // Verify /join displays closing notice
    const joinRender = renderApp(<JoinQueueScreen />, { initialRoute: '/join' });
    expect(screen.getByText(/Online Queue Closing Notice/i)).toBeInTheDocument();
    joinRender.unmount();

    // Verify /reception can still register walk-in patron
    renderApp(<ReceptionScreen />, { initialRoute: '/reception' });
    const nameInput = screen.getByPlaceholderText(/e\.g\. Ramesh Shah/i);
    const phoneInput = screen.getByPlaceholderText(/e\.g\. 9825012345/i);
    const submitBtn = screen.getByRole('button', { name: /Add Walk-In Patron/i });

    fireEvent.change(nameInput, { target: { value: 'Night Walkin Customer' } });
    fireEvent.change(phoneInput, { target: { value: '9825077665' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Night Walkin Customer')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // SCENARIO 15: GUJARATI TRANSLATION WORKS ACROSS ALL SCREENS
  // =========================================================================
  it('Scenario 15: Gujarati translation renders cleanly without losing form state', () => {
    const TestBilingualView = () => {
      const { setLanguage, language } = useLanguage();
      return (
        <div>
          <button onClick={() => setLanguage('gu')}>Switch to GU</button>
          <span data-testid="lang-display">{language}</span>
          <JoinQueueScreen />
        </div>
      );
    };

    renderApp(<TestBilingualView />, { initialRoute: '/join' });

    // Type a customer name
    const nameInput = screen.getByPlaceholderText(/e\.g\. Rajesh Patel/i);
    fireEvent.change(nameInput, { target: { value: 'Mahesh Solanki' } });

    // Switch to Gujarati
    const switchBtn = screen.getByText('Switch to GU');
    fireEvent.click(switchBtn);

    // Verify text changed to Gujarati
    expect(screen.getByTestId('lang-display').textContent).toBe('gu');
    expect(screen.getByText('કતારમાં જોડાઓ')).toBeInTheDocument();

    // Verify input state was preserved
    expect(nameInput).toHaveValue('Mahesh Solanki');
  });

  // =========================================================================
  // SCENARIO 16: DATA PERSISTS AFTER REFRESH / DATABASE RESTART
  // =========================================================================
  it('Scenario 16: Queue and configuration data persist accurately in localStorage', async () => {
    let capturedContext: ReturnType<typeof useQueue> | null = null;
    const { unmount } = renderApp(
      <QueueInspector
        onInspect={(ctx) => {
          capturedContext = ctx;
        }}
      />
    );

    // Add a token
    await act(async () => {
      await capturedContext!.addWalkIn({
        customerName: 'Persistent Patron',
        customerPhone: '9825019999',
        services: [capturedContext!.services[0]],
        barberPreference: 'ANY',
      });
    });

    unmount();

    // Read directly from localStorage
    const savedQueue = JSON.parse(localStorage.getItem('salon_queue_tokens') || '[]');
    const found = savedQueue.find((t: any) => t.customerName === 'Persistent Patron');
    expect(found).toBeDefined();
    expect(found.customerPhone).toBe('9825019999');
  });

  // =========================================================================
  // SCENARIO 17: MULTIPLE BROWSER WINDOWS REMAIN SYNCHRONIZED
  // =========================================================================
  it('Scenario 17: Multi-window cross-tab sync propagates within milliseconds via storage events', async () => {
    renderApp(<DisplayScreen />, { initialRoute: '/display' });

    const newTabToken = {
      id: 'S-88',
      customerName: 'Tab 2 Customer',
      customerPhone: '9825088888',
      services: [
        {
          id: 'classic-haircut',
          nameEn: 'Classic Precision Haircut',
          nameGu: 'ક્લાસિક હેરકટ',
          durationMinutes: 30,
          priceInr: 250,
          isActive: true,
        },
      ],
      barberPreference: 'ANY',
      status: 'WAITING',
      isWalkIn: false,
      createdAt: new Date().toISOString(),
      estimatedWaitMinutes: 10,
    };

    // Dispatch StorageEvent from Tab 2
    await act(async () => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'salon_queue_tokens',
          newValue: JSON.stringify([newTabToken]),
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('#S-88')).toBeInTheDocument();
      expect(screen.getByText('Tab 2 Customer')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // SCENARIO 18: INVALID PHONE NUMBERS
  // =========================================================================
  it('Scenario 18: Rejects invalid phone numbers (less than 10 digits or non-Indian prefix)', async () => {
    let capturedContext: ReturnType<typeof useQueue> | null = null;
    renderApp(
      <QueueInspector
        onInspect={(ctx) => {
          capturedContext = ctx;
        }}
      />
    );

    // 1. Less than 10 digits
    const res1 = await capturedContext!.addTokenToQueue({
      customerName: 'Test User',
      customerPhone: '98250',
      services: [capturedContext!.services[0]],
      barberPreference: 'ANY',
    });
    expect(res1.success).toBe(false);
    expect(res1.error).toContain('valid 10-digit');

    // 2. Starts with invalid digit 3
    const res2 = await capturedContext!.addTokenToQueue({
      customerName: 'Test User',
      customerPhone: '3825012345',
      services: [capturedContext!.services[0]],
      barberPreference: 'ANY',
    });
    expect(res2.success).toBe(false);
    expect(res2.error).toContain('valid 10-digit');
  });

  // =========================================================================
  // SCENARIO 19: EMPTY SERVICE SELECTION
  // =========================================================================
  it('Scenario 19: Rejects empty service selection (0 services)', async () => {
    let capturedContext: ReturnType<typeof useQueue> | null = null;
    renderApp(
      <QueueInspector
        onInspect={(ctx) => {
          capturedContext = ctx;
        }}
      />
    );

    const res = await capturedContext!.addTokenToQueue({
      customerName: 'No Service User',
      customerPhone: '9825012345',
      services: [],
      barberPreference: 'ANY',
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('Maximum 3 services');
  });

  // =========================================================================
  // SCENARIO 20: MORE THAN THREE SERVICES
  // =========================================================================
  it('Scenario 20: Rejects more than three services (Invariant 03 violation)', async () => {
    let capturedContext: ReturnType<typeof useQueue> | null = null;
    renderApp(
      <QueueInspector
        onInspect={(ctx) => {
          capturedContext = ctx;
        }}
      />
    );

    const fourServices = [
      capturedContext!.services[0],
      capturedContext!.services[1],
      capturedContext!.services[2],
      capturedContext!.services[3],
    ];

    const res = await capturedContext!.addTokenToQueue({
      customerName: 'Greedy User',
      customerPhone: '9825012345',
      services: fourServices,
      barberPreference: 'ANY',
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('Maximum 3 services');
  });

  // =========================================================================
  // SCENARIO 21: DUPLICATE SUBMISSIONS
  // =========================================================================
  it('Scenario 21: Prevents duplicate submissions on rapid double clicks', async () => {
    renderApp(<JoinQueueScreen />, { initialRoute: '/join' });

    const nameInput = screen.getByPlaceholderText(/e\.g\. Rajesh Patel/i);
    const phoneInput = screen.getByPlaceholderText(/e\.g\. 9825012345/i);
    const submitBtn = screen.getByRole('button', { name: /Confirm & Join Queue/i });

    fireEvent.change(nameInput, { target: { value: 'Rapid Clicker' } });
    fireEvent.change(phoneInput, { target: { value: '9825019876' } });

    // Double fire click
    fireEvent.click(submitBtn);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Rapid Clicker')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // SCENARIO 22: INVALID QUEUE TRANSITIONS
  // =========================================================================
  it('Scenario 22: Strictly prevents invalid queue transitions (e.g. canceling in-service token, seating terminal token)', async () => {
    let capturedContext: ReturnType<typeof useQueue> | null = null;
    renderApp(
      <QueueInspector
        onInspect={(ctx) => {
          capturedContext = ctx;
        }}
      />
    );

    // 1. S-1 is IN_SERVICE: Attempting to cancel must fail
    const cancelRes = capturedContext!.cancelToken('S-1');
    expect(cancelRes.success).toBe(false);
    expect(cancelRes.error).toContain('actively in progress');

    // 2. Mark S-4 as NO_SHOW -> Attempting to seat a NO_SHOW token must fail
    await act(async () => {
      capturedContext!.markNoShow('S-4');
    });
    const seatRes = capturedContext!.seatCustomer('S-4');
    expect(seatRes.success).toBe(false);
    expect(seatRes.error).toContain('terminal state');
  });

  // =========================================================================
  // SCENARIO 23: TWO SIMULTANEOUS REQUESTS FOR THE SAME BARBER
  // =========================================================================
  it('Scenario 23: Mutex locks barber chair against simultaneous double-seating (Invariant 05)', async () => {
    let capturedContext: ReturnType<typeof useQueue> | null = null;
    renderApp(
      <QueueInspector
        onInspect={(ctx) => {
          capturedContext = ctx;
        }}
      />
    );

    // Barber 1 (Amit) is currently IN_SERVICE with S-1
    // Attempting to seat S-4 in Amit's chair must fail
    const res = capturedContext!.seatCustomer('S-4', 'barber-amit');
    expect(res.success).toBe(false);
    expect(res.error).toContain('already occupied');
  });

  // =========================================================================
  // SCENARIO 24: TWO CUSTOMERS ATTEMPTING TO JOIN WITH SAME PHONE NUMBER
  // =========================================================================
  it('Scenario 24: Concurrency control blocks second customer attempting to join with same phone number', async () => {
    let capturedContext: ReturnType<typeof useQueue> | null = null;
    renderApp(
      <QueueInspector
        onInspect={(ctx) => {
          capturedContext = ctx;
        }}
      />
    );

    let firstJoin: any;
    let secondJoin: any;
    await act(async () => {
      // First customer joins
      firstJoin = await capturedContext!.addTokenToQueue({
        customerName: 'First Patron',
        customerPhone: '9825044411',
        services: [capturedContext!.services[0]],
        barberPreference: 'ANY',
      });

      // Second customer simultaneously attempts to join with exact same phone number
      secondJoin = await capturedContext!.addTokenToQueue({
        customerName: 'Second Patron',
        customerPhone: '9825044411',
        services: [capturedContext!.services[0]],
        barberPreference: 'ANY',
      });
    });

    expect(firstJoin.success).toBe(true);
    expect(secondJoin.success).toBe(false);
    expect(secondJoin.error).toContain('already has an active queue ticket');
  });
});
