import { MatInputModule } from '@angular/material/input';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents, MockModule } from 'ng-mocks';
import { BehaviorSubject, of } from 'rxjs';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { FailoverStatus } from 'app/enums/failover-status.enum';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { CopyrightLineComponent } from 'app/modules/layout/copyright-line/copyright-line.component';
import {
  DisconnectedMessageComponent,
} from 'app/pages/signin/disconnected-message/disconnected-message.component';
import { FailoverStatusComponent } from 'app/pages/signin/failover-status/failover-status.component';
import {
  SetAdminPasswordFormComponent,
} from 'app/pages/signin/set-admin-password-form/set-admin-password-form.component';
import { SigninFormComponent } from 'app/pages/signin/signin-form/signin-form.component';
import { SigninComponent } from 'app/pages/signin/signin.component';
import { SigninStore } from 'app/pages/signin/store/signin.store';
import {
  TrueCommandStatusComponent,
} from 'app/pages/signin/true-command-status/true-command-status.component';
import { WebSocketConnectionService } from 'app/services/websocket-connection.service';

describe('SigninComponent', () => {
  let spectator: Spectator<SigninComponent>;
  const wasAdminSet$ = new BehaviorSubject<boolean>(undefined);
  const failover$ = new BehaviorSubject<{
    // eslint-disable-next-line no-restricted-globals
    status: FailoverStatus;
    ips?: string[];
    disabledReasons?: FailoverDisabledReason[];
  }>(null);
  const hasFailover$ = new BehaviorSubject<boolean>(undefined);
  const canLogin$ = new BehaviorSubject<boolean>(undefined);
  const isConnected$ = new BehaviorSubject<boolean>(undefined);
  const loginBanner$ = new BehaviorSubject<string>(undefined);

  const createComponent = createComponentFactory({
    component: SigninComponent,
    imports: [
      MatInputModule,
      MockModule(IxIconModule),
    ],
    declarations: [
      MockComponents(
        SigninFormComponent,
        DisconnectedMessageComponent,
        SetAdminPasswordFormComponent,
        TrueCommandStatusComponent,
        FailoverStatusComponent,
        CopyrightLineComponent,
      ),
    ],
    componentProviders: [
      mockProvider(SigninStore, {
        wasAdminSet$,
        failover$,
        hasFailover$,
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
      mockProvider(WebSocketConnectionService, {
        isConnected$,
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    wasAdminSet$.next(true);
    failover$.next(null);
    hasFailover$.next(false);
    canLogin$.next(true);
    isConnected$.next(true);
    loginBanner$.next('');
  });

  it('initializes SigninStore on component init', () => {
    expect(spectator.inject(SigninStore, true).init).toHaveBeenCalled();
  });

  describe('disconnected', () => {
    it('shows DisconnectedMessageComponent when there is no websocket connection', () => {
      isConnected$.next(false);
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

    it('shows FailoverStatusComponent when failover status is loaded and system has failover', () => {
      failover$.next({
        status: FailoverStatus.Error,
        ips: ['123.44.1.22', '123.44.1.34'],
        disabledReasons: [FailoverDisabledReason.NoPong],
      });
      hasFailover$.next(true);
      spectator.detectChanges();

      const failoverStatus = spectator.query(FailoverStatusComponent);
      expect(failoverStatus).toExist();
      expect(failoverStatus.disabledReasons).toEqual([FailoverDisabledReason.NoPong]);
      expect(failoverStatus.status).toEqual(FailoverStatus.Error);
      expect(failoverStatus.failoverIps).toEqual(['123.44.1.22', '123.44.1.34']);
    });

    it('checks login banner and shows full dialog if set', () => {
      loginBanner$.next('HELLO USER');
      spectator.detectChanges();

      expect(spectator.inject(DialogService).fullScreenDialog).toHaveBeenCalled();
    });
  });
});
