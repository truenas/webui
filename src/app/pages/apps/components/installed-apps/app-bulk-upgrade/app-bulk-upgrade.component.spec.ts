/* eslint-disable */
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AppUpgradeSummary } from 'app/interfaces/application.interface';
import { App } from 'app/interfaces/app.interface';
import { CoreBulkQuery } from 'app/interfaces/core-bulk.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormsModule } from 'app/modules/forms/ix-forms/ix-forms.module';
import { BulkListItemComponent } from 'app/modules/lists/bulk-list-item/bulk-list-item.component';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { AppBulkUpgradeComponent } from 'app/pages/apps/components/installed-apps/app-bulk-upgrade/app-bulk-upgrade.component';
import { WebSocketService } from 'app/services/ws.service';
import { CatalogAppState } from 'app/enums/catalog-app-state.enum';

const fakeAppOne = {
  name: 'test-app-one',
  version: '1',
  id: 'test-app-one',
  state: CatalogAppState.Running,
  upgrade_available: true,
  human_version: '2022.10_1.0.7',
  metadata: {
    icon: 'path-to-icon',
    train: 'stable',
  },
} as App;

const fakeAppTwo = {
  name: 'test-app-two',
  version: '1',
  id: 'test-app-two',
  state: CatalogAppState.Running,
  upgrade_available: true,
  human_version: '25_1.6.33',
  metadata: {
    icon: 'path-to-icon',
    train: 'stable'
  },
} as App;

const fakeUpgradeSummary: AppUpgradeSummary = {
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
  latest_version: '15.3.36',
  upgrade_version: '15.3.36',
  latest_human_version: '24.0.6_15.3.36',
  upgrade_human_version: '24.0.6_15.3.36',
};

// TODO:
describe.skip('AppBulkUpgradeComponent', () => {
  let spectator: Spectator<AppBulkUpgradeComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: AppBulkUpgradeComponent,
    imports: [AppLoaderModule, ReactiveFormsModule, IxFormsModule, ImgFallbackModule],
    declarations: [
      BulkListItemComponent,
      FakeFormatDateTimePipe,
    ],
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: [fakeAppOne, fakeAppTwo],
      },
      mockProvider(MatDialogRef),
      mockProvider(DialogService),
      mockProvider(SnackbarService),
      mockWebSocket([
        mockJob('core.bulk'),
        mockCall('app.upgrade_summary', fakeUpgradeSummary),
        mockJob('app.upgrade', fakeSuccessfulJob(fakeAppOne)),
      ]),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  // TODO:
  it.skip('checks dialog confirmation text', () => {
    expect(spectator.fixture.nativeElement).toHaveText(
      'The following 2 applications will be upgraded. Are you sure you want to proceed?',
    );
  });

  // TODO:
  it.skip('checks for the correct payload and success toast', async () => {
    const jobArguments: CoreBulkQuery = ['app.upgrade', [
      ['test-app-one', { app_version: '1.0.8' }],
      ['test-app-two', { app_version: '1.6.34' }],
    ]];

    const updatedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Upgrade' }));
    await updatedButton.click();

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('core.bulk', jobArguments);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Upgrading Apps. Please check on the progress in Task Manager.');
  });
});
