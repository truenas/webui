import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness, TnMenuHarness, TnSelectHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AlertClassName } from 'app/enums/alert-class-name.enum';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { AlertPolicy } from 'app/enums/alert-policy.enum';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { AlertConfigFormComponent } from 'app/pages/system/alert-config-form/alert-config-form.component';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

describe('AlertConfigFormComponent', () => {
  let spectator: Spectator<AlertConfigFormComponent>;
  let loader: HarnessLoader;
  let rootLoader: HarnessLoader;
  let api: ApiService;
  const createComponent = createComponentFactory({
    component: AlertConfigFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('alert.list_categories', [
          {
            id: 'APPLICATIONS',
            title: 'Applications',
            classes: [
              {
                id: AlertClassName.AppUpdate,
                title: 'app_title_1',
                level: AlertLevel.Info,
              },
              {
                id: AlertClassName.ApplicationsConfigurationFailed,
                title: 'app_title_1',
                level: AlertLevel.Warning,
              },
            ],
          },
          {
            id: 'CERTIFICATES',
            title: 'Certificates',
            classes: [
              {
                id: AlertClassName.CertificateExpired,
                title: 'cert_title_1',
                level: AlertLevel.Critical,
              },
              {
                id: AlertClassName.CertificateIsExpiring,
                title: 'cert_title_2',
                level: AlertLevel.Notice,
              },
            ],
          },
          {
            id: 'SYSTEM',
            title: 'System',
            classes: [
              {
                id: AlertClassName.BootPoolStatus,
                title: 'Boot Pool Status',
                level: AlertLevel.Critical,
              },
              {
                id: AlertClassName.FailoverReboot,
                title: 'Failover Event Caused System Reboot',
                level: AlertLevel.Critical,
              },
              {
                id: AlertClassName.FencedReboot,
                title: 'Fenced Event Caused System Reboot',
                level: AlertLevel.Critical,
              },
            ],
          },
          {
            id: 'HA',
            title: 'High-Availability',
            classes: [
              {
                id: AlertClassName.FailoverFailed,
                title: 'Failover Failed',
                level: AlertLevel.Critical,
              },
            ],
          },
        ]),
        mockCall('alertclasses.config', {
          id: 1,
          classes: {
            [AlertClassName.AppUpdate]: {
              level: AlertLevel.Error,
              policy: AlertPolicy.Never,
            },
            [AlertClassName.CertificateIsExpiring]: {
              level: AlertLevel.Error,
            },
          },
        }),
        mockCall('alert.list_policies', [
          AlertPolicy.Immediately,
          AlertPolicy.Never,
          AlertPolicy.Daily,
          AlertPolicy.Hourly,
        ]),
        mockCall('alertclasses.update'),
      ]),
      mockProvider(LoaderService),
      mockProvider(DialogService),
      mockProvider(FormErrorHandlerService),
      provideMockStore({
        selectors: [
          { selector: selectIsHaLicensed, value: false },
        ],
      }),
      mockAuth(),
    ],
  });

  function setup(isHaLicensed = false): void {
    spectator = createComponent({ detectChanges: false });
    const store$ = spectator.inject(MockStore);
    store$.overrideSelector(selectIsHaLicensed, isHaLicensed);
    spectator.detectChanges();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    rootLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);
    api = spectator.inject(ApiService);
  }

  beforeEach(() => {
    setup();
  });

  it('loads current config and shows values in the form', async () => {
    expect(api.call).toHaveBeenCalledWith('alert.list_categories');
    expect(api.call).toHaveBeenCalledWith('alertclasses.config');

    // First category (Applications) is selected by default; its two classes render level/policy selects.
    const [appUpdateLevel, appUpdatePolicy, appFailedLevel, appFailedPolicy] = await loader
      .getAllHarnesses(TnSelectHarness);
    expect(await appUpdateLevel.getDisplayText()).toBe(AlertLevel.Error);
    expect(await appUpdatePolicy.getDisplayText()).toBe(AlertPolicy.Never);
    expect(await appFailedLevel.getDisplayText()).toBe(AlertLevel.Warning);
    expect(await appFailedPolicy.getDisplayText()).toBe(AlertPolicy.Immediately);
  });

  it('saves updated config', async () => {
    const [appUpdateLevel, appUpdatePolicy, appFailedLevel] = await loader.getAllHarnesses(TnSelectHarness);
    await appUpdateLevel.selectOption(AlertLevel.Info);
    await appUpdatePolicy.selectOption(AlertPolicy.Immediately);
    await appFailedLevel.selectOption(AlertLevel.Notice);

    // Switch to the Certificates category to edit its classes within the same form.
    const categoriesTrigger = await loader.getHarness(TnButtonHarness.with({ label: 'Applications' }));
    await categoriesTrigger.click();
    const categoriesMenu = await rootLoader.getHarness(TnMenuHarness);
    await categoriesMenu.clickItem({ label: 'Certificates' });

    const [, certExpiredPolicy, , certExpiringPolicy] = await loader.getAllHarnesses(TnSelectHarness);
    await certExpiredPolicy.selectOption(AlertPolicy.Never);
    await certExpiringPolicy.selectOption(AlertPolicy.Hourly);

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('alertclasses.update', [{
      classes: {
        [AlertClassName.ApplicationsConfigurationFailed]: { level: AlertLevel.Notice },
        [AlertClassName.CertificateExpired]: { policy: AlertPolicy.Never },
        [AlertClassName.CertificateIsExpiring]: { level: AlertLevel.Error, policy: AlertPolicy.Hourly },
      },
    }]);
  });

  it('disables Save button while form is loading', async () => {
    spectator.component.isFormLoading.set(true);
    spectator.detectChanges();

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    expect(await saveButton.isDisabled()).toBe(true);
  });

  async function openCategory(category: string): Promise<void> {
    const trigger = await loader.getHarness(TnButtonHarness.with({ label: 'Applications' }));
    await trigger.click();
    const menu = await rootLoader.getHarness(TnMenuHarness);
    await menu.clickItem({ label: category });
  }

  function getClassLabels(): (string | undefined)[] {
    return spectator.queryAll('.class-label').map((el) => el.textContent?.trim());
  }

  describe('non-HA system', () => {
    beforeEach(() => setup(false));

    it('hides the High-Availability category', async () => {
      const trigger = await loader.getHarness(TnButtonHarness.with({ label: 'Applications' }));
      await trigger.click();
      const menu = await rootLoader.getHarness(TnMenuHarness);
      expect(await menu.getItemLabels()).not.toContain('High-Availability');
    });

    it('hides the HA reboot alert classes from the System category', async () => {
      await openCategory('System');
      expect(getClassLabels()).toEqual(['Boot Pool Status']);
    });
  });

  describe('HA system', () => {
    beforeEach(() => setup(true));

    it('shows the High-Availability category with the moved reboot classes', async () => {
      await openCategory('High-Availability');
      expect(getClassLabels()).toEqual([
        'Failover Failed',
        'Failover Event Caused System Reboot',
        'Fenced Event Caused System Reboot',
      ]);
    });

    it('removes the reboot classes from the System category', async () => {
      await openCategory('System');
      expect(getClassLabels()).toEqual(['Boot Pool Status']);
    });
  });

  describe('HA system without an HA category in the response', () => {
    beforeEach(() => {
      spectator = createComponent({ detectChanges: false });
      const store$ = spectator.inject(MockStore);
      store$.overrideSelector(selectIsHaLicensed, true);
      api = spectator.inject(ApiService);
      (api.call as jest.Mock).mockImplementation((method: string) => {
        if (method === 'alert.list_categories') {
          return of([
            {
              id: 'SYSTEM',
              title: 'System',
              classes: [
                { id: AlertClassName.BootPoolStatus, title: 'Boot Pool Status', level: AlertLevel.Critical },
                { id: AlertClassName.FailoverReboot, title: 'Failover Event Caused System Reboot', level: AlertLevel.Critical },
              ],
            },
          ]);
        }
        if (method === 'alertclasses.config') {
          return of({ id: 1, classes: {} });
        }
        if (method === 'alert.list_policies') {
          return of([AlertPolicy.Immediately]);
        }
        return of(undefined);
      });
      spectator.detectChanges();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      rootLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);
    });

    it('keeps the reboot classes in their original category instead of dropping them', () => {
      // System is the only category, so it is selected by default.
      expect(getClassLabels()).toEqual(['Boot Pool Status', 'Failover Event Caused System Reboot']);
    });
  });
});
