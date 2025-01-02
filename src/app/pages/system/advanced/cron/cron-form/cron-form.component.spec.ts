import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Cronjob } from 'app/interfaces/cronjob.interface';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { LocaleService } from 'app/modules/language/locale.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { CronFormComponent } from 'app/pages/system/advanced/cron/cron-form/cron-form.component';
import { UserService } from 'app/services/user.service';
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

  const getData = jest.fn(() => existingCronJob);
  const componentRef: SlideInRef<Cronjob, unknown> = {
    close: jest.fn(),
    getData: jest.fn(() => undefined),
    requireConfirmationWhen: jest.fn(),
  };

  const createComponent = createComponentFactory({
    component: CronFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(LocaleService, {
        timezone: 'America/New_York',
      }),
      mockProvider(DialogService),
      mockApi([
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
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: true, error: null })),
        components$: of([]),
      }),
      mockProvider(UserService, {
        userQueryDsCache: () => of([
          { username: 'root' },
          { username: 'steven' },
        ] as User[]),
      }),
      mockProvider(SlideInRef, componentRef),
      mockAuth(),
    ],
  });

  describe('adds new cron job', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('adds a new cron job entry', async () => {
      await form.fillForm({
        Description: 'Final cron job',
        Command: 'rm -rf /',
        'Run As User': 'root',
        'Hide Standard Output': true,
        'Hide Standard Error': true,
        Schedule: '0 0 * * *',
        Enabled: true,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('cronjob.create', [{
        command: 'rm -rf /',
        description: 'Final cron job',
        enabled: true,
        schedule: {
          minute: '0',
          hour: '0',
          dom: '*',
          dow: '*',
          month: '*',
        },
        stderr: true,
        stdout: true,
        user: 'root',
      }]);
      expect(componentRef.close).toHaveBeenCalled();
    });
  });

  describe('edits cron job', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...componentRef, getData }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('shows existing values when cron form is opened to edit existing record', async () => {
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

    it('edits an existing cron job entry when it is open for editing', async () => {
      await form.fillForm({
        Description: 'Updated cron job',
        Schedule: '* */2 * * 0-4',
        Enabled: false,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('cronjob.update', [234, {
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
      expect(componentRef.close).toHaveBeenCalled();
    });
  });
});
