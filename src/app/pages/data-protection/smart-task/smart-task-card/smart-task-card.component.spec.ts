import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockPipe } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DiskBus } from 'app/enums/disk-bus.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { SmartTestTaskUi } from 'app/interfaces/smart-test.interface';
import { ScheduleDescriptionPipe } from 'app/modules/dates/pipes/schedule-description/schedule-description.pipe';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxCellScheduleComponent,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-schedule/ix-cell-schedule.component';
import { LocaleService } from 'app/modules/language/locale.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { SmartTaskCardComponent } from 'app/pages/data-protection/smart-task/smart-task-card/smart-task-card.component';
import { SmartTaskFormComponent } from 'app/pages/data-protection/smart-task/smart-task-form/smart-task-form.component';
import { TaskService } from 'app/services/task.service';
import { selectSystemConfigState } from 'app/store/system-config/system-config.selectors';

describe('SmartTaskCardComponent', () => {
  let spectator: Spectator<SmartTaskCardComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const smartTasks = [
    {
      id: 1,
      desc: 'test',
      disks: [
        '{serial_lunid}8HG7MZJH_5000cca2700de678',
        '{serial_lunid}8HG7MLTH_5000cca2700de0c8',
      ],
      type: 'LONG',
      schedule: {
        hour: '0',
        dom: '*',
        month: '*',
        dow: '0',
      },
    },
  ] as SmartTestTaskUi[];

  const disks = [
    {
      identifier: '{serial}6585AC6A1EE9525D',
      name: 'pmem0',
      subsystem: 'nd',
      number: 66309,
      serial: '6585AC6A1EE9525D',
      lunid: null,
      size: 17179865088,
      description: '',
      transfermode: 'Auto',
      hddstandby: 'ALWAYS ON',
      advpowermgmt: 'DISABLED',
      togglesmart: true,
      type: 'SSD',
      zfs_guid: '6853459480607509721',
      bus: DiskBus.Spi,
      devname: 'pmem0',
      supports_smart: null,
      pool: null,
    } as Disk,
  ];

  const slideInRef: SlideInRef<SmartTestTaskUi | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => undefined),
  };

  const createComponent = createComponentFactory({
    component: SmartTaskCardComponent,
    overrideComponents: [
      [
        IxCellScheduleComponent, {
          remove: { imports: [ScheduleDescriptionPipe] },
          add: { imports: [MockPipe(ScheduleDescriptionPipe, jest.fn(() => 'At 00:00, every day'))] },
        },
      ],
    ],
    providers: [
      mockAuth(),
      provideMockStore({
        selectors: [
          {
            selector: selectSystemConfigState,
            value: {},
          },
        ],
      }),
      mockApi([
        mockCall('smart.test.query', smartTasks),
        mockCall('disk.query', disks),
        mockCall('smart.test.delete'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
      }),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockProvider(LocaleService),
      mockProvider(TaskService, {
        getTaskNextTime: jest.fn(() => new Date(new Date().getTime() + (25 * 60 * 60 * 1000))),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Disks', 'Type', 'Description', 'Frequency', 'Next Run', ''],
      [
        '{serial_lunid}8HG7MZJH_5000cca2700de678,{serial_lunid}8HG7MLTH_5000cca2700de0c8',
        'LONG',
        'test',
        'At 00:00, every day',
        'in 1 day',
        '',
      ],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('shows form to edit an existing Smart Task when Edit button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 5);
    await editButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(SmartTaskFormComponent, {
      data: expect.objectContaining(smartTasks[0]),
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('smart.test.query');
  });

  it('shows form to create new Smart Task when Add button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(SmartTaskFormComponent, {
      data: undefined,
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('smart.test.query');
  });

  it('deletes a Smart Task with confirmation when Delete button is pressed', async () => {
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 5);
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Confirmation',
      message: 'Delete S.M.A.R.T. Test <b>"LONG - test"</b>?',
      buttonColor: 'warn',
      buttonText: 'Delete',
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('smart.test.delete', [1]);

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('smart.test.query');
  });
});
