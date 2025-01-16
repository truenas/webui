import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { PoolScrubTask } from 'app/interfaces/pool-scrub.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { LocaleService } from 'app/modules/language/locale.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { ScrubTaskFormComponent } from 'app/pages/data-protection/scrub-task/scrub-task-form/scrub-task-form.component';
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
  } as PoolScrubTask;

  const slideInRef: SlideInRef<PoolScrubTask | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => undefined),
  };

  let spectator: Spectator<ScrubTaskFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: ScrubTaskFormComponent,
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
        mockCall('pool.query', [
          { id: 1, name: 'Poolio' },
          { id: 2, name: 'My pool' },
        ] as Pool[]),
      ]),
      mockProvider(SlideIn, {
        components$: of([]),
      }),
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

  describe('adds new task', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('adds new scrub task', async () => {
      await form.fillForm({
        Pool: 'Poolio',
        'Threshold Days': '30',
        Description: 'New task',
        Schedule: '* * 1,2 * *',
        Enabled: true,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.scrub.create', [{
        pool: 1,
        description: 'New task',
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

  describe('edits task', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: jest.fn(() => existingScrubTask) }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('shows current values when scrub task form is opened for edit', async () => {
      const formValues = await form.getValues();

      expect(formValues).toEqual({
        Pool: 'My pool',
        'Threshold Days': '40',
        Description: 'Existing task',
        Schedule: 'Custom (10 15 1,2 * 7) At 03:10 PM, on day 1 and 2 of the month, and on Sunday',
        Enabled: true,
      });
    });

    it('edits existing SMART test task when form is opened for edit', async () => {
      await form.fillForm({
        Pool: 'Poolio',
        'Threshold Days': '20',
        Description: 'Updated task',
        Schedule: '0 * * * *',
        Enabled: false,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.scrub.update', [13, {
        description: 'Updated task',
        enabled: false,
        pool: 1,
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
