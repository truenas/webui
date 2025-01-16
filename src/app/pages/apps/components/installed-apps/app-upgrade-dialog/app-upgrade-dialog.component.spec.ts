import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { AppUpgradeDialogComponent } from 'app/pages/apps/components/installed-apps/app-upgrade-dialog/app-upgrade-dialog.component';

const fakeAppInfo = {
  name: 'elastic-search',
  metadata: {
    icon: 'https://images.contentstack.io/v3/assets/bltefdd0b53724fa2ce/blt280217a63b82a734/6202d3378b1f312528798412/elastic-logo.svg',
  },
  id: 'elastic-search',
  human_version: '8.7.0_1.0.1',
  human_latest_version: '8.7.0_1.0.2',
};

const fakeUpgradeSummary = {
  container_images_to_update: {},
  changelog: '',
  available_versions_for_upgrade: [
    {
      version: '1.0.2',
      human_version: '8.7.0_1.0.2',
    },
  ],
  image_update_available: false,
  latest_version: '1.0.2',
  upgrade_version: '1.0.2',
  latest_human_version: '8.7.0_1.0.2',
  upgrade_human_version: '8.7.0_1.0.2',
};

describe('AppUpgradeDialogComponent', () => {
  let spectator: Spectator<AppUpgradeDialogComponent>;
  const createComponent = createComponentFactory({
    component: AppUpgradeDialogComponent,
    imports: [
      FormsModule,
      ImgFallbackModule,
    ],
    providers: [
      mockProvider(MatDialogRef),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          appInfo: fakeAppInfo,
          upgradeSummary: fakeUpgradeSummary,
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows title as application name', () => {
    expect(spectator.query('.app-name')!.textContent).toBe('elastic-search');
  });
});
