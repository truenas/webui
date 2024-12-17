import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponent, MockInstance } from 'ng-mocks';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import {
  SchedulerModalConfig,
} from 'app/modules/scheduler/components/scheduler-modal/scheduler-modal-config.interface';
import {
  SchedulerPreviewColumnComponent,
} from 'app/modules/scheduler/components/scheduler-modal/scheduler-preview-column/scheduler-preview-column.component';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';
import { SchedulerModalComponent } from './scheduler-modal.component';

describe('SchedulerModalComponent', () => {
  let spectator: Spectator<SchedulerModalComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SchedulerModalComponent,
    imports: [
      ReactiveFormsModule,
      TooltipComponent,
    ],
    providers: [
      mockProvider(MatDialogRef),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          crontab: '0 2 * * mon',
          hideMinutes: false,
        } as SchedulerModalConfig,
      },
      provideMockStore({
        selectors: [
          {
            selector: selectTimezone,
            value: 'America/New_York',
          },
        ],
      }),
    ],
    declarations: [
      MockComponent(SchedulerPreviewColumnComponent),
    ],
  });

  async function getFormValues(): Promise<Record<string, unknown>> {
    const preset = await loader.getHarness(IxSelectHarness.with({ selector: '.preset-select' }));
    const minutes = await loader.getHarness(IxInputHarness.with({ label: 'Minutes' }));
    const hours = await loader.getHarness(IxInputHarness.with({ label: 'Hours' }));
    const days = await loader.getHarness(IxInputHarness.with({ label: 'Days of Month' }));

    const monthCheckboxes = await loader.getAllHarnesses(MatCheckboxHarness.with({ ancestor: '.months' }));
    const months = await parallel(() => monthCheckboxes.map(async (month) => {
      return await month.isChecked() ? month.getLabelText() : undefined;
    }));

    const daysOfWeekCheckboxes = await loader.getAllHarnesses(MatCheckboxHarness.with({ ancestor: '.weekdays' }));
    const daysOfWeek = await parallel(() => daysOfWeekCheckboxes.map(async (month) => {
      return await month.isChecked() ? month.getLabelText() : undefined;
    }));

    return {
      Preset: await preset.getValue(),
      Minutes: await minutes.getValue(),
      Hours: await hours.getValue(),
      'Days of Month': await days.getValue(),
      Months: months.filter(Boolean),
      'Days of Week': daysOfWeek.filter(Boolean),
    };
  }

  beforeEach(() => {
    // TODO: Workaround for https://github.com/help-me-mom/ng-mocks/issues/8634
    MockInstance(SchedulerPreviewColumnComponent, 'calendar', signal(null));
  });

  describe('base operations', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('sets form values based on the crontab provided', async () => {
      const values = await getFormValues();
      expect(values).toEqual({
        Preset: '',
        Minutes: '0',
        Hours: '2',
        'Days of Month': '*',
        'Days of Week': ['Mon'],
        Months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      });
    });

    it('closes dialog with crontab value when Done is pressed', async () => {
      const doneButton = await loader.getHarness(MatButtonHarness.with({ text: 'Done' }));
      await doneButton.click();

      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith('0 2 * * mon');
    });

    it('shows preview column for the current crontab', () => {
      const previewColumn = spectator.query(SchedulerPreviewColumnComponent);

      expect(previewColumn.crontab).toBe('0 2 * * mon');
      expect(previewColumn.timezone).toBe('America/New_York');
    });

    it('sets form values when preset is selected', async () => {
      const presetSelect = await loader.getHarness(IxSelectHarness.with({ selector: '.preset-select' }));
      await presetSelect.setValue('Weekly');

      const values = await getFormValues();
      expect(values).toEqual({
        Preset: 'Weekly',
        Minutes: '0',
        Hours: '0',
        'Days of Month': '*',
        'Days of Week': ['Sun'],
        Months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      });
    });

    it('updates preview when minutes, hours, days, months or days of week are changed', async () => {
      const minutes = await loader.getHarness(IxInputHarness.with({ label: 'Minutes' }));
      await minutes.setValue('25');

      const hours = await loader.getHarness(IxInputHarness.with({ label: 'Hours' }));
      await hours.setValue('*/2');

      const days = await loader.getHarness(IxInputHarness.with({ label: 'Days of Month' }));
      await days.setValue('2-5');

      const months = await loader.getAllHarnesses(MatCheckboxHarness.with({ ancestor: '.months' }));
      await months[0].uncheck();

      const daysOfWeek = await loader.getAllHarnesses(MatCheckboxHarness.with({ ancestor: '.weekdays' }));
      await daysOfWeek[0].check();

      const previewColumn = spectator.query(SchedulerPreviewColumnComponent);
      expect(previewColumn.crontab).toBe('25 */2 2-5 2,3,4,5,6,7,8,9,10,11,12 mon,sun');
    });

    it('sets day of week portion of crontab to * when all days are selected', async () => {
      const weekdays = await loader.getAllHarnesses(MatCheckboxHarness.with({ ancestor: '.weekdays' }));
      await parallel(() => weekdays.map((weekday) => weekday.check()));

      const previewColumn = spectator.query(SchedulerPreviewColumnComponent);
      expect(previewColumn.crontab).toBe('0 2 * * *');
    });

    it('sets month portion of crontab to * when all months are selected', async () => {
      const months = await loader.getAllHarnesses(MatCheckboxHarness.with({ ancestor: '.months' }));
      await parallel(() => months.map((month) => month.check()));

      const previewColumn = spectator.query(SchedulerPreviewColumnComponent);
      expect(previewColumn.crontab).toBe('0 2 * * mon');
    });

    it('shows an explanation about how DOW and DOM conditions work when both of them are restricted', async () => {
      const daysOfWeek = await loader.getAllHarnesses(MatCheckboxHarness.with({ ancestor: '.weekdays' }));
      await daysOfWeek[0].check();

      const days = await loader.getHarness(IxInputHarness.with({ label: 'Days of Month' }));
      await days.setValue('2-5');

      const explanationSection = spectator.query('.or-condition-explanation');
      expect(explanationSection).toExist();
      expect(explanationSection).toHaveText('or');
    });

    it('updates Preset when other form fields are updated', async () => {
      const presetSelect = await loader.getHarness(IxSelectHarness.with({ selector: '.preset-select' }));
      await presetSelect.setValue('Daily');

      const hours = await loader.getHarness(IxInputHarness.with({ label: 'Hours' }));
      await hours.setValue('2');

      expect(await presetSelect.getValue()).toBe('');

      await hours.setValue('*');

      expect(await presetSelect.getValue()).toBe('Hourly');
    });
  });

  describe('hideMinutes', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              crontab: '0 2 * * mon',
              hideMinutes: true,
            } as SchedulerModalConfig,
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('does not show minutes input when hideMinutes is true', async () => {
      const minutes = await loader.getAllHarnesses(IxInputHarness.with({ label: 'Minutes' }));
      expect(minutes).toHaveLength(0);
    });
  });
});
