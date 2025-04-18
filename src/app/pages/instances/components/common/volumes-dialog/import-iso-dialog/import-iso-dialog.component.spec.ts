import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { IxExplorerHarness } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.harness';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxImportIsoDialogComponent } from 'app/pages/instances/components/common/volumes-dialog/import-iso-dialog/import-iso-dialog.component';
import { FilesystemService } from 'app/services/filesystem.service';

describe('IxImportIsoDialog', () => {
  let spectator: Spectator<IxImportIsoDialogComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: IxImportIsoDialogComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('virt.volume.import_iso'),
      ]),
      mockProvider(FilesystemService),
      mockProvider(MatDialogRef, {
        close: jest.fn(),
      }),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          config: {
            storage_pools: ['pool1', 'pool2'],
            pool: 'pool1',
          },
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('disables button for invalid value', async () => {
    const explorer = await loader.getHarness(IxExplorerHarness.with({ label: 'ISO Path' }));
    await explorer.setValue('mnt/pool');
    spectator.detectChanges();
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Select ISO' }));
    expect(await saveButton.isDisabled()).toBeTruthy();
  });

  it('enables button for invalid value', async () => {
    const explorer = await loader.getHarness(IxExplorerHarness.with({ label: 'ISO Path' }));
    await explorer.setValue('mnt/pool/file.iso');
    spectator.detectChanges();
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Select ISO' }));
    expect(await saveButton.isDisabled()).toBeFalsy();
  });

  it('auto fills name when iso file is selected', async () => {
    const explorer = await loader.getHarness(IxExplorerHarness.with({ label: 'ISO Path' }));
    await explorer.setValue('mnt/pool/file.iso');
    spectator.detectChanges();

    const nameInput = await loader.getHarness(IxInputHarness.with({ label: 'Name' }));
    expect(await nameInput.getValue()).toBe('file');
  });

  it('submits the value when save is clicked', async () => {
    const explorer = await loader.getHarness(IxExplorerHarness.with({ label: 'ISO Path' }));
    await explorer.setValue('mnt/pool/file.iso');
    spectator.detectChanges();
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Select ISO' }));
    await saveButton.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });
});
