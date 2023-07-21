import { MatInputModule } from '@angular/material/input';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { BehaviorSubject, of } from 'rxjs';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { FailoverStatus } from 'app/enums/failover-status.enum';
import { CopyrightLineComponent } from 'app/modules/layout/components/copyright-line/copyright-line.component';
import { WebsocketConnectionService } from 'app/services/websocket-connection.service';
import {
  DisconnectedMessageComponent,
} from 'app/views/sessions/signin/disconnected-message/disconnected-message.component';
import { FailoverStatusComponent } from 'app/views/sessions/signin/failover-status/failover-status.component';
import {
  SetAdminPasswordFormComponent,
} from 'app/views/sessions/signin/set-admin-password-form/set-admin-password-form.component';
import { SigninFormComponent } from 'app/views/sessions/signin/signin-form/signin-form.component';
import { SigninComponent } from 'app/views/sessions/signin/signin.component';
import { SigninStore } from 'app/views/sessions/signin/store/signin.store';
import {
  TrueCommandStatusComponent,
} from 'app/views/sessions/signin/true-command-status/true-command-status.component';

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

  const createComponent = createComponentFactory({
    component: SigninComponent,
    imports: [
      MatInputModule,
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
    providers: [
      mockProvider(WebsocketConnectionService, {
        isConnected$,
      }),
      mockProvider(SigninStore, {
        wasAdminSet$,
        failover$,
        hasFailover$,
        canLogin$,
        isLoading$: of(false),
        init: jest.fn(),
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
  });

  it('initializes SigninStore on component init', () => {
    expect(spectator.inject(SigninStore).init).toHaveBeenCalled();
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
      expect(spectator.inject(SigninStore).init).toHaveBeenCalled();
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
  });
});
