import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync, tick } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents, MockInstance } from 'ng-mocks';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Direction } from 'app/enums/direction.enum';
import { SnapshotNamingOption } from 'app/enums/snapshot-naming-option.enum';
import { TransportMode } from 'app/enums/transport-mode.enum';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
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
import { DatasetService } from 'app/services/dataset-service/dataset.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { ReplicationService } from 'app/services/replication.service';
import { WebSocketService } from 'app/services/ws.service';

describe('ReplicationFormComponent', () => {
  let spectator: Spectator<ReplicationFormComponent>;
  let loader: HarnessLoader;
  const remoteNodeProvider = jest.fn();
  const localNodeProvider = jest.fn();

  const generalForm = new FormGroup({
    name: new FormControl('dataset'),
    direction: new FormControl(Direction.Pull),
    transport: new FormControl(TransportMode.Ssh),
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
      IxFormsModule,
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
      mockProvider(DatasetService, {
        getDatasetNodeProvider: jest.fn(() => localNodeProvider),
      }),
      mockWebsocket([
        mockCall('replication.count_eligible_manual_snapshots', {
          eligible: 3,
          total: 5,
        }),
        mockCall('replication.create'),
        mockCall('replication.update'),
      ]),
      mockProvider(IxSlideInService),
      mockProvider(SnackbarService),
      mockProvider(IxSlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
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

      expect(spectator.inject(IxSlideInRef).close).toHaveBeenCalled();
      expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(ReplicationWizardComponent, { wide: true });
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
      }]);
      expect(spectator.inject(IxSlideInRef).close).toHaveBeenCalled();
    });
  });

  describe('updates task', () => {
    beforeEach(fakeAsync(() => {
      spectator = createComponent({
        providers: [
          { provide: SLIDE_IN_DATA, useValue: { id: 1 } as ReplicationTask },
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
        },
      ]);
      expect(spectator.inject(IxSlideInRef).close).toHaveBeenCalled();
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
});
