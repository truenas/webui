import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSelectHarness } from '@angular/material/select/testing';
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
  changelog: '',
  available_versions_for_upgrade: [
    {
      version: '1.0.2',
      human_version: '8.7.0_1.0.2',
      app_version: '8.7.0',
    },
    {
      version: '1.0.3',
      human_version: '8.7.1_1.0.3',
      app_version: '8.7.1',
    },
  ],
  latest_version: '1.0.2',
  latest_app_version: '8.7.0',
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
    let loader: HarnessLoader;

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
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows title as application name', () => {
      expect(spectator.query('.app-name')!.textContent).toBe('elastic-search');
    });

    it('displays version information with catalog and app versions', () => {
      const versionInfo = spectator.query('.version-info');
      expect(versionInfo).toBeTruthy();

      const versionRows = spectator.queryAll('.version-row');
      expect(versionRows).toHaveLength(1);

      // Only revision row is shown (app version stayed the same)
      expect(versionRows[0].textContent).toContain('Revision');
      expect(versionRows[0].textContent).toContain('1.0.1');
      expect(versionRows[0].textContent).toContain('1.0.2');
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

    it('updates version row when a different version is selected from dropdown', async () => {
      // Initially no version row (app version 8.7.0 -> 8.7.0, no change)
      let versionRows = spectator.queryAll('.version-row');
      expect(versionRows).toHaveLength(1);
      expect(versionRows[0].textContent).toContain('Revision');

      // Select version 1.0.3 which has app version 8.7.1 via the dropdown
      const select = await loader.getHarness(MatSelectHarness);
      await select.open();
      await select.clickOptions({ text: /Revision: 1.0.3/ });
      spectator.detectChanges();

      versionRows = spectator.queryAll('.version-row');
      expect(versionRows).toHaveLength(2);
      expect(versionRows[0].textContent).toContain('Version');
      expect(versionRows[0].textContent).toContain('8.7.1');
      expect(versionRows[1].textContent).toContain('Revision');
      expect(versionRows[1].textContent).toContain('1.0.3');
    });
  });

  describe('with app version change', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(MatDialogRef),
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              appInfo: fakeAppInfo,
              upgradeSummary: {
                ...fakeUpgradeSummary,
                latest_version: '1.0.3',
                latest_app_version: '8.7.1',
                latest_human_version: '8.7.1_1.0.3',
              },
            },
          },
        ],
      });
    });

    it('displays both version and revision rows', () => {
      const versionRows = spectator.queryAll('.version-row');
      expect(versionRows).toHaveLength(2);

      expect(versionRows[0].textContent).toContain('Version');
      expect(versionRows[0].textContent).toContain('8.7.0');
      expect(versionRows[0].textContent).toContain('8.7.1');

      expect(versionRows[1].textContent).toContain('Revision');
      expect(versionRows[1].textContent).toContain('1.0.1');
      expect(versionRows[1].textContent).toContain('1.0.3');
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
