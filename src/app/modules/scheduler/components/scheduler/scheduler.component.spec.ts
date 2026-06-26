import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  createHostFactory, mockProvider, SpectatorHost,
} from '@ngneat/spectator/jest';
import { TnDialog, TnFormFieldHarness, TnSelectHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { SchedulerComponent } from 'app/modules/scheduler/components/scheduler/scheduler.component';
import { SchedulerModalComponent } from 'app/modules/scheduler/components/scheduler-modal/scheduler-modal.component';
import { CrontabExplanationPipe } from 'app/modules/scheduler/pipes/crontab-explanation.pipe';

describe('SchedulerComponent', () => {
  let spectator: SpectatorHost<SchedulerComponent>;
  let loader: HarnessLoader;
  let control: FormControl<string>;
  const createHost = createHostFactory({
    component: SchedulerComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of('0 2 */4 * 0'),
        })),
      }),
    ],
    componentProviders: [
      { provide: CrontabExplanationPipe, useValue: { transform: (crontab: string) => crontab } },
    ],
  });

  beforeEach(() => {
    control = new FormControl<string>('0 0 * * *', { nonNullable: true });
    spectator = createHost(
      `<ix-scheduler
        [formControl]="control"
        [label]="label"
        [required]="required"
        [tooltip]="tooltip"
      ></ix-scheduler>`,
      {
        hostProps: {
          control,
          label: 'Run at',
          required: false,
          tooltip: undefined,
        },
      },
    );
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('renders a label and passes properties to it', async () => {
    spectator.setHostInput('label', 'Apply To Groups');
    spectator.setHostInput('required', true);
    spectator.setHostInput('tooltip', 'Enter the location of the system.');

    const field = await loader.getHarness(TnFormFieldHarness);
    expect(await field.getLabel()).toBe('Apply To Groups');
    expect(await field.isRequired()).toBe(true);
    expect(await field.getTooltip()).toBe('Enter the location of the system.');
  });

  it('shows a list of presets and a custom option', async () => {
    const select = await loader.getHarness(TnSelectHarness);
    await select.open();
    const optionLabels = await select.getOptions();
    expect(optionLabels).toEqual([
      'Hourly At the start of each hour',
      'Daily At 00:00 (12:00 AM)',
      'Weekly On Sundays at 00:00 (12:00 AM)',
      'Monthly On the first day of the month at 00:00 (12:00 AM)',
      'Create Custom schedule',
    ]);
  });

  it('shows current form group value in the select', async () => {
    control.setValue('0 * * * *');
    spectator.detectChanges();

    const select = await loader.getHarness(TnSelectHarness);
    expect(await select.getDisplayText()).toBe('Hourly At the start of each hour');
  });

  it('writes values to form group when preset is selected from the dropdown', async () => {
    const select = await loader.getHarness(TnSelectHarness);
    await select.selectOption('Daily At 00:00 (12:00 AM)');
    expect(control.value).toBe('0 0 * * *');
  });

  it('shows Scheduler modal when custom option is selected', async () => {
    const select = await loader.getHarness(TnSelectHarness);
    await select.selectOption('Create Custom schedule');
    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(
      SchedulerModalComponent,
      {
        width: '760px',
        data: expect.objectContaining({
          crontab: undefined,
          hideMinutes: false,
        }),
      },
    );
  });

  it('writes crontab provided in Scheduler modal when it is closed', async () => {
    const select = await loader.getHarness(TnSelectHarness);
    await select.selectOption('Create Custom schedule');

    expect(control.value).toBe('0 2 */4 * 0');
  });
});
