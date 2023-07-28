import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { SmartTestType } from 'app/enums/smart-test-type.enum';
import { SmartTestTask } from 'app/interfaces/smart-test.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { SchedulerModule } from 'app/modules/scheduler/scheduler.module';
import { SmartTaskFormComponent } from 'app/pages/data-protection/smart-task/smart-task-form/smart-task-form.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

describe('SmartTaskFormComponent', () => {
  const existingSmartTask = {
    id: 5,
    disks: ['sda', 'sdb'],
    schedule: {
      minute: '10',
      hour: '15',
      dom: '1,2,3',
      dow: '7',
      month: '*',
    },
    desc: 'Existing task',
    type: SmartTestType.Short,
  } as SmartTestTask;

  let spectator: Spectator<SmartTaskFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: SmartTaskFormComponent,
    imports: [
      IxFormsModule,
      SchedulerModule,
      ReactiveFormsModule,
    ],
    providers: [
      DialogService,
      mockWebsocket([
        mockCall('smart.test.create'),
        mockCall('smart.test.update'),
        mockCall('smart.test.disk_choices', {
          sda: 'sda',
          sdb: 'sdb',
          sdc: 'sdc',
        }),
      ]),
      mockProvider(IxSlideInService),
      mockProvider(DialogService),
      provideMockStore({
        selectors: [
          {
            selector: selectTimezone,
            value: 'America/New_York',
          },
        ],
      }),
      mockProvider(IxSlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  describe('adds new SMART test', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('adds new SMART test task', async () => {
      await form.fillForm({
        Disks: ['sdc'],
        Description: 'New task',
        Schedule: '*/2 15 * 2',
        Type: 'LONG',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('smart.test.create', [{
        all_disks: false,
        disks: ['sdc'],
        desc: 'New task',
        schedule: {
          hour: '*/2',
          dom: '15',
          month: '*',
          dow: 'tue',
        },
        type: SmartTestType.Long,
      }]);
      expect(spectator.inject(IxSlideInRef).close).toHaveBeenCalled();
    });
  });

  describe('edits SMART test', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          { provide: SLIDE_IN_DATA, useValue: existingSmartTask },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('shows current values when SMART test form is opened for edit', async () => {
      const formValues = await form.getValues();

      expect(formValues).toEqual({
        'All Disks': false,
        Disks: ['sda', 'sdb'],
        Description: 'Existing task',
        Schedule: 'Custom (10 15 1,2,3 * 7) At 03:10 PM, on day 1, 2, and 3 of the month, and on Sunday',
        Type: 'SHORT',
      });
    });

    it('edits existing SMART test task when form is opened for edit', async () => {
      await form.fillForm({
        'All Disks': true,
        Description: 'Updated task',
        Schedule: '10 * 2 3',
        Type: 'OFFLINE',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('smart.test.update', [5, {
        all_disks: true,
        disks: [],
        desc: 'Updated task',
        schedule: {
          hour: '10',
          dom: '*',
          month: '2',
          dow: 'wed',
        },
        type: SmartTestType.Offline,
      }]);
      expect(spectator.inject(IxSlideInRef).close).toHaveBeenCalled();
    });
  });
});
