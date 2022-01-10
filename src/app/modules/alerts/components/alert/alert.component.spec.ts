import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatIconHarness } from '@angular/material/icon/testing';
import {
  byText, createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { EffectsModule } from '@ngrx/effects';
import { Store, StoreModule } from '@ngrx/store';
import { MockPipe, ngMocks } from 'ng-mocks';
import { of } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { FormatDateTimePipe } from 'app/core/components/pipes/format-datetime.pipe';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { AlertComponent } from 'app/modules/alerts/components/alert/alert.component';
import { AlertEffects } from 'app/modules/alerts/store/alert.effects';
import { adapter, alertReducer, alertsInitialState } from 'app/modules/alerts/store/alert.reducer';
import { alertStateKey, selectAlerts } from 'app/modules/alerts/store/alert.selectors';
import { SystemGeneralService, WebSocketService } from 'app/services';

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
  let loader: HarnessLoader;
  let websocket: WebSocketService;
  const createComponent = createComponentFactory({
    component: AlertComponent,
    imports: [
      StoreModule.forRoot({ [alertStateKey]: alertReducer }, {
        initialState: {
          [alertStateKey]: adapter.setAll([dummyAlert], alertsInitialState),
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
      mockProvider(SystemGeneralService, {
        getGeneralConfig$: of({
          timezone: 'America/Alaska',
        } as SystemGeneralConfig),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        alert: dummyAlert,
      },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    websocket = spectator.inject(WebSocketService);
  });

  it('shows alert level', () => {
    expect(spectator.query('.alert-level')).toHaveText('Critical');
  });

  it('shows alert message', () => {
    expect(spectator.query('.alert-message')).toHaveExactText('CPU is on fire');
  });

  it('shows an alert icon', async () => {
    const icon = await loader.getHarness(MatIconHarness);
    expect(await icon.getName()).toEqual('error');
  });

  it('shows alert datetime (formatted according to system settings) and system timezone', () => {
    const datetime = spectator.query('.alert-time');
    expect(datetime).toHaveText('Jan 10 2022 10:36 (America/Alaska)');

    const formatPipe = ngMocks.findInstance(FormatDateTimePipe);
    expect(formatPipe.transform).toHaveBeenCalledWith(1641811015);
  });

  it('dismisses an open alert when Dismiss link is pressed', async () => {
    const dismissLink = spectator.query(byText('Dismiss'));
    spectator.click(dismissLink);

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
