import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSnackBar } from '@angular/material/snack-bar';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of, Subject } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { BootEnvironmentListComponent } from 'app/pages/system/bootenv/bootenv-list/bootenv-list.component';
import { fakeBootEnvironmentsDataSource } from 'app/pages/system/bootenv/test/fake-boot-environments';
import { LocaleService } from 'app/services/locale.service';
import { SlideInService } from 'app/services/slide-in.service';
import { ApiService } from 'app/services/websocket/api.service';

describe('BootEnvironmentListComponent', () => {
  let spectator: Spectator<BootEnvironmentListComponent>;
  let loader: HarnessLoader;
  let websocket: ApiService;
  let table: IxTableHarness;

  const createComponent = createComponentFactory({
    component: BootEnvironmentListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      SearchInput1Component,
    ],
    declarations: [
      FakeFormatDateTimePipe,
    ],
    providers: [
      mockProvider(LocaleService, {
        timezone: 'America/Los_Angeles',
      }),
      mockApi([
        mockCall('boot.environment.query', fakeBootEnvironmentsDataSource),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(MatSnackBar),
      mockProvider(SlideInService, {
        onClose$: new Subject<unknown>(),
        open: jest.fn(),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    websocket = spectator.inject(ApiService);
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
    ];

    expect(websocket.call).toHaveBeenCalledWith('boot.environment.query');
    expect(cells).toEqual(expectedRows);
  });
});
