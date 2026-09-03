import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TnCheckboxHarness, TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { EntitlementReason } from 'app/enums/entitlement-reason.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ixFormMinSubmitFeedbackMs } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { selectEntitlements } from 'app/store/entitlements/entitlements.selectors';
import { DiskFormComponent } from './disk-form.component';

describe('DiskFormComponent', () => {
  let spectator: Spectator<DiskFormComponent>;
  let loader: HarnessLoader;
  let store$: MockStore;

  const dataDisk = {
    name: 'sdc',
    serial: 'VB9fbb6dfe-9cf26570',
    advpowermgmt: DiskPowerLevel.Level127,
    description: 'Some disk description',
    hddstandby: DiskStandby.Minutes10,
    passwd: '',
    devname: 'sdc',
    identifier: '{serial}VB9fbb6dfe-9cf26570',
  } as Disk;

  const createComponent = createComponentFactory({
    component: DiskFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      ...ixFormTestingProviders(),
      // The side-panel host otherwise holds a successful submit for the
      // minimum-feedback window before emitting `closed`.
      { provide: ixFormMinSubmitFeedbackMs, useValue: 0 },
      mockProvider(DialogService),
      mockApi([
        mockCall('disk.update', dataDisk),
      ]),
      mockAuth(),
      provideMockStore({
        selectors: [{
          selector: selectEntitlements,
          value: {
            [EntitlementFeature.Sed]: {
              entitled: false,
              reason: EntitlementReason.NoLicense,
              message: 'This system is not licensed to use the SED feature.',
            },
          },
        }],
      }),
    ],
  });

  function getInput(controlName: string): Promise<TnInputHarness> {
    return loader.getHarness(TnInputHarness.with({ selector: `[formControlName="${controlName}"]` }));
  }

  function getSelect(controlName: string): Promise<TnSelectHarness> {
    return loader.getHarness(TnSelectHarness.with({ selector: `[formControlName="${controlName}"]` }));
  }

  beforeEach(() => {
    spectator = createComponent({ props: { diskToEdit: dataDisk } });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    store$ = spectator.inject(MockStore);
  });

  describe('community edition', () => {
    beforeEach(() => {
      store$.overrideSelector(selectEntitlements, {
        [EntitlementFeature.Sed]: {
          entitled: false,
          reason: EntitlementReason.NoLicense,
          message: 'This system is not licensed to use the SED feature.',
        },
      });
      store$.refreshState();
      store$.refreshState();
    });

    it('does not show SED section', async () => {
      expect(await loader.getHarnessOrNull(
        TnInputHarness.with({ selector: '[formControlName="passwd"]' }),
      )).toBeNull();
      expect(await loader.getHarnessOrNull(
        TnCheckboxHarness.with({ label: 'Clear SED Password' }),
      )).toBeNull();
    });

    it('keeps the legacy label-derived option test ids for advanced power management', async () => {
      await (await getSelect('advpowermgmt')).open();

      expect(document.querySelector(
        '[data-test="option-advpowermgmt-level-127-maximum-power-usage-with-standby"]',
      )).toBeTruthy();
    });

    it('sets disk settings when form is opened', async () => {
      expect(await (await getInput('name')).getValue()).toBe('sdc');
      expect(await (await getInput('serial')).getValue()).toBe('VB9fbb6dfe-9cf26570');
      expect(await (await getInput('description')).getValue()).toBe('Some disk description');
      expect(await (await getSelect('hddstandby')).getDisplayText()).toBe('10');
      expect(await (await getSelect('advpowermgmt')).getDisplayText())
        .toBe('Level 127 - Maximum power usage with Standby');
    });

    it('saves disk settings when form is saved', async () => {
      await (await getInput('description')).setValue('New disk description');
      await (await getSelect('advpowermgmt')).selectOption('Level 64 - Intermediate power usage with Standby');

      spectator.component.submit();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('disk.update', ['{serial}VB9fbb6dfe-9cf26570', {
        advpowermgmt: '64',
        description: 'New disk description',
        hddstandby: '10',
      }]);
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });

    it('emits the disk update through closed so the opener can reconcile its rows', () => {
      const closed = jest.fn();
      spectator.component.closed.subscribe(closed);

      spectator.component.submit();

      expect(closed).toHaveBeenCalledWith([{
        identifier: '{serial}VB9fbb6dfe-9cf26570',
        advpowermgmt: '127',
        description: 'Some disk description',
        hddstandby: '10',
      }]);
    });
  });

  describe('disk without power management values', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: { diskToEdit: { ...dataDisk, hddstandby: null, advpowermgmt: null } as unknown as Disk },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('does not require them, so an edit to another field can still be saved', async () => {
      await (await getInput('description')).setValue('New disk description');

      // Requiring a value the disk never had would leave the panel Save permanently disabled.
      expect(spectator.component.canSubmit()).toBe(true);

      spectator.component.submit();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('disk.update', ['{serial}VB9fbb6dfe-9cf26570', {
        advpowermgmt: null,
        description: 'New disk description',
        hddstandby: null,
      }]);
    });
  });

  describe('enterprise', () => {
    beforeEach(() => {
      store$.overrideSelector(selectEntitlements, {});
      store$.refreshState();
      store$.refreshState();

      // recreate the component after overriding to enterprise view
      // to ensure that `ngOnInit` picks up those changes.
      spectator = createComponent({ props: { diskToEdit: dataDisk } });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('disables and clears \'SED Password\' when \'Clear SED Password\' is checked', async () => {
      const sedPassword = await getInput('passwd');
      await sedPassword.setValue('sedPassword');

      // make sure the password is there
      expect(await sedPassword.getValue()).toBe('sedPassword');

      // clear it
      const clearPassword = await loader.getHarness(TnCheckboxHarness.with({ label: 'Clear SED Password' }));
      await clearPassword.check();

      // make sure it *isn't* there anymore
      expect(await sedPassword.isDisabled()).toBe(true);
      expect(await sedPassword.getValue()).toBe('');
    });

    it('lets the user reveal the SED password they typed', async () => {
      const sedPassword = await getInput('passwd');
      await sedPassword.setValue('sedPassword');

      expect(await sedPassword.hasPasswordToggle()).toBe(true);
      expect(await sedPassword.isPasswordRevealed()).toBe(false);

      await sedPassword.togglePasswordVisibility();

      expect(await sedPassword.isPasswordRevealed()).toBe(true);
    });

    it('sets disk settings when form is opened', async () => {
      expect(await (await getInput('name')).getValue()).toBe('sdc');
      expect(await (await getInput('passwd')).getValue()).toBe('');

      const clearPassword = await loader.getHarness(TnCheckboxHarness.with({ label: 'Clear SED Password' }));
      expect(await clearPassword.isChecked()).toBe(false);
    });

    it('saves disk settings when form is saved', async () => {
      await (await getInput('description')).setValue('New disk description');
      await (await getSelect('advpowermgmt')).selectOption('Level 64 - Intermediate power usage with Standby');
      await (await getInput('passwd')).setValue('123456');

      spectator.component.submit();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('disk.update', ['{serial}VB9fbb6dfe-9cf26570', {
        advpowermgmt: '64',
        description: 'New disk description',
        hddstandby: '10',
        passwd: '123456',
      }]);
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });

    it('sends an empty password when \'Clear SED Password\' is checked', async () => {
      await (await getInput('passwd')).setValue('123456');

      const clearPassword = await loader.getHarness(TnCheckboxHarness.with({ label: 'Clear SED Password' }));
      await clearPassword.check();

      spectator.component.submit();

      // `clear_pw` is a UI-only control: it must reach the API as an empty `passwd`
      // (and never as a field of its own).
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('disk.update', ['{serial}VB9fbb6dfe-9cf26570', {
        advpowermgmt: '127',
        description: 'Some disk description',
        hddstandby: '10',
        passwd: '',
      }]);
    });
  });
});
