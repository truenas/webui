import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { Direction } from 'app/enums/direction.enum';
import { LifetimeUnit } from 'app/enums/lifetime-unit.enum';
import { PeriodicSnapshotTask } from 'app/interfaces/periodic-snapshot-task.interface';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetHarness } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.harness';
import {
  SourceSectionComponent,
} from 'app/pages/data-protection/replication/replication-form/sections/source-section/source-section.component';
import { LanguageService } from 'app/services/language.service';
import { LocaleService } from 'app/services/locale.service';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

describe('SourceSectionComponent', () => {
  let spectator: Spectator<SourceSectionComponent>;
  let loader: HarnessLoader;
  let form: IxFieldsetHarness;
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

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        direction: Direction.Push,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFieldsetHarness);
  });

  it('shows default values when creating a replication tasks', async () => {
    expect(await form.getValues()).toEqual({
      Source: '',
      Recursive: false,
      'Include Dataset Properties': true,
      'Full Filesystem Replication': false,
      'Properties Override': [],
      'Properties Exclude': [],
      'Periodic Snapshot Tasks': [],
      'Replicate Specific Snapshots': false,
      'Also include snapshots with the name': 'Matching naming schema',
      'Also Include Naming Schema': [],
      'Save Pending Snapshots': false,
    });
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

    expect(await form.getValues()).toEqual({
      Source: 'tank/files',
      'Full Filesystem Replication': true,
      'Properties Override': ['property1=value1', 'property2=value2'],
      'Properties Exclude': ['exclude1', 'exclude2'],
      'Periodic Snapshot Tasks': [
        'files - auto-%Y-%m - 2 WEEK (S) - Enabled',
        'system - %Y-%m-%d - 1 DAY (S) - Disabled',
      ],
      'Replicate Specific Snapshots': true,
      'By snapshot creation time': 'Custom (* * * */2 *) Every minute, every 2 months',
      'Also include snapshots with the name': 'Matching naming schema',
      'Also Include Naming Schema': ['%Y-%m-%d'],
      'Save Pending Snapshots': true,
    });
  });

  it('returns payload when getPayload is called', async () => {
    await form.fillForm(
      {
        Source: ['tank/files'],
        'Full Filesystem Replication': true,
        'Periodic Snapshot Tasks': ['files - auto-%Y-%m - 2 WEEK (S) - Enabled'],
        'Also include snapshots with the name': 'Matching regular expression',
        'Properties Exclude': ['exclude1'],
        'Save Pending Snapshots': true,
        'Matching regular expression': 'test-.*',
      },
    );

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

      const explorer = spectator.query(IxExplorerComponent);
      expect(explorer.nodeProvider()).toBe(sourceNodeProvider);
    });

    it('disables explorer when nodeProvider is not provided', async () => {
      const explorer = await form.getControl('Source');
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

      expect(await form.getLabels()).not.toContain('Periodic Snapshot Tasks');
    });

    it('shows Exclude Child Datasets when Recursive is ticked', async () => {
      await form.fillForm(
        {
          Recursive: true,
          'Exclude Child Datasets': ['pool1/files', 'pool1/storage'],
        },
      );

      expect(spectator.component.getPayload()).toMatchObject({
        recursive: true,
        exclude: [
          'pool1/files',
          'pool1/storage',
        ],
      });
    });

    it('shows property fields when Include Dataset Properties is ticked', async () => {
      await form.fillForm({
        'Include Dataset Properties': true,
        'Properties Override': ['property1=value', 'property2=value'],
        'Properties Exclude': ['excluded'],
      });

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
      await form.fillForm({
        'Full Filesystem Replication': true,
        'Properties Override': ['property1=value', 'property2=value'],
        'Properties Exclude': ['excluded'],
      });

      const controls = await form.getLabels();
      expect(controls).not.toContain('Recursive');
      expect(controls).not.toContain('Include Dataset Properties');

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
      await form.fillForm({
        'Also include snapshots with the name': 'Matching naming schema',
        'Also Include Naming Schema': ['%Y%m%d%H%M', '%Y%m%d%H%M-2'],
      });

      expect(spectator.component.getPayload()).toMatchObject({
        naming_schema: [],
        also_include_naming_schema: ['%Y%m%d%H%M', '%Y%m%d%H%M-2'],
      });
    });

    it('shows naming schema specific fields when `Matching naming schema` is selected for Pull replications', async () => {
      spectator.setInput('direction', Direction.Pull);

      await form.fillForm({
        'Include snapshots with the name': 'Matching naming schema',
        'Matching naming schema': ['%Y%m%d%H%M', '%Y%m%d%H%M-2'],
      });

      const payload = spectator.component.getPayload();
      expect(payload).toMatchObject({
        naming_schema: ['%Y%m%d%H%M', '%Y%m%d%H%M-2'],
        also_include_naming_schema: [],
        name_regex: null,
      });
    });

    it('shows regex specific fields when `Matching regular expression` is selected', async () => {
      await form.fillForm(
        {
          'Also include snapshots with the name': 'Matching regular expression',
          'Matching regular expression': 'test-.*',
        },
      );

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
      await form.fillForm({
        'Replicate Specific Snapshots': true,
      });
    });

    it('shows schedule fields when Replicate Specific Snapshots is checked', async () => {
      await form.fillForm({
        'By snapshot creation time': '0 0 * * 0',
      });

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
      await form.fillForm(
        {
          'By snapshot creation time': '0 * * * *',
          Begin: '10:00:00',
          End: '23:15:00',
        },
      );

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
