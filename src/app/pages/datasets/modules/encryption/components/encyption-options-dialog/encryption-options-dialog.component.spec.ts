import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockEntityJobComponentRef } from 'app/core/testing/utils/mock-entity-job-component-ref.utils';
import { mockCall, mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { EncryptionKeyFormat } from 'app/enums/encryption-key-format.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { IxSelectHarness } from 'app/modules/ix-forms/components/ix-select/ix-select.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { SnackbarModule } from 'app/modules/snackbar/snackbar.module';
import { EncryptionOptionsDialogComponent } from 'app/pages/datasets/modules/encryption/components/encyption-options-dialog/encryption-options-dialog.component';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';
import { EncryptionOptionsDialogData } from './encryption-options-dialog-data.interface';

describe('EncryptionOptionsDialogComponent', () => {
  let spectator: Spectator<EncryptionOptionsDialogComponent>;
  let websocket: WebSocketService;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let dialogRef: MatDialogRef<EncryptionOptionsDialogComponent>;
  const createComponent = createComponentFactory({
    component: EncryptionOptionsDialogComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
      AppLoaderModule,
      SnackbarModule,
    ],
    providers: [
      { provide: MAT_DIALOG_DATA, useValue: {} },
      mockProvider(MatDialogRef),
      mockProvider(DialogService),
      mockProvider(MatDialog, {
        open: jest.fn(() => mockEntityJobComponentRef),
      }),
      mockWebsocket([
        mockJob('pool.dataset.change_key'),
        mockCall('pool.dataset.inherit_parent_encryption_properties'),
        mockCall('pool.dataset.query', [{
          pbkdf2iters: {
            rawvalue: '100000',
          },
        } as Dataset]),
      ]),
    ],
  });

  const defaultDialogData = {
    dataset: {
      id: 'pool/parent/child',
      encryption_root: 'pool/parent/child',
      children: [],
      key_format: {
        value: EncryptionKeyFormat.Passphrase,
      },
    },
    parent: {
      id: 'pool/parent',
      encrypted: true,
    },
  } as EncryptionOptionsDialogData;

  async function setupTest(dialogData: EncryptionOptionsDialogData = defaultDialogData): Promise<void> {
    spectator = createComponent({
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
      ],
    });
    websocket = spectator.inject(WebSocketService);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    dialogRef = spectator.inject(MatDialogRef);
    form = await loader.getHarness(IxFormHarness);
  }

  it('loads dataset pbkdf2iters when dialog is opened', async () => {
    await setupTest();
    expect(spectator.inject(WebSocketService).call)
      .toHaveBeenCalledWith('pool.dataset.query', [[['id', '=', 'pool/parent/child']]]);
    spectator.component.ngOnInit();

    const pbkdf2iters = await form.getControl('pbkdf2iters');
    expect(await pbkdf2iters.getValue()).toBe('100000');
  });

  it('allows to inherit when there is an encrypted parent', async () => {
    await setupTest();

    await form.fillForm({
      'Inherit encryption properties from parent': true,
      Confirm: true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(websocket.call).toHaveBeenCalledWith('pool.dataset.inherit_parent_encryption_properties', ['pool/parent/child']);
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('does not make the API call when set to Inherit, but dataset is already not an encryption root', async () => {
    await setupTest({
      dataset: {
        id: 'pool/parent/child',
        encryption_root: 'pool',
      },
      parent: {
        id: 'pool/parent',
        encrypted: true,
      },
    } as EncryptionOptionsDialogData);

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
    await setupTest();

    await form.fillForm({
      'Inherit encryption properties from parent': true,
    });

    const labels = await form.getLabels();
    expect(labels).toEqual(['Inherit encryption properties from parent', 'Algorithm', 'Confirm']);
  });

  it('allows to set encryption to key', async () => {
    await setupTest();

    const key = 'k'.repeat(64);
    await form.fillForm({
      'Encryption Type': 'Key',
    });
    await form.fillForm({
      Key: 'k'.repeat(64),
      Confirm: true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(mockEntityJobComponentRef.componentInstance.setCall).toHaveBeenCalledWith(
      'pool.dataset.change_key',
      ['pool/parent/child', { key, generate_key: false }],
    );
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('allows key to be generated for when encryption type is key', async () => {
    await setupTest();

    await form.fillForm({
      'Encryption Type': 'Key',
    });
    await form.fillForm({
      'Generate Key': true,
      Confirm: true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(mockEntityJobComponentRef.componentInstance.setCall).toHaveBeenCalledWith(
      'pool.dataset.change_key',
      ['pool/parent/child', { generate_key: true }],
    );
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('allows to set encryption to passphrase', async () => {
    await setupTest();

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

    expect(mockEntityJobComponentRef.componentInstance.setCall).toHaveBeenCalledWith(
      'pool.dataset.change_key',
      ['pool/parent/child', { passphrase: '12345678', pbkdf2iters: 350001 }],
    );
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('only allows key encryption when dataset has a key-encrypted child', async () => {
    await setupTest({
      ...defaultDialogData,
      dataset: {
        ...defaultDialogData.dataset,
        children: [
          {
            encrypted: true,
            key_format: {
              value: EncryptionKeyFormat.Hex,
            },
          },
        ],
      },
    } as EncryptionOptionsDialogData);

    const encryptionTypeDropdown = await loader.getHarness(IxSelectHarness.with({ label: 'Encryption Type' }));
    expect(await encryptionTypeDropdown.getValue()).toBe('Key');
    expect(await encryptionTypeDropdown.isDisabled()).toBe(true);
  });

  it('only allows passphrase encryption when dataset has a passphrase-encrypted parent', async () => {
    await setupTest({
      ...defaultDialogData,
      parent: {
        key_format: {
          value: EncryptionKeyFormat.Passphrase,
        },
      },
    } as EncryptionOptionsDialogData);

    const encryptionTypeDropdown = await loader.getHarness(IxSelectHarness.with({ label: 'Encryption Type' }));
    expect(await encryptionTypeDropdown.getValue()).toBe('Passphrase');
    expect(await encryptionTypeDropdown.isDisabled()).toBe(true);
  });
});
