import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWebSocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { PoolScrubTask } from 'app/interfaces/pool-scrub.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ScrubTaskCardComponent } from 'app/pages/data-protection/scrub-task/scrub-task-card/scrub-task-card.component';
import { ScrubTaskFormComponent } from 'app/pages/data-protection/scrub-task/scrub-task-form/scrub-task-form.component';
import { LocaleService } from 'app/services/locale.service';
import { SlideInService } from 'app/services/slide-in.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectSystemConfigState } from 'app/store/system-config/system-config.selectors';

describe('ScrubTaskCardComponent', () => {
  let spectator: Spectator<ScrubTaskCardComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const scrubTasks = [
    {
      id: 1,
      threshold: 35,
      description: 'cccc',
      enabled: false,
      pool: 1,
      pool_name: 'APPS',
      schedule: {
        minute: '00',
        hour: '00',
        dom: '*',
        month: '*',
        dow: '7',
      },
    },
  ] as PoolScrubTask[];

  const createComponent = createComponentFactory({
    component: ScrubTaskCardComponent,
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
        mockCall('pool.scrub.query', scrubTasks),
        mockCall('pool.scrub.delete'),
        mockCall('pool.scrub.update'),
        mockCall('cronjob.run'),
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
      ['Pool', 'Description', 'Frequency', 'Next Run', 'Enabled', ''],
      ['APPS', 'cccc', 'At 00:00, only on Sunday', 'Disabled', '', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('shows form to edit an existing Scrub Task when Edit button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 5);
    await editButton.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(ScrubTaskFormComponent, {
      data: expect.objectContaining(scrubTasks[0]),
    });
  });

  it('shows form to create new Scrub Task when Add button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(ScrubTaskFormComponent, {
      data: undefined,
    });
  });

  it('deletes a Scrub Task with confirmation when Delete button is pressed', async () => {
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 5);
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Confirmation',
      message: 'Delete Scrub Task <b>"APPS"</b>?',
    });

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('pool.scrub.delete', [1]);
  });

  it('updates Scrub Task Enabled status once mat-toggle is updated', async () => {
    const toggle = await table.getHarnessInCell(MatSlideToggleHarness, 1, 4);

    expect(await toggle.isChecked()).toBe(false);

    await toggle.check();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith(
      'pool.scrub.update',
      [1, { enabled: true }],
    );
  });
});
