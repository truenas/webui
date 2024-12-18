import { CdkStepper } from '@angular/cdk/stepper';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DatasetSource } from 'app/enums/dataset.enum';
import { Direction } from 'app/enums/direction.enum';
import { EncryptionKeyFormat } from 'app/enums/encryption-key-format.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { SnapshotNamingOption } from 'app/enums/snapshot-naming-option.enum';
import { TransportMode } from 'app/enums/transport-mode.enum';
import { helptextReplicationWizard } from 'app/helptext/data-protection/replication/replication-wizard';
import { KeychainCredential } from 'app/interfaces/keychain-credential.interface';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  SshCredentialsSelectComponent,
} from 'app/modules/forms/custom-selects/ssh-credentials-select/ssh-credentials-select.component';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ReplicationFormComponent } from 'app/pages/data-protection/replication/replication-form/replication-form.component';
import { ReplicationWhatAndWhereComponent } from 'app/pages/data-protection/replication/replication-wizard/steps/replication-what-and-where/replication-what-and-where.component';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { DatasetService } from 'app/services/dataset-service/dataset.service';

describe('ReplicationWhatAndWhereComponent', () => {
  let spectator: Spectator<ReplicationWhatAndWhereComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const chainedRef: ChainedRef<unknown> = {
    close: jest.fn(),
    swap: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => undefined),
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
      ]),
      mockProvider(ChainedSlideInService, {
        open: jest.fn(() => of()),
      }),
      mockProvider(DatasetService),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(),
        })),
      }),
      mockProvider(SlideInRef),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of()),
      }),
      mockProvider(ChainedRef, chainedRef),
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
        'Encryption Key Format': 'HEX',
      },
    );
  });

  it('generates payload which will inherit dataset encryption from its parent dataset', async () => {
    await form.fillForm({ 'Inherit Encryption': true });

    expect(spectator.component.getPayload()).toEqual({
      exist_replication: null,
      source_datasets_from: DatasetSource.Local,
      target_dataset_from: DatasetSource.Local,
      source_datasets: ['pool1/', 'pool2/'],
      target_dataset: 'pool3/',
      custom_snapshots: true,
      recursive: true,
      schema_or_regex: SnapshotNamingOption.NamingSchema,
      naming_schema: 'auto-%Y-%m-%d_%H-%M',
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
      schema_or_regex: SnapshotNamingOption.NamingSchema,
      naming_schema: 'auto-%Y-%m-%d_%H-%M',
      encryption: true,
      encryption_inherit: false,
      encryption_key_format: EncryptionKeyFormat.Hex,
      encryption_key_generate: true,
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
      message: helptextReplicationWizard.sudo_warning,
      title: 'Sudo Enabled',
    });
  });

  it('when an existing name is entered, the "Next" button is disabled', async () => {
    const nextButton = await loader.getHarness(MatButtonHarness.with({ text: 'Next' }));

    await form.fillForm({ 'Task Name': 'task1' });
    expect(await nextButton.isDisabled()).toBe(true);

    await form.fillForm({ 'Task Name': 'task3' });
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
      encryption_key_generate: true,
      encryption_key_location_truenasdb: true,
      name: 'task1',
      sudo: false,
      transport: TransportMode.Ssh,
    });
  });

  it('opens an advanced dialog when Advanced Replication Creation is pressed', async () => {
    const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Replication Creation' }));
    await advancedButton.click();
    expect(
      chainedRef.swap,
    ).toHaveBeenCalledWith(ReplicationFormComponent, true);
  });
});
