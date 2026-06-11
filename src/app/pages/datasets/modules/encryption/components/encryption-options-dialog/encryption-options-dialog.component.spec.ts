import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCheckboxHarness, TnSelectHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { EncryptionKeyFormat } from 'app/enums/encryption-key-format.enum';
import { Dataset, DatasetDetails } from 'app/interfaces/dataset.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import { EncryptionOptionsDialog } from 'app/pages/datasets/modules/encryption/components/encryption-options-dialog/encryption-options-dialog.component';
import { EncryptionOptionsDialogData } from './encryption-options-dialog-data.interface';

describe('EncryptionOptionsDialogComponent', () => {
  let spectator: Spectator<EncryptionOptionsDialog>;
  let api: ApiService;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let dialogRef: DialogRef;
  const createComponent = createComponentFactory({
    component: EncryptionOptionsDialog,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      { provide: DIALOG_DATA, useValue: {} },
      mockProvider(DialogRef),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(undefined),
        })),
      }),
      mockApi([
        mockJob('pool.dataset.change_key'),
        mockCall('pool.dataset.inherit_parent_encryption_properties'),
        mockCall('pool.dataset.query', [{
          pbkdf2iters: {
            rawvalue: '1300000',
          },
        } as Dataset]),
      ]),
      mockAuth(),
    ],
  });

  const defaultDialogData = {
    dataset: {
      id: 'pool/parent/child',
      encryption_root: 'pool/parent/child',
      children: [] as DatasetDetails[],
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
        { provide: DIALOG_DATA, useValue: dialogData },
      ],
    });
    api = spectator.inject(ApiService);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    dialogRef = spectator.inject(DialogRef);
    form = await loader.getHarness(IxFormHarness);
  }

  async function setCheckbox(label: string, checked: boolean): Promise<void> {
    const checkbox = await loader.getHarness(TnCheckboxHarness.with({ label }));
    await (checked ? checkbox.check() : checkbox.uncheck());
  }

  async function selectEncryptionType(option: string): Promise<void> {
    const encryptionTypeSelect = await loader.getHarness(TnSelectHarness);
    await encryptionTypeSelect.selectOption(option);
  }

  it('loads dataset pbkdf2iters when dialog is opened', async () => {
    await setupTest();
    expect(api.call)
      .toHaveBeenCalledWith('pool.dataset.query', [[['id', '=', 'pool/parent/child']]]);
    spectator.component.ngOnInit();

    const pbkdf2iters = await form.getControl('pbkdf2iters');
    expect(await pbkdf2iters.getValue()).toBe('1300000');
  });

  it('allows to inherit when there is an encrypted parent', async () => {
    await setupTest();

    await setCheckbox('Inherit encryption properties from parent', true);
    await setCheckbox('Confirm', true);

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('pool.dataset.inherit_parent_encryption_properties', ['pool/parent/child']);
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

    await setCheckbox('Inherit encryption properties from parent', true);
    await setCheckbox('Confirm', true);

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(api.call).not.toHaveBeenCalledWith('pool.dataset.inherit_parent_encryption_properties');
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('hides other controls when Inherit checkbox is ticked', async () => {
    await setupTest();

    await setCheckbox('Inherit encryption properties from parent', true);

    // Inherit/Confirm are tn-checkbox (outside IxFormHarness); ticking Inherit
    // hides the encryption-type controls, leaving only the Algorithm select.
    const labels = await form.getLabels();
    expect(labels).toEqual(['Algorithm']);
    expect(await loader.getHarness(TnCheckboxHarness.with({ label: 'Confirm' }))).toBeTruthy();
  });

  it('allows to set encryption to key', async () => {
    await setupTest();

    const key = 'k'.repeat(64);
    await selectEncryptionType('Key');
    await form.fillForm({
      Key: 'k'.repeat(64),
    });
    await setCheckbox('Confirm', true);

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(api.job).toHaveBeenCalledWith(
      'pool.dataset.change_key',
      ['pool/parent/child', { key, generate_key: false }],
    );
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('allows key to be generated for when encryption type is key', async () => {
    await setupTest();

    await selectEncryptionType('Key');
    await setCheckbox('Generate Key', true);
    await setCheckbox('Confirm', true);

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(api.job).toHaveBeenCalledWith(
      'pool.dataset.change_key',
      ['pool/parent/child', { generate_key: true }],
    );
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('allows to set encryption to passphrase', async () => {
    await setupTest();

    await selectEncryptionType('Passphrase');
    await form.fillForm({
      Passphrase: '12345678',
      'Confirm Passphrase': '12345678',
      pbkdf2iters: '1300001',
    });
    await setCheckbox('Confirm', true);

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(api.job).toHaveBeenCalledWith(
      'pool.dataset.change_key',
      ['pool/parent/child', { passphrase: '12345678', pbkdf2iters: 1300001 }],
    );
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('allows saving when switching from passphrase to key with mismatched passphrase fields', async () => {
    await setupTest();

    await selectEncryptionType('Passphrase');
    await form.fillForm({
      Passphrase: '12345678',
    });

    const key = 'k'.repeat(64);
    await selectEncryptionType('Key');
    await form.fillForm({
      Key: key,
    });
    await setCheckbox('Confirm', true);

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    expect(await saveButton.isDisabled()).toBe(false);

    await saveButton.click();

    expect(api.job).toHaveBeenCalledWith(
      'pool.dataset.change_key',
      ['pool/parent/child', { key, generate_key: false }],
    );
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

    const encryptionTypeDropdown = await loader.getHarness(TnSelectHarness);
    expect(await encryptionTypeDropdown.getDisplayText()).toBe('Key');
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

    const encryptionTypeDropdown = await loader.getHarness(TnSelectHarness);
    expect(await encryptionTypeDropdown.getDisplayText()).toBe('Passphrase');
    expect(await encryptionTypeDropdown.isDisabled()).toBe(true);
  });
});
