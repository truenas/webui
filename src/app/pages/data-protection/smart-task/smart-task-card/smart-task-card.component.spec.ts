import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { SmartTestTaskUi } from 'app/interfaces/smart-test.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { SmartTaskCardComponent } from 'app/pages/data-protection/smart-task/smart-task-card/smart-task-card.component';
import { SmartTaskFormComponent } from 'app/pages/data-protection/smart-task/smart-task-form/smart-task-form.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LocaleService } from 'app/services/locale.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';

describe('SmartTaskCardComponent', () => {
  let spectator: Spectator<SmartTaskCardComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;

  const smartTasks = [
    {
      id: 1,
      desc: 'test',
      all_disks: false,
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
      next_run: 'in 6 days',
      disksLabel: [
        'sdm,sdb',
      ],
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
      smartoptions: '',
      expiretime: null,
      critical: null,
      difference: null,
      informational: null,
      model: null,
      rotationrate: null,
      type: 'SSD',
      zfs_guid: '6853459480607509721',
      bus: 'UNKNOWN',
      devname: 'pmem0',
      enclosure: null,
      supports_smart: null,
      pool: null,
    } as unknown as Disk,
  ];

  const createComponent = createComponentFactory({
    component: SmartTaskCardComponent,
    imports: [
      AppLoaderModule,
      EntityModule,
      IxTable2Module,
    ],
    providers: [
      mockWebsocket([
        mockCall('smart.test.query', smartTasks),
        mockCall('disk.query', disks),
        mockCall('smart.test.delete'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(IxSlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of() };
        }),
      }),
      mockProvider(IxSlideInRef),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockProvider(LocaleService),
      mockProvider(TaskService, {
        getTaskNextRun: jest.fn(() => 'in 6 days'),
        getTaskCronDescription: jest.fn(() => 'At 00:00, only on Sunday'),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTable2Harness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Disks', 'Type', 'Description', 'Frequency', 'Next Run', ''],
      [
        '{serial_lunid}8HG7MZJH_5000cca2700de678,{serial_lunid}8HG7MLTH_5000cca2700de0c8',
        'LONG',
        'test',
        'At 00:00, only on Sunday',
        'in 6 days',
        '',
      ],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('shows form to edit an existing Smart Task when Edit button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 5);
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(SmartTaskFormComponent, {
      data: expect.objectContaining(smartTasks[0]),
    });
  });

  it('shows form to create new Smart Task when Add button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(SmartTaskFormComponent, {
      data: undefined,
    });
  });

  it('deletes a Smart Task with confirmation when Delete button is pressed', async () => {
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'delete' }), 1, 5);
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Confirmation',
      message: 'Delete S.M.A.R.T. Test <b>\"LONG - test\"</b>?',
    });

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('smart.test.delete', [1]);
  });
});
