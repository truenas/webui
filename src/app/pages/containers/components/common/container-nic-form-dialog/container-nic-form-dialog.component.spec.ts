import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnCheckboxHarness, TnDialogHarness, TnInputHarness,
} from '@truenas/ui-components';
import { ContainerNicFormDialog } from 'app/pages/containers/components/common/container-nic-form-dialog/container-nic-form-dialog.component';

describe('ContainerNicFormDialogComponent', () => {
  let spectator: Spectator<ContainerNicFormDialog>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ContainerNicFormDialog,
    providers: [
      mockProvider(DialogRef, {
        close: jest.fn(),
      }),
      {
        provide: DIALOG_DATA,
        useValue: { nic: 'ens' },
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows nic name in title', async () => {
    const dialog = await loader.getHarness(TnDialogHarness);
    expect(await dialog.getTitle()).toBe('Add NIC Device: ens');
  });

  it('returns default value', async () => {
    const checkbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Use Default Mac Address' }));
    await checkbox.check();
    const button = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    expect(await button.isDisabled()).toBeFalsy();
    await button.click();
    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith({
      type: 'VIRTIO',
      useDefault: true,
      trust_guest_rx_filters: false,
    });
  });

  it('returns mac value', async () => {
    const checkbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Use Default Mac Address' }));
    await checkbox.uncheck();
    const input = await loader.getHarness(TnInputHarness);
    await input.setValue('aa:bb:cc:dd:ee:ff');
    const button = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    expect(await button.isDisabled()).toBeFalsy();
    await button.click();
    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith({
      type: 'VIRTIO',
      useDefault: false,
      mac: 'aa:bb:cc:dd:ee:ff',
      trust_guest_rx_filters: false,
    });
  });

  it('doesnt allow invalid mac value', async () => {
    const checkbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Use Default Mac Address' }));
    await checkbox.uncheck();
    const input = await loader.getHarness(TnInputHarness);
    await input.setValue('aa:bb:cc:dd:ff');
    const button = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    expect(await button.isDisabled()).toBeTruthy();
  });

  // Middleware accepts colon-separated MACs only; the dash, unseparated and Cisco dotted
  // forms used to save and then fail at container start.
  it.each([
    ['dash-separated', '10-66-6a-1f-f1-b1'],
    ['unseparated', '10666a1ff1b1'],
    ['mixed-separator', '10-66:6a-1f:f1-b1'],
    ['Cisco dotted', '1066.6a1f.f1b1'],
  ])('doesnt allow a %s mac value', async (_, mac) => {
    const checkbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Use Default Mac Address' }));
    await checkbox.uncheck();
    const input = await loader.getHarness(TnInputHarness);
    await input.setValue(mac);
    const button = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    expect(await button.isDisabled()).toBeTruthy();
  });
});
