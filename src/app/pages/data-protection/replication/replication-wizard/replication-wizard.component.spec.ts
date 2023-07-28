import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatStepperHarness, MatStepperNextHarness } from '@angular/material/stepper/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Direction } from 'app/enums/direction.enum';
import { LifetimeUnit } from 'app/enums/lifetime-unit.enum';
import { ReadOnlyMode } from 'app/enums/readonly-mode.enum';
import { RetentionPolicy } from 'app/enums/retention-policy.enum';
import { TransportMode } from 'app/enums/transport-mode.enum';
import { PeriodicSnapshotTask } from 'app/interfaces/periodic-snapshot-task.interface';
import { SummaryComponent } from 'app/modules/common/summary/summary.component';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { SchedulerModule } from 'app/modules/scheduler/scheduler.module';
import { ReplicationWizardComponent } from 'app/pages/data-protection/replication/replication-wizard/replication-wizard.component';
import { ReplicationWhatAndWhereComponent } from 'app/pages/data-protection/replication/replication-wizard/steps/replication-what-and-where/replication-what-and-where.component';
import { ReplicationWhenComponent } from 'app/pages/data-protection/replication/replication-wizard/steps/replication-when/replication-when.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

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
      mockProvider(IxSlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
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

    expect(spectator.inject(IxSlideInRef).close).toHaveBeenCalled();
  });
});
