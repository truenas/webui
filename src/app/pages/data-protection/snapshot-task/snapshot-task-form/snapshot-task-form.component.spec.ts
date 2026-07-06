import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnCheckboxHarness, TnChipInputHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { LifetimeUnit } from 'app/enums/lifetime-unit.enum';
import { PeriodicSnapshotTask } from 'app/interfaces/periodic-snapshot-task.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { LocaleService } from 'app/modules/language/locale.service';
import { SchedulerHarness } from 'app/modules/scheduler/components/scheduler/scheduler.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { SnapshotTaskFormComponent } from 'app/pages/data-protection/snapshot-task/snapshot-task-form/snapshot-task-form.component';
import { StorageService } from 'app/services/storage.service';
import { TaskService } from 'app/services/task.service';
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

  const slideInRef: SlideInRef<PeriodicSnapshotTask | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  let spectator: Spectator<SnapshotTaskFormComponent>;
  let loader: HarnessLoader;

  // Shared by both hosts. A factory (not a shared array) so each host gets its own `jest.fn()`s —
  // `ixFormTestingProviders()` and the service mocks must be fresh per TestBed to avoid call counts
  // leaking between tests. The legacy SlideIn host adds SlideInRef; the `<tn-side-panel>` host forces
  // it null, so the form's optional `inject(SlideInRef)` resolves null → side-panel mode.
  const baseProviders = (): unknown[] => [
    mockAuth(),
    mockProvider(LocaleService, {
      timezone: 'America/New_York',
    }),
    mockApi([
      mockCall('pool.snapshottask.create'),
      mockCall('pool.snapshottask.update'),
      mockCall('pool.snapshottask.update_will_change_retention_for', {}),
    ]),
    mockProvider(DialogService),
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
    ...ixFormTestingProviders(),
  ];

  const createComponent = createComponentFactory({
    component: SnapshotTaskFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      ...baseProviders(),
      mockProvider(SlideInRef, slideInRef),
    ],
  });

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getChipInput = (name: string): Promise<TnChipInputHarness> => loader.getHarness(
    TnChipInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getScheduler = (): Promise<SchedulerHarness> => loader.getHarness(SchedulerHarness);

  describe('adds a new snapshot task', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('adds a new snapshot task when new form is saved', async () => {
      await (await getSelect('dataset')).selectOption('test');
      await (await getInput('lifetime_value')).setValue('2');
      await (await getSelect('lifetime_unit')).selectOption(LifetimeUnit.Week);
      await (await getInput('naming_schema')).setValue('auto-%Y-%m-%d_%H-%M');
      await (await getCheckbox('recursive')).check();
      await (await getCheckbox('allow_empty')).uncheck();
      await (await getCheckbox('enabled')).check();

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.snapshottask.create', [{
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
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: () => ({ ...existingTask, id: 1 }) }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows values for an existing snapshot task when it is open for edit', async () => {
      expect(await (await getSelect('dataset')).getDisplayText()).toBe('test');
      expect(await (await getChipInput('exclude')).getChips()).toEqual([]);
      expect(await (await getCheckbox('recursive')).isChecked()).toBe(true);
      expect(await (await getInput('lifetime_value')).getValue()).toBe('2');
      expect(await (await getSelect('lifetime_unit')).getDisplayText()).toBe(LifetimeUnit.Week);
      expect(await (await getInput('naming_schema')).getValue()).toBe('auto-%Y-%m-%d_%H-%M');
      expect(await (await getScheduler()).getValue()).toBe('Daily At 00:00 (12:00 AM)');
      expect(await (await getCheckbox('allow_empty')).isChecked()).toBe(true);
      expect(await (await getCheckbox('enabled')).isChecked()).toBe(true);
    });

    it('saves updated snapshot task when form opened for edit is saved', async () => {
      await (await getChipInput('exclude')).addChip('root');
      await (await getCheckbox('recursive')).uncheck();
      await (await getCheckbox('enabled')).uncheck();

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.snapshottask.update', [
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
          fixate_removal_date: false,
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

    it('includes fixate_removal_date as false when no snapshots are affected', async () => {
      const apiService = spectator.inject(ApiService);

      await (await getCheckbox('allow_empty')).uncheck();

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(apiService.call).toHaveBeenCalledWith('pool.snapshottask.update', [
        1,
        expect.objectContaining({
          fixate_removal_date: false,
        }),
      ]);
    });

    it('shows retention warning when snapshots are affected', async () => {
      const mockSnapshots = ['snapshot1', 'snapshot2', 'snapshot3'];
      spectator.inject(ApiService).call.mockReturnValue(of(mockSnapshots));

      await (await getInput('lifetime_value')).setValue('5');

      // Wait for debounce and API call
      await new Promise((resolve) => {
        setTimeout(resolve, 300);
      });

      spectator.detectChanges();

      const warningElement = spectator.query('.retention-warning');
      expect(warningElement).toBeTruthy();
      expect(warningElement.textContent).toContain('3');
      expect(warningElement.textContent).toContain('existing snapshot(s)');
    });

    it('shows error message when retention check fails', async () => {
      // Mock console.error to avoid test framework warnings for expected errors
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockError = new Error('API Error');
      spectator.inject(ApiService).call.mockImplementation(() => {
        throw mockError;
      });

      await (await getInput('lifetime_value')).setValue('5');

      // Wait for debounce and API call
      await new Promise((resolve) => {
        setTimeout(resolve, 300);
      });

      spectator.detectChanges();

      const errorElement = spectator.query('.retention-warning.error');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Unable to check if changes will affect snapshot retention');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[SnapshotTaskForm] Failed to check retention changes:',
        mockError,
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('when hosted in a side panel', () => {
    // SlideInRef forced null (the form's optional inject then resolves null → side-panel mode); data
    // arrives via the `taskToEdit` input and the form closes through its `closed` output. Defined in
    // this describe so its TestBed override is scoped here and doesn't disable the SlideIn host above.
    const createPanelComponent = createComponentFactory({
      component: SnapshotTaskFormComponent,
      imports: [
        ReactiveFormsModule,
      ],
      providers: [
        ...baseProviders(),
        { provide: SlideInRef, useValue: null },
      ],
    });

    it('submits via submit() and emits closed on a successful save', async () => {
      const panelSpectator = createPanelComponent({
        props: { taskToEdit: { ...existingTask, id: 1 } },
      });
      panelSpectator.detectChanges();

      const closedSpy = jest.fn();
      panelSpectator.component.closed.subscribe(closedSpy);

      // The container footer's Save calls submit() directly (no in-form Save button in panel mode).
      panelSpectator.component.submit();
      await panelSpectator.fixture.whenStable();

      expect(panelSpectator.inject(ApiService).call).toHaveBeenCalledWith(
        'pool.snapshottask.update',
        [1, expect.any(Object)],
      );
      expect(closedSpy).toHaveBeenCalledWith(true);
    });
  });
});
