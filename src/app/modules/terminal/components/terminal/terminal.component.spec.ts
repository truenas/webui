/* eslint-disable max-classes-per-file */
import { signal } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';
import { take, tap } from 'rxjs/operators';
import { ShellConnectedEvent } from 'app/interfaces/shell.interface';
import { TerminalConfiguration } from 'app/interfaces/terminal.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { ShellService } from 'app/services/shell.service';

// Mock the terminal logic from TerminalComponent
class TestTerminalReconnectLogic {
  shellConnected = signal(false);
  connectionId = signal<string>(undefined);
  isReconnecting = signal(false);
  hasAttemptedAutoReconnect = false;
  private autoReconnectEnabled = true;
  token: string;
  authService: AuthService;
  shellService: ShellService;

  conf = (): TerminalConfiguration => ({
    connectionData: { virt_instance_id: 'test-instance', use_console: false },
  });

  constructor(
    authServiceParam: AuthService,
    shellServiceParam: ShellService,
  ) {
    this.authService = authServiceParam;
    this.shellService = shellServiceParam;

    this.shellService.shellConnected$.subscribe((event: ShellConnectedEvent) => {
      this.shellConnected.set(event.connected);
      this.connectionId.set(event.id);

      if (event.connected) {
        this.isReconnecting.set(false);
        this.hasAttemptedAutoReconnect = false;
      } else {
        // Connection lost or failed
        this.isReconnecting.set(false);

        // Start immediate automatic reconnection for all shells (only once)
        if (this.autoReconnectEnabled && !this.hasAttemptedAutoReconnect) {
          this.hasAttemptedAutoReconnect = true;
          this.performAutoReconnect();
        }
      }
    });
  }

  reconnect(): void {
    this.isReconnecting.set(true);

    this.authService.getOneTimeToken().pipe(
      take(1),
      tap((token) => {
        this.token = token;
        this.shellService.connect(this.token, this.conf().connectionData);
      }),
    ).subscribe({
      error: () => {
        this.isReconnecting.set(false);
      },
    });
  }

  private performAutoReconnect(): void {
    if (!this.autoReconnectEnabled || this.shellConnected() || this.isReconnecting()) {
      return;
    }

    this.isReconnecting.set(true);

    this.authService.getOneTimeToken().pipe(
      take(1),
      tap((token) => {
        this.token = token;
        this.shellService.connect(this.token, this.conf().connectionData);
      }),
    ).subscribe({
      error: () => {
        this.isReconnecting.set(false);
      },
    });
  }

  isInstanceShell(): boolean {
    return 'virt_instance_id' in this.conf().connectionData;
  }
}

// Create a simplified test for the reconnect functionality without the DOM dependencies
describe('TerminalComponent Reconnect Logic', () => {
  let authService: jest.Mocked<AuthService>;
  let shellService: jest.Mocked<ShellService>;
  let shellConnected$: Subject<ShellConnectedEvent>;

  beforeEach(() => {
    shellConnected$ = new Subject<ShellConnectedEvent>();

    authService = {
      getOneTimeToken: jest.fn(() => of('fresh-token')),
    } as unknown as jest.Mocked<AuthService>;

    shellService = {
      connect: jest.fn(),
      disconnectIfSessionActive: jest.fn(),
      shellConnected$: shellConnected$.asObservable(),
    } as unknown as jest.Mocked<ShellService>;
  });

  afterEach(() => {
    shellConnected$.complete();
  });

  describe('reconnect functionality', () => {
    it('should get fresh token and attempt reconnection', () => {
      const logic = new TestTerminalReconnectLogic(authService, shellService);

      logic.reconnect();

      expect(logic.isReconnecting()).toBe(true);
      expect(authService.getOneTimeToken).toHaveBeenCalled();
      expect(shellService.connect).toHaveBeenCalledWith('fresh-token', {
        virt_instance_id: 'test-instance',
        use_console: false,
      });
    });

    it('should handle token retrieval errors', () => {
      authService.getOneTimeToken.mockReturnValue(throwError(() => new Error('Token failed')));
      const logic = new TestTerminalReconnectLogic(authService, shellService);

      logic.reconnect();

      expect(logic.isReconnecting()).toBe(false);
    });

    it('should reset loading state on successful connection', () => {
      const logic = new TestTerminalReconnectLogic(authService, shellService);
      logic.isReconnecting.set(true);

      shellConnected$.next({ connected: true, id: 'test-connection' });

      expect(logic.shellConnected()).toBe(true);
      expect(logic.connectionId()).toBe('test-connection');
      expect(logic.isReconnecting()).toBe(false);
      expect(logic.hasAttemptedAutoReconnect).toBe(false);
    });

    it('should trigger auto-reconnection on connection failure', () => {
      const logic = new TestTerminalReconnectLogic(authService, shellService);

      shellConnected$.next({ connected: false });

      expect(logic.shellConnected()).toBe(false);
      expect(logic.isReconnecting()).toBe(true); // Auto-reconnection started
      expect(logic.hasAttemptedAutoReconnect).toBe(true);
      expect(authService.getOneTimeToken).toHaveBeenCalled();
    });

    it('should update token when reconnecting', () => {
      const logic = new TestTerminalReconnectLogic(authService, shellService);
      logic.token = 'old-token';

      logic.reconnect();

      expect(logic.token).toBe('fresh-token');
    });
  });

  describe('auto-reconnection functionality', () => {
    it('should automatically attempt reconnection when connection is lost', () => {
      const logic = new TestTerminalReconnectLogic(authService, shellService);

      // Simulate connection loss
      shellConnected$.next({ connected: false });

      expect(logic.hasAttemptedAutoReconnect).toBe(true);
      expect(logic.isReconnecting()).toBe(true);
      expect(authService.getOneTimeToken).toHaveBeenCalledTimes(1);
      expect(shellService.connect).toHaveBeenCalledWith('fresh-token', {
        virt_instance_id: 'test-instance',
        use_console: false,
      });
    });

    it('should only attempt auto-reconnection once per connection loss', () => {
      const logic = new TestTerminalReconnectLogic(authService, shellService);

      // First connection loss
      shellConnected$.next({ connected: false });
      expect(authService.getOneTimeToken).toHaveBeenCalledTimes(1);

      // Second connection loss event (should not trigger another auto-reconnect)
      shellConnected$.next({ connected: false });
      expect(authService.getOneTimeToken).toHaveBeenCalledTimes(1); // Still only called once
      expect(logic.hasAttemptedAutoReconnect).toBe(true);
    });

    it('should handle auto-reconnection failure gracefully', () => {
      authService.getOneTimeToken.mockReturnValue(throwError(() => new Error('Auto-reconnect failed')));
      const logic = new TestTerminalReconnectLogic(authService, shellService);

      // Simulate connection loss
      shellConnected$.next({ connected: false });

      expect(logic.isReconnecting()).toBe(false);
      expect(logic.hasAttemptedAutoReconnect).toBe(true);
    });

    it('should reset auto-reconnection flag on successful connection', () => {
      const logic = new TestTerminalReconnectLogic(authService, shellService);
      logic.hasAttemptedAutoReconnect = true;

      // Simulate successful reconnection
      shellConnected$.next({ connected: true, id: 'test-connection' });

      expect(logic.hasAttemptedAutoReconnect).toBe(false);
    });

    it('should work for instance shells', () => {
      const logic = new TestTerminalReconnectLogic(authService, shellService);

      expect(logic.isInstanceShell()).toBe(true);

      // Auto-reconnection should work regardless of shell type
      shellConnected$.next({ connected: false });
      expect(logic.isReconnecting()).toBe(true);
    });

    it('should work for non-instance shells', () => {
      // Create logic with non-instance shell configuration
      const nonInstanceLogic = new class extends TestTerminalReconnectLogic {
        override conf = (): TerminalConfiguration => ({
          connectionData: {},
        });
      }(authService, shellService);

      expect(nonInstanceLogic.isInstanceShell()).toBe(false);

      // Auto-reconnection should work for all shell types
      shellConnected$.next({ connected: false });
      expect(nonInstanceLogic.isReconnecting()).toBe(true);
    });
  });

  describe('shell connection state management', () => {
    it('should handle connection events properly', () => {
      const logic = new TestTerminalReconnectLogic(authService, shellService);

      // Test connection
      shellConnected$.next({ connected: true, id: 'conn-123' });
      expect(logic.shellConnected()).toBe(true);
      expect(logic.connectionId()).toBe('conn-123');

      // Test disconnection
      shellConnected$.next({ connected: false });
      expect(logic.shellConnected()).toBe(false);
    });

    it('should reset reconnecting state on successful connection', () => {
      const logic = new TestTerminalReconnectLogic(authService, shellService);
      logic.isReconnecting.set(true);

      // Successful connection should reset the loading state
      shellConnected$.next({ connected: true, id: 'test' });
      expect(logic.isReconnecting()).toBe(false);
    });

    it('should start auto-reconnection on connection loss', () => {
      const logic = new TestTerminalReconnectLogic(authService, shellService);
      logic.isReconnecting.set(false);

      // Connection loss should start auto-reconnection
      shellConnected$.next({ connected: false });
      expect(logic.isReconnecting()).toBe(true); // Auto-reconnection started
    });
  });

  describe('connection state management', () => {
    it('should show overlay when shell is not connected', () => {
      const logic = new TestTerminalReconnectLogic(authService, shellService);

      // Shell starts as not connected
      expect(logic.shellConnected()).toBe(false);
      // Template will show overlay when !shellConnected()
    });

    it('should hide overlay when shell is connected', () => {
      const logic = new TestTerminalReconnectLogic(authService, shellService);

      shellConnected$.next({ connected: true, id: 'test-connection' });

      expect(logic.shellConnected()).toBe(true);
      // Template will hide overlay when shellConnected() is true
    });

    it('should maintain connection state properly', () => {
      const logic = new TestTerminalReconnectLogic(authService, shellService);

      // Connect
      shellConnected$.next({ connected: true, id: 'test-connection' });
      expect(logic.shellConnected()).toBe(true);

      // Disconnect
      shellConnected$.next({ connected: false });
      expect(logic.shellConnected()).toBe(false);
    });
  });
});
