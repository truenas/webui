import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { PoolScrubTask } from 'app/interfaces/pool-scrub.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTableColumnsSelectorComponent,
} from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { ScrubListComponent } from 'app/pages/data-protection/scrub-task/scrub-list/scrub-list.component';
import { ScrubTaskFormComponent } from 'app/pages/data-protection/scrub-task/scrub-task-form/scrub-task-form.component';
import { SlideInService } from 'app/services/slide-in.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { selectGeneralConfig, selectSystemConfigState } from 'app/store/system-config/system-config.selectors';

describe('ScrubListComponent', () => {
  let spectator: Spectator<ScrubListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const scrubTasks = [
    {
      id: 1,
      threshold: 35,
      description: 'My task',
      enabled: true,
      pool_name: 'Apps',
      schedule: {
        minute: '00',
        hour: '00',
        dom: '*',
        month: '*',
        dow: '4',
      },
    },
    {
      id: 58,
      threshold: 35,
      description: 'Second task',
      enabled: false,
      pool_name: 'enc',
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
    component: ScrubListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      IxTableColumnsSelectorComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(SlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of() };
        }),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockWebSocket([
        mockCall('pool.scrub.query', scrubTasks),
      ]),
      mockProvider(TaskService, {
        getTaskNextRun: jest.fn(() => 'in about 10 hours'),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectSystemConfigState,
            value: {},
          },
          {
            selector: selectGeneralConfig,
            value: {
              timezone: 'Europe/Kiev',
            },
          },
          {
            selector: selectPreferences,
            value: {},
          },
        ],
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('shows table rows', async () => {
    const expectedRows = [
      [
        'Pool',
        'Threshold Days',
        'Description',
        'Schedule',
        'Frequency',
        'Next Run',
        'Enabled',
        '',
      ],
      [
        'Apps',
        '35',
        'My task',
        '00 00 * * 4',
        'At 12:00 AM, only on Thursday',
        'N/A',
        'Yes',
        '',
      ],
      [
        'enc',
        '35',
        'Second task',
        '00 00 * * 7',
        'At 12:00 AM, only on Sunday',
        'Disabled',
        'No',
        '',
      ],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('opens edit form when Edit icon is pressed', async () => {
    const editIcon = await table.getHarnessInRow(IxIconHarness.with({ name: 'edit' }), 'Apps');
    await editIcon.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(ScrubTaskFormComponent, {
      data: scrubTasks[0],
    });
  });

  it('deletes a network interface with confirmation when Delete icon is pressed', async () => {
    const deleteIcon = await table.getHarnessInRow(IxIconHarness.with({ name: 'mdi-delete' }), 'Apps');
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Delete Task',
    }));
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('pool.scrub.delete', [1]);
  });
});
