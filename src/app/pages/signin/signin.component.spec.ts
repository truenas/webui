import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { BehaviorSubject, of } from 'rxjs';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { CopyrightLineComponent } from 'app/modules/layout/copyright-line/copyright-line.component';
import {
  DisconnectedMessageComponent,
} from 'app/pages/signin/disconnected-message/disconnected-message.component';
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
  const wasAdminSet$ = new BehaviorSubject<boolean>(undefined);
  const canLogin$ = new BehaviorSubject<boolean>(undefined);
  const isConnected$ = new BehaviorSubject<boolean>(undefined);
  const loginBanner$ = new BehaviorSubject<string>(undefined);
  const isTokenWithinTimeline$ = new BehaviorSubject<boolean>(undefined);
  const isConnectedDelayed$ = new BehaviorSubject<boolean>(null);

  const createComponent = createComponentFactory({
    component: SigninComponent,
    imports: [
      MockComponents(
        SigninFormComponent,
        DisconnectedMessageComponent,
        SetAdminPasswordFormComponent,
        TrueCommandStatusComponent,
        CopyrightLineComponent,
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
        fullScreenDialog: jest.fn(),
      }),
      mockProvider(AuthService, {
        hasAuthToken: true,
      }),
      mockProvider(TokenLastUsedService, {
        isTokenWithinTimeline$,
      }),
      mockProvider(WebSocketStatusService, {
        isConnected$,
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
    spectator.component.isConnectedDelayed$ = isConnectedDelayed$;
  });

  it('initializes SigninStore on component init', () => {
    expect(spectator.inject(SigninStore, true).init).toHaveBeenCalled();
  });

  describe('disconnected', () => {
    it('shows DisconnectedMessageComponent when there is no websocket connection', () => {
      isConnected$.next(false);
      isConnectedDelayed$.next(false);

      spectator.detectChanges();

      expect(spectator.query(DisconnectedMessageComponent)).toExist();
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
      isConnectedDelayed$.next(null);
      spectator.detectChanges();

      const logo = spectator.query('.logo-wrapper ix-icon');
      expect(logo).toExist();
    });

    it('shows "Logging in..." message when user is authenticated and token is within the timeline', () => {
      isConnected$.next(true);
      isConnectedDelayed$.next(true);

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
  });
});
