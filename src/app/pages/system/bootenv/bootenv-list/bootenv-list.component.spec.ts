import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSnackBar } from '@angular/material/snack-bar';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnIconHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { BootEnvironment } from 'app/interfaces/boot-environment.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { LocaleService } from 'app/modules/language/locale.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import { BootEnvironmentListComponent } from 'app/pages/system/bootenv/bootenv-list/bootenv-list.component';
import { fakeBootEnvironmentsDataSource } from 'app/pages/system/bootenv/test/fake-boot-environments';

describe('BootEnvironmentListComponent', () => {
  let spectator: Spectator<BootEnvironmentListComponent>;
  let loader: HarnessLoader;
  let api: ApiService;
  let table: IxTableHarness;

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
    ],
    declarations: [
      FakeFormatDateTimePipe,
    ],
    providers: [
      mockProvider(LocaleService, {
        timezone: 'America/Los_Angeles',
      }),
      mockApi([
        mockCall('boot.environment.query', bootEnvironmentsWithKeep),
        mockCall('boot.environment.keep'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(MatSnackBar),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
    table = await loader.getHarness(IxTableHarness);
  });

  it('shows table rows', async () => {
    const cells = await table.getCellTexts();

    const expectedRows = [
      ['', 'Name', 'Active', 'Date Created', 'Used Space', 'Keep', ''],
      [
        '',
        '25.04.0-MASTER-20241105-224807',
        'Now',
        '2024-11-06 04:05:36',
        '3.13 GiB',
        'No',
        '',
      ],
      [
        '',
        '25.04.0-MASTER-20241031-104807',
        'No',
        '2024-10-31 10:55:47',
        '3.05 GiB',
        'No',
        '',
      ],
      [
        '',
        '25.04.0-MASTER-20241020-084512',
        'No',
        '2024-10-20 01:05:12',
        '2.89 GiB',
        'Yes',
        '',
      ],
    ];

    expect(api.call).toHaveBeenCalledWith('boot.environment.query');
    expect(cells).toEqual(expectedRows);
  });

  it('shows "Keep" action with outline bookmark icon when keep is false', async () => {
    const icon = await table.getHarnessInCell(TnIconHarness.with({ name: 'mdi-bookmark-outline' }), 1, 6);
    expect(icon).toBeTruthy();
  });

  it('shows "Unkeep" action with filled bookmark icon when keep is true', async () => {
    const icon = await table.getHarnessInCell(TnIconHarness.with({ name: 'mdi-bookmark' }), 3, 6);
    expect(icon).toBeTruthy();
  });

  it('calls API to set keep flag when Keep action is clicked', async () => {
    const keepIcon = await table.getHarnessInCell(TnIconHarness.with({ name: 'mdi-bookmark-outline' }), 1, 6);
    await keepIcon.click();

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
    const unkeepIcon = await table.getHarnessInCell(TnIconHarness.with({ name: 'mdi-bookmark' }), 3, 6);
    await unkeepIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Unkeep',
      message: 'No longer keep this Boot Environment?',
      buttonText: 'Remove Keep Flag',
    });

    expect(api.call).toHaveBeenCalledWith('boot.environment.keep', [
      { id: '25.04.0-MASTER-20241020-084512', value: false },
    ]);
  });
});
