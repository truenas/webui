import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SmartTestType } from 'app/enums/smart-test-type.enum';
import { SmartTestTask } from 'app/interfaces/smart-test.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { LocaleService } from 'app/modules/language/locale.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { SmartTaskFormComponent } from 'app/pages/data-protection/smart-task/smart-task-form/smart-task-form.component';
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

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => undefined),
  };

  const createComponent = createComponentFactory({
    component: SmartTaskFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(LocaleService, {
        timezone: 'America/New_York',
      }),
      mockAuth(),
      DialogService,
      mockApi([
        mockCall('smart.test.create'),
        mockCall('smart.test.update'),
        mockCall('smart.test.disk_choices', {
          sda: 'sda',
          sdb: 'sdb',
          sdc: 'sdc',
        }),
      ]),
      mockProvider(SlideIn, {
        components$: of([]),
      }),
      mockProvider(DialogService),
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

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('smart.test.create', [{
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
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });
  });

  describe('edits SMART test', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: () => existingSmartTask }),
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

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('smart.test.update', [5, {
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
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });
  });
});
