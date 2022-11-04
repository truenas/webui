import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockPipe } from 'ng-mocks';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { BulkListItemComponent } from 'app/core/components/bulk-list-item/bulk-list-item.component';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { UpgradeSummary } from 'app/interfaces/application.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { CoreBulkQuery, CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { ChartBulkUpgradeComponent } from 'app/pages/applications/dialogs/chart-bulk-upgrade/chart-bulk-upgrade.component';
import { AppLoaderService, DialogService, WebSocketService } from 'app/services';

const mockSuccessBulkResponse = [
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
] as CoreBulkResponse[];

const fakeAppOne = {
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
  update_available: false,
  human_version: '2022.10_1.0.7',
  human_latest_version: '2022.10_1.0.7',
  pod_status: { desired: 1, available: 1 },
  used_ports: [],
  chart_metadata: {
    icon: 'path-to-icon',
  },
  container_images_update_available: false,
} as ChartRelease;

const fakeAppTwo = {
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
  human_version: '25_1.6.33',
  human_latest_version: '25_1.6.36',
  pod_status: { desired: 2, available: 2 },
  used_ports: [],
  chart_metadata: {
    icon: 'path-to-icon',
  },
  container_images_update_available: true,
} as ChartRelease;

const fakeUpgradeSummary: UpgradeSummary = {
  container_images_to_update: {
    '1.0.1': {
      id: '1.0.1',
      update_available: true,
    },
    '1.0.2': {
      id: '1.0.1',
      update_available: true,
    },
  },
  changelog: '<h1>Changelog</h1>',
  available_versions_for_upgrade: [
    {
      version: '15.3.36',
      human_version: '24.0.6_15.3.36',
    },
    {
      version: '15.3.35',
      human_version: '24.0.6_15.3.35',
    },
    {
      version: '15.3.34',
      human_version: '24.0.6_15.3.34',
    },
  ],
  item_update_available: true,
  image_update_available: true,
  latest_version: '15.3.36',
  upgrade_version: '15.3.36',
  latest_human_version: '24.0.6_15.3.36',
  upgrade_human_version: '24.0.6_15.3.36',
};

describe('ChartBulkUpgradeComponent', () => {
  let spectator: Spectator<ChartBulkUpgradeComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ChartBulkUpgradeComponent,
    imports: [AppLoaderModule, ReactiveFormsModule, IxFormsModule, ImgFallbackModule],
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
        useValue: [fakeAppOne, fakeAppTwo],
      },
      mockProvider(AppLoaderService),
      mockProvider(MatDialogRef),
      mockProvider(DialogService),
      mockWebsocket([
        mockJob('core.bulk'),
        mockCall('chart.release.upgrade', fakeAppOne),
        mockCall('chart.release.upgrade_summary', fakeUpgradeSummary),
      ]),
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
