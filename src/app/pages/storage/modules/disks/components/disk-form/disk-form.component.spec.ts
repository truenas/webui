import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { WebSocketService } from 'app/services/ws.service';
import { DiskFormComponent } from './disk-form.component';

describe('DiskFormComponent', () => {
  let spectator: Spectator<DiskFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const dataDisk = {
    name: 'sdc',
    serial: 'VB9fbb6dfe-9cf26570',
    advpowermgmt: DiskPowerLevel.Level127,
    critical: 5,
    description: 'Some disk description',
    difference: 5,
    informational: 5,
    hddstandby: DiskStandby.Minutes10,
    passwd: '123',
    smartoptions: 'smart options',
    togglesmart: false,
    devname: 'sdc',
    identifier: '{serial}VB9fbb6dfe-9cf26570',
  } as Disk;
  const createComponent = createComponentFactory({
    component: DiskFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(SlideInRef),
      mockProvider(DialogService),
      mockProvider(SnackbarService),
      mockWebSocket([
        mockCall('disk.update', dataDisk),
      ]),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('disables \'SED Password\' when \'Clear SED Password\' is checked', async () => {
    const clearPassword = await loader.getHarness(IxCheckboxHarness.with({ label: 'Clear SED Password' }));
    const sedPassword = await loader.getHarness(IxInputHarness.with({ label: 'SED Password' }));
    await clearPassword.setValue(true);

    expect(sedPassword.isDisabled()).toBeTruthy();
  });

  it('sets disk settings when form is opened', async () => {
    spectator.component.setFormDisk(dataDisk);
    const formValue = await form.getValues();
    expect(formValue).toEqual({
      'Advanced Power Management': 'Level 127 - Maximum power usage with Standby',
      'Clear SED Password': false,
      Critical: '5',
      Description: 'Some disk description',
      Difference: '5',
      'Enable S.M.A.R.T.': false,
      'HDD Standby': '10',
      Informational: '5',
      Name: 'sdc',
      'S.M.A.R.T. extra options': 'smart options',
      'SED Password': '123',
      Serial: 'VB9fbb6dfe-9cf26570',
    });
  });

  it('saves disk settings when form is saved', async () => {
    spectator.component.setFormDisk(dataDisk);
    const changeValue = {
      'Advanced Power Management': 'Level 64 - Intermediate power usage with Standby',
      Critical: '',
      Description: 'New disk description',
      Difference: '',
      Informational: '10',
      'HDD Standby': '10',
      'S.M.A.R.T. extra options': 'new smart options',
      'Enable S.M.A.R.T.': true,
      'SED Password': '123',
      'Clear SED Password': true,
    };
    await form.fillForm(changeValue);
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('disk.update', ['{serial}VB9fbb6dfe-9cf26570', {
      advpowermgmt: '64',
      critical: null,
      description: 'New disk description',
      difference: null,
      informational: 10,
      hddstandby: '10',
      smartoptions: 'new smart options',
      togglesmart: true,
      passwd: '',
    }]);
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith(true);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
  });
});
