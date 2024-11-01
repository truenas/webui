import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { LifetimeUnit } from 'app/enums/lifetime-unit.enum';
import { PeriodicSnapshotTask } from 'app/interfaces/periodic-snapshot-task.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { SnapshotTaskFormComponent } from 'app/pages/data-protection/snapshot-task/snapshot-task-form/snapshot-task-form.component';
import { LocaleService } from 'app/services/locale.service';
import { SlideInService } from 'app/services/slide-in.service';
import { StorageService } from 'app/services/storage.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

describe('SnapshotTaskComponent', () => {
  const existingTask = {
    allow_empty: true,
    dataset: 'test',
    enabled: true,
    exclude: [],
    id: 1,
    lifetime_unit: LifetimeUnit.Week,
    lifetime_value: 2,
    naming_schema: 'auto-%Y-%m-%d_%H-%M',
    recursive: true,
    schedule: {
      begin: '00:00',
      dom: '*',
      dow: '*',
      end: '23:59',
      hour: '0',
      minute: '0',
      month: '*',
    },
    state: {
      state: 'PENDING',
    },
    vmware_sync: false,
  } as PeriodicSnapshotTask;

  let spectator: Spectator<SnapshotTaskFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: SnapshotTaskFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockProvider(LocaleService, {
        timezone: 'America/New_York',
      }),
      mockWebSocket([
        mockCall('pool.snapshottask.create'),
        mockCall('pool.snapshottask.update'),
      ]),
      mockProvider(DialogService),
      mockProvider(SlideInService),
      mockProvider(StorageService, {
        getDatasetNameOptions: jest.fn(() => of([
          { label: 'test', value: 'test' },
          { label: 'dev', value: 'dev' },
        ])),
      }),
      mockProvider(TaskService, {
        getTimeOptions: jest.fn(() => [
          { label: '00:00:00', value: '00:00' },
          { label: '09:15:00', value: '09:15' },
          { label: '23:59:00', value: '23:59' },
        ]),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectTimezone,
            value: 'America/New_York',
          },
        ],
      }),
      mockProvider(SlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  describe('adds a new snapshot task', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('adds a new snapshot task when new form is saved', async () => {
      await form.fillForm({
        Dataset: 'test',
        Exclude: [],
        Recursive: true,
        'Snapshot Lifetime': 2,
        Unit: LifetimeUnit.Week,
        'Naming Schema': 'auto-%Y-%m-%d_%H-%M',
        Schedule: '0 0 * * *',
        'Allow Taking Empty Snapshots': false,
        Enabled: true,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('pool.snapshottask.create', [{
        allow_empty: false,
        dataset: 'test',
        enabled: true,
        exclude: [],
        lifetime_unit: LifetimeUnit.Week,
        lifetime_value: 2,
        naming_schema: 'auto-%Y-%m-%d_%H-%M',
        recursive: true,
        schedule: {
          dom: '*',
          dow: '*',
          hour: '0',
          minute: '0',
          month: '*',
        },
      }]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });
  });

  describe('edits snapshot task', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          { provide: SLIDE_IN_DATA, useValue: { ...existingTask, id: 1 } },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('shows values for an existing snapshot task when it is open for edit', async () => {
      const values = await form.getValues();

      expect(values).toEqual({
        Dataset: 'test',
        Exclude: [],
        Recursive: true,
        'Snapshot Lifetime': '2',
        Unit: LifetimeUnit.Week,
        'Naming Schema': 'auto-%Y-%m-%d_%H-%M',
        Schedule: 'Daily (0 0 * * *)  At 00:00 (12:00 AM)',
        'Allow Taking Empty Snapshots': true,
        Enabled: true,
      });
    });

    it('saves updated snapshot task when form opened for edit is saved', async () => {
      await form.fillForm({
        Exclude: ['root'],
        Recursive: false,
        Schedule: '0 0 * * *',
        Enabled: false,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('pool.snapshottask.update', [
        1,
        {
          allow_empty: true,
          dataset: 'test',
          lifetime_unit: LifetimeUnit.Week,
          lifetime_value: 2,
          naming_schema: 'auto-%Y-%m-%d_%H-%M',
          enabled: false,
          exclude: ['root'],
          recursive: false,
          schedule: {
            dom: '*',
            dow: '*',
            hour: '0',
            minute: '0',
            month: '*',
          },
        },
      ]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });
  });
});
