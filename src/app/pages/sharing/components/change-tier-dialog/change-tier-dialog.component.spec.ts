import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { CallResponse } from '@truenas/api-client';
import { TnBannerHarness, TnButtonHarness, TnCheckboxHarness } from '@truenas/ui-components';
import {
  EMPTY, Observable, catchError,
} from 'rxjs';
import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';
import { mockTypedApi, mockTypedCall, mockTypedQuery } from 'app/core/testing/utils/mock-typed-api.utils';
import { DatasetTier } from 'app/enums/dataset-tier.enum';
import { LoaderService } from 'app/modules/loader/loader.service';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
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
      mockTypedApi([
        mockTypedCall('zpool.query', []),
        mockTypedQuery('pool.dataset.query', []),
        mockTypedQuery('sharing.smb.query', []),
        mockTypedQuery('sharing.nfs.query', []),
        mockTypedQuery('sharing.webshare.query', []),
        mockTypedQuery('sharing.s3.query', []),
      ]),
      { provide: DIALOG_DATA, useValue: dialogData },
      mockProvider(DialogRef),
    ],
  });

  function setShares(shares: {
    smb?: { id: number; name: string }[];
    nfs?: { id: number }[];
    webshare?: { id: number; name: string }[];
    s3?: { id: number; name: string }[];
  }): void {
    const mockService = spectator.inject(MockTypedApiService);
    mockService.mockQuery('sharing.smb.query', shares.smb ?? []);
    mockService.mockQuery('sharing.nfs.query', shares.nfs ?? []);
    mockService.mockQuery('sharing.webshare.query', shares.webshare ?? []);
    mockService.mockQuery('sharing.s3.query', shares.s3 ?? []);
  }

  beforeEach(() => {
    spectator = createComponent({ detectChanges: false });
  });

  // The value moved into its own <span> to carry a test id, which left a whitespace-only text node
  // between it and the label — and `preserveWhitespaces: false` deletes those, rendering
  // "Dataset:tank/SHARE". `&ngsp;` on the </strong> is what keeps the space.
  it('renders the dataset name separated from its label', async () => {
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(spectator.query('.dataset-name')).toHaveText('Dataset: tank/SHARE');
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
    spectator.detectChanges();

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

  it('lists S3 buckets that live on the dataset', async () => {
    setShares({ s3: [{ id: 1, name: 'photos' }] });
    spectator.detectChanges();
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    const block = spectator.query('.share-usage');
    expect(block).not.toBeNull();
    expect(block.textContent).toContain('S3 Bucket');
    expect(block.textContent).toContain('photos');
  });

  it('pluralizes a single NFS share as "1 share"', async () => {
    setShares({ nfs: [{ id: 1 }] });
    spectator.detectChanges();
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    const block = spectator.query('.share-usage');
    expect(block.textContent).toContain('1 share');
  });

  it('omits service headings with no shares', async () => {
    setShares({ smb: [{ id: 1, name: 'OnlySmb' }] });
    spectator.detectChanges();
    await spectator.fixture.whenStable();
    spectator.detectChanges();

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
      mockTypedApi([
        mockTypedCall('zpool.query', []),
        mockTypedQuery('pool.dataset.query', []),
        mockTypedQuery('sharing.smb.query', []),
        mockTypedQuery('sharing.nfs.query', []),
        mockTypedQuery('sharing.webshare.query', []),
        mockTypedQuery('sharing.s3.query', []),
      ]),
      { provide: DIALOG_DATA, useValue: dialogData },
      mockProvider(DialogRef),
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
    spectator.inject(MockTypedApiService).mockCallError('zpool.query');
    spectator.detectChanges();
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const applyButton = await loader.getHarness(TnButtonHarness.with({ label: 'Apply' }));
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
      mockTypedApi([
        mockTypedCall('zpool.query', [{
          name: 'tank',
          properties: {
            class_normal_available: { value: 1024 * 1024 * 1024 * 4 }, // 4 GiB
            class_special_available: { value: 1024 * 1024 * 1024 * 2 }, // 2 GiB
          },
        }] as unknown as CallResponse<WebUiApiDirectory, 'zpool.query'>),
        mockTypedQuery('pool.dataset.query', [{
          id: 'tank/SHARE',
          usedbydataset: { parsed: 1024 * 1024 * 512 }, // 512 MiB
          usedbysnapshots: { parsed: 0 },
        }] as WebUiQueryEntity<'pool.dataset.query'>[]),
        mockTypedQuery('sharing.smb.query', []),
        mockTypedQuery('sharing.nfs.query', []),
        mockTypedQuery('sharing.webshare.query', []),
        mockTypedQuery('sharing.s3.query', []),
      ]),
      { provide: DIALOG_DATA, useValue: dialogData },
      mockProvider(DialogRef),
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
    spectator.inject(MockTypedApiService).mockQuery('pool.dataset.query', [{
      id: 'tank/SHARE',
      usedbydataset: { parsed: 1024 },
      usedbysnapshots: { parsed: 4096 },
    }] as WebUiQueryEntity<'pool.dataset.query'>[]);
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(spectator.component.hasSnapshots()).toBe(true);
  });
});

describe('ChangeTierDialogComponent — apply', () => {
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
      mockTypedApi([
        mockTypedCall('zpool.query', []),
        mockTypedQuery('pool.dataset.query', []),
        mockTypedQuery('sharing.smb.query', []),
        mockTypedQuery('sharing.nfs.query', []),
        mockTypedQuery('sharing.webshare.query', []),
        mockTypedQuery('sharing.s3.query', []),
        mockTypedCall('zfs.tier.dataset_set_tier', null),
      ]),
      { provide: DIALOG_DATA, useValue: dialogData },
      mockProvider(DialogRef),
      mockProvider(LoaderService, {
        withLoader: <T>() => (source$: Observable<T>) => source$,
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({ detectChanges: false });
    spectator.detectChanges();
    await spectator.fixture.whenStable();
    spectator.detectChanges();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('warns that the tier takes effect immediately, and that cancelling the migration does not undo it', async () => {
    const banner = await loader.getHarness(TnBannerHarness);

    expect(await banner.getText()).toContain('Changing the tier takes effect immediately');
    expect(await banner.getText()).toContain(
      'Data migration can be cancelled while it runs, but cancelling does not undo the tier change',
    );
  });

  it('drops the migration half of the warning when existing data is not moved', async () => {
    const moveExistingData = await loader.getHarness(TnCheckboxHarness.with({ label: 'Move existing data' }));
    await moveExistingData.uncheck();

    const banner = await loader.getHarness(TnBannerHarness);

    expect(await banner.getText()).toContain('Changing the tier takes effect immediately');
    expect(await banner.getText()).not.toContain('Data migration can be cancelled');
  });

  it('sends the new tier with move_existing_data from the checkbox and closes on apply', async () => {
    const moveExistingData = await loader.getHarness(TnCheckboxHarness.with({ label: 'Move existing data' }));
    await moveExistingData.uncheck();

    const applyButton = await loader.getHarness(TnButtonHarness.with({ label: 'Apply' }));
    await applyButton.click();

    expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('zfs.tier.dataset_set_tier', [{
      dataset_name: 'tank/SHARE',
      tier_type: DatasetTier.Performance,
      move_existing_data: false,
    }]);
    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
  });
});
