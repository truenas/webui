import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { EffectsModule } from '@ngrx/effects';
import { Store, StoreModule } from '@ngrx/store';
import { ngMocks } from 'ng-mocks';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { AlertComponent } from 'app/modules/alerts/components/alert/alert.component';
import { AlertPageObject } from 'app/modules/alerts/components/alert/alert.page-object';
import { AlertEffects } from 'app/modules/alerts/store/alert.effects';
import { adapter, alertReducer, alertsInitialState } from 'app/modules/alerts/store/alert.reducer';
import { alertStateKey, selectAlerts } from 'app/modules/alerts/store/alert.selectors';
import { FormatDateTimePipe } from 'app/modules/pipes/format-date-time/format-datetime.pipe';
import { WebSocketService } from 'app/services/ws.service';
import { systemConfigReducer, SystemConfigState } from 'app/store/system-config/system-config.reducer';
import { systemConfigStateKey } from 'app/store/system-config/system-config.selectors';

const dummyAlert = {
  id: '79',
  datetime: {
    $date: 1641811015,
  },
  node: 'Active Controller (A)',
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
      FakeFormatDateTimePipe,
    ],
    providers: [
      mockAuth(),
      mockWebSocket([
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

  it('shows an alert node on an HA system', () => {
    spectator.setInput('isHaLicensed', true);
    expect(alert.nodeElement).toHaveExactText('Active Controller (A)');
  });

  it('shows an alert icon', async () => {
    const icon = await alert.getIconHarness();
    expect(await icon.getName()).toBe('error');
  });

  it('shows alert datetime (formatted according to system settings) and system timezone', () => {
    expect(alert.dateTimeElement.textContent.replace(/\s{2,}/g, ' ').trim()).toBe('1970-01-20 03:03:31 (America/Alaska)');

    const formatPipe = ngMocks.findInstance(FormatDateTimePipe);
    expect(formatPipe.transform).toHaveBeenCalledWith(1641811015);
  });

  it('dismisses an open alert when Dismiss link is pressed', async () => {
    alert.clickDismissLink();

    expect(websocket.call).toHaveBeenCalledWith('alert.dismiss', ['79']);

    const state = await firstValueFrom(spectator.inject(Store).pipe(map(selectAlerts)));
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

    alert.clickReopenLink();

    expect(websocket.call).toHaveBeenCalledWith('alert.restore', ['79']);

    const state = await firstValueFrom(spectator.inject(Store).pipe(map(selectAlerts)));
    expect(state).toEqual([dummyAlert]);
  });
});
