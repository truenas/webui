import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { VirtualizationDeviceType, VirtualizationNicType } from 'app/enums/virtualization.enum';
import { VirtualizationNic } from 'app/interfaces/virtualization.interface';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { InstanceNicMacDialog } from 'app/pages/instances/components/common/instance-nics-mac-addr-dialog/instance-nic-mac-dialog.component';

describe('InstanceNicMacDialogComponent', () => {
  let spectator: Spectator<InstanceNicMacDialog>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: InstanceNicMacDialog,
    providers: [
      mockProvider(MatDialogRef, {
        close: jest.fn(),
      }),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          dev_type: VirtualizationDeviceType.Nic,
          nic_type: VirtualizationNicType.Macvlan,
          parent: 'ens',
        } as VirtualizationNic,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows nic name in title', () => {
    const title = spectator.query('h1');
    expect(title.textContent).toBe('Add NIC Device: ens');
  });

  it('returns default value', async () => {
    const checkbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Use Default Mac Address' }));
    await checkbox.setValue(true);
    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    expect(await button.isDisabled()).toBeFalsy();
    await button.click();
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({ useDefault: true });
  });

  it('returns mac value', async () => {
    const checkbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Use Default Mac Address' }));
    await checkbox.setValue(false);
    const input = await loader.getHarness(IxInputHarness.with({ label: 'Mac Address' }));
    await input.setValue('aa:bb:cc:dd:ee:ff');
    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    expect(await button.isDisabled()).toBeFalsy();
    await button.click();
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({ mac: 'aa:bb:cc:dd:ee:ff' });
  });

  it('doesnt allow invalid mac value', async () => {
    const checkbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Use Default Mac Address' }));
    await checkbox.setValue(false);
    const input = await loader.getHarness(IxInputHarness.with({ label: 'Mac Address' }));
    await input.setValue('aa:bb:cc:dd:ff');
    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    expect(await button.isDisabled()).toBeTruthy();
  });
});
