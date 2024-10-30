import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatStepperModule } from '@angular/material/stepper';
import { MatStepperHarness, MatStepperNextHarness } from '@angular/material/stepper/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
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
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { SummaryComponent } from 'app/modules/summary/summary.component';
import { ReplicationWizardComponent } from 'app/pages/data-protection/replication/replication-wizard/replication-wizard.component';
import { ReplicationWhatAndWhereComponent } from 'app/pages/data-protection/replication/replication-wizard/steps/replication-what-and-where/replication-what-and-where.component';
import { ReplicationWhenComponent } from 'app/pages/data-protection/replication/replication-wizard/steps/replication-when/replication-when.component';
import { WebSocketService } from 'app/services/ws.service';

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
  let form: IxFormHarness;
  let nextButton: MatStepperNextHarness;
  const chainedRef: ChainedRef<ReplicationTask> = {
    close: jest.fn(),
    swap: jest.fn(),
    getData: jest.fn(() => undefined),
  };

  const createComponent = createComponentFactory({
    component: ReplicationWizardComponent,
    imports: [
      ReactiveFormsModule,
      MatStepperModule,
    ],
    declarations: [
      ReplicationWhatAndWhereComponent,
      ReplicationWhenComponent,
      MockComponent(SummaryComponent),
    ],
    providers: [
      mockAuth(),
      mockWebSocket([
        mockCall('replication.query', []),
        mockCall('keychaincredential.query', []),
        mockCall('replication.count_eligible_manual_snapshots', { total: 0, eligible: 0 }),
        mockCall('replication.target_unmatched_snapshots', {}),
        mockCall('pool.snapshottask.query', []),
        mockCall('pool.snapshottask.create', { id: 33 } as PeriodicSnapshotTask),
        mockCall('zfs.snapshot.create'),
        mockCall('replication.create', existingTask),
      ]),
      mockProvider(ChainedRef, chainedRef),
      mockProvider(SnackbarService),
      mockProvider(SlideInRef),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    await updateStepHarnesses();
  });

  async function updateStepHarnesses(): Promise<void> {
    const stepper = await loader.getHarness(MatStepperHarness);
    const activeStep = (await stepper.getSteps({ selected: true }))[0];

    form = await activeStep.getHarnessOrNull(IxFormHarness);
    nextButton = await activeStep.getHarnessOrNull(MatStepperNextHarness.with({ text: 'Next' }));
  }

  async function goToNextStep(): Promise<void> {
    await nextButton.click();
    await updateStepHarnesses();
  }

  it('creates objects when wizard is submitted', async () => {
    await form.fillForm(
      {
        'Source Location': 'On this System',
        'Destination Location': 'On this System',
        Recursive: false,
        'Replicate Custom Snapshots': true,
        Source: ['pool1/', 'pool2/'],
        Destination: 'pool3/',
      },
    );

    await goToNextStep();

    await form.fillForm({
      'Destination Snapshot Lifetime': 'Custom',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('pool.snapshottask.create', [{
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

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('pool.snapshottask.create', [{
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

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('zfs.snapshot.create', [{
      dataset: 'pool1/',
      naming_schema: 'auto-%Y-%m-%d_%H-%M',
      recursive: false,
    }]);

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('zfs.snapshot.create', [{
      dataset: 'pool2/',
      naming_schema: 'auto-%Y-%m-%d_%H-%M',
      recursive: false,
    }]);

    expect(spectator.inject(WebSocketService).call).toHaveBeenLastCalledWith('replication.create', [{
      auto: true,
      direction: Direction.Push,
      encryption: false,
      lifetime_unit: LifetimeUnit.Week,
      lifetime_value: 2,
      name: 'pool1/,pool2/ - pool3/',
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
    expect(chainedRef.close).toHaveBeenCalledWith({ response: existingTask, error: null });
  });
});
