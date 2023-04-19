import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatStepperHarness, MatStepperNextHarness } from '@angular/material/stepper/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Direction } from 'app/enums/direction.enum';
import { PeriodicSnapshotTask } from 'app/interfaces/periodic-snapshot-task.interface';
import { SummaryComponent } from 'app/modules/common/summary/summary.component';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { SchedulerModule } from 'app/modules/scheduler/scheduler.module';
import { ReplicationWizardComponent } from 'app/pages/data-protection/replication/replication-wizard/replication-wizard.component';
import { ReplicationWhatAndWhereComponent } from 'app/pages/data-protection/replication/replication-wizard/steps/replication-what-and-where/replication-what-and-where.component';
import { ReplicationWhenComponent } from 'app/pages/data-protection/replication/replication-wizard/steps/replication-when/replication-when.component';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('ReplicationWizardComponent', () => {
  let spectator: Spectator<ReplicationWizardComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let nextButton: MatStepperNextHarness;

  const createComponent = createComponentFactory({
    component: ReplicationWizardComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
      MatStepperModule,
      SchedulerModule,
    ],
    declarations: [
      ReplicationWhatAndWhereComponent,
      ReplicationWhenComponent,
      MockComponent(SummaryComponent),
    ],
    providers: [
      mockWebsocket([
        mockCall('replication.query', []),
        mockCall('keychaincredential.query', []),
        mockCall('replication.count_eligible_manual_snapshots', { total: 0, eligible: 0 }),
        mockCall('replication.target_unmatched_snapshots', {}),
        mockCall('pool.snapshottask.query', []),
        mockCall('pool.snapshottask.create', { id: 33 } as PeriodicSnapshotTask),
        mockCall('zfs.snapshot.create'),
        mockCall('replication.create'),
      ]),
      mockProvider(IxSlideInService),
      mockProvider(MatSnackBar),
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

  it('creates objects when wizard is submitted', fakeAsync(async () => {
    await form.fillForm({
      'Source Location': 'On this System',
      'Destination Location': 'On this System',
    });

    await form.fillForm({
      Recursive: false,
      'Replicate Custom Snapshots': true,
      Source: ['pool1/', 'pool2/'],
      Destination: 'pool3/',
    });

    await goToNextStep();

    await form.fillForm({
      'Destination Snapshot Lifetime': 'Custom',
    });

    await goToNextStep();

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();
    tick();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('pool.snapshottask.create', [{
      dataset: 'pool1/',
      enabled: true,
      lifetime_unit: 'WEEK',
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
      lifetime_unit: 'WEEK',
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
      lifetime_unit: 'WEEK',
      lifetime_value: 2,
      name: 'pool1/,pool2/ - pool3/',
      periodic_snapshot_tasks: [33, 33],
      readonly: 'SET',
      recursive: false,
      retention_policy: 'CUSTOM',
      source_datasets: ['pool1/', 'pool2/'],
      ssh_credentials: undefined,
      sudo: undefined,
      target_dataset: 'pool3/',
      transport: 'LOCAL',
    }]);

    expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
  }));
});
