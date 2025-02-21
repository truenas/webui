import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  createComponentFactory,
  mockProvider,
  Spectator,
} from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { VirtualizationPciChoices, VirtualizationPciDeviceOption } from 'app/interfaces/virtualization.interface';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import { PciPassthroughDialogComponent } from './pci-passthrough-dialog.component';

const pciChoices = {
  '0000:26:00.0': {
    description: 'SCSI Device',
    controller_type: 'SCSI storage controller',
  } as VirtualizationPciDeviceOption,
  '0000:27:00.0': {
    description: 'USB Device',
    controller_type: 'USB controller',
  } as VirtualizationPciDeviceOption,
  '0000:28:00.0': {
    description: 'Unknown Device',
    controller_type: null,
  } as VirtualizationPciDeviceOption,
} as VirtualizationPciChoices;

describe('PciPassthroughDialogComponent', () => {
  let spectator: Spectator<PciPassthroughDialogComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: PciPassthroughDialogComponent,
    imports: [ReactiveFormsModule],
    providers: [
      mockApi([mockCall('virt.device.pci_choices', pciChoices)]),
      mockProvider(MatDialogRef),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          existingDeviceAddresses: ['0000:27:00.0'],
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows the header', () => {
    expect(spectator.query('h1')).toHaveText('Add PCI Passthrough Device');
  });

  it('calls the API to retrieve pci_choices', () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('virt.device.pci_choices');
  });

  it('shows the correct column headers', () => {
    const headers = spectator.queryAll('th').map((th) => th.textContent?.trim());
    expect(headers).toEqual(['Type', 'Device', '']);
  });

  it('shows the device rows, skipping existing devices', () => {
    const rows = spectator.queryAll('tbody tr').map((row) => {
      return Array.from(row.querySelectorAll('td')).map((td) => td.textContent?.trim());
    });
    expect(rows).toEqual([
      ['SCSI storage controller', 'SCSI Device', 'Select'],
      ['Unknown', 'Unknown Device', 'Select'],
    ]);
  });

  it('filters rows by search string', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Search Devices': 'Unknown',
    });

    const rows = spectator.queryAll('tbody tr').map((row) => {
      return Array.from(row.querySelectorAll('td')).map((td) => td.textContent?.trim());
    });
    expect(rows).toEqual([
      ['Unknown', 'Unknown Device', 'Select'],
    ]);
  });

  it('filters rows by Type', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Type: 'SCSI storage controller',
    });

    const rows = spectator.queryAll('tbody tr').map((row) => {
      return Array.from(row.querySelectorAll('td')).map((td) => td.textContent?.trim());
    });
    expect(rows).toEqual([
      ['SCSI storage controller', 'SCSI Device', 'Select'],
    ]);
  });

  it('closes dialog when X icon is clicked', () => {
    spectator.click('#ix-close-icon');
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith([]);
  });

  it('selects a device and closes the dialog', async () => {
    const selectButtons = await loader.getAllHarnesses(
      MatButtonHarness.with({ text: 'Select' }),
    );
    expect(selectButtons).toHaveLength(2);

    await selectButtons[0].click();
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith([
      {
        label: 'SCSI Device',
        value: '0000:26:00.0',
      },
    ]);
  });
});
