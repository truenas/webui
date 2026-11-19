import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatTooltip } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { byText, createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { EffectsModule } from '@ngrx/effects';
import { Store, StoreModule } from '@ngrx/store';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AlertClassName } from 'app/enums/alert-class-name.enum';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { Alert } from 'app/interfaces/alert.interface';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { AlertComponent } from 'app/modules/alerts/components/alert/alert.component';
import { AlertPageObject } from 'app/modules/alerts/components/alert/alert.page-object';
import { AlertEffects } from 'app/modules/alerts/store/alert.effects';
import { adapter, alertReducer, alertsInitialState } from 'app/modules/alerts/store/alert.reducer';
import { alertStateKey } from 'app/modules/alerts/store/alert.selectors';
import { systemConfigLoaded } from 'app/store/system-config/system-config.actions';
import { systemConfigReducer, SystemConfigState } from 'app/store/system-config/system-config.reducer';
import { systemConfigStateKey } from 'app/store/system-config/system-config.selectors';

const dummyAlert = {
  id: '79',
  key: 'cpu-alert',
  datetime: {
    // 17 Nov 2026 10:00:02 in Los Angeles; Jest runs in Europe/Kiev, where it is 20:00:02.
    $date: Date.UTC(2026, 10, 17, 18, 0, 2),
  },
  node: 'Active Controller (A)',
  level: AlertLevel.Critical,
  formatted: 'CPU is on fire',
  klass: AlertClassName.ApiKeyRevoked,
  dismissed: false,
  allIds: ['79'],
} as Alert & { allIds: string[] };

describe('AlertComponent', () => {
  let spectator: Spectator<AlertComponent>;
  let alert: AlertPageObject;
  let loader: HarnessLoader;

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
              timezone: 'America/Los_Angeles',
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
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
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

  it('shows the alert time on the NAS clock, next to the NAS time zone', () => {
    expect(alert.dateTimeElement!.textContent!.replace(/\s{2,}/g, ' ').trim())
      .toBe('2026-11-17 10:00:02 (America/Los_Angeles)');
  });

  it('offers the browser clock in a tooltip when the browser is in another time zone', () => {
    const timeTooltip = spectator.query(MatTooltip, { parentSelector: '.alert-time' })!;

    expect(timeTooltip.message).toBe('Browser time: 2026-11-17 20:00:02');
    expect(timeTooltip.disabled).toBe(false);
    expect(spectator.query('.alert-time .has-time-difference')).toExist();
  });

  it('drops the browser-time tooltip when the browser and the NAS share a time zone', () => {
    spectator.inject(Store).dispatch(systemConfigLoaded({
      generalConfig: { timezone: 'Europe/Kiev' } as SystemGeneralConfig,
      advancedConfig: {} as AdvancedConfig,
    }));
    spectator.detectChanges();

    expect(spectator.query(MatTooltip, { parentSelector: '.alert-time' })!.disabled).toBe(true);
    expect(spectator.query('.alert-time .has-time-difference')).not.toExist();
    expect(alert.dateTimeElement!.textContent!.replace(/\s{2,}/g, ' ').trim())
      .toBe('2026-11-17 20:00:02 (Europe/Kiev)');
  });

  it('falls back to the browser clock with no time-zone label while the NAS time zone is unknown', () => {
    spectator.inject(Store).dispatch(systemConfigLoaded({
      generalConfig: {} as SystemGeneralConfig,
      advancedConfig: {} as AdvancedConfig,
    }));
    spectator.detectChanges();

    expect(alert.dateTimeElement!.textContent!.trim()).toBe('2026-11-17 20:00:02');
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

  it('shows smart action button for enhanced alerts', () => {
    const actionButton = spectator.query(byText('Go to API keys'))!;
    expect(actionButton).toExist();
  });

  it('reopens a dismissed alert when Re-open link is pressed', () => {
    const dismissedAlert = {
      ...dummyAlert,
      dismissed: true,
    } as Alert;

    spectator.setInput('alert', dismissedAlert);

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

  it('shows expand/collapse button when alert message is too long', async () => {
    const longMessage = 'This is a very long alert message '.repeat(10);
    spectator.setInput('alert', { ...dummyAlert, formatted: longMessage } as Alert);

    const alertMessageElement = spectator.debugElement.query(By.css('.alert-message')).nativeElement as HTMLElement;
    jest.spyOn(alertMessageElement, 'scrollHeight', 'get').mockReturnValue(300);
    jest.spyOn(alertMessageElement, 'offsetHeight', 'get').mockReturnValue(100);

    spectator.component.ngAfterViewInit();

    // Wait for setTimeout to complete
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    spectator.detectChanges();

    const expandButton = await loader.getHarness(MatButtonHarness.with({ text: 'View More' }));
    expect(expandButton).toExist();

    await expandButton.click();

    const collapseButton = await loader.getHarness(MatButtonHarness.with({ text: 'Collapse' }));
    expect(collapseButton).toExist();
  });
});
