import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Cronjob } from 'app/interfaces/cronjob.interface';
import { User } from 'app/interfaces/user.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { SchedulerModule } from 'app/modules/scheduler/scheduler.module';
import { CronFormComponent } from 'app/pages/system/advanced/cron/cron-form/cron-form.component';
import { DialogService, UserService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

describe('CronFormComponent', () => {
  let spectator: Spectator<CronFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const existingCronJob = {
    id: 234,
    schedule: {
      dom: '12',
      dow: '1,2,3',
      hour: '*',
      minute: '30',
      month: '*',
    },
    description: 'Important cron job',
    enabled: true,
    command: 'ls -la',
    user: 'root',
  } as Cronjob;

  const createComponent = createComponentFactory({
    component: CronFormComponent,
    imports: [
      IxFormsModule,
      SchedulerModule,
      ReactiveFormsModule,
    ],
    providers: [
      DialogService,
      mockWebsocket([
        mockCall('cronjob.create'),
        mockCall('cronjob.update'),
      ]),
      provideMockStore({
        selectors: [
          {
            selector: selectTimezone,
            value: 'America/New_York',
          },
        ],
      }),
      mockProvider(IxSlideInService),
      mockProvider(UserService, {
        userQueryDsCache: () => of([
          { username: 'root' },
          { username: 'steven' },
        ] as User[]),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('shows existing values when cron form is opened to edit existing record', async () => {
    spectator.component.setCronForEdit(existingCronJob);

    const values = await form.getValues();

    expect(values).toEqual({
      Description: 'Important cron job',
      Command: 'ls -la',
      'Run As User': 'root',
      Schedule: 'Custom (30 * 12 * 1,2,3) At 30 minutes past the hour, on day 12 of the month, and on Monday, Tuesday, and Wednesday',
      'Hide Standard Output': true,
      'Hide Standard Error': false,
      Enabled: true,
    });
  });

  it('adds a new cron job entry', async () => {
    await form.fillForm({
      Description: 'Final cron job',
      Command: 'rm -rf /',
      'Run As User': 'root',
      'Hide Standard Output': true,
      'Hide Standard Error': true,
      Schedule: '0-30 */2 2 * 2-3',
      Enabled: true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('cronjob.create', [{
      command: 'rm -rf /',
      description: 'Final cron job',
      enabled: true,
      schedule: {
        minute: '0-30',
        hour: '*/2',
        dom: '2',
        dow: 'tue,wed',
        month: '*',
      },
      stderr: true,
      stdout: true,
      user: 'root',
    }]);
    expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
  });

  it('edits an existing cron job entry when it is open for editing', async () => {
    spectator.component.setCronForEdit(existingCronJob);

    await form.fillForm({
      Description: 'Updated cron job',
      Schedule: '* */2 * * 0-4',
      Enabled: false,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('cronjob.update', [234, {
      command: 'ls -la',
      description: 'Updated cron job',
      enabled: false,
      schedule: {
        minute: '*',
        hour: '*/2',
        dom: '*',
        month: '*',
        dow: 'mon,tue,wed,thu,sun',
      },
      stderr: false,
      stdout: true,
      user: 'root',
    }]);
    expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
  });
});
