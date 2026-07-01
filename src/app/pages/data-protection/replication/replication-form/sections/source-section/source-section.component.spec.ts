import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnCheckboxHarness, TnChipInputHarness, TnInputHarness, TnRadioHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { Direction } from 'app/enums/direction.enum';
import { LifetimeUnit } from 'app/enums/lifetime-unit.enum';
import { PeriodicSnapshotTask } from 'app/interfaces/periodic-snapshot-task.interface';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxExplorerHarness } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.harness';
import { LanguageService } from 'app/modules/language/language.service';
import { LocaleService } from 'app/modules/language/locale.service';
import { SchedulerHarness } from 'app/modules/scheduler/components/scheduler/scheduler.harness';
import {
  SourceSectionComponent,
} from 'app/pages/data-protection/replication/replication-form/sections/source-section/source-section.component';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

describe('SourceSectionComponent', () => {
  let spectator: Spectator<SourceSectionComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SourceSectionComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(LanguageService),
      mockProvider(LocaleService),
      mockApi([
        mockCall('pool.snapshottask.query', [
          {
            id: 1,
            dataset: 'files',
            naming_schema: 'auto-%Y-%m',
            lifetime_value: 2,
            lifetime_unit: LifetimeUnit.Week,
            enabled: true,
          },
          {
            id: 2,
            dataset: 'system',
            naming_schema: '%Y-%m-%d',
            lifetime_value: 1,
            lifetime_unit: LifetimeUnit.Day,
            enabled: false,
          },
        ] as PeriodicSnapshotTask[]),
      ]),
      provideMockStore({
        selectors: [
          {
            selector: selectTimezone,
            value: 'America/New_York',
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        direction: Direction.Push,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getChips = (name: string): Promise<TnChipInputHarness> => loader.getHarness(
    TnChipInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getCheckedRadioLabel = async (): Promise<string | null> => {
    const radios = await loader.getAllHarnesses(TnRadioHarness);
    for (const radio of radios) {
      if (await radio.isChecked()) {
        return radio.getLabelText();
      }
    }
    return null;
  };
  const setNameOrRegexRadio = async (label: string): Promise<void> => {
    await (await loader.getHarness(TnRadioHarness.with({ label }))).check();
  };
  const getScheduler = (label: string): Promise<SchedulerHarness> => loader.getHarness(
    SchedulerHarness.with({ label }),
  );

  it('shows default values when creating a replication tasks', async () => {
    expect(await (await getCheckbox('recursive')).isChecked()).toBe(false);
    expect(await (await getCheckbox('properties')).isChecked()).toBe(true);
    expect(await (await getCheckbox('replicate')).isChecked()).toBe(false);
    expect(await (await getChips('properties_override')).getChips()).toEqual([]);
    expect(await (await getChips('properties_exclude')).getChips()).toEqual([]);
    expect(await (await getSelect('periodic_snapshot_tasks')).getDisplayText()).toBe('Select an option');
    expect(await (await getCheckbox('restrict_schedule')).isChecked()).toBe(false);
    expect(await getCheckedRadioLabel()).toBe('Matching naming schema');
    expect(await (await getChips('also_include_naming_schema')).getChips()).toEqual([]);
    expect(await (await getCheckbox('hold_pending_snapshots')).isChecked()).toBe(false);
  });

  it('shows values when editing a replication task', async () => {
    spectator.setInput('replication', {
      source_datasets: ['tank/files'],
      replicate: true,
      properties_override: {
        property1: 'value1',
        property2: 'value2',
      } as Record<string, string>,
      properties_exclude: ['exclude1', 'exclude2'],
      periodic_snapshot_tasks: [
        { id: 1 },
        { id: 2 },
      ],
      restrict_schedule: {
        month: '*/2',
        hour: '*',
        minute: '*',
        dom: '*',
        dow: '*',
      },
      also_include_naming_schema: ['%Y-%m-%d'],
      hold_pending_snapshots: true,
    } as ReplicationTask);

    expect(await (await getCheckbox('replicate')).isChecked()).toBe(true);
    expect(await (await getChips('properties_override')).getChips()).toEqual(['property1=value1', 'property2=value2']);
    expect(await (await getChips('properties_exclude')).getChips()).toEqual(['exclude1', 'exclude2']);
    expect(await (await getSelect('periodic_snapshot_tasks')).getDisplayText()).toBe(
      'files - auto-%Y-%m - 2 WEEK (S) - Enabled, system - %Y-%m-%d - 1 DAY (S) - Disabled',
    );
    expect(await (await getCheckbox('restrict_schedule')).isChecked()).toBe(true);
    expect(await (await getScheduler('By snapshot creation time')).getValue()).toBe(
      'Custom Every minute, every hour, every day, every 2 months',
    );
    expect(await getCheckedRadioLabel()).toBe('Matching naming schema');
    expect(await (await getChips('also_include_naming_schema')).getChips()).toEqual(['%Y-%m-%d']);
    expect(await (await getCheckbox('hold_pending_snapshots')).isChecked()).toBe(true);
  });

  it('returns payload when getPayload is called', async () => {
    spectator.setInput('nodeProvider', jest.fn());
    spectator.component.form.controls.source_datasets.setValue(['tank/files']);
    await (await getCheckbox('replicate')).check();
    await (await getSelect('periodic_snapshot_tasks')).selectOption('files - auto-%Y-%m - 2 WEEK (S) - Enabled');
    await setNameOrRegexRadio('Matching regular expression');
    await (await getChips('properties_exclude')).addChip('exclude1');
    await (await getCheckbox('hold_pending_snapshots')).check();
    await (await getInput('name_regex')).setValue('test-.*');

    expect(spectator.component.getPayload()).toEqual({
      also_include_naming_schema: [],
      source_datasets: ['tank/files'],
      replicate: true,
      periodic_snapshot_tasks: [1],
      recursive: true,
      properties: true,
      exclude: [],
      properties_exclude: ['exclude1'],
      properties_override: {},
      name_regex: 'test-.*',
      hold_pending_snapshots: true,
      restrict_schedule: null,
    });
  });

  describe('explorer', () => {
    it('uses tree node provider from input in explorer component', () => {
      const sourceNodeProvider = jest.fn();
      spectator.setInput('nodeProvider', sourceNodeProvider);

      const explorer = spectator.query(IxExplorerComponent)!;
      expect(explorer.nodeProvider()).toBe(sourceNodeProvider);
    });

    it('disables explorer when nodeProvider is not provided', async () => {
      const explorer = await loader.getHarness(IxExplorerHarness.with({ label: 'Source' }));
      spectator.setInput('nodeProvider', null);
      expect(await explorer.isDisabled()).toBe(true);

      const sourceNodeProvider = jest.fn();
      spectator.setInput('nodeProvider', sourceNodeProvider);
      expect(await explorer.isDisabled()).toBe(false);
    });
  });

  describe('field conditions', () => {
    it('does not show Periodic Snapshot Tasks for pull replications', async () => {
      spectator.setInput('direction', Direction.Pull);

      const periodicSnapshotTasks = await loader.getHarnessOrNull(
        TnSelectHarness.with({ selector: '[formControlName="periodic_snapshot_tasks"]' }),
      );
      expect(periodicSnapshotTasks).toBeNull();
    });

    it('shows Exclude Child Datasets when Recursive is ticked', async () => {
      await (await getCheckbox('recursive')).check();
      await (await getChips('exclude')).addChip('pool1/files');
      await (await getChips('exclude')).addChip('pool1/storage');

      expect(spectator.component.getPayload()).toMatchObject({
        recursive: true,
        exclude: [
          'pool1/files',
          'pool1/storage',
        ],
      });
    });

    it('shows property fields when Include Dataset Properties is ticked', async () => {
      await (await getChips('properties_override')).addChip('property1=value');
      await (await getChips('properties_override')).addChip('property2=value');
      await (await getChips('properties_exclude')).addChip('excluded');

      expect(spectator.component.getPayload()).toMatchObject({
        properties: true,
        properties_exclude: ['excluded'],
        properties_override: {
          property1: 'value',
          property2: 'value',
        },
      });
    });

    it('shows property fields and hides other fields when Full Filesystem Replication is ticked', async () => {
      await (await getCheckbox('replicate')).check();
      await (await getChips('properties_override')).addChip('property1=value');
      await (await getChips('properties_override')).addChip('property2=value');
      await (await getChips('properties_exclude')).addChip('excluded');

      const recursive = await loader.getHarnessOrNull(
        TnCheckboxHarness.with({ selector: '[formControlName="recursive"]' }),
      );
      const properties = await loader.getHarnessOrNull(
        TnCheckboxHarness.with({ selector: '[formControlName="properties"]' }),
      );
      expect(recursive).toBeNull();
      expect(properties).toBeNull();

      expect(spectator.component.getPayload()).toMatchObject({
        replicate: true,
        exclude: [],
        properties: true,
        properties_exclude: ['excluded'],
        properties_override: {
          property1: 'value',
          property2: 'value',
        },
        recursive: true,
      });
    });
  });

  describe('naming schema or regex', () => {
    it('shows naming schema specific fields when `Matching naming schema` is selected for Push replications', async () => {
      await setNameOrRegexRadio('Matching naming schema');
      await (await getChips('also_include_naming_schema')).addChip('%Y%m%d%H%M');
      await (await getChips('also_include_naming_schema')).addChip('%Y%m%d%H%M-2');

      expect(spectator.component.getPayload()).toMatchObject({
        naming_schema: [],
        also_include_naming_schema: ['%Y%m%d%H%M', '%Y%m%d%H%M-2'],
      });
    });

    it('shows naming schema specific fields when `Matching naming schema` is selected for Pull replications', async () => {
      spectator.setInput('direction', Direction.Pull);

      await setNameOrRegexRadio('Matching naming schema');
      await (await getChips('naming_schema')).addChip('%Y%m%d%H%M');
      await (await getChips('naming_schema')).addChip('%Y%m%d%H%M-2');

      const payload = spectator.component.getPayload();
      expect(payload).toMatchObject({
        naming_schema: ['%Y%m%d%H%M', '%Y%m%d%H%M-2'],
        also_include_naming_schema: [],
        name_regex: null,
      });
    });

    it('shows regex specific fields when `Matching regular expression` is selected', async () => {
      await setNameOrRegexRadio('Matching regular expression');
      await (await getInput('name_regex')).setValue('test-.*');

      const payload = spectator.component.getPayload();
      expect(payload).toMatchObject({
        name_regex: 'test-.*',
        also_include_naming_schema: [],
      });
      expect(Object.keys(payload)).not.toContain('naming_schema');
    });
  });

  describe('Replicate Specific Snapshots', () => {
    beforeEach(async () => {
      await (await getCheckbox('restrict_schedule')).check();
    });

    it('shows schedule fields when Replicate Specific Snapshots is checked', async () => {
      await (await getScheduler('By snapshot creation time')).setValue('0 0 * * 0');

      expect(spectator.component.getPayload()).toMatchObject({
        restrict_schedule: {
          month: '*',
          dom: '*',
          dow: 'sun',
          hour: '0',
          minute: '0',

          begin: '00:00',
          end: '23:59',
        },
      });
    });

    it('shows Begin and End fields when Replicate Specific Snapshot is set and schedule is hourly', async () => {
      await (await getScheduler('By snapshot creation time')).setValue('0 * * * *');
      await (await getSelect('restrict_schedule_begin')).selectOption('10:00:00');
      await (await getSelect('restrict_schedule_end')).selectOption('23:15:00');

      expect(spectator.component.getPayload()).toMatchObject({
        restrict_schedule: {
          month: '*',
          dow: '*',
          dom: '*',
          hour: '*',
          minute: '0',

          begin: '10:00',
          end: '23:15',
        },
      });
    });
  });
});
