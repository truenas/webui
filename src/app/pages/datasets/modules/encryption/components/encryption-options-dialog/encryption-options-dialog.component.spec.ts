import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnCheckboxHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { EncryptionKeyFormat } from 'app/enums/encryption-key-format.enum';
import { Dataset, DatasetDetails } from 'app/interfaces/dataset.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { indexFormControls } from 'app/modules/forms/ix-forms/testing/control-harnesses.helpers';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { ApiService } from 'app/modules/websocket/api.service';
import { EncryptionOptionsDialog } from 'app/pages/datasets/modules/encryption/components/encryption-options-dialog/encryption-options-dialog.component';
import { EncryptionOptionsDialogData } from './encryption-options-dialog-data.interface';

describe('EncryptionOptionsDialogComponent', () => {
  let spectator: Spectator<EncryptionOptionsDialog>;
  let api: ApiService;
  let loader: HarnessLoader;
  let dialogRef: DialogRef;
  const createComponent = createComponentFactory({
    component: EncryptionOptionsDialog,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      ixFormTestingProviders(),
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

  function setupTest(dialogData: EncryptionOptionsDialogData = defaultDialogData): void {
    spectator = createComponent({
      providers: [
        { provide: DIALOG_DATA, useValue: dialogData },
      ],
    });
    api = spectator.inject(ApiService);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    dialogRef = spectator.inject(DialogRef);
  }

  async function setCheckbox(label: string, checked: boolean): Promise<void> {
    const checkbox = await loader.getHarness(TnCheckboxHarness.with({ label }));
    await (checked ? checkbox.check() : checkbox.uncheck());
  }

  async function setInput(controlName: string, value: string): Promise<void> {
    const input = await loader.getHarness(TnInputHarness.with({ selector: `[formControlName="${controlName}"]` }));
    await input.setValue(value);
  }

  async function selectEncryptionType(option: string): Promise<void> {
    const encryptionTypeSelect = await loader.getHarness(TnSelectHarness);
    await encryptionTypeSelect.selectOption(option);
  }

  async function clickSave(): Promise<void> {
    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();
  }

  it('loads dataset pbkdf2iters when dialog is opened', async () => {
    setupTest();
    expect(api.call)
      .toHaveBeenCalledWith('pool.dataset.query', [[['id', '=', 'pool/parent/child']]]);

    const pbkdf2iters = await loader.getHarness(
      TnInputHarness.with({ selector: '[formControlName="pbkdf2iters"]' }),
    );
    expect(await pbkdf2iters.getValue()).toBe('1300000');
  });

  it('allows to inherit when there is an encrypted parent', async () => {
    setupTest();

    await setCheckbox('Inherit encryption properties from parent', true);
    await setCheckbox('Confirm', true);

    await clickSave();

    expect(api.call).toHaveBeenCalledWith('pool.dataset.inherit_parent_encryption_properties', ['pool/parent/child']);
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('does not make the API call when set to Inherit, but dataset is already not an encryption root', async () => {
    setupTest({
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

    await clickSave();

    expect(api.call).not.toHaveBeenCalledWith('pool.dataset.inherit_parent_encryption_properties');
    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });

  it('hides other controls when Inherit checkbox is ticked', async () => {
    setupTest();

    expect(Object.keys(await indexFormControls(loader))).toEqual([
      'Inherit encryption properties from parent',
      'Encryption Type',
      'Passphrase',
      'Confirm Passphrase',
      'pbkdf2iters',
      'Confirm',
    ]);

    await setCheckbox('Inherit encryption properties from parent', true);

    expect(Object.keys(await indexFormControls(loader))).toEqual([
      'Inherit encryption properties from parent',
      'Confirm',
    ]);
    expect(await loader.getAllHarnesses(TnSelectHarness)).toHaveLength(0);
  });

  it('allows to set encryption to key', async () => {
    setupTest();

    const key = 'k'.repeat(64);
    await selectEncryptionType('Key');
    await setInput('key', key);
    await setCheckbox('Confirm', true);

    await clickSave();

    expect(api.job).toHaveBeenCalledWith(
      'pool.dataset.change_key',
      ['pool/parent/child', { key, generate_key: false }],
    );
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('allows key to be generated for when encryption type is key', async () => {
    setupTest();

    await selectEncryptionType('Key');
    await setCheckbox('Generate Key', true);
    await setCheckbox('Confirm', true);

    await clickSave();

    expect(api.job).toHaveBeenCalledWith(
      'pool.dataset.change_key',
      ['pool/parent/child', { generate_key: true }],
    );
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('allows to set encryption to passphrase', async () => {
    setupTest();

    await selectEncryptionType('Passphrase');
    await setInput('passphrase', '12345678');
    await setInput('confirm_passphrase', '12345678');
    await setInput('pbkdf2iters', '1300001');
    await setCheckbox('Confirm', true);

    await clickSave();

    expect(api.job).toHaveBeenCalledWith(
      'pool.dataset.change_key',
      ['pool/parent/child', { passphrase: '12345678', pbkdf2iters: 1300001 }],
    );
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('allows saving when switching from passphrase to key with mismatched passphrase fields', async () => {
    setupTest();

    await selectEncryptionType('Passphrase');
    await setInput('passphrase', '12345678');

    const key = 'k'.repeat(64);
    await selectEncryptionType('Key');
    await setInput('key', key);
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
    setupTest({
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
    setupTest({
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
