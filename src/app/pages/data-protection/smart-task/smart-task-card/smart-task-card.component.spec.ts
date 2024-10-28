import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWebSocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { DiskBus } from 'app/enums/disk-bus.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { SmartTestTaskUi } from 'app/interfaces/smart-test.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SmartTaskCardComponent } from 'app/pages/data-protection/smart-task/smart-task-card/smart-task-card.component';
import { SmartTaskFormComponent } from 'app/pages/data-protection/smart-task/smart-task-form/smart-task-form.component';
import { LocaleService } from 'app/services/locale.service';
import { SlideInService } from 'app/services/slide-in.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';
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
      cron_schedule: '0 0 * * 0',
      frequency: 'At 00:00, only on Sunday',
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

  const createComponent = createComponentFactory({
    component: SmartTaskCardComponent,
    imports: [
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
      mockWebSocket([
        mockCall('smart.test.query', smartTasks),
        mockCall('disk.query', disks),
        mockCall('smart.test.delete'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of() };
        }),
      }),
      mockProvider(SlideInRef),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockProvider(LocaleService),
      mockProvider(TaskService, {
        getTaskNextTime: jest.fn(() => new Date(new Date().getTime() + (25 * 60 * 60 * 1000))),
        getTaskCronDescription: jest.fn(() => 'At 00:00, only on Sunday'),
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
        'At 00:00, only on Sunday',
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

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(SmartTaskFormComponent, {
      data: expect.objectContaining(smartTasks[0]),
    });

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('smart.test.query');
  });

  it('shows form to create new Smart Task when Add button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(SmartTaskFormComponent, {
      data: undefined,
    });

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('smart.test.query');
  });

  it('deletes a Smart Task with confirmation when Delete button is pressed', async () => {
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 5);
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Confirmation',
      message: 'Delete S.M.A.R.T. Test <b>"LONG - test"</b>?',
    });

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('smart.test.delete', [1]);

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('smart.test.query');
  });
});
