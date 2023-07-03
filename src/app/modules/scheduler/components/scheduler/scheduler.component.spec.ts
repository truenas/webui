import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectHarness } from '@angular/material/select/testing';
import { createHostFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockPipe } from 'ng-mocks';
import { of } from 'rxjs';
import { IxLabelComponent } from 'app/modules/ix-forms/components/ix-label/ix-label.component';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { SchedulerComponent } from 'app/modules/scheduler/components/scheduler/scheduler.component';
import { SchedulerModalComponent } from 'app/modules/scheduler/components/scheduler-modal/scheduler-modal.component';
import { CrontabExplanationPipe } from 'app/modules/scheduler/pipes/crontab-explanation.pipe';

describe('SchedulerComponent', () => {
  let spectator: Spectator<SchedulerComponent>;
  let loader: HarnessLoader;
  let control: FormControl<string>;
  const createHost = createHostFactory({
    component: SchedulerComponent,
    imports: [
      ReactiveFormsModule,
      FormsModule,
      IxFormsModule,
    ],
    providers: [
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of('0 2 */4 * 0'),
        })),
      }),
    ],
    declarations: [
      MockPipe(CrontabExplanationPipe),
    ],
  });

  beforeEach(() => {
    control = new FormControl<string>('0 0 * * *');
    spectator = createHost(
      '<ix-scheduler [formControl]="control" label="Run at"></ix-scheduler>',
      { hostProps: { control } },
    );
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('renders a label and passes properties to it', () => {
    spectator.setInput('label', 'Apply To Groups');
    spectator.setInput('required', true);
    spectator.setInput('tooltip', 'Enter the location of the system.');

    const label = spectator.query(IxLabelComponent);
    expect(label).toExist();
    expect(label.label).toBe('Apply To Groups');
    expect(label.required).toBe(true);
    expect(label.tooltip).toBe('Enter the location of the system.');
  });

  it('shows a list of presets and a custom option', async () => {
    const select = await loader.getHarness(MatSelectHarness);
    await select.open();
    const options = await select.getOptions();
    const optionLabels = await parallel(() => options.map((option) => option.getText()));
    expect(optionLabels).toEqual([
      'Hourly (0 * * * *)  At the start of each hour',
      'Daily (0 0 * * *)  At 00:00 (12:00 AM)',
      'Weekly (0 0 * * 0)  On Sundays at 00:00 (12:00 AM)',
      'Monthly (0 0 1 * *)  On the first day of the month at 00:00 (12:00 AM)',
      'Custom  Create custom schedule',
    ]);
  });

  it('shows current form group value in the select', async () => {
    control.setValue('0 2 15-28 * mon');

    const select = await loader.getHarness(MatSelectHarness);
    const currentValue = await select.getValueText();
    spectator.detectChanges();
    expect(currentValue).toBe('Custom (0 2 15-28 * mon)');
  });

  it('writes values to form group when preset is selected from the dropdown', async () => {
    const select = await loader.getHarness(MatSelectHarness);
    await select.open();
    await select.clickOptions({ text: 'Daily (0 0 * * *)  At 00:00 (12:00 AM)' });
    expect(control.value).toBe('0 0 * * *');
  });

  it('shows Scheduler modal when custom option is selected', async () => {
    const select = await loader.getHarness(MatSelectHarness);
    await select.open();
    await select.clickOptions({ text: 'Custom  Create custom schedule' });
    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
      SchedulerModalComponent,
      {
        data: expect.objectContaining({
          crontab: undefined,
          hideMinutes: false,
        }),
      },
    );
  });

  it('writes crontab provided in Scheduler modal when it is closed', async () => {
    const select = await loader.getHarness(MatSelectHarness);
    await select.open();
    await select.clickOptions({ text: 'Custom  Create custom schedule' });

    expect(control.value).toBe('0 2 */4 * 0');
  });
});
