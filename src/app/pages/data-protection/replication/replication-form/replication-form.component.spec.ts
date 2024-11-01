import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync, tick } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents, MockInstance } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Direction } from 'app/enums/direction.enum';
import { JobState } from 'app/enums/job-state.enum';
import { KeychainCredentialType } from 'app/enums/keychain-credential-type.enum';
import { RetentionPolicy } from 'app/enums/retention-policy.enum';
import { ScheduleMethod } from 'app/enums/schedule-method.enum';
import { SnapshotNamingOption } from 'app/enums/snapshot-naming-option.enum';
import { TransportMode } from 'app/enums/transport-mode.enum';
import { helptextReplicationWizard } from 'app/helptext/data-protection/replication/replication-wizard';
import { KeychainCredential } from 'app/interfaces/keychain-credential.interface';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  ReplicationFormComponent,
} from 'app/pages/data-protection/replication/replication-form/replication-form.component';
import {
  GeneralSectionComponent,
} from 'app/pages/data-protection/replication/replication-form/sections/general-section/general-section.component';
import {
  ScheduleSectionComponent,
} from 'app/pages/data-protection/replication/replication-form/sections/schedule-section/schedule-section.component';
import {
  SourceSectionComponent,
} from 'app/pages/data-protection/replication/replication-form/sections/source-section/source-section.component';
import {
  TargetSectionComponent,
} from 'app/pages/data-protection/replication/replication-form/sections/target-section/target-section.component';
import {
  TransportSectionComponent,
} from 'app/pages/data-protection/replication/replication-form/sections/transport-section/transport-section.component';
import {
  ReplicationWizardComponent,
} from 'app/pages/data-protection/replication/replication-wizard/replication-wizard.component';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { DatasetService } from 'app/services/dataset-service/dataset.service';
import { ReplicationService } from 'app/services/replication.service';
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

describe('ReplicationFormComponent', () => {
  let spectator: Spectator<ReplicationFormComponent>;
  let loader: HarnessLoader;
  const remoteNodeProvider = jest.fn();
  const localNodeProvider = jest.fn();
  const chainedRef: ChainedRef<ReplicationTask> = {
    close: jest.fn(),
    swap: jest.fn(),
    getData: jest.fn(() => undefined),
  };

  const generalForm = new FormGroup({
    name: new FormControl('dataset'),
    direction: new FormControl(Direction.Pull),
    transport: new FormControl(TransportMode.Ssh),
    sudo: new FormControl(false),
  });
  const transportForm = new FormGroup({
    ssh_credentials: new FormControl(5),
  });
  const sourceForm = new FormGroup({
    source_datasets: new FormControl(['/tank/source']),
    name_regex: new FormControl('test-.*'),
    schema_or_regex: new FormControl(SnapshotNamingOption.NameRegex),
    also_include_naming_schema: new FormControl('%Y%m%d%H%M'),
  });
  const targetForm = new FormGroup({
    target_dataset: new FormControl('/tank/target'),
  });
  const scheduleForm = new FormGroup({
    auto: new FormControl(true),
  });

  MockInstance(GeneralSectionComponent, () => ({
    form: generalForm as unknown as GeneralSectionComponent['form'],
    getPayload: jest.fn(() => generalForm.value),
  }));
  MockInstance(TransportSectionComponent, () => ({
    form: transportForm as unknown as TransportSectionComponent['form'],
    getPayload: jest.fn(() => transportForm.value),
  }));
  MockInstance(SourceSectionComponent, () => ({
    form: sourceForm as unknown as SourceSectionComponent['form'],
    getPayload: jest.fn(() => {
      return {
        source_datasets: sourceForm.value.source_datasets,
        name_regex: sourceForm.value.name_regex,
      };
    }),
  }));
  MockInstance(TargetSectionComponent, () => ({
    form: targetForm as unknown as TargetSectionComponent['form'],
    getPayload: jest.fn(() => targetForm.value),
  }));
  MockInstance(ScheduleSectionComponent, () => ({
    form: scheduleForm as unknown as ScheduleSectionComponent['form'],
    getPayload: jest.fn(() => scheduleForm.value),
  }));

  const createComponent = createComponentFactory({
    component: ReplicationFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    declarations: [
      MockComponents(
        GeneralSectionComponent,
        TransportSectionComponent,
        TargetSectionComponent,
        SourceSectionComponent,
        ScheduleSectionComponent,
      ),
    ],
    providers: [
      mockAuth(),
      mockProvider(DatasetService, {
        getDatasetNodeProvider: jest.fn(() => localNodeProvider),
      }),
      mockWebSocket([
        mockCall('replication.count_eligible_manual_snapshots', {
          eligible: 3,
          total: 5,
        }),
        mockCall('replication.create', existingTask),
        mockCall('replication.update', existingTask),
        mockCall('keychaincredential.query', [
          {
            id: 123,
            name: 'non-root-ssh-connection',
            attributes: {
              username: 'user1',
            },
          },
        ] as KeychainCredential[]),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of()),
      }),
      mockProvider(ChainedSlideInService, {
        components$: of([]),
        open: jest.fn(() => of()),
      }),
      mockProvider(SnackbarService),
      mockProvider(SlideInRef),
      mockProvider(ChainedRef, chainedRef),
    ],
    componentProviders: [
      mockProvider(ReplicationService, {
        getTreeNodeProvider: jest.fn(() => remoteNodeProvider),
      }),
    ],
  });

  describe('checks replication form', () => {
    beforeEach(fakeAsync(() => {
      spectator = createComponent();
      tick();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    }));

    it('shows form sections', () => {
      expect(spectator.query(GeneralSectionComponent)).toExist();
      expect(spectator.query(TransportSectionComponent)).toExist();
      expect(spectator.query(TargetSectionComponent)).toExist();
      expect(spectator.query(SourceSectionComponent)).toExist();
      expect(spectator.query(ScheduleSectionComponent)).toExist();
    });

    it('switches to wizard when Switch To Wizard is pressed', async () => {
      const switchButton = await loader.getHarness(MatButtonHarness.with({ text: 'Switch To Wizard' }));
      await switchButton.click();

      expect(
        chainedRef.swap,
      ).toHaveBeenCalledWith(ReplicationWizardComponent, true);
    });

    it('creates a new replication task', async () => {
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.query(GeneralSectionComponent).getPayload).toHaveBeenCalled();
      expect(spectator.query(TransportSectionComponent).getPayload).toHaveBeenCalled();
      expect(spectator.query(SourceSectionComponent).getPayload).toHaveBeenCalled();
      expect(spectator.query(TargetSectionComponent).getPayload).toHaveBeenCalled();
      expect(spectator.query(ScheduleSectionComponent).getPayload).toHaveBeenCalled();

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('replication.create', [{
        name: 'dataset',
        ssh_credentials: 5,
        direction: Direction.Pull,
        source_datasets: ['/tank/source'],
        name_regex: 'test-.*',
        target_dataset: '/tank/target',
        transport: TransportMode.Ssh,
        auto: true,
        sudo: false,
      }]);
      expect(chainedRef.close).toHaveBeenCalledWith({ response: existingTask, error: null });
    });
  });

  describe('updates task', () => {
    beforeEach(fakeAsync(() => {
      spectator = createComponent({
        providers: [
          mockProvider(ChainedRef, { ...chainedRef, getData: jest.fn(() => ({ id: 1 } as ReplicationTask)) }),
        ],
      });
      tick();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    }));

    it('updates an existing replication task', async () => {
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('replication.update', [
        1,
        {
          name: 'dataset',
          ssh_credentials: 5,
          direction: Direction.Pull,
          source_datasets: ['/tank/source'],
          name_regex: 'test-.*',
          target_dataset: '/tank/target',
          transport: TransportMode.Ssh,
          auto: true,
          sudo: false,
        },
      ]);
      expect(chainedRef.close).toHaveBeenCalledWith({ response: existingTask, error: null });
    });
  });

  describe('updates node providers when direction, transport or ssh credentials change', () => {
    beforeEach(fakeAsync(() => {
      spectator = createComponent();
      tick();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    }));

    it('push from local to remote', fakeAsync(() => {
      generalForm.controls.direction.setValue(Direction.Push);
      generalForm.controls.transport.setValue(TransportMode.Ssh);
      tick();
      spectator.detectChanges();

      expect(spectator.query(SourceSectionComponent).nodeProvider).toBe(localNodeProvider);
      expect(spectator.query(TargetSectionComponent).nodeProvider).toBe(remoteNodeProvider);
    }));

    it('pull from remote to local', fakeAsync(() => {
      generalForm.controls.direction.setValue(Direction.Pull);
      generalForm.controls.transport.setValue(TransportMode.Ssh);
      tick();
      spectator.detectChanges();

      expect(spectator.query(SourceSectionComponent).nodeProvider).toBe(remoteNodeProvider);
      expect(spectator.query(TargetSectionComponent).nodeProvider).toBe(localNodeProvider);
    }));

    it('from local to local', fakeAsync(() => {
      generalForm.controls.direction.setValue(Direction.Push);
      generalForm.controls.transport.setValue(TransportMode.Local);
      tick();
      spectator.detectChanges();
      expect(spectator.query(SourceSectionComponent).nodeProvider).toBe(localNodeProvider);
      expect(spectator.query(TargetSectionComponent).nodeProvider).toBe(localNodeProvider);

      generalForm.controls.direction.setValue(Direction.Pull);
      tick();
      spectator.detectChanges();
      expect(spectator.query(SourceSectionComponent).nodeProvider).toBe(localNodeProvider);
      expect(spectator.query(TargetSectionComponent).nodeProvider).toBe(localNodeProvider);
    }));
  });

  describe('sudo enabled dialog', () => {
    beforeEach(fakeAsync(() => {
      spectator = createComponent();
      tick();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    }));

    it('opens sudo enabled dialog when choosing to existing ssh credential', fakeAsync(() => {
      transportForm.controls.ssh_credentials.setValue(123);
      tick();
      spectator.detectChanges();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
        buttonText: 'Use Sudo For ZFS Commands',
        hideCheckbox: true,
        message: helptextReplicationWizard.sudo_warning,
        title: 'Sudo Enabled',
      });
    }));
  });
});
