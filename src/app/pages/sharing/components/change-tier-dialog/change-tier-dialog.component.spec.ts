import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { DatasetTier } from 'app/enums/dataset-tier.enum';
import {
  ChangeTierDialogComponent, ChangeTierDialogData,
} from 'app/pages/sharing/components/change-tier-dialog/change-tier-dialog.component';

describe('ChangeTierDialogComponent — share usage list', () => {
  let spectator: Spectator<ChangeTierDialogComponent>;

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

  function setShares(shares: {
    smb?: { id: number; name: string }[];
    nfs?: { id: number }[];
    webshare?: { id: number; name: string }[];
  }): void {
    const mockService = spectator.inject(MockApiService);
    mockService.mockCall('sharing.smb.query', shares.smb ?? []);
    mockService.mockCall('sharing.nfs.query', shares.nfs ?? []);
    mockService.mockCall('sharing.webshare.query', shares.webshare ?? []);
  }

  beforeEach(() => {
    spectator = createComponent({ detectChanges: false });
  });

  it('does not render the share usage block when no shares use the dataset', async () => {
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(spectator.query('.share-usage')).toBeNull();
  });

  it('lists SMB and WebShare share names, and summarizes NFS export count', async () => {
    setShares({
      smb: [{ id: 1, name: 'SSDSMB' }, { id: 2, name: 'ssdsmb2' }],
      nfs: [{ id: 1 }, { id: 2 }, { id: 3 }],
      webshare: [{ id: 1, name: 'projects' }],
    });
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const block = spectator.query('.share-usage');
    expect(block).not.toBeNull();
    expect(block.textContent).toContain('SMB Share');
    expect(block.textContent).toContain('SSDSMB');
    expect(block.textContent).toContain('ssdsmb2');
    expect(block.textContent).toContain('NFS Export');
    expect(block.textContent).toContain('3 exports');
    expect(block.textContent).toContain('WebShare');
    expect(block.textContent).toContain('projects');
  });

  it('pluralizes a single NFS export as "1 export"', async () => {
    setShares({ nfs: [{ id: 1 }] });
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const block = spectator.query('.share-usage');
    expect(block.textContent).toContain('1 export');
  });

  it('omits service headings with no shares', async () => {
    setShares({ smb: [{ id: 1, name: 'OnlySmb' }] });
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const block = spectator.query('.share-usage');
    expect(block.textContent).toContain('SMB Share');
    expect(block.textContent).not.toContain('NFS Export');
    expect(block.textContent).not.toContain('WebShare');
  });
});
