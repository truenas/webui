import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  EMPTY, Observable, catchError, of, throwError,
} from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { DatasetTier } from 'app/enums/dataset-tier.enum';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ChangeTierDialogComponent, ChangeTierDialogData,
} from 'app/pages/sharing/components/change-tier-dialog/change-tier-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

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

  it('lists SMB and WebShare share names, and summarizes NFS share count', async () => {
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
    expect(block.textContent).toContain('NFS Share');
    expect(block.textContent).toContain('3 shares');
    expect(block.textContent).toContain('WebShare');
    expect(block.textContent).toContain('projects');
  });

  it('pluralizes a single NFS share as "1 share"', async () => {
    setShares({ nfs: [{ id: 1 }] });
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const block = spectator.query('.share-usage');
    expect(block.textContent).toContain('1 share');
  });

  it('omits service headings with no shares', async () => {
    setShares({ smb: [{ id: 1, name: 'OnlySmb' }] });
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const block = spectator.query('.share-usage');
    expect(block.textContent).toContain('SMB Share');
    expect(block.textContent).not.toContain('NFS Share');
    expect(block.textContent).not.toContain('WebShare');
  });
});

describe('ChangeTierDialogComponent — load failure', () => {
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
      mockProvider(ErrorHandlerService, {
        withErrorHandler: <T>() => (source$: Observable<T>) => source$.pipe(catchError((err: unknown) => {
          spectator.inject(ErrorHandlerService).showErrorModal(err);
          return EMPTY;
        })),
      }),
    ],
  });

  it('disables the Apply button when loadDetails fails', async () => {
    spectator = createComponent({ detectChanges: false });
    const api = spectator.inject(ApiService);
    jest.spyOn(api, 'call').mockImplementation((method) => {
      if (method === 'zpool.query') {
        return throwError(() => new Error('boom')) as ReturnType<ApiService['call']>;
      }
      return of([]) as ReturnType<ApiService['call']>;
    });
    spectator.detectChanges();
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const applyButton = await loader.getHarness(MatButtonHarness.with({ text: 'Apply' }));
    expect(await applyButton.isDisabled()).toBe(true);
    expect(spectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalled();
  });
});

describe('ChangeTierDialogComponent — loadDetails parsing', () => {
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
        mockCall('zpool.query', [{
          name: 'tank',
          properties: {
            class_normal_available: { value: 1024 * 1024 * 1024 * 4 }, // 4 GiB
            class_special_available: { value: 1024 * 1024 * 1024 * 2 }, // 2 GiB
          },
        }]),
        mockCall('pool.dataset.query', [{
          id: 'tank/SHARE',
          usedbydataset: { parsed: 1024 * 1024 * 512 }, // 512 MiB
          usedbysnapshots: { parsed: 0 },
        }]),
        mockCall('sharing.smb.query', []),
        mockCall('sharing.nfs.query', []),
        mockCall('sharing.webshare.query', []),
      ]),
      { provide: MAT_DIALOG_DATA, useValue: dialogData },
      mockProvider(MatDialogRef),
    ],
  });

  it('parses zpool / dataset details into the displayed strings', async () => {
    spectator = createComponent({ detectChanges: false });
    spectator.detectChanges();
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    // currentTier is Regular → currentTierSpace pulls regularAvailable
    expect(spectator.component.regularAvailable()).toBe('4 GiB');
    expect(spectator.component.performanceAvailable()).toBe('2 GiB');
    expect(spectator.component.estimatedRewriteSize()).toBe('512 MiB');
    expect(spectator.component.hasSnapshots()).toBe(false);
  });

  it('flags hasSnapshots when usedbysnapshots > 0', async () => {
    spectator = createComponent({ detectChanges: false });
    spectator.inject(MockApiService).mockCall('pool.dataset.query', [{
      id: 'tank/SHARE',
      usedbydataset: { parsed: 1024 },
      usedbysnapshots: { parsed: 4096 },
    }]);
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(spectator.component.hasSnapshots()).toBe(true);
  });
});
