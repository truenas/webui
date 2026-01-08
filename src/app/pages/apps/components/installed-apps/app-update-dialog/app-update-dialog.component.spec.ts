import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { App } from 'app/interfaces/app.interface';
import { AppUpdateDialog } from 'app/pages/apps/components/installed-apps/app-update-dialog/app-update-dialog.component';

const fakeAppInfo = {
  name: 'elastic-search',
  version: '1.0.1',
  metadata: {
    icon: 'https://images.contentstack.io/v3/assets/bltefdd0b53724fa2ce/blt280217a63b82a734/6202d3378b1f312528798412/elastic-logo.svg',
    app_version: '8.7.0',
    changelog_url: 'https://github.com/elastic/elasticsearch/releases',
  },
  id: 'elastic-search',
  human_version: '8.7.0_1.0.1',
  human_latest_version: '8.7.0_1.0.2',
} as unknown as App;

const fakeUpgradeSummary = {
  container_images_to_update: {},
  changelog: '',
  available_versions_for_upgrade: [
    {
      version: '1.0.2',
      human_version: '8.7.0_1.0.2',
    },
    {
      version: '1.0.3',
      human_version: '8.7.1_1.0.3',
    },
  ],
  image_update_available: false,
  latest_version: '1.0.2',
  upgrade_version: '1.0.2',
  latest_human_version: '8.7.0_1.0.2',
  upgrade_human_version: '8.7.0_1.0.2',
};

describe('AppUpdateDialog', () => {
  let spectator: Spectator<AppUpdateDialog>;
  const createComponent = createComponentFactory({
    component: AppUpdateDialog,
    imports: [
      FormsModule,
      ImgFallbackModule,
    ],
  });

  describe('with multiple versions available', () => {
    beforeEach(() => {
      spectator = createComponent({
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
    });

    it('shows title as application name', () => {
      expect(spectator.query('.app-name')!.textContent).toBe('elastic-search');
    });

    it('displays version information with catalog and app versions', () => {
      const versionInfo = spectator.query('.version-info');
      expect(versionInfo).toBeTruthy();

      const versionRows = spectator.queryAll('.version-row');
      expect(versionRows).toHaveLength(2);

      // Check app version (first row)
      expect(versionRows[0].textContent).toContain('App Version');
      expect(versionRows[0].textContent).toContain('8.7.0');
      expect(versionRows[0].textContent).toContain('8.7.0_1.0.2');

      // Check catalog version (second row)
      expect(versionRows[1].textContent).toContain('Version');
      expect(versionRows[1].textContent).toContain('1.0.1');
      expect(versionRows[1].textContent).toContain('1.0.2');
    });

    it('displays changelog link when changelog_url is present', () => {
      const changelogLink = spectator.query<HTMLAnchorElement>('.changelog-url');
      expect(changelogLink).toBeTruthy();
      expect(changelogLink?.href).toBe('https://github.com/elastic/elasticsearch/releases');
      expect(changelogLink?.getAttribute('target')).toBe('_blank');
      expect(changelogLink?.getAttribute('rel')).toBe('noopener noreferrer');
      expect(changelogLink?.getAttribute('aria-label')).toContain('opens in new window');
    });

    it('shows version dropdown when multiple versions are available', () => {
      const versionDropdown = spectator.query('.resource mat-select');
      expect(versionDropdown).toBeTruthy();
    });
  });

  describe('without changelog URL', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(MatDialogRef),
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              appInfo: { ...fakeAppInfo, metadata: { ...fakeAppInfo.metadata, changelog_url: undefined } },
              upgradeSummary: fakeUpgradeSummary,
            },
          },
        ],
      });
    });

    it('hides changelog link when changelog_url is not present', () => {
      const changelogLink = spectator.query('.changelog-link');
      expect(changelogLink).not.toBeTruthy();
    });
  });

  describe('with single version', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(MatDialogRef),
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              appInfo: fakeAppInfo,
              upgradeSummary: { ...fakeUpgradeSummary, available_versions_for_upgrade: [] },
            },
          },
        ],
      });
    });

    it('hides version dropdown when only one version is available', () => {
      const versionDropdown = spectator.query('.resource mat-select');
      expect(versionDropdown).not.toBeTruthy();
    });
  });
});
