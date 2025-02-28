import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import {
  byText, createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';
import { DiskFormComponent } from './disk-form.component';

describe('DiskFormComponent', () => {
  let spectator: Spectator<DiskFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let store$: MockStore;

  const dataDisk = {
    name: 'sdc',
    serial: 'VB9fbb6dfe-9cf26570',
    advpowermgmt: DiskPowerLevel.Level127,
    critical: 5,
    description: 'Some disk description',
    difference: 5,
    informational: 5,
    hddstandby: DiskStandby.Minutes10,
    passwd: '',
    togglesmart: false,
    devname: 'sdc',
    identifier: '{serial}VB9fbb6dfe-9cf26570',
  } as Disk;

  const slideInRef: SlideInRef<Disk | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => dataDisk),
  };

  const createComponent = createComponentFactory({
    component: DiskFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(SlideInRef, slideInRef),
      mockProvider(DialogService),
      mockProvider(SnackbarService),
      mockApi([
        mockCall('disk.update', dataDisk),
      ]),
      mockAuth(),
      provideMockStore({
        selectors: [{
          selector: selectIsEnterprise,
          value: false,
        }],
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
    store$ = spectator.inject(MockStore);
  });

  describe('community edition', () => {
    beforeEach(() => {
      store$.overrideSelector(selectIsEnterprise, false);
      store$.refreshState();
    });

    it('does not show SED section', () => {
      expect(spectator.query(byText('SED Password'))).toBeNull();
      expect(spectator.query(byText('Clear SED Password'))).toBeNull();
    });

    it('sets disk settings when form is opened', async () => {
      const formValue = await form.getValues();
      expect(formValue).toEqual({
        'Advanced Power Management': 'Level 127 - Maximum power usage with Standby',
        Critical: '5',
        Description: 'Some disk description',
        Difference: '5',
        'Enable S.M.A.R.T.': false,
        'HDD Standby': '10',
        Informational: '5',
        Name: 'sdc',
        Serial: 'VB9fbb6dfe-9cf26570',
      });
    });

    it('saves disk settings when form is saved', async () => {
      await form.fillForm({
        'Advanced Power Management': 'Level 64 - Intermediate power usage with Standby',
        Critical: '',
        Description: 'New disk description',
        Difference: '',
        Informational: '10',
        'HDD Standby': '10',
        'Enable S.M.A.R.T.': true,
      });
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('disk.update', ['{serial}VB9fbb6dfe-9cf26570', {
        advpowermgmt: '64',
        critical: null,
        description: 'New disk description',
        difference: null,
        informational: 10,
        hddstandby: '10',
        togglesmart: true,
      }]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({ response: true, error: null });
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });
  });

  describe('enterprise', () => {
    beforeEach(() => {
      store$.overrideSelector(selectIsEnterprise, true);
      store$.refreshState();
    });

    it('disables \'SED Password\' when \'Clear SED Password\' is checked', async () => {
      const clearPassword = await loader.getHarness(IxCheckboxHarness.with({ label: 'Clear SED Password' }));
      const sedPassword = await loader.getHarness(IxInputHarness.with({ label: 'SED Password' }));
      await clearPassword.setValue(true);

      expect(sedPassword.isDisabled()).toBeTruthy();
    });

    it('sets disk settings when form is opened', async () => {
      const formValue = await form.getValues();
      expect(formValue).toEqual({
        'Advanced Power Management': 'Level 127 - Maximum power usage with Standby',
        Critical: '5',
        'Clear SED Password': false,
        Description: 'Some disk description',
        Difference: '5',
        'Enable S.M.A.R.T.': false,
        'HDD Standby': '10',
        Informational: '5',
        Name: 'sdc',
        'SED Password': '',
        Serial: 'VB9fbb6dfe-9cf26570',
      });
    });

    it('saves disk settings when form is saved', async () => {
      await form.fillForm({
        'Advanced Power Management': 'Level 64 - Intermediate power usage with Standby',
        Critical: '',
        Description: 'New disk description',
        Difference: '',
        Informational: '10',
        'HDD Standby': '10',
        'Enable S.M.A.R.T.': true,
        'SED Password': '123456',
      });
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('disk.update', ['{serial}VB9fbb6dfe-9cf26570', {
        advpowermgmt: '64',
        critical: null,
        description: 'New disk description',
        difference: null,
        informational: 10,
        hddstandby: '10',
        togglesmart: true,
        passwd: '123456',
      }]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({ response: true, error: null });
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });
  });
});
