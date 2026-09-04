import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnCheckboxHarness, TnInputHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Cronjob } from 'app/interfaces/cronjob.interface';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { IxUserComboboxHarness } from 'app/modules/forms/ix-forms/testing/user-group-picker.harnesses';
import { LocaleService } from 'app/modules/language/locale.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { CronFormComponent } from 'app/pages/system/advanced/cron/cron-form/cron-form.component';
import { UserService } from 'app/services/user.service';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

describe('CronFormComponent', () => {
  let spectator: Spectator<CronFormComponent>;
  let closedSpy: jest.SpyInstance;
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

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getRunAsUser = (): Promise<IxUserComboboxHarness> => loader.getHarness(
    IxUserComboboxHarness.with({ selector: '[formControlName="user"]' }),
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
      ...ixFormTestingProviders(),
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
      mockProvider(UserService, {
        userQueryDsCache: () => of([
          { username: 'root' },
          { username: 'steven' },
        ] as User[]),
        getUserByName: (username: string) => of({ username } as User),
        getUserByNameCached: (username: string) => of({ username } as User),
      }),
      mockAuth(),
    ],
  });

  describe('adds new cron job', () => {
    beforeEach(async () => {
      spectator = createComponent();
      closedSpy = jest.spyOn(spectator.component.closed, 'emit');
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('adds a new cron job entry', async () => {
      await (await getInput('description')).setValue('Final cron job');
      await (await getInput('command')).setValue('rm -rf /');
      await (await getCheckbox('stdout')).check();
      await (await getCheckbox('stderr')).check();
      await (await getCheckbox('enabled')).check();
      // `ix-user-combobox` is its own CVA, so IxFormHarness — which resolves
      // only ix-* controls — cannot reach it by label.
      await (await getRunAsUser()).setInputValue('root');
      await (await getRunAsUser()).blur();
      await form.fillForm({
        Schedule: '0 0 * * *',
      });

      // Panel-hosted form: the `<tn-side-panel>` footer owns Save and calls `submit()`.

      spectator.component.submit();

      spectator.detectChanges();

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
      expect(closedSpy).toHaveBeenCalledWith(true);
    });
  });

  describe('edits cron job', () => {
    beforeEach(async () => {
      spectator = createComponent({ props: { editCronjob: existingCronJob } });
      closedSpy = jest.spyOn(spectator.component.closed, 'emit');
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('shows existing values when cron form is opened to edit existing record', async () => {
      expect(await (await getInput('description')).getValue()).toBe('Important cron job');
      expect(await (await getInput('command')).getValue()).toBe('ls -la');
      expect(await (await getCheckbox('stdout')).isChecked()).toBe(true);
      expect(await (await getCheckbox('stderr')).isChecked()).toBe(false);
      expect(await (await getCheckbox('enabled')).isChecked()).toBe(true);

      expect(await (await getRunAsUser()).getInputValue()).toBe('root');

      const values = await form.getValues();
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

      // Panel-hosted form: the `<tn-side-panel>` footer owns Save and calls `submit()`.

      spectator.component.submit();

      spectator.detectChanges();

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
      expect(closedSpy).toHaveBeenCalledWith(true);
    });
  });
});
