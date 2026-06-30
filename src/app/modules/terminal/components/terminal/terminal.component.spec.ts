/* eslint-disable max-classes-per-file */
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnIconHarness } from '@truenas/ui-components';
import {
  EMPTY, of, Subject, throwError,
} from 'rxjs';
import { take, tap } from 'rxjs/operators';
import { MockAuthService } from 'app/core/testing/classes/mock-auth.service';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Role } from 'app/enums/role.enum';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { ShellConnectedEvent } from 'app/interfaces/shell.interface';
import { TerminalConfiguration } from 'app/interfaces/terminal.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { TerminalComponent } from 'app/modules/terminal/components/terminal/terminal.component';
import { ShellService } from 'app/services/shell.service';

// Loading the real @xterm/xterm module touches a canvas at import time, which jsdom logs as
// "not implemented" and jest-fail-on-console turns into a failure. The terminal is never
// instantiated in these tests, so a lightweight stub is enough.
jest.mock('@xterm/xterm', () => ({ Terminal: jest.fn() }));

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
    connectionData: { container_id: 1, use_console: false },
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
    const data = this.conf().connectionData;
    return ('container_id' in data && 'use_console' in data);
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
        container_id: 1,
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
        container_id: 1,
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

describe('TerminalComponent access control', () => {
  let spectator: Spectator<TerminalComponent>;
  let shellService: ShellService;
  let loader: HarnessLoader;
  let getOneTimeToken: jest.Mock;

  const accessDeniedText = 'Your user permissions do not allow Web Shell access.';

  const getLockIcon = (): Promise<TnIconHarness | null> => loader.getHarnessOrNull(TnIconHarness.with({ name: 'lock' }));

  const createComponent = createComponentFactory({
    component: TerminalComponent,
    componentProviders: [
      mockProvider(ShellService, {
        connect: jest.fn(),
        disconnectIfSessionActive: jest.fn(),
        shellConnected$: new Subject<ShellConnectedEvent>().asObservable(),
      }),
    ],
    providers: [
      mockApi(),
      provideMockStore(),
      mockAuth(),
    ],
  });

  function setupComponent(
    conf: TerminalConfiguration,
    options: { webShell?: boolean } = {},
  ): void {
    const { webShell = true } = options;

    spectator = createComponent({
      props: { conf },
      detectChanges: false,
    });

    const authService = spectator.inject(MockAuthService);
    authService.setUser({
      privilege: {
        roles: { $set: [Role.FullAdmin] },
        web_shell: webShell,
      },
    } as LoggedInUser);
    // Prevent terminal/websocket initialization in tests. getOneTimeToken is the first call
    // startShell() makes, so it doubles as a probe for whether the connect path ran.
    getOneTimeToken = jest.fn(() => EMPTY);
    (authService as unknown as AuthService).getOneTimeToken = getOneTimeToken;

    spectator.detectChanges();
    shellService = spectator.inject(ShellService, true);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  it('shows a restricted-access warning when the user lacks the web_shell privilege', async () => {
    setupComponent({ connectionData: {} }, { webShell: false });

    expect(await getLockIcon()).not.toBeNull();
    expect(spectator.fixture.nativeElement).toHaveText(accessDeniedText);
    expect(shellService.connect).not.toHaveBeenCalled();
    expect(getOneTimeToken).not.toHaveBeenCalled();
  });

  it('proceeds to connect when the user has the web_shell privilege', async () => {
    setupComponent({ connectionData: { container_id: 1, use_console: false } }, { webShell: true });

    expect(await getLockIcon()).toBeNull();
    expect(getOneTimeToken).toHaveBeenCalled();
  });
});
