import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnBannerHarness } from '@truenas/ui-components';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { DatasetTier } from 'app/enums/dataset-tier.enum';
import {
  ChangeTierDialogComponent, ChangeTierDialogData,
} from 'app/pages/sharing/components/change-tier-dialog/change-tier-dialog.component';

describe('ChangeTierDialogComponent — share usage banner', () => {
  let spectator: Spectator<ChangeTierDialogComponent>;
  let loader: HarnessLoader;

  const dialogData: ChangeTierDialogData = {
    datasetName: 'tank/SHARE',
    currentTier: DatasetTier.Regular,
    poolName: 'tank',
  };

  const createComponent = createComponentFactory({
    component: ChangeTierDialogComponent,
    providers: [
      mockApi([
        mockCall('zpool.query', []),
        mockCall('pool.dataset.query', []),
        mockCall('sharing.smb.query', []),
        mockCall('sharing.nfs.query', []),
        mockCall('sharing.webshare.query', []),
      ]),
      { provide: MAT_DIALOG_DATA, useValue: dialogData },
      mockProvider(MatDialogRef),
    ],
  });

  function setShareCounts(counts: { smb: number; nfs: number; webshare: number }): void {
    const mockService = spectator.inject(MockApiService);
    mockService.mockCall('sharing.smb.query', new Array(counts.smb).fill({ id: 1 }));
    mockService.mockCall('sharing.nfs.query', new Array(counts.nfs).fill({ id: 1 }));
    mockService.mockCall('sharing.webshare.query', new Array(counts.webshare).fill({ id: 1 }));
  }

  beforeEach(() => {
    spectator = createComponent({ detectChanges: false });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('does not render the banner when no shares use the dataset', async () => {
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const hasBanner = await loader.hasHarness(
      TnBannerHarness.with({ textContains: /Dataset is in use by shares/ }),
    );
    expect(hasBanner).toBe(false);
  });

  it('renders the banner with a summary of all three share services', async () => {
    setShareCounts({ smb: 1, nfs: 1, webshare: 1 });
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const banner = await loader.getHarness(
      TnBannerHarness.with({ textContains: /Dataset is in use by shares/ }),
    );
    const text = await banner.getText();
    expect(text).toContain('1 SMB share');
    expect(text).toContain('1 NFS export');
    expect(text).toContain('1 Webshare');
  });

  it('pluralizes share counts correctly', async () => {
    setShareCounts({ smb: 2, nfs: 3, webshare: 4 });
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const banner = await loader.getHarness(TnBannerHarness);
    const text = await banner.getText();
    expect(text).toContain('2 SMB shares');
    expect(text).toContain('3 NFS exports');
    expect(text).toContain('4 Webshares');
  });

  it('omits share services with zero count from the summary', async () => {
    setShareCounts({ smb: 2, nfs: 0, webshare: 0 });
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const banner = await loader.getHarness(TnBannerHarness);
    const text = await banner.getText();
    expect(text).toContain('2 SMB shares');
    expect(text).not.toContain('NFS');
    expect(text).not.toContain('Webshare');
  });
});
