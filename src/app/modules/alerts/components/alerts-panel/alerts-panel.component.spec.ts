import { byText, createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { EffectsModule } from '@ngrx/effects';
import { Store, StoreModule } from '@ngrx/store';
import { MockComponent } from 'ng-mocks';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { queryAllNestedDirectives } from 'app/core/testing/utils/query-all-nested-directives.utils';
import { Alert } from 'app/interfaces/alert.interface';
import { AlertComponent } from 'app/modules/alerts/components/alert/alert.component';
import { AlertsPanelComponent } from 'app/modules/alerts/components/alerts-panel/alerts-panel.component';
import { AlertEffects } from 'app/modules/alerts/store/alert.effects';
import { adapter, alertReducer, alertsInitialState } from 'app/modules/alerts/store/alert.reducer';
import { alertStateKey } from 'app/modules/alerts/store/alert.selectors';
import { WebSocketService } from 'app/services';
import { adminUiInitialized } from 'app/store/actions/admin.actions';

const unreadAlerts = [
  {
    id: '1',
    dismissed: false,
    formatted: 'Unread 1',
    datetime: { $date: 1641811015 },
  },
  {
    id: '2',
    dismissed: false,
    formatted: 'Unread 2',
    datetime: { $date: 1641810015 },
  },
] as Alert[];

const dismissedAlerts = [
  {
    id: '3',
    dismissed: true,
    formatted: 'Dismissed 3',
    datetime: { $date: 1641790015 },
  },
  {
    id: '4',
    dismissed: true,
    formatted: 'Dismissed 4',
    datetime: { $date: 1641780015 },
  },
] as Alert[];

describe('AlertsPanelComponent', () => {
  let spectator: Spectator<AlertsPanelComponent>;
  let websocket: WebSocketService;
  const createComponent = createComponentFactory({
    component: AlertsPanelComponent,
    imports: [
      StoreModule.forRoot({ [alertStateKey]: alertReducer }, {
        initialState: {
          [alertStateKey]: adapter.setAll([...unreadAlerts, ...dismissedAlerts], alertsInitialState),
        },
      }),
      EffectsModule.forRoot([AlertEffects]),
    ],
    declarations: [
      MockComponent(AlertComponent),
    ],
    providers: [
      mockWebsocket([
        mockCall('alert.list', []),
        mockCall('alert.dismiss'),
        mockCall('alert.restore'),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();

    websocket = spectator.inject(WebSocketService);
  });

  // TODO: Move elsewhere?
  it('loads alerts when adminUiInitialized is dispatched', () => {
    const store$ = spectator.inject(Store);
    store$.dispatch(adminUiInitialized());

    expect(websocket.call).toHaveBeenCalledWith('alert.list');
  });

  it('shows a list of unread alerts', () => {
    const alerts = queryAllNestedDirectives(spectator.debugElement, '.unread-alerts', AlertComponent);

    expect(alerts.length).toEqual(2);
    expect(alerts[0].alert).toEqual(unreadAlerts[0]);
    expect(alerts[1].alert).toEqual(unreadAlerts[1]);
  });

  it('shows a list of dismissed alerts', () => {
    const alerts = queryAllNestedDirectives(spectator.debugElement, '.dismissed-alerts', AlertComponent);

    expect(alerts.length).toEqual(2);
    expect(alerts[0].alert).toEqual(dismissedAlerts[0]);
    expect(alerts[1].alert).toEqual(dismissedAlerts[1]);
  });

  it('dismisses all alerts when Dismiss All Alerts is pressed', () => {
    spectator.click(spectator.query(byText('Dismiss All Alerts')));

    expect(websocket.call).toHaveBeenCalledWith('alert.dismiss', ['1']);
    expect(websocket.call).toHaveBeenCalledWith('alert.dismiss', ['2']);

    expect(spectator.query(byText('Dismiss All Alerts'))).not.toExist();

    const dismissedAlerts = queryAllNestedDirectives(spectator.debugElement, '.dismissed-alerts', AlertComponent);
    expect(dismissedAlerts.length).toEqual(4);
    expect(spectator.query('.unread-alerts')).not.toExist();
  });

  it('reopens all alerts when Reopen All Alerts is pressed', () => {
    spectator.click(spectator.query(byText('Re-Open All Alerts')));

    expect(websocket.call).toHaveBeenCalledWith('alert.restore', ['3']);
    expect(websocket.call).toHaveBeenCalledWith('alert.restore', ['4']);

    expect(spectator.query(byText('Re-Open All Alerts'))).not.toExist();

    const unreadAlerts = queryAllNestedDirectives(spectator.debugElement, '.unread-alerts', AlertComponent);
    expect(unreadAlerts.length).toEqual(4);
    expect(spectator.query('.dismissed-alerts')).not.toExist();
  });

  it('removes an alert when ?', () => {

  });

  it('closes panel when X is pressed', () => {

  });
});
