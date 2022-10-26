import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockPipe } from 'ng-mocks';
import { BulkListItemComponent } from 'app/core/components/bulk-list-item/bulk-list-item.component';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { CoreBulkQuery, CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { ChartBulkUpgradeComponent } from 'app/pages/applications/dialogs/chart-bulk-upgrade/chart-bulk-upgrade.component';
import { AppLoaderService, DialogService, WebSocketService } from 'app/services';

const mockSuccessBulkResponse = [
  {
    result: [{ status: 'Status: Application test-app-one has been upgraded' }],
    error: null,
  },
  {
    result: [{ status: 'Status: Application test-app-two has been upgraded' }],
    error: null,
  },
] as CoreBulkResponse[];

const mockFailedBulkResponse = [
  {
    result: null,
    error: 'Something went wrong',
  },
  {
    result: null,
    error: 'Something went wrong',
  },
] as CoreBulkResponse[];

const fakeAppsDataSource = [
  {
    name: 'test-app-one',
    version: 1,
    namespace: 'ix-test-app-one',
    id: 'test-app-one',
    catalog: 'OFFICIAL',
    catalog_train: 'charts',
    path: '/mnt/tank/ix-applications/releases/test-pihole',
    dataset: 'tank/ix-applications/releases/test-pihole',
    status: 'ACTIVE',
    history: {},
    update_available: true,
    human_version: '2022.10_1.0.7',
    human_latest_version: '2022.10_1.0.9',
    pod_status: { desired: 1, available: 1 },
    used_ports: [],
    chart_metadata: {
      icon: 'path-to-icon',
    },
    container_images_update_available: false,
  },
  {
    name: 'test-app-two',
    version: 1,
    namespace: 'ix-test-app-one',
    id: 'test-app-two',
    catalog: 'OFFICIAL',
    catalog_train: 'charts',
    path: '/mnt/tank/ix-applications/releases/test-nextcloud',
    dataset: 'tank/ix-applications/releases/test-nextcloud',
    status: 'ACTIVE',
    history: {},
    update_available: false,
    human_version: '25_1.6.15',
    human_latest_version: '25_1.6.35',
    pod_status: { desired: 2, available: 2 },
    used_ports: [],
    chart_metadata: {
      icon: 'path-to-icon',
    },
    container_images_update_available: true,
  },
] as ChartRelease[];

describe('ChartBulkUpgradeComponent', () => {
  let spectator: Spectator<ChartBulkUpgradeComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ChartBulkUpgradeComponent,
    imports: [AppLoaderModule, ReactiveFormsModule, IxFormsModule],
    declarations: [
      BulkListItemComponent,
      MockPipe(
        FormatDateTimePipe,
        jest.fn(() => '2022-31-05 10:52:06'),
      ),
    ],
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: fakeAppsDataSource,
      },
      mockProvider(AppLoaderService),
      mockProvider(MatDialogRef),
      mockProvider(DialogService),
      mockWebsocket([mockJob('core.bulk'), mockCall('chart.release.upgrade')]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('updates selected applications when form is submitted', async () => {
    const jobArguments: CoreBulkQuery = ['chart.release.upgrade', [
      ['test-app-one', { item_version: '2022.10_1.0.9' }],
      ['test-app-two', { item_version: '25_1.6.35' }],
    ]];
    spectator
      .inject(MockWebsocketService)
      .mockJob('core.bulk', fakeSuccessfulJob(mockSuccessBulkResponse, jobArguments));

    expect(spectator.fixture.nativeElement).toHaveText(
      'The following 2 applications will be upgraded. Are you sure you want to proceed?',
    );

    const updatedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Upgrade' }));
    await updatedButton.click();

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('core.bulk', jobArguments);
    expect(spectator.fixture.nativeElement).toHaveText('2 applications has been upgraded.');

    const closeButton = await loader.getHarness(MatButtonHarness.with({ text: 'Close' }));
    await closeButton.click();
  });

  it('checks updating failures of applications when form is submitted', async () => {
    const jobArguments: CoreBulkQuery = ['chart.release.upgrade', [
      ['test-app-one', { item_version: '2022.10_1.0.9' }],
      ['test-app-two', { item_version: '25_1.6.35' }],
    ]];
    spectator
      .inject(MockWebsocketService)
      .mockJob('core.bulk', fakeSuccessfulJob(mockFailedBulkResponse, jobArguments));

    const updateButton = await loader.getHarness(MatButtonHarness.with({ text: 'Upgrade' }));
    await updateButton.click();

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('core.bulk', jobArguments);
    expect(spectator.fixture.nativeElement).toHaveText('Warning: 2 of 2 applications could not be upgraded.');

    const closeButton = await loader.getHarness(MatButtonHarness.with({ text: 'Close' }));
    await closeButton.click();
  });
});
