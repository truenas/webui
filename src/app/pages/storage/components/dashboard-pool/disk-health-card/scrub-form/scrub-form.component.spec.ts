import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness, TnCheckboxHarness, TnInputHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ScrubTask } from 'app/interfaces/pool-scrub.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { LocaleService } from 'app/modules/language/locale.service';
import { SchedulerHarness } from 'app/modules/scheduler/components/scheduler/scheduler.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ScrubFormComponent, ScrubFormParams,
} from 'app/pages/storage/components/dashboard-pool/disk-health-card/scrub-form/scrub-form.component';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

describe('ScrubTaskFormComponent', () => {
  const existingScrubTask = {
    id: 13,
    description: 'Existing task',
    enabled: true,
    pool: 2,
    threshold: 40,
    schedule: {
      minute: '10',
      hour: '15',
      dom: '1,2',
      dow: '7',
      month: '*',
    },
  } as ScrubTask;

  const slideInRef: SlideInRef<ScrubFormParams, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => ({
      poolId: 2,
      existingScrubTask: null as ScrubTask | null,
    })),
  };

  let spectator: Spectator<ScrubFormComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: ScrubFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(LocaleService, {
        timezone: 'America/New_York',
      }),
      mockAuth(),
      mockProvider(DialogService),
      mockApi([
        mockCall('pool.scrub.create'),
        mockCall('pool.scrub.update'),
      ]),
      provideMockStore({
        selectors: [
          {
            selector: selectTimezone,
            value: 'America/New_York',
          },
        ],
      }),
      mockProvider(SlideInRef, slideInRef),
    ],
  });

  function getInput(formControlName: string): Promise<TnInputHarness> {
    return loader.getHarness(TnInputHarness.with({ selector: `[formControlName="${formControlName}"]` }));
  }

  function getCheckbox(formControlName: string): Promise<TnCheckboxHarness> {
    return loader.getHarness(TnCheckboxHarness.with({ selector: `[formControlName="${formControlName}"]` }));
  }

  describe('adds new task when form is opened without an existing task', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('adds new scrub task', async () => {
      await (await loader.getHarness(SchedulerHarness)).setValue('* * 1,2 * *');
      await (await getInput('threshold')).setValue('30');

      const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.scrub.create', [{
        pool: 2,
        enabled: true,
        schedule: {
          dom: '1,2',
          dow: '*',
          hour: '*',
          minute: '*',
          month: '*',
        },
        threshold: 30,
      }]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });
  });

  describe('edits existing scrub task', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, {
            ...slideInRef,
            getData: jest.fn(() => ({
              existingScrubTask,
              poolId: 2,
            })),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows current values', async () => {
      expect(await (await getCheckbox('enabled')).isChecked()).toBe(true);
      expect(await (await loader.getHarness(SchedulerHarness)).getValue())
        .toBe('Custom At 15:10 (03:10 PM), on day 1 and 2 of the month, and on Sunday');
      expect(await (await getInput('threshold')).getValue()).toBe('40');
    });

    it('edits existing Scrub test task when form is opened for edit', async () => {
      await (await getCheckbox('enabled')).uncheck();
      await (await loader.getHarness(SchedulerHarness)).setValue('0 * * * *');
      await (await getInput('threshold')).setValue('20');

      const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.scrub.update', [13, {
        enabled: false,
        pool: 2,
        schedule: {
          dom: '*',
          dow: '*',
          hour: '*',
          minute: '0',
          month: '*',
        },
        threshold: 20,
      }]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });
  });
});
