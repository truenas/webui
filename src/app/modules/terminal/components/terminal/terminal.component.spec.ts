import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness, TnIconHarness } from '@truenas/ui-components';
import {
  defer, EMPTY, NEVER, Observable, of, Subject, throwError,
} from 'rxjs';
import { MockAuthService } from 'app/core/testing/classes/mock-auth.service';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Role } from 'app/enums/role.enum';
import { helptextGlobal } from 'app/helptext/global-helptext';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { ShellConnectedEvent } from 'app/interfaces/shell.interface';
import { TerminalConfiguration } from 'app/interfaces/terminal.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { TerminalComponent } from 'app/modules/terminal/components/terminal/terminal.component';
import { ShellService } from 'app/services/shell.service';
import { defaultPreferences } from 'app/store/preferences/default-preferences.constant';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

// The real @xterm modules touch a canvas at import time, which jsdom logs as "not implemented".
// These stubs are deliberately wide enough for the component's real connect path to run end to
// end — initializeTerminal() constructs the terminal and loads addons — so the reconnect tests
// below drive production code instead of a re-implementation of it.
jest.mock('@xterm/xterm', () => ({
  Terminal: jest.fn(() => ({
    loadAddon: jest.fn(),
    open: jest.fn(),
    clear: jest.fn(),
    focus: jest.fn(),
    options: {},
  })),
}));

jest.mock('@xterm/addon-fit', () => ({
  FitAddon: jest.fn(() => ({
    fit: jest.fn(),
    proposeDimensions: jest.fn(() => ({ cols: 80, rows: 20 })),
  })),
}));

// Deliberately never settles. The font callback only draws the terminal, which is out of scope
// here, and resolving it would run drawTerminal() in a microtask after the test has finished.
jest.mock('fontfaceobserver', () => jest.fn(() => ({
  load: () => new Promise(() => {}),
})));

describe('TerminalComponent', () => {
  let spectator: Spectator<TerminalComponent>;
  let loader: HarnessLoader;
  let shellService: ShellService;
  let shellConnected$: Subject<ShellConnectedEvent>;
  let getOneTimeToken: jest.Mock<Observable<string>>;

  const instanceShellConf: TerminalConfiguration = {
    connectionData: { container_id: 1, use_console: false },
  };

  const createComponent = createComponentFactory({
    component: TerminalComponent,
    componentProviders: [
      mockProvider(ShellService, {
        connect: jest.fn(),
        disconnectIfSessionActive: jest.fn(),
        // defer() so each test's fresh Subject is resolved at subscribe time — the factory
        // itself is only evaluated once, so a plain Subject would leak between tests.
        shellConnected$: defer(() => shellConnected$),
      }),
    ],
    providers: [
      mockApi(),
      provideMockStore({
        selectors: [{ selector: selectPreferences, value: defaultPreferences }],
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    shellConnected$ = new Subject<ShellConnectedEvent>();
  });

  afterEach(() => {
    shellConnected$.complete();
  });

  function setupTerminal(options: {
    conf?: TerminalConfiguration;
    webShell?: boolean;
    initialToken?: Observable<string>;
  } = {}): void {
    const {
      conf = { connectionData: {} },
      webShell = true,
      initialToken = of('initial-token'),
    } = options;

    spectator = createComponent({ props: { conf }, detectChanges: false });
    shellService = spectator.inject(ShellService, true);

    const authService = spectator.inject(MockAuthService);
    authService.setUser({
      privilege: {
        roles: { $set: [Role.FullAdmin] },
        web_shell: webShell,
      },
    } as LoggedInUser);

    // getOneTimeToken is the first call startShell() makes, so it doubles as a probe for
    // whether the connect path ran at all.
    getOneTimeToken = jest.fn(() => initialToken);
    (authService as unknown as AuthService).getOneTimeToken = getOneTimeToken;

    spectator.detectChanges();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  /**
   * Drives the real connection-lost sequence: the shell drops, the component spends its single
   * automatic retry, and that retry fails to get a token. This is the only state in which the
   * manual Reconnect button is offered.
   */
  function loseConnectionAndFailAutoReconnect(): void {
    getOneTimeToken.mockReturnValue(throwError(() => new Error('Token request failed')));
    shellConnected$.next({ connected: false });
    spectator.detectChanges();
  }

  const getReconnectButton = (): Promise<TnButtonHarness | null> => (
    loader.getHarnessOrNull(TnButtonHarness.with({ label: 'Reconnect' }))
  );

  const getLockIcon = (): Promise<TnIconHarness | null> => (
    loader.getHarnessOrNull(TnIconHarness.with({ name: 'lock' }))
  );

  describe('access control', () => {
    it('shows a restricted-access warning when the user lacks the web_shell privilege', async () => {
      setupTerminal({ webShell: false });

      expect(await getLockIcon()).not.toBeNull();
      expect(spectator.fixture.nativeElement).toHaveText(helptextGlobal.webShellAccessDenied);
      expect(shellService.connect).not.toHaveBeenCalled();
      expect(getOneTimeToken).not.toHaveBeenCalled();
    });

    it('connects the shell when the user has the web_shell privilege', async () => {
      setupTerminal({ conf: instanceShellConf });

      expect(await getLockIcon()).toBeNull();
      expect(getOneTimeToken).toHaveBeenCalledTimes(1);
      expect(shellService.connect).toHaveBeenCalledWith('initial-token', instanceShellConf.connectionData);
    });
  });

  describe('connection state', () => {
    it('shows a spinner while the shell is connecting', async () => {
      setupTerminal();

      expect(spectator.fixture.nativeElement).toHaveText('Connecting...');
      expect(await getReconnectButton()).toBeNull();
    });

    it('names the instance shell while connecting to one', () => {
      setupTerminal({ conf: instanceShellConf });

      expect(spectator.fixture.nativeElement).toHaveText('Connecting to instance shell...');
    });

    it('clears the busy overlay once the shell connects', async () => {
      setupTerminal();

      shellConnected$.next({ connected: true, id: 'conn-123' });
      spectator.detectChanges();

      expect(spectator.fixture.nativeElement).not.toHaveText('Connecting...');
      expect(await getReconnectButton()).toBeNull();
    });
  });

  describe('automatic reconnect', () => {
    it('retries the connection by itself when the shell drops', () => {
      setupTerminal();
      getOneTimeToken.mockReturnValue(of('retry-token'));

      shellConnected$.next({ connected: false });

      expect(getOneTimeToken).toHaveBeenCalledTimes(2);
      expect(shellService.connect).toHaveBeenLastCalledWith('retry-token', {});
    });

    it('retries only once per connection loss', () => {
      setupTerminal();
      getOneTimeToken.mockReturnValue(throwError(() => new Error('Token request failed')));

      shellConnected$.next({ connected: false });
      expect(getOneTimeToken).toHaveBeenCalledTimes(2);

      shellConnected$.next({ connected: false });
      expect(getOneTimeToken).toHaveBeenCalledTimes(2);
    });

    it('is available again after the shell has reconnected', () => {
      setupTerminal();
      getOneTimeToken.mockReturnValue(throwError(() => new Error('Token request failed')));

      shellConnected$.next({ connected: false });
      expect(getOneTimeToken).toHaveBeenCalledTimes(2);

      shellConnected$.next({ connected: true, id: 'conn-123' });
      spectator.detectChanges();

      shellConnected$.next({ connected: false });
      expect(getOneTimeToken).toHaveBeenCalledTimes(3);
    });
  });

  describe('manual reconnect', () => {
    it('does not offer a reconnect button while the automatic retry is still in flight', async () => {
      setupTerminal();
      getOneTimeToken.mockReturnValue(EMPTY);

      shellConnected$.next({ connected: false });
      spectator.detectChanges();

      expect(await getReconnectButton()).toBeNull();
      expect(spectator.fixture.nativeElement).toHaveText('Connecting...');
    });

    it('offers a reconnect button once the automatic retry has failed', async () => {
      setupTerminal();
      loseConnectionAndFailAutoReconnect();

      expect(await getReconnectButton()).not.toBeNull();
      expect(spectator.fixture.nativeElement).toHaveText('Connection lost. Click Reconnect to restore the session.');
    });

    it('requests a fresh token and reconnects when the button is clicked', async () => {
      setupTerminal();
      loseConnectionAndFailAutoReconnect();
      getOneTimeToken.mockReturnValue(of('fresh-token'));

      await (await getReconnectButton())?.click();

      expect(getOneTimeToken).toHaveBeenCalledTimes(3);
      expect(shellService.connect).toHaveBeenLastCalledWith('fresh-token', {});
    });

    it('falls back to the busy spinner while the manual reconnect is in flight', async () => {
      setupTerminal();
      loseConnectionAndFailAutoReconnect();
      getOneTimeToken.mockReturnValue(NEVER);

      await (await getReconnectButton())?.click();
      spectator.detectChanges();

      expect(spectator.fixture.nativeElement).toHaveText('Connecting...');
      expect(await getReconnectButton()).toBeNull();
    });

    it('keeps offering the reconnect button when the manual reconnect fails', async () => {
      setupTerminal();
      loseConnectionAndFailAutoReconnect();

      await (await getReconnectButton())?.click();
      spectator.detectChanges();

      expect(await getReconnectButton()).not.toBeNull();
    });
  });
});
