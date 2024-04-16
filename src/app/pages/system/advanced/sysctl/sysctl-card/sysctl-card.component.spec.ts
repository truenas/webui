import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Tunable } from 'app/interfaces/tunable.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ChainedRef } from 'app/modules/ix-forms/components/ix-slide-in/chained-component-ref';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { IxTableModule } from 'app/modules/ix-table/ix-table.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { TunableFormComponent } from 'app/pages/system/advanced/sysctl/tunable-form/tunable-form.component';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { SysctlCardComponent } from './sysctl-card.component';

describe('SysctlCardComponent', () => {
  let spectator: Spectator<SysctlCardComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

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
      IxTableModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('tunable.query', items),
        mockJob('tunable.delete', fakeSuccessfulJob()),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(IxChainedSlideInService, {
        open: jest.fn(() => of({ response: true, error: null })),
      }),
      mockProvider(ChainedRef, { close: jest.fn() }),
      mockProvider(AdvancedSettingsService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => Promise.resolve()),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
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

    expect(spectator.inject(IxChainedSlideInService).open).toHaveBeenCalledWith(
      TunableFormComponent,
      false,
      expect.objectContaining(items[0]),
    );
  });

  it('deletes a sysctl variable with confirmation when Delete button is pressed', async () => {
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'delete' }), 1, 4);
    await deleteIcon.click();

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('tunable.delete', [1]);
  });
});
