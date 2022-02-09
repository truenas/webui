import {
  byText, createComponentFactory, Spectator,
} from '@ngneat/spectator/jest';
import { EffectsModule } from '@ngrx/effects';
import { Store, StoreModule } from '@ngrx/store';
import { MockPipe, ngMocks } from 'ng-mocks';
import { first, map } from 'rxjs/operators';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { AlertComponent } from 'app/modules/alerts/components/alert/alert.component';
import { AlertPageObject } from 'app/modules/alerts/components/alert/alert.page-object';
import { AlertEffects } from 'app/modules/alerts/store/alert.effects';
import { adapter, alertReducer, alertsInitialState } from 'app/modules/alerts/store/alert.reducer';
import { alertStateKey, selectAlerts } from 'app/modules/alerts/store/alert.selectors';
import { WebSocketService } from 'app/services';
import { systemConfigReducer, SystemConfigState } from 'app/store/system-config/system-config.reducer';
import { systemConfigStateKey } from 'app/store/system-config/system-config.selectors';

const dummyAlert = {
  id: '79',
  datetime: {
    $date: 1641811015,
  },
  level: AlertLevel.Critical,
  formatted: 'CPU is on fire',
  dismissed: false,
} as Alert;

describe('AlertComponent', () => {
  let spectator: Spectator<AlertComponent>;
  let websocket: WebSocketService;
  let alert: AlertPageObject;
  const createComponent = createComponentFactory({
    component: AlertComponent,
    imports: [
      StoreModule.forRoot({
        [alertStateKey]: alertReducer,
        [systemConfigStateKey]: systemConfigReducer,
      }, {
        initialState: {
          [alertStateKey]: adapter.setAll([dummyAlert], alertsInitialState),
          [systemConfigStateKey]: {
            generalConfig: {
              timezone: 'America/Alaska',
            },
          } as SystemConfigState,
        },
      }),
      EffectsModule.forRoot([AlertEffects]),
    ],
    declarations: [
      MockPipe(FormatDateTimePipe, jest.fn(() => 'Jan 10 2022 10:36')),
    ],
    providers: [
      mockWebsocket([
        mockCall('alert.dismiss'),
        mockCall('alert.restore'),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        alert: dummyAlert,
      },
    });

    websocket = spectator.inject(WebSocketService);
    alert = new AlertPageObject(spectator);
  });

  it('shows alert level', () => {
    expect(alert.levelElement).toHaveText('Critical');
  });

  it('shows alert message', () => {
    expect(alert.messageElement).toHaveExactText('CPU is on fire');
  });

  it('shows an alert icon', async () => {
    const icon = await alert.getIconHarness();
    expect(await icon.getName()).toEqual('error');
  });

  it('shows alert datetime (formatted according to system settings) and system timezone', () => {
    const datetime = spectator.query('.alert-time');
    expect(datetime).toHaveText('Jan 10 2022 10:36 (America/Alaska)');

    const formatPipe = ngMocks.findInstance(FormatDateTimePipe);
    expect(formatPipe.transform).toHaveBeenCalledWith(1641811015);
  });

  it('dismisses an open alert when Dismiss link is pressed', async () => {
    alert.clickDismissLink();

    expect(websocket.call).toHaveBeenCalledWith('alert.dismiss', ['79']);

    const state = await spectator.inject(Store).pipe(map(selectAlerts), first()).toPromise();
    expect(state).toEqual([
      {
        ...dummyAlert,
        dismissed: true,
      },
    ]);
  });

  it('reopens a dismissed alert when Re-open link is pressed', async () => {
    spectator.setInput('alert', {
      ...dummyAlert,
      dismissed: true,
    } as Alert);

    const reopenLink = spectator.query(byText('Re-Open'));
    spectator.click(reopenLink);

    expect(websocket.call).toHaveBeenCalledWith('alert.restore', ['79']);

    const state = await spectator.inject(Store).pipe(map(selectAlerts), first()).toPromise();
    expect(state).toEqual([dummyAlert]);
  });
});
