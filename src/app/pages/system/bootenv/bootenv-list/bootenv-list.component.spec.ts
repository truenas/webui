import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnIconButtonHarness, TnTableHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { BootEnvironment } from 'app/interfaces/boot-environment.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import { BootEnvironmentListComponent } from 'app/pages/system/bootenv/bootenv-list/bootenv-list.component';
import { fakeBootEnvironmentsDataSource } from 'app/pages/system/bootenv/test/fake-boot-environments';

describe('BootEnvironmentListComponent', () => {
  let spectator: Spectator<BootEnvironmentListComponent>;
  let loader: HarnessLoader;
  let api: ApiService;
  let table: TnTableHarness;

  const bootEnvironmentsWithKeep = [
    ...fakeBootEnvironmentsDataSource,
    {
      id: '25.04.0-MASTER-20241020-084512',
      dataset: 'boot-pool/ROOT/25.04.0-MASTER-20241020-084512',
      active: false,
      activated: false,
      created: {
        $date: 1729411512000,
      },
      used_bytes: 3100000000,
      used: '2.88 GiB',
      keep: true,
      can_activate: true,
    } as BootEnvironment,
  ];

  const createComponent = createComponentFactory({
    component: BootEnvironmentListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      BasicSearchComponent,
      FakeFormatDateTimePipe,
    ],
    providers: [
      mockApi([
        mockCall('boot.environment.query', bootEnvironmentsWithKeep),
        mockCall('boot.environment.keep'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(FormSidePanelService, {
        openForm: jest.fn(() => SlideInResult.empty()),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
    table = await loader.getHarness(TnTableHarness);
  });

  it('shows table rows', async () => {
    expect(api.call).toHaveBeenCalledWith('boot.environment.query');

    expect(await table.getHeaderTexts()).toEqual([
      'Name', 'Active', 'Date Created', 'Used Space', 'Keep', '',
    ]);
    expect(await table.getAllRowTexts()).toEqual([
      [
        '25.04.0-MASTER-20241105-224807',
        'Now',
        '2024-11-06 14:05:36',
        '3.13 GiB',
        'No',
        '',
      ],
      [
        '25.04.0-MASTER-20241031-104807',
        'No',
        '2024-10-31 19:55:47',
        '3.05 GiB',
        'No',
        '',
      ],
      [
        '25.04.0-MASTER-20241020-084512',
        'No',
        '2024-10-20 11:05:12',
        '2.89 GiB',
        'Yes',
        '',
      ],
    ]);
  });

  it('shows "Keep" action with outline bookmark icon when keep is false', async () => {
    const keepButtons = await loader.getAllHarnesses(TnIconButtonHarness.with({ name: 'mdi-bookmark-outline' }));
    expect(keepButtons).toHaveLength(2);
  });

  it('shows "Unkeep" action with filled bookmark icon when keep is true', async () => {
    const unkeepButtons = await loader.getAllHarnesses(TnIconButtonHarness.with({ name: 'mdi-bookmark' }));
    expect(unkeepButtons).toHaveLength(1);
  });

  it('calls API to set keep flag when Keep action is clicked', async () => {
    const [keepButton] = await loader.getAllHarnesses(TnIconButtonHarness.with({ name: 'mdi-bookmark-outline' }));
    await keepButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Keep',
      message: 'Keep this Boot Environment?',
      buttonText: 'Set Keep Flag',
    });

    expect(api.call).toHaveBeenCalledWith('boot.environment.keep', [
      { id: '25.04.0-MASTER-20241105-224807', value: true },
    ]);
  });

  it('calls API to remove keep flag when Unkeep action is clicked', async () => {
    const unkeepButton = await loader.getHarness(TnIconButtonHarness.with({ name: 'mdi-bookmark' }));
    await unkeepButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Unkeep',
      message: 'No longer keep this Boot Environment?',
      buttonText: 'Remove Keep Flag',
    });

    expect(api.call).toHaveBeenCalledWith('boot.environment.keep', [
      { id: '25.04.0-MASTER-20241020-084512', value: false },
    ]);
  });

  it('opens the clone form when the Clone action is clicked', async () => {
    const [cloneButton] = await loader.getAllHarnesses(TnIconButtonHarness.with({ name: 'mdi-content-copy' }));
    await cloneButton.click();

    expect(spectator.inject(FormSidePanelService).openForm).toHaveBeenCalledWith(
      expect.anything(),
      { title: 'Clone Boot Environment' },
    );
  });

  it('shows the batch actions toolbar and deletes selected boot environments', async () => {
    await table.toggleRowSelection(1);

    expect(await table.isRowSelected(1)).toBe(true);
    expect(spectator.query('.batch-actions-toolbar')).toBeTruthy();
  });
});
