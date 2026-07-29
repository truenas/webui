import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnCheckboxHarness } from '@truenas/ui-components';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { LanguageService } from 'app/modules/language/language.service';
import { LocaleService } from 'app/modules/language/locale.service';
import { SchedulerHarness } from 'app/modules/scheduler/components/scheduler/scheduler.harness';
import {
  ScheduleSectionComponent,
} from 'app/pages/data-protection/replication/replication-form/sections/schedule-section/schedule-section.component';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

describe('ScheduleSectionComponent', () => {
  let spectator: Spectator<ScheduleSectionComponent>;
  let loader: HarnessLoader;
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

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const hasCheckbox = async (name: string): Promise<boolean> => {
    return Boolean(await loader.getHarnessOrNull(TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` })));
  };
  const getScheduler = (): Promise<SchedulerHarness> => loader.getHarness(SchedulerHarness);

  it('shows schedule fields when Schedule checkbox is ticked', async () => {
    expect(await hasCheckbox('only_matching_schedule')).toBe(false);

    await (await getCheckbox('schedule')).check();

    expect(await loader.getHarnessOrNull(SchedulerHarness)).not.toBeNull();
    expect(await hasCheckbox('only_matching_schedule')).toBe(true);
  });

  it('shows Begin and End fields when Hourly frequency is selected', async () => {
    await (await getCheckbox('schedule')).check();
    await (await getScheduler()).setValue('0 * * * *');

    expect(spectator.query('[formControlName="schedule_begin"]')).not.toBeNull();
    expect(spectator.query('[formControlName="schedule_end"]')).not.toBeNull();
  });

  it('shows defaults when creating a new replication', async () => {
    expect(await (await getCheckbox('auto')).isChecked()).toBe(true);
    expect(await (await getCheckbox('schedule')).isChecked()).toBe(false);
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

    expect(await (await getCheckbox('auto')).isChecked()).toBe(true);
    expect(await (await getCheckbox('schedule')).isChecked()).toBe(true);
    expect(await (await getScheduler()).getValue()).toBe('Daily At 00:00 (12:00 AM)');
    expect(await (await getCheckbox('only_matching_schedule')).isChecked()).toBe(true);
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

    expect(await (await getScheduler()).getValue()).toBe('Custom At 00:00 (12:00 AM), every 2 days');
    expect(spectator.component.getPayload()).toMatchObject({
      auto: true,
      only_matching_schedule: true,
    });
  });
});
