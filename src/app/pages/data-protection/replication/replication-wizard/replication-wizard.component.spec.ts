import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnCheckboxHarness, TnInputHarness, TnRadioHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Direction } from 'app/enums/direction.enum';
import { JobState } from 'app/enums/job-state.enum';
import { KeychainCredentialType } from 'app/enums/keychain-credential-type.enum';
import { LifetimeUnit } from 'app/enums/lifetime-unit.enum';
import { ReadOnlyMode } from 'app/enums/readonly-mode.enum';
import { RetentionPolicy } from 'app/enums/retention-policy.enum';
import { ScheduleMethod } from 'app/enums/schedule-method.enum';
import { TransportMode } from 'app/enums/transport-mode.enum';
import { PeriodicSnapshotTask } from 'app/interfaces/periodic-snapshot-task.interface';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { IxExplorerHarness } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.harness';
import { LocaleService } from 'app/modules/language/locale.service';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { SummaryComponent } from 'app/modules/summary/summary.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { ReplicationWizardComponent } from 'app/pages/data-protection/replication/replication-wizard/replication-wizard.component';
import { ReplicationWhatAndWhereComponent } from 'app/pages/data-protection/replication/replication-wizard/steps/replication-what-and-where/replication-what-and-where.component';
import { ReplicationWhenComponent } from 'app/pages/data-protection/replication/replication-wizard/steps/replication-when/replication-when.component';

const existingTask: ReplicationTask = {
  name: 'dataset',
  id: 123,
  recursive: false,
  retention_policy: RetentionPolicy.Source,
  schedule_method: ScheduleMethod.Cron,
  source_datasets_from: '',
  target_dataset_from: '',
  state: {
    state: JobState.Running,
  },
  ssh_credentials: {
    attributes: {
      connect_timeout: 1,
      host: '',
      port: 1,
      private_key: 1,
      remote_host_key: '',
      username: 'root',
      id: '5',
    },
    id: 5,
    name: 'test',
    type: KeychainCredentialType.SshCredentials,
  },
  direction: Direction.Pull,
  source_datasets: ['/tank/source'],
  name_regex: 'test-.*',
  target_dataset: '/tank/target',
  transport: TransportMode.Ssh,
  auto: true,
};

describe('ReplicationWizardComponent', () => {
  let spectator: Spectator<ReplicationWizardComponent>;
  let loader: HarnessLoader;
  let nextButton: TnButtonHarness | null;
  const slideInRef: SlideInRef<ReplicationTask, unknown> = {
    close: jest.fn(),
    swap: jest.fn(),
    getData: jest.fn(() => ({} as ReplicationTask)),
    requireConfirmationWhen: jest.fn(),
  };

  const createComponent = createComponentFactory({
    component: ReplicationWizardComponent,
    imports: [
      ReactiveFormsModule,
    ],
    declarations: [
      ReplicationWhatAndWhereComponent,
      ReplicationWhenComponent,
      MockComponent(SummaryComponent),
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('replication.query', []),
        mockCall('keychaincredential.query', []),
        mockCall('replication.count_eligible_manual_snapshots', { total: 0, eligible: 0 }),
        mockCall('replication.target_unmatched_snapshots', {}),
        mockCall('pool.snapshottask.query', []),
        mockCall('pool.snapshottask.create', { id: 33 } as PeriodicSnapshotTask),
        mockCall('pool.snapshot.create'),
        mockCall('replication.create', existingTask),
      ]),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(SnackbarService),
      mockProvider(LocaleService),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    await updateStepHarnesses();
  });

  async function updateStepHarnesses(): Promise<void> {
    // tn-stepper renders only the active step's content, so the single visible
    // Next button resolves straight from the document-root loader. The last step
    // has no Next button, so tolerate its absence.
    nextButton = await loader.getHarnessOrNull(TnButtonHarness.with({ label: 'Next' }));
  }

  async function goToNextStep(): Promise<void> {
    await nextButton!.click();
    await updateStepHarnesses();
  }

  function setTnInput(name: string, value: string): Promise<void> {
    return loader.getHarness(TnInputHarness.with({ selector: `[formControlName="${name}"]` }))
      .then((input) => input.setValue(value));
  }

  function selectTnOption(name: string, label: string): Promise<void> {
    return loader.getHarness(TnSelectHarness.with({ selector: `[formControlName="${name}"]` }))
      .then((select) => select.selectOption(label));
  }

  async function setTnCheckbox(name: string, value: boolean): Promise<void> {
    const checkbox = await loader.getHarness(TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }));
    if (value) {
      await checkbox.check();
    } else {
      await checkbox.uncheck();
    }
  }

  it('creates objects when wizard is submitted', async () => {
    await selectTnOption('source_datasets_from', 'On this System');
    await selectTnOption('target_dataset_from', 'On this System');
    await setTnCheckbox('recursive', false);
    await setTnCheckbox('custom_snapshots', true);
    await setTnInput('name_regex', '.*');
    await (await loader.getHarness(IxExplorerHarness.with({ label: 'Source' }))).setValue(['pool1/', 'pool2/']);
    await (await loader.getHarness(IxExplorerHarness.with({ label: 'Destination' }))).setValue('pool3/');

    await goToNextStep();

    await (await loader.getHarness(TnRadioHarness.with({ label: 'Custom' }))).check();

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.snapshottask.create', [{
      dataset: 'pool1/',
      enabled: true,
      lifetime_unit: LifetimeUnit.Week,
      lifetime_value: 2,
      naming_schema: 'auto-%Y-%m-%d_%H-%M',
      recursive: false,
      schedule: {
        dom: '*', dow: '*', hour: '0', minute: '0', month: '*',
      },
    }]);

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.snapshottask.create', [{
      dataset: 'pool2/',
      enabled: true,
      lifetime_unit: LifetimeUnit.Week,
      lifetime_value: 2,
      naming_schema: 'auto-%Y-%m-%d_%H-%M',
      recursive: false,
      schedule: {
        dom: '*', dow: '*', hour: '0', minute: '0', month: '*',
      },
    }]);

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.snapshot.create', [{
      dataset: 'pool1/',
      naming_schema: 'auto-%Y-%m-%d_%H-%M',
      recursive: false,
    }]);

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.snapshot.create', [{
      dataset: 'pool2/',
      naming_schema: 'auto-%Y-%m-%d_%H-%M',
      recursive: false,
    }]);

    expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('replication.create', [{
      auto: true,
      direction: Direction.Push,
      encryption: false,
      lifetime_unit: LifetimeUnit.Week,
      lifetime_value: 2,
      name: 'pool1/,pool2/ - pool3/',
      name_regex: '.*',
      periodic_snapshot_tasks: [33, 33],
      readonly: ReadOnlyMode.Set,
      recursive: false,
      retention_policy: RetentionPolicy.Custom,
      source_datasets: ['pool1/', 'pool2/'],
      ssh_credentials: undefined,
      sudo: undefined,
      target_dataset: 'pool3/',
      transport: TransportMode.Local,
    }]);

    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Replication task created.');
    expect(slideInRef.close).toHaveBeenCalledWith({ response: existingTask });
  });

  it('uses custom source snapshot lifetime for periodic snapshot tasks', async () => {
    await selectTnOption('source_datasets_from', 'On this System');
    await selectTnOption('target_dataset_from', 'On this System');
    await setTnCheckbox('recursive', false);
    await setTnCheckbox('custom_snapshots', true);
    await setTnInput('name_regex', '.*');
    await (await loader.getHarness(IxExplorerHarness.with({ label: 'Source' }))).setValue(['pool1/']);
    await (await loader.getHarness(IxExplorerHarness.with({ label: 'Destination' }))).setValue('pool3/');

    await goToNextStep();

    await setTnInput('source_lifetime_value', '3');
    await selectTnOption('source_lifetime_unit', 'Hours');

    await (await loader.getHarness(TnRadioHarness.with({ label: 'Custom' }))).check();

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.snapshottask.create', [{
      dataset: 'pool1/',
      enabled: true,
      lifetime_unit: LifetimeUnit.Hour,
      lifetime_value: 3,
      naming_schema: 'auto-%Y-%m-%d_%H-%M',
      recursive: false,
      schedule: {
        dom: '*', dow: '*', hour: '0', minute: '0', month: '*',
      },
    }]);
  });
});
