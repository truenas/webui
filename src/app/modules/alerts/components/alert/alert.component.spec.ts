import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { byText, createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { EffectsModule } from '@ngrx/effects';
import { Store, StoreModule } from '@ngrx/store';
import { TnIconButtonHarness } from '@truenas/ui-components';
import { ngMocks } from 'ng-mocks';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AlertClassName } from 'app/enums/alert-class-name.enum';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { AlertWithDuplicates } from 'app/interfaces/smart-alert.interface';
import { AlertComponent } from 'app/modules/alerts/components/alert/alert.component';
import { AlertPageObject } from 'app/modules/alerts/components/alert/alert.page-object';
import { AlertEffects } from 'app/modules/alerts/store/alert.effects';
import { adapter, alertReducer, alertsInitialState } from 'app/modules/alerts/store/alert.reducer';
import { alertStateKey } from 'app/modules/alerts/store/alert.selectors';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { systemConfigReducer, SystemConfigState } from 'app/store/system-config/system-config.reducer';
import { systemConfigStateKey } from 'app/store/system-config/system-config.selectors';

const dummyAlert = {
  id: '79',
  key: 'cpu-alert',
  datetime: {
    $date: 1641811015,
  },
  node: 'Active Controller (A)',
  level: AlertLevel.Critical,
  formatted: 'CPU is on fire',
  klass: AlertClassName.ApiKeyRevoked,
  dismissed: false,
  duplicateCount: 1,
  allIds: ['79'],
} as unknown as AlertWithDuplicates;

describe('AlertComponent', () => {
  let spectator: Spectator<AlertComponent>;
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
      mockApi([
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

  it('shows an alert icon', () => {
    const iconName = alert.getIconName();
    expect(iconName).toBe('mdi-alert-circle');
  });

  it('shows alert datetime (formatted according to system settings) and system timezone', () => {
    expect(alert.dateTimeElement!.textContent!.replace(/\s{2,}/g, ' ').trim()).toBe('1970-01-20 03:03:31 (America/Alaska)');

    const formatPipe = ngMocks.findInstance(FormatDateTimePipe);
    expect(formatPipe.transform).toHaveBeenCalledWith(1641811015);
  });

  it('dismisses an open alert when Dismiss link is pressed', () => {
    const store$ = spectator.inject(Store);
    const dispatchSpy = jest.spyOn(store$, 'dispatch');

    alert.clickDismissLink();

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: '[Alert Panel] Dismiss Pressed',
        ids: ['79'],
      }),
    );
  });

  it('dismisses an open alert when the dismiss icon button is pressed', async () => {
    const store$ = spectator.inject(Store);
    const dispatchSpy = jest.spyOn(store$, 'dispatch');

    const dismissButton = await TestbedHarnessEnvironment.loader(spectator.fixture)
      .getHarness(TnIconButtonHarness.with({ name: 'mdi-close' }));
    await dismissButton.click();

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: '[Alert Panel] Dismiss Pressed',
        ids: ['79'],
      }),
    );
  });

  it('shows smart action button for enhanced alerts', () => {
    const actionButton = spectator.query(byText('Go to API keys'))!;
    expect(actionButton).toExist();
  });

  it('reopens a dismissed alert when Re-open link is pressed', () => {
    spectator.setInput('alert', { ...dummyAlert, dismissed: true });

    const store$ = spectator.inject(Store);
    const dispatchSpy = jest.spyOn(store$, 'dispatch');

    alert.clickReopenLink();

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: '[Alert Panel] Reopen Pressed',
        ids: ['79'],
      }),
    );
  });

  it('shows only the first sentence of a long message, expanding in place on View More', () => {
    const longMessage = 'Pool is degraded and needs attention right away. '
      + 'Replace the failed disk and run a scrub afterwards.';
    spectator.setInput('alert', { ...dummyAlert, formatted: longMessage });

    expect(alert.messageElement).toHaveExactText('Pool is degraded and needs attention right away.');

    const expandButton = spectator.query(byText('View More'))!;
    expect(expandButton).toExist();

    spectator.click(expandButton);

    // A single alert expands in place, rather than repeating its opening sentence below.
    expect(alert.messageElement).toHaveExactText(longMessage);
    expect(spectator.query('.alert-detail')).not.toExist();
    expect(spectator.query(byText('Collapse'))).toExist();
  });

  it('does not offer View More when the message is already short', () => {
    expect(spectator.query(byText('View More'))).not.toExist();
  });

  it('shows a group summary and every message when several alerts are consolidated', () => {
    spectator.setInput('alert', {
      ...dummyAlert,
      duplicateCount: 2,
      allIds: ['79', '80'],
      groupedMessages: ['API key "one" was revoked', 'API key "two" was revoked'],
    } as AlertWithDuplicates);

    expect(alert.messageElement).toHaveExactText('2 API keys have been revoked');

    spectator.click(spectator.query(byText('View More'))!);

    const details = spectator.queryAll('.alert-detail').map((element) => element.textContent?.trim());
    expect(details).toEqual(['API key "one" was revoked', 'API key "two" was revoked']);
  });

  it('drops object-scoped actions on a consolidated alert', () => {
    const cloudBackup = {
      ...dummyAlert,
      klass: AlertClassName.CloudBackupTaskFailed,
      formatted: 'Cloud Backup Task "Nightly" failed.',
      args: [{ id: 7, name: 'Nightly' }],
    } as unknown as AlertWithDuplicates;

    spectator.setInput('alert', cloudBackup);
    expect(spectator.query(byText('Rerun Cloud Backup'))).toExist();

    spectator.setInput('alert', {
      ...cloudBackup,
      duplicateCount: 2,
      allIds: ['79', '80'],
    } as AlertWithDuplicates);

    // Rerunning would only cover the newest task in the group.
    expect(spectator.query(byText('Rerun Cloud Backup'))).not.toExist();
    expect(spectator.query(byText('View Cloud Backup'))).toExist();
  });

  it('dismisses every consolidated alert at once', () => {
    spectator.setInput('alert', {
      ...dummyAlert,
      duplicateCount: 2,
      allIds: ['79', '80'],
    } as AlertWithDuplicates);

    const store$ = spectator.inject(Store);
    const dispatchSpy = jest.spyOn(store$, 'dispatch');

    spectator.click(spectator.query(byText('Dismiss All (2)'))!);

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: '[Alert Panel] Dismiss Pressed',
        ids: ['79', '80'],
      }),
    );
  });
});
