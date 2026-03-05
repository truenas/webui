import { CdkStepper } from '@angular/cdk/stepper';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DatasetSource } from 'app/enums/dataset.enum';
import { Direction } from 'app/enums/direction.enum';
import { EncryptionKeyFormat } from 'app/enums/encryption-key-format.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { TransportMode } from 'app/enums/transport-mode.enum';
import { helptextReplicationWizard } from 'app/helptext/data-protection/replication/replication-wizard';
import { Dataset } from 'app/interfaces/dataset.interface';
import { KeychainCredential } from 'app/interfaces/keychain-credential.interface';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  SshCredentialsSelectComponent,
} from 'app/modules/forms/custom-selects/ssh-credentials-select/ssh-credentials-select.component';
import { ixManualValidateError } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { LocaleService } from 'app/modules/language/locale.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ReplicationFormComponent } from 'app/pages/data-protection/replication/replication-form/replication-form.component';
import { ReplicationWhatAndWhereComponent } from 'app/pages/data-protection/replication/replication-wizard/steps/replication-what-and-where/replication-what-and-where.component';
import { DatasetService } from 'app/services/dataset/dataset.service';

describe('ReplicationWhatAndWhereComponent', () => {
  let spectator: Spectator<ReplicationWhatAndWhereComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const slideInRef: SlideInRef<unknown, unknown> = {
    close: jest.fn(),
    swap: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const createComponent = createComponentFactory({
    component: ReplicationWhatAndWhereComponent,
    imports: [
      ReactiveFormsModule,
      SshCredentialsSelectComponent,
    ],
    providers: [
      mockProvider(CdkStepper),
      mockAuth(),
      mockApi([
        mockCall('replication.query', [
          {
            id: 1,
            name: 'task1',
            direction: Direction.Push,
            ssh_credentials: { id: 123 },
            source_datasets: ['pool21', 'pool22'],
            target_dataset: 'pool23',
            transport: TransportMode.Ssh,
          },
        ] as ReplicationTask[]),
        mockCall('keychaincredential.query', [
          {
            id: 123,
            name: 'non-root-ssh-connection',
            attributes: {
              username: 'user1',
            },
          },
        ] as KeychainCredential[]),
        mockCall('replication.count_eligible_manual_snapshots', { total: 0, eligible: 0 }),
        mockCall('pool.dataset.query', []),
      ]),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
      }),
      mockProvider(DatasetService),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(),
        })),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of()),
      }),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(LocaleService),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);

    await form.fillForm(
      {
        'Source Location': 'On this System',
        'Destination Location': 'On this System',
        Recursive: true,
        'Replicate Custom Snapshots': true,
        Encryption: true,
        Source: ['pool1/', 'pool2/'],
        Destination: 'pool3/',
        'Encryption Type': 'Key',
      },
    );
  });

  it('generates payload which will inherit dataset encryption from its parent dataset', async () => {
    await form.fillForm({
      'Inherit Encryption': true,
      'Replicate Custom Snapshots': true,
      'Snapshot Name Regular Expression': '.*',
    });

    expect(spectator.component.getPayload()).toEqual({
      exist_replication: null,
      source_datasets_from: DatasetSource.Local,
      target_dataset_from: DatasetSource.Local,
      source_datasets: ['pool1/', 'pool2/'],
      target_dataset: 'pool3/',
      custom_snapshots: true,
      recursive: true,
      name_regex: '.*',
      encryption: true,
      encryption_inherit: true,
      name: 'pool1/,pool2/ - pool3/',
    });
  });

  it('returns fields when getPayload() is called', () => {
    expect(spectator.component.getPayload()).toEqual({
      exist_replication: null,
      source_datasets_from: DatasetSource.Local,
      target_dataset_from: DatasetSource.Local,
      source_datasets: ['pool1/', 'pool2/'],
      target_dataset: 'pool3/',
      custom_snapshots: true,
      recursive: true,
      name_regex: '',
      encryption: true,
      encryption_inherit: false,
      encryption_key_format: EncryptionKeyFormat.Hex,
      encryption_key_location_truenasdb: true,
      name: 'pool1/,pool2/ - pool3/',
    });
  });

  it('returns summary when getSummary() is called', () => {
    expect(spectator.component.getSummary()).toEqual([
      { label: 'Source', value: 'pool1/,pool2/' },
      { label: 'Destination', value: 'pool3/' },
    ]);
  });

  it('opens sudo enabled dialog when choosing to existing ssh credential', async () => {
    await form.fillForm(
      {
        'Source Location': 'On a Different System',
        'SSH Connection': 'non-root-ssh-connection',
      },
    );
    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      buttonText: 'Use Sudo For ZFS Commands',
      hideCheckbox: true,
      message: helptextReplicationWizard.sudoWarning,
      title: 'Sudo Enabled',
    });
  });

  it('when an existing name is entered, the "Next" button is disabled', async () => {
    const nextButton = await loader.getHarness(MatButtonHarness.with({ text: 'Next' }));

    await form.fillForm({ 'Task Name': 'task1' });
    expect(await nextButton.isDisabled()).toBe(true);

    await form.fillForm({
      'Task Name': 'task3',
      'Snapshot Name Regular Expression': '.*', // Fill required regex field
    });
    // Wait for async validation to complete
    spectator.fixture.detectChanges();
    await spectator.fixture.whenStable();
    expect(await nextButton.isDisabled()).toBe(false);
  });

  it('loads from an existing replication task', async () => {
    await form.fillForm({
      'Load Previous Replication Task': 'task1 (never ran)',
    });
    const payload = spectator.component.getPayload();
    expect(payload).toEqual({
      exist_replication: 1,
      source_datasets_from: DatasetSource.Local,
      target_dataset_from: DatasetSource.Remote,
      source_datasets: [`${mntPath}/pool21`, `${mntPath}/pool22`],
      target_dataset: 'pool23',
      ssh_credentials_target: 123,
      custom_snapshots: false,
      recursive: true,
      encryption: true,
      encryption_inherit: false,
      encryption_key_format: EncryptionKeyFormat.Hex,
      encryption_key_location_truenasdb: true,
      name: 'task1',
      sudo: false,
      transport: TransportMode.Ssh,
    });
  });

  it('clears the existing replication task selection when source datasets are manually changed', async () => {
    await form.fillForm({
      'Load Previous Replication Task': 'task1 (never ran)',
    });
    expect(spectator.component.form.controls.exist_replication.value).toBe(1);

    spectator.component.form.controls.source_datasets.setValue([`${mntPath}/pool99`]);
    spectator.detectChanges();

    expect(spectator.component.form.controls.exist_replication.value).toBeNull();
  });

  it('opens an advanced dialog when Advanced Replication Creation is pressed', async () => {
    const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Replication Creation' }));
    await advancedButton.click();
    expect(
      slideInRef.swap,
    ).toHaveBeenCalledWith(ReplicationFormComponent, { wide: true });
  });

  describe('field availability based on source location', () => {
    it('for Local system: only name_regex is available when custom snapshots enabled', async () => {
      const testForm = await loader.getHarness(IxFormHarness);

      await testForm.fillForm({
        'Source Location': 'On this System',
        'Destination Location': 'On this System',
        'Replicate Custom Snapshots': true,
      });

      // For local sources with custom snapshots enabled, only name_regex should be enabled
      expect(spectator.component.form.controls.schema_or_regex.disabled).toBe(true);
      expect(spectator.component.form.controls.naming_schema.disabled).toBe(true);
      expect(spectator.component.form.controls.name_regex.enabled).toBe(true);
    });

    it('for Local system: name_regex is disabled when custom snapshots disabled', async () => {
      const testForm = await loader.getHarness(IxFormHarness);

      await testForm.fillForm({
        'Source Location': 'On this System',
        'Destination Location': 'On this System',
        'Replicate Custom Snapshots': false,
      });

      // For local sources with custom snapshots disabled, name_regex should be disabled
      expect(spectator.component.form.controls.schema_or_regex.disabled).toBe(true);
      expect(spectator.component.form.controls.naming_schema.disabled).toBe(true);
      expect(spectator.component.form.controls.name_regex.disabled).toBe(true);
    });

    it('for Remote system: schema_or_regex, naming_schema are available, name_regex depends on selection', async () => {
      const testForm = await loader.getHarness(IxFormHarness);

      await testForm.fillForm({
        'Source Location': 'On a Different System',
        'SSH Connection': 'non-root-ssh-connection',
      });

      // For remote sources, schema_or_regex and naming_schema should be enabled
      expect(spectator.component.form.controls.schema_or_regex.enabled).toBe(true);
      expect(spectator.component.form.controls.naming_schema.enabled).toBe(true);

      // By default naming_schema is selected, so name_regex should be disabled
      expect(spectator.component.form.controls.name_regex.disabled).toBe(true);

      // When switching to regex mode, name_regex should be enabled
      await testForm.fillForm({
        'Include snapshots with the name': 'Snapshot Name Regular Expression',
      });

      expect(spectator.component.form.controls.name_regex.enabled).toBe(true);
      expect(spectator.component.form.controls.naming_schema.disabled).toBe(true);
    });

    it('switching from Local to Remote enables schema_or_regex and naming_schema', async () => {
      const testForm = await loader.getHarness(IxFormHarness);

      // Start with Local system
      await testForm.fillForm({
        'Source Location': 'On this System',
        'Destination Location': 'On this System',
        'Replicate Custom Snapshots': true,
      });

      // Verify Local system behavior
      expect(spectator.component.form.controls.schema_or_regex.disabled).toBe(true);
      expect(spectator.component.form.controls.naming_schema.disabled).toBe(true);
      expect(spectator.component.form.controls.name_regex.enabled).toBe(true);

      // Switch to Remote system
      await testForm.fillForm({
        'Source Location': 'On a Different System',
        'SSH Connection': 'non-root-ssh-connection',
      });

      // Verify Remote system behavior - schema_or_regex and naming_schema enabled, name_regex depends on selection
      expect(spectator.component.form.controls.schema_or_regex.enabled).toBe(true);
      expect(spectator.component.form.controls.naming_schema.enabled).toBe(true);
      // disabled by default (naming schema mode)
      expect(spectator.component.form.controls.name_regex.disabled).toBe(true);
    });

    it('switching from Remote to Local disables schema_or_regex and naming_schema', async () => {
      const testForm = await loader.getHarness(IxFormHarness);

      // Start with Remote system
      await testForm.fillForm({
        'Source Location': 'On a Different System',
        'SSH Connection': 'non-root-ssh-connection',
      });

      // Verify Remote system behavior
      expect(spectator.component.form.controls.schema_or_regex.enabled).toBe(true);
      expect(spectator.component.form.controls.naming_schema.enabled).toBe(true);
      // disabled by default (naming schema mode)
      expect(spectator.component.form.controls.name_regex.disabled).toBe(true);

      // Switch to Local system
      await testForm.fillForm({
        'Source Location': 'On this System',
        'Destination Location': 'On this System',
        'Replicate Custom Snapshots': true,
      });

      // Verify Local system behavior - only name_regex should be enabled
      expect(spectator.component.form.controls.schema_or_regex.disabled).toBe(true);
      expect(spectator.component.form.controls.naming_schema.disabled).toBe(true);
      expect(spectator.component.form.controls.name_regex.enabled).toBe(true);
    });
  });

  describe('encryption validation', () => {
    it('sets error on encryption when enabled on non-encrypted local destination', fakeAsync(() => {
      const freshSpectator = createComponent();
      const mockApiService = freshSpectator.inject(MockApiService);
      mockApiService.mockCall('pool.dataset.query', [{ encrypted: false }] as Dataset[]);

      freshSpectator.component.form.controls.source_datasets_from.setValue(DatasetSource.Local);
      freshSpectator.component.form.controls.target_dataset_from.setValue(DatasetSource.Local);
      freshSpectator.component.form.controls.encryption.setValue(true);

      freshSpectator.component.form.controls.target_dataset.setValue('/mnt/tank/target');
      tick(300);

      // Capture error right after validation fires
      const capturedErrors = freshSpectator.component.form.controls.encryption.errors;

      // Errors are set correctly by validateEncryption
      expect(capturedErrors).toEqual({
        [ixManualValidateError]: {
          removable: false,
          message: 'Destination dataset is not encrypted. Disable encryption or select an encrypted destination.',
        },
      });
    }));

    it('disables encryption when source is encrypted (wizard always preserves properties)', fakeAsync(() => {
      const freshSpectator = createComponent();
      const mockApiService = freshSpectator.inject(MockApiService);
      mockApiService.mockCall('pool.dataset.query', [{ encrypted: true }] as Dataset[]);

      freshSpectator.component.form.controls.source_datasets_from.setValue(DatasetSource.Local);
      freshSpectator.component.form.controls.target_dataset_from.setValue(DatasetSource.Local);
      freshSpectator.component.form.controls.encryption.setValue(true);

      freshSpectator.component.form.controls.source_datasets.setValue(['/mnt/pool/encrypted']);
      tick(300);

      expect(freshSpectator.component.form.controls.encryption.disabled).toBe(true);
      expect(freshSpectator.component.form.controls.encryption.value).toBe(false);
    }));

    it('sets error when destination is its own encryption root', fakeAsync(() => {
      const freshSpectator = createComponent();
      const mockApiService = freshSpectator.inject(MockApiService);
      mockApiService.mockCall('pool.dataset.query', [{
        id: 'tank/encrypted', encrypted: true, encryption_root: 'tank/encrypted',
      }] as Dataset[]);

      freshSpectator.component.form.controls.source_datasets_from.setValue(DatasetSource.Local);
      freshSpectator.component.form.controls.target_dataset_from.setValue(DatasetSource.Local);

      freshSpectator.component.form.controls.target_dataset.setValue('/mnt/tank/encrypted');
      tick(300);

      expect(freshSpectator.component.form.controls.encryption.errors).toEqual({
        [ixManualValidateError]: {
          removable: false,
          message: 'Destination dataset is its own encryption root. Replicating into an existing encryption root is not supported. Encrypt the parent dataset instead.',
        },
      });
    }));
  });
});
