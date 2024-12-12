import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { EffectsModule } from '@ngrx/effects';
import { Store, StoreModule } from '@ngrx/store';
import { MockComponent } from 'ng-mocks';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NavigateAndInteractDirective } from 'app/directives/navigate-and-interact/navigate-and-interact.directive';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { CollectionChangeType } from 'app/enums/api.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { AlertComponent } from 'app/modules/alerts/components/alert/alert.component';
import { AlertsPanelComponent } from 'app/modules/alerts/components/alerts-panel/alerts-panel.component';
import { AlertsPanelPageObject } from 'app/modules/alerts/components/alerts-panel/alerts-panel.page-object';
import { AlertEffects } from 'app/modules/alerts/store/alert.effects';
import { adapter, alertReducer, alertsInitialState } from 'app/modules/alerts/store/alert.reducer';
import { alertStateKey } from 'app/modules/alerts/store/alert.selectors';
import { SystemGeneralService } from 'app/services/system-general.service';
import { ApiService } from 'app/services/websocket/api.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { haInfoReducer } from 'app/store/ha-info/ha-info.reducer';
import { haInfoStateKey } from 'app/store/ha-info/ha-info.selectors';
import { alertIndicatorPressed } from 'app/store/topbar/topbar.actions';

const unreadAlerts = [
  {
    id: '1',
    dismissed: false,
    formatted: 'Unread 1',
    datetime: { $date: 1641811015 },
    level: AlertLevel.Critical,
  },
  {
    id: '2',
    dismissed: false,
    formatted: 'Unread 2',
    datetime: { $date: 1641810015 },
    level: AlertLevel.Alert,
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
  let api: ApiService;
  let alertPanel: AlertsPanelPageObject;

  const createComponent = createComponentFactory({
    component: AlertsPanelComponent,
    imports: [
      StoreModule.forRoot({ [alertStateKey]: alertReducer, [haInfoStateKey]: haInfoReducer }, {
        initialState: {
          [alertStateKey]: adapter.setAll([...unreadAlerts, ...dismissedAlerts], alertsInitialState),
          [haInfoStateKey]: {
            haStatus: {
              hasHa: true,
              reasons: [],
            },
            isHaLicensed: true,
          },
        },
      }),
      EffectsModule.forRoot([AlertEffects]),
      NavigateAndInteractDirective,
    ],
    declarations: [
      MockComponent(AlertComponent),
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('alert.list', [...unreadAlerts, ...dismissedAlerts]),
        mockCall('alert.dismiss'),
        mockCall('alert.restore'),
      ]),
      mockProvider(SystemGeneralService, {
        get isEnterprise(): boolean {
          return true;
        },
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();

    api = spectator.inject(ApiService);
    alertPanel = new AlertsPanelPageObject(spectator);
  });

  it('loads alerts when adminUiInitialized is dispatched', () => {
    spectator.inject(Store).dispatch(adminUiInitialized());

    expect(api.call).toHaveBeenCalledWith('alert.list');
  });

  it('selects HA status from store and passes it to the ix-alert', () => {
    expect(alertPanel.unreadAlertComponents[0].isHaLicensed).toBe(true);
    expect(alertPanel.dismissedAlertComponents[0].isHaLicensed).toBe(true);
  });

  it('shows a list of unread alerts', () => {
    const unreadAlertComponents = alertPanel.unreadAlertComponents;

    expect(unreadAlertComponents).toHaveLength(2);
    expect(unreadAlertComponents[0].alert).toEqual(unreadAlerts[1]);
    expect(unreadAlertComponents[1].alert).toEqual(unreadAlerts[0]);
  });

  it('shows a list of dismissed alerts', () => {
    const dismissedAlertComponents = alertPanel.dismissedAlertComponents;

    expect(dismissedAlertComponents).toHaveLength(2);
    expect(dismissedAlertComponents[0].alert).toEqual(dismissedAlerts[1]);
    expect(dismissedAlertComponents[1].alert).toEqual(dismissedAlerts[0]);
  });

  it('dismisses all alerts when Dismiss All Alerts is pressed', () => {
    spectator.click(alertPanel.dismissAllButton);

    expect(api.call).toHaveBeenCalledWith('alert.dismiss', ['1']);
    expect(api.call).toHaveBeenCalledWith('alert.dismiss', ['2']);

    expect(alertPanel.dismissAllButton).not.toExist();

    expect(alertPanel.dismissedAlertComponents).toHaveLength(4);
    expect(alertPanel.unreadAlertsSection).not.toExist();
  });

  it('reopens all alerts when Reopen All Alerts is pressed', () => {
    spectator.click(alertPanel.reopenAllButton);

    expect(api.call).toHaveBeenCalledWith('alert.restore', ['3']);
    expect(api.call).toHaveBeenCalledWith('alert.restore', ['4']);

    expect(alertPanel.reopenAllButton).not.toExist();

    expect(alertPanel.unreadAlertComponents).toHaveLength(4);
    expect(alertPanel.dismissedAlertsSection).not.toExist();
  });

  it('adds an alert when websocket alert.list subscription sends an "add" event', () => {
    spectator.inject(Store).dispatch(adminUiInitialized());

    const websocketMock = spectator.inject(MockApiService);
    websocketMock.emitSubscribeEvent({
      msg: CollectionChangeType.Added,
      collection: 'alert.list',
      fields: {
        id: 'new',
        dismissed: false,
        formatted: 'New Alert',
        datetime: { $date: 1641819015 },
      } as Alert,
    });
    spectator.detectChanges();

    expect(alertPanel.unreadAlertComponents).toHaveLength(3);
  });

  it('updates an alert when websocket alert.list subscription sends a "change" event', () => {
    spectator.inject(Store).dispatch(adminUiInitialized());

    const websocketMock = spectator.inject(MockApiService);
    websocketMock.emitSubscribeEvent({
      msg: CollectionChangeType.Changed,
      collection: 'alert.list',
      fields: {
        id: '1',
        dismissed: true,
        formatted: 'Unread 1',
        datetime: { $date: 1641811015 },
      } as Alert,
    });
    spectator.detectChanges();

    expect(alertPanel.unreadAlertComponents).toHaveLength(1);
    expect(alertPanel.dismissedAlertComponents).toHaveLength(3);
  });

  it('calls alert.list when alerts panel is open', () => {
    spectator.inject(Store).dispatch(alertIndicatorPressed());
    expect(api.call).toHaveBeenCalledWith('alert.list');
  });
});
