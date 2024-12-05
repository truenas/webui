import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AppState } from 'app/enums/app-state.enum';
import { App } from 'app/interfaces/app.interface';
import { AppUpgradeSummary } from 'app/interfaces/application.interface';
import { CoreBulkQuery } from 'app/interfaces/core-bulk.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { BulkListItemComponent } from 'app/modules/lists/bulk-list-item/bulk-list-item.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { AppBulkUpgradeComponent } from 'app/pages/apps/components/installed-apps/app-bulk-upgrade/app-bulk-upgrade.component';
import { ApiService } from 'app/services/websocket/api.service';

const fakeAppOne = {
  name: 'test-app-one',
  version: '1',
  id: 'test-app-one',
  state: AppState.Running,
  upgrade_available: true,
  human_version: '2022.10_1.0.7',
  metadata: {
    app_version: '2022.10_1.0.8',
    icon: 'path-to-icon',
    train: 'stable',
  },
} as App;

const fakeAppTwo = {
  name: 'test-app-two',
  version: '1',
  id: 'test-app-two',
  state: AppState.Running,
  upgrade_available: true,
  human_version: '25_1.6.33',
  metadata: {
    app_version: '25_1.6.34',
    icon: 'path-to-icon',
    train: 'stable',
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

describe('AppBulkUpgradeComponent', () => {
  let spectator: Spectator<AppBulkUpgradeComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: AppBulkUpgradeComponent,
    imports: [
      ReactiveFormsModule,
      ImgFallbackModule,
      FakeProgressBarComponent,
    ],
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
      mockApi([
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

  it('checks dialog confirmation text', () => {
    expect(spectator.fixture.nativeElement).toHaveText(
      'The following 2 applications will be upgraded. Are you sure you want to proceed?',
    );
  });

  it('checks for the correct payload and success toast', async () => {
    const expandHeader = spectator.query('mat-expansion-panel-header');
    expandHeader.dispatchEvent(new Event('click'));
    spectator.detectChanges();
    const jobArguments: CoreBulkQuery = ['app.upgrade', [
      ['test-app-one', { app_version: '15.3.36' }],
      ['test-app-two'],
    ]];

    const updatedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Upgrade' }));
    await updatedButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('core.bulk', jobArguments);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Upgrading Apps. Please check on the progress in Task Manager.');
  });
});
