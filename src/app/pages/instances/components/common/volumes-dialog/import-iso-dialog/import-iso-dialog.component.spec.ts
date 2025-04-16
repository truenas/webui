import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxExplorerHarness } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.harness';
import { IxImportIsoDialogComponent } from 'app/pages/instances/components/common/volumes-dialog/import-iso-dialog/import-iso-dialog.component';
import { FilesystemService } from 'app/services/filesystem.service';

describe('IxImportIsoDialog', () => {
  let spectator: Spectator<IxImportIsoDialogComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: IxImportIsoDialogComponent,
    imports: [
      ReactiveFormsModule,
      IxExplorerComponent,
    ],
    providers: [
      mockProvider(FilesystemService),
      mockProvider(MatDialogRef, {
        close: jest.fn(),
      }),
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

  it('submits the value when save is clicked', async () => {
    const explorer = await loader.getHarness(IxExplorerHarness.with({ label: 'ISO Path' }));
    await explorer.setValue('mnt/pool/file.iso');
    spectator.detectChanges();
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Select ISO' }));
    await saveButton.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith('mnt/pool/file.iso');
  });
});
