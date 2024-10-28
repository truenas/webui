import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { PoolScrubTask } from 'app/interfaces/pool-scrub.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { ScrubTaskFormComponent } from 'app/pages/data-protection/scrub-task/scrub-task-form/scrub-task-form.component';
import { LocaleService } from 'app/services/locale.service';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
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
      mockWebSocket([
        mockCall('pool.scrub.create'),
        mockCall('pool.scrub.update'),
        mockCall('pool.query', [
          { id: 1, name: 'Poolio' },
          { id: 2, name: 'My pool' },
        ] as Pool[]),
      ]),
      mockProvider(SlideInService),
      provideMockStore({
        selectors: [
          {
            selector: selectTimezone,
            value: 'America/New_York',
          },
        ],
      }),
      mockProvider(SlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  describe('adds new task', () => {
    beforeEach(async () => {
      spectator = createComponent();
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

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('pool.scrub.create', [{
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
          { provide: SLIDE_IN_DATA, useValue: existingScrubTask },
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

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('pool.scrub.update', [13, {
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
