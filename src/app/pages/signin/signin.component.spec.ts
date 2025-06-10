import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { BehaviorSubject, of } from 'rxjs';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { CopyrightLineComponent } from 'app/modules/layout/copyright-line/copyright-line.component';
import {
  DisconnectedMessageComponent,
} from 'app/pages/signin/disconnected-message/disconnected-message.component';
import { ReconnectMessage } from 'app/pages/signin/reconnect-message/reconnect-message.component';
import {
  SetAdminPasswordFormComponent,
} from 'app/pages/signin/set-admin-password-form/set-admin-password-form.component';
import { SigninFormComponent } from 'app/pages/signin/signin-form/signin-form.component';
import { SigninComponent } from 'app/pages/signin/signin.component';
import { SigninStore } from 'app/pages/signin/store/signin.store';
import {
  TrueCommandStatusComponent,
} from 'app/pages/signin/true-command-status/true-command-status.component';
import { TokenLastUsedService } from 'app/services/token-last-used.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

describe('SigninComponent', () => {
  let spectator: Spectator<SigninComponent>;
  const wasAdminSet$ = new BehaviorSubject<boolean>(true);
  const canLogin$ = new BehaviorSubject<boolean>(true);
  const isConnected$ = new BehaviorSubject<boolean>(true);
  const loginBanner$ = new BehaviorSubject<string>('');
  const isTokenWithinTimeline$ = new BehaviorSubject<boolean>(true);
  const isReconnectAllowed$ = new BehaviorSubject<boolean>(false);
  const isFailoverRestart$ = new BehaviorSubject<boolean>(false);

  const createComponent = createComponentFactory({
    component: SigninComponent,
    imports: [
      MockComponents(
        SigninFormComponent,
        DisconnectedMessageComponent,
        SetAdminPasswordFormComponent,
        TrueCommandStatusComponent,
        CopyrightLineComponent,
        ReconnectMessage,
      ),
    ],
    componentProviders: [
      mockProvider(SigninStore, {
        wasAdminSet$,
        canLogin$,
        loginBanner$,
        isLoading$: of(false),
        init: jest.fn(),
      }),
    ],
    providers: [
      mockProvider(DialogService, {
        fullScreenDialog: jest.fn(() => of()),
      }),
      mockProvider(AuthService, {
        hasAuthToken: true,
      }),
      mockProvider(TokenLastUsedService, {
        isTokenWithinTimeline$,
      }),
      mockProvider(WebSocketStatusService, {
        isConnected$,
        isReconnectAllowed$,
        setReconnectAllowed: jest.fn(),
        isFailoverRestart$,
        setFailoverStatus: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    wasAdminSet$.next(true);
    canLogin$.next(true);
    isConnected$.next(true);
    loginBanner$.next('');
    isTokenWithinTimeline$.next(false);
  });

  it('initializes SigninStore on component init', () => {
    expect(spectator.inject(SigninStore, true).init).toHaveBeenCalled();
    expect(spectator.inject(WebSocketStatusService).setReconnectAllowed).toHaveBeenCalledWith(true);
  });

  describe('disconnected', () => {
    it('shows DisconnectedMessageComponent when there is no websocket connection', () => {
      isConnected$.next(false);

      spectator.detectChanges();

      expect(spectator.query(DisconnectedMessageComponent)).toExist();
    });

    it('shows ReconnectMessage when has established initial connection', () => {
      isConnected$.next(false);
      isReconnectAllowed$.next(true);

      spectator.detectChanges();

      expect(spectator.query(ReconnectMessage)).toExist();
    });
  });

  describe('connected', () => {
    it('shows SetRootPasswordFormComponent when root password is not set', () => {
      wasAdminSet$.next(false);
      spectator.detectChanges();

      expect(spectator.query(SetAdminPasswordFormComponent)).toExist();
    });

    it('initializes SigninStore when component is initialized', () => {
      expect(spectator.inject(SigninStore, true).init).toHaveBeenCalled();
    });

    it('shows SigninFormComponent when root password is set,', () => {
      expect(spectator.query(SigninFormComponent)).toExist();
    });

    it('shows TrueCommandStatusComponent', () => {
      expect(spectator.query(TrueCommandStatusComponent)).toExist();
    });

    it('shows the logo when waiting for connection status', () => {
      spectator.detectChanges();

      const logo = spectator.query('.logo-wrapper ix-icon');
      expect(logo).toExist();
    });

    it('shows "Logging in..." message when user is authenticated and token is within the timeline', () => {
      isConnected$.next(true);
      isTokenWithinTimeline$.next(true);

      spectator.detectChanges();

      const loggingInMessage = spectator.query('.logging-in');
      expect(loggingInMessage).toExist();
      expect(loggingInMessage).toHaveText('Logging in...');
    });

    it('checks login banner and shows full dialog if set', () => {
      loginBanner$.next('HELLO USER');
      spectator.detectChanges();

      expect(spectator.inject(DialogService).fullScreenDialog).toHaveBeenCalled();
    });

    it('checks signin store is initialized when isFailoverStart$ is true', () => {
      isFailoverRestart$.next(true);
      spectator.detectChanges();

      expect(spectator.inject(SigninStore, true).init).toHaveBeenCalled();
      expect(spectator.inject(WebSocketStatusService).setFailoverStatus).toHaveBeenCalledWith(false);
    });
  });
});
