import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { IxFieldsetHarness } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.harness';
import {
  ScheduleSectionComponent,
} from 'app/pages/data-protection/replication/replication-form/sections/schedule-section/schedule-section.component';
import { LanguageService } from 'app/services/language.service';
import { LocaleService } from 'app/services/locale.service';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

describe('ScheduleSectionComponent', () => {
  let spectator: Spectator<ScheduleSectionComponent>;
  let loader: HarnessLoader;
  let form: IxFieldsetHarness;
  const createComponent = createComponentFactory({
    component: ScheduleSectionComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(LanguageService),
      mockProvider(LocaleService),
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
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFieldsetHarness);
  });

  it('shows schedule fields when Schedule checkbox is ticked', async () => {
    expect(await form.getLabels()).toEqual(['Run Automatically', 'Schedule']);

    await form.fillForm({
      Schedule: true,
    });

    expect(await form.getLabels()).toEqual([
      'Run Automatically',
      'Schedule',
      'Frequency',
      'Only Replicate Snapshots Matching Schedule',
    ]);
  });

  it('shows Begin and End fields when Hourly frequency is selected', async () => {
    await form.fillForm(
      {
        Schedule: true,
        Frequency: '0 * * * *',
      },
    );

    expect(await form.getLabels()).toEqual([
      'Run Automatically',
      'Schedule',
      'Frequency',
      'Begin',
      'End',
      'Only Replicate Snapshots Matching Schedule',
    ]);
  });

  it('shows defaults when creating a new replication', async () => {
    expect(await form.getValues()).toEqual({
      'Run Automatically': true,
      Schedule: false,
    });
  });

  it('shows existing values when editing a replication', async () => {
    spectator.setInput('replication', {
      auto: true,
      schedule: {
        minute: '0',
        hour: '0',
        dom: '*',
        month: '*',
        dow: '*',
        begin: '10:00',
        end: '18:00',
      },
      only_matching_schedule: true,
    } as ReplicationTask);

    expect(await form.getValues()).toEqual({
      'Run Automatically': true,
      Schedule: true,
      Frequency: 'Daily (0 0 * * *)  At 00:00 (12:00 AM)',
      'Only Replicate Snapshots Matching Schedule': true,
    });
  });

  it('returns payload when getPayload() is called', async () => {
    spectator.setInput('replication', {
      auto: true,
      schedule: {
        minute: '0',
        hour: '0',
        dom: '*/2',
        month: '*',
        dow: '*',
      },
      only_matching_schedule: true,
    } as ReplicationTask);

    expect(await form.getValues()).toEqual({
      'Run Automatically': true,
      Schedule: true,
      Frequency: 'Custom (0 0 */2 * *) At 12:00 AM, every 2 days',
      'Only Replicate Snapshots Matching Schedule': true,
    });
  });
});
