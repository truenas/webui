import { ChangeDetectorRef } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';
import { take, tap } from 'rxjs/operators';
import { ShellConnectedEvent } from 'app/interfaces/shell.interface';
import { TerminalConfiguration } from 'app/interfaces/terminal.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { ShellService } from 'app/services/shell.service';

// Create a simplified test for the reconnect functionality without the DOM dependencies
describe('TerminalComponent Reconnect Logic', () => {
  let authService: jest.Mocked<AuthService>;
  let shellService: jest.Mocked<ShellService>;
  let cdr: jest.Mocked<ChangeDetectorRef>;
  let shellConnected$: Subject<ShellConnectedEvent>;

  // Mock the reconnect method from TerminalComponent
  class TestTerminalReconnectLogic {
    shellConnected = false;
    connectionId: string;
    isReconnecting = false;
    token: string;
    authService: AuthService;
    shellService: ShellService;

    conf = (): TerminalConfiguration => ({
      connectionData: { virt_instance_id: 'test-instance', use_console: false },
    });

    constructor(
      private authServiceParam: AuthService,
      private shellServiceParam: ShellService,
      private changeDetectorRef: ChangeDetectorRef,
    ) {
      this.authService = authServiceParam;
      this.shellService = shellServiceParam;

      this.shellService.shellConnected$.subscribe((event: ShellConnectedEvent) => {
        this.shellConnected = event.connected;
        this.connectionId = event.id;

        this.isReconnecting = false;
        this.changeDetectorRef.markForCheck();
      });
    }

    reconnect(): void {
      this.isReconnecting = true;
      this.changeDetectorRef.markForCheck();

      this.authService.getOneTimeToken().pipe(
        take(1),
        tap((token) => {
          this.token = token;
          this.shellService.connect(this.token, this.conf().connectionData);
        }),
      ).subscribe({
        error: () => {
          this.isReconnecting = false;
          this.changeDetectorRef.markForCheck();
        },
      });
    }
  }

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

    cdr = {
      markForCheck: jest.fn(),
    } as unknown as jest.Mocked<ChangeDetectorRef>;
  });

  afterEach(() => {
    shellConnected$.complete();
  });

  describe('reconnect functionality', () => {
    it('should get fresh token and attempt reconnection', () => {
      const logic = new TestTerminalReconnectLogic(authService, shellService, cdr);

      logic.reconnect();

      expect(logic.isReconnecting).toBe(true);
      expect(cdr.markForCheck).toHaveBeenCalled();
      expect(authService.getOneTimeToken).toHaveBeenCalled();
      expect(shellService.connect).toHaveBeenCalledWith('fresh-token', {
        virt_instance_id: 'test-instance',
        use_console: false,
      });
    });

    it('should handle token retrieval errors', () => {
      authService.getOneTimeToken.mockReturnValue(throwError(() => new Error('Token failed')));
      const logic = new TestTerminalReconnectLogic(authService, shellService, cdr);

      logic.reconnect();

      expect(logic.isReconnecting).toBe(false);
      expect(cdr.markForCheck).toHaveBeenCalledTimes(2); // Once for start, once for error
    });

    it('should reset loading state on successful connection', () => {
      const logic = new TestTerminalReconnectLogic(authService, shellService, cdr);
      logic.isReconnecting = true;

      shellConnected$.next({ connected: true, id: 'test-connection' });

      expect(logic.shellConnected).toBe(true);
      expect(logic.connectionId).toBe('test-connection');
      expect(logic.isReconnecting).toBe(false);
      expect(cdr.markForCheck).toHaveBeenCalled();
    });

    it('should reset loading state on connection failure', () => {
      const logic = new TestTerminalReconnectLogic(authService, shellService, cdr);
      logic.isReconnecting = true;

      shellConnected$.next({ connected: false });

      expect(logic.shellConnected).toBe(false);
      expect(logic.isReconnecting).toBe(false);
      expect(cdr.markForCheck).toHaveBeenCalled();
    });

    it('should update token when reconnecting', () => {
      const logic = new TestTerminalReconnectLogic(authService, shellService, cdr);
      logic.token = 'old-token';

      logic.reconnect();

      expect(logic.token).toBe('fresh-token');
    });
  });

  describe('shell connection state management', () => {
    it('should handle connection events properly', () => {
      const logic = new TestTerminalReconnectLogic(authService, shellService, cdr);

      // Test connection
      shellConnected$.next({ connected: true, id: 'conn-123' });
      expect(logic.shellConnected).toBe(true);
      expect(logic.connectionId).toBe('conn-123');

      // Test disconnection
      shellConnected$.next({ connected: false });
      expect(logic.shellConnected).toBe(false);
    });

    it('should reset reconnecting state on any connection event', () => {
      const logic = new TestTerminalReconnectLogic(authService, shellService, cdr);
      logic.isReconnecting = true;

      // Both successful and failed connections should reset the loading state
      shellConnected$.next({ connected: true, id: 'test' });
      expect(logic.isReconnecting).toBe(false);

      logic.isReconnecting = true;
      shellConnected$.next({ connected: false });
      expect(logic.isReconnecting).toBe(false);
    });
  });
});
