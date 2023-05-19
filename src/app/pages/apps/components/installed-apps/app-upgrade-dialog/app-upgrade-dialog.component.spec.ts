import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSelectHarness } from '@angular/material/select/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { AppUpgradeDialogComponent } from 'app/pages/apps/components/installed-apps/app-upgrade-dialog/app-upgrade-dialog.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppLoaderService, DialogService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';

const fakeAppInfo = {
  name: 'elastic-search',
  chart_metadata: {
    icon: 'https://images.contentstack.io/v3/assets/bltefdd0b53724fa2ce/blt280217a63b82a734/6202d3378b1f312528798412/elastic-logo.svg',
  },
  id: 'elastic-search',
  human_version: '8.7.0_1.0.1',
  human_latest_version: '8.7.0_1.0.2',
};

const fakeUpgradeSummary = {
  container_images_to_update: {},
  changelog: null as string,
  available_versions_for_upgrade: [
    {
      version: '1.0.2',
      human_version: '8.7.0_1.0.2',
    },
  ],
  item_update_available: true,
  image_update_available: false,
  latest_version: '1.0.2',
  upgrade_version: '1.0.2',
  latest_human_version: '8.7.0_1.0.2',
  upgrade_human_version: '8.7.0_1.0.2',
};

describe('AppUpgradeDialogComponent - test 1', () => {
  let spectator: Spectator<AppUpgradeDialogComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: AppUpgradeDialogComponent,
    imports: [AppLoaderModule, ReactiveFormsModule, FormsModule, ImgFallbackModule],
    providers: [
      mockProvider(MatDialogRef),
      mockProvider(DialogService),
      mockProvider(AppLoaderService),
      mockProvider(ErrorHandlerService),
      mockProvider(ApplicationsService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent(
      {
        providers: [
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              appInfo: fakeAppInfo,
              upgradeSummary: fakeUpgradeSummary,
            },
          },
        ],
      },
    );
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows title as application name', () => {
    expect(spectator.query('.chart-name').textContent).toBe('elastic-search');
  });

  it('shows current application version', () => {
    expect(spectator.query('.version').textContent).toBe(' 8.7.0_1.0.1');
  });

  it('shows application image', () => {
    expect(spectator.query('img').getAttribute('src')).toBe('https://images.contentstack.io/v3/assets/bltefdd0b53724fa2ce/blt280217a63b82a734/6202d3378b1f312528798412/elastic-logo.svg');
  });

  it('shows 2 mat-panels with titles', () => {
    const panelTitles = spectator.queryAll('mat-expansion-panel mat-panel-title');
    expect(panelTitles[0].textContent).toBe(' Images ( to be updated ) ');
    expect(panelTitles[1].textContent).toBe(' Changelog ');
  });

  it('shows 2 mat-panels detail rows with data', () => {
    const panelContent = spectator.queryAll('mat-expansion-panel .detail-row');
    expect(panelContent[0].textContent).toBe(' There are no images requiring upgrade ');
    expect(panelContent[1].textContent).toBe('No Changelog');
  });

  it('shows a list of versions to be upgraded to', async () => {
    const select = await loader.getHarness(MatSelectHarness);
    await select.open();
    const options = await select.getOptions();
    const optionLabels = await parallel(() => options.map((option) => option.getText()));
    expect(optionLabels).toEqual(['8.7.0_1.0.2']);
  });

  it('submits upgrade from 1.0.0 to 1.0.2 version', async () => {
    const upgradeButton = await loader.getHarness(MatButtonHarness.with({ text: 'Upgrade' }));
    await upgradeButton.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith('1.0.2');
  });

  it('closes modal with no upgrades to start if Close button clicked', async () => {
    const upgradeButton = await loader.getHarness(MatButtonHarness.with({ text: 'Close' }));
    await upgradeButton.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });
});
