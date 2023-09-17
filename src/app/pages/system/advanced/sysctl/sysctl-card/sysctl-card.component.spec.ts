import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Tunable } from 'app/interfaces/tunable.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { TunableFormComponent } from 'app/pages/system/advanced/sysctl/tunable-form/tunable-form.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { SysctlCardComponent } from './sysctl-card.component';

describe('SysctlCardComponent', () => {
  let spectator: Spectator<SysctlCardComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;

  const items = [
    {
      id: 1,
      var: 'zfs_arc_max',
      comment: 'Max ZFS ARC size',
      enabled: true,
      value: '1073741824',
    },
    {
      id: 2,
      var: 'vfs.zfs.arc_min',
      comment: 'Min ZFS ARC size',
      enabled: true,
      value: '10000000',
    },
  ] as Tunable[];

  const createComponent = createComponentFactory({
    component: SysctlCardComponent,
    imports: [
      AppLoaderModule,
      EntityModule,
      IxTable2Module,
    ],
    providers: [
      mockWebsocket([
        mockCall('tunable.query', items),
        mockJob('tunable.delete', fakeSuccessfulJob()),
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
      mockProvider(AdvancedSettingsService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => Promise.resolve()),
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
      ['Var', 'Value', 'Enabled', 'Description', ''],
      [
        'zfs_arc_max',
        '1073741824',
        'Yes',
        'Max ZFS ARC size',
        '',
      ],
      [
        'vfs.zfs.arc_min',
        '10000000',
        'Yes',
        'Min ZFS ARC size',
        '',
      ],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('shows form to edit a sysctl variable when Edit button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 4);
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(TunableFormComponent, {
      data: expect.objectContaining(items[0]),
    });
  });

  it('deletes a sysctl variable with confirmation when Delete button is pressed', async () => {
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'delete' }), 1, 4);
    await deleteIcon.click();

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('tunable.delete', [1]);
  });
});
