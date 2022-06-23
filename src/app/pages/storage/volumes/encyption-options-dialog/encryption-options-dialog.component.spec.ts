import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { VolumesListDataset } from 'app/interfaces/volumes-list-pool.interface';
import { AppLoaderModule } from 'app/modules/app-loader/app-loader.module';
import { IxSelectHarness } from 'app/modules/ix-forms/components/ix-select/ix-select.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import {
  EncryptionOptionsDialogData,
} from 'app/pages/storage/volumes/encyption-options-dialog/encryption-options-dialog-data.interface';
import { DialogService, WebSocketService } from 'app/services';
import { EncryptionOptionsDialogComponent } from './encryption-options-dialog.component';

describe('EncryptionOptionsDialogComponent', () => {
  let spectator: Spectator<EncryptionOptionsDialogComponent>;
  let websocket: WebSocketService;
  let loader: HarnessLoader;
  let dialogRef: MatDialogRef<EncryptionOptionsDialogComponent>;
  const createComponent = createComponentFactory({
    component: EncryptionOptionsDialogComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
      AppLoaderModule,
    ],
    providers: [
      { provide: MAT_DIALOG_DATA, useValue: {} },
      mockProvider(MatDialogRef),
      mockProvider(DialogService),
      mockWebsocket([
        mockCall('pool.dataset.change_key'),
        mockCall('pool.dataset.inherit_parent_encryption_properties'),
      ]),
    ],
  });

  const defaultDialogData = {
    row: {
      id: 'my-row',
      is_encrypted_root: true,
      parent: {
        encrypted: true,
      } as VolumesListDataset,
    } as VolumesListDataset,
    hasKeyChild: false,
    hasPassphraseParent: false,
  };

  function setupTest(dialogData: EncryptionOptionsDialogData = defaultDialogData): void {
    spectator = createComponent({
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
      ],
    });
    websocket = spectator.inject(WebSocketService);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    dialogRef = spectator.inject(MatDialogRef);
  }

  it('allows to inherit when there is an encrypted parent', async () => {
    setupTest();

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Inherit encryption properties from parent': true,
      Confirm: true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(websocket.call).toHaveBeenCalledWith('pool.dataset.inherit_parent_encryption_properties', ['my-row']);
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('does not make the API call when set to Inherit, but dataset is already not an encryption root', async () => {
    setupTest({
      row: {
        is_encrypted_root: false,
        parent: {
          encrypted: true,
        } as VolumesListDataset,
      } as VolumesListDataset,
      hasKeyChild: false,
      hasPassphraseParent: false,
    });

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Inherit encryption properties from parent': true,
      Confirm: true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(websocket.call).not.toHaveBeenCalledWith('pool.dataset.inherit_parent_encryption_properties');
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('hides other controls when Inherit checkbox is ticked', async () => {
    setupTest();

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Inherit encryption properties from parent': true,
    });

    const labels = await form.getLabels();
    expect(labels).toEqual(['Inherit encryption properties from parent', 'Algorithm', 'Confirm']);
  });

  it('allows to set encryption to key', async () => {
    setupTest();

    const key = 'k'.repeat(64);
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Encryption Type': 'Key',
      Key: 'k'.repeat(64),
      Confirm: true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(websocket.call).toHaveBeenCalledWith(
      'pool.dataset.change_key',
      ['my-row', { key, generate_key: false }],
    );
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('allows key to be generated for when encryption type is key', async () => {
    setupTest();

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Encryption Type': 'Key',
      'Generate Key': true,
      Confirm: true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(websocket.call).toHaveBeenCalledWith(
      'pool.dataset.change_key',
      ['my-row', { generate_key: true }],
    );
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('allows to set encryption to passphrase', async () => {
    setupTest();

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Encryption Type': 'Passphrase',
    });
    await form.fillForm({
      Passphrase: '12345678',
      'Confirm Passphrase': '12345678',
      pbkdf2iters: '350001',
      Confirm: true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(websocket.call).toHaveBeenCalledWith(
      'pool.dataset.change_key',
      ['my-row', { passphrase: '12345678', pbkdf2iters: 350001 }],
    );
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('only allows key encryption when dataset has a key-encrypted child', async () => {
    setupTest({
      ...defaultDialogData,
      hasKeyChild: true,
    });

    const encryptionTypeDropdown = await loader.getHarness(IxSelectHarness.with({ label: 'Encryption Type' }));
    expect(await encryptionTypeDropdown.getValue()).toBe('Key');
    expect(await encryptionTypeDropdown.isDisabled()).toBe(true);
  });

  it('only allows passphrase encryption when dataset has a passphrase-encrypted parent', async () => {
    setupTest({
      ...defaultDialogData,
      hasPassphraseParent: true,
    });

    const encryptionTypeDropdown = await loader.getHarness(IxSelectHarness.with({ label: 'Encryption Type' }));
    expect(await encryptionTypeDropdown.getValue()).toBe('Passphrase');
    expect(await encryptionTypeDropdown.isDisabled()).toBe(true);
  });
});
