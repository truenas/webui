import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness, TnCheckboxHarness, TnInputHarness } from '@truenas/ui-components';
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
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
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
  const componentRef: SlideInRef<Cronjob | undefined, unknown> = {
    close: jest.fn(),
    getData: jest.fn((): undefined => undefined),
    requireConfirmationWhen: jest.fn(),
  };

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );

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
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(UserService, {
        userQueryDsCache: () => of([
          { username: 'root' },
          { username: 'steven' },
        ] as User[]),
        getUserByName: (username: string) => of({ username } as User),
        getUserByNameCached: (username: string) => of({ username } as User),
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
      await (await getInput('description')).setValue('Final cron job');
      await (await getInput('command')).setValue('rm -rf /');
      await (await getCheckbox('stdout')).check();
      await (await getCheckbox('stderr')).check();
      await (await getCheckbox('enabled')).check();
      await form.fillForm({
        'Run As User': 'root',
        Schedule: '0 0 * * *',
      });

      const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
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
      expect(await (await getInput('description')).getValue()).toBe('Important cron job');
      expect(await (await getInput('command')).getValue()).toBe('ls -la');
      expect(await (await getCheckbox('stdout')).isChecked()).toBe(true);
      expect(await (await getCheckbox('stderr')).isChecked()).toBe(false);
      expect(await (await getCheckbox('enabled')).isChecked()).toBe(true);

      const values = await form.getValues();
      expect(values['Run As User']).toBe('root');
      expect(values.Schedule).toBe(
        'Custom At 30 minutes past the hour, every hour, on day 12 of the month, and on Monday, Tuesday, and Wednesday',
      );
    });

    it('edits an existing cron job entry when it is open for editing', async () => {
      await (await getInput('description')).setValue('Updated cron job');
      await (await getCheckbox('enabled')).uncheck();
      await form.fillForm({
        Schedule: '* */2 * * 0-4',
      });

      const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
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
