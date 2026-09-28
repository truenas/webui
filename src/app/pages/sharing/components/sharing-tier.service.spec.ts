import { DestroyRef } from '@angular/core';
import {
  createServiceFactory, mockProvider, SpectatorService,
} from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { TnDialog } from '@truenas/ui-components';
import { Subject, firstValueFrom, of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { DatasetTier } from 'app/enums/dataset-tier.enum';
import { ZfsTierConfig } from 'app/interfaces/zfs-tier.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ChangeTierDialogComponent,
} from 'app/pages/sharing/components/change-tier-dialog/change-tier-dialog.component';
import { SharingTierService } from 'app/pages/sharing/components/sharing-tier.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('SharingTierService', () => {
  let spectator: SpectatorService<SharingTierService>;
  const matDialogOpen = jest.fn(() => ({ closed: of(true) }));

  const createService = createServiceFactory({
    service: SharingTierService,
    providers: [
      mockApi([]),
      mockProvider(TnDialog, { open: matDialogOpen }),
      mockProvider(ErrorHandlerService),
      mockProvider(TranslateService, {
        instant: (key: string, params?: Record<string, unknown>) => (
          params ? `${key} ${JSON.stringify(params)}` : key
        ),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    matDialogOpen.mockClear();
  });

  describe('openChangeTierDialog', () => {
    const baseTier = { tier_type: DatasetTier.Regular, tier_job: null };

    it('opens the dialog with parsed dataset name and pool name from a normal mount path', () => {
      spectator.service.openChangeTierDialog({
        path: '/mnt/pool1/dataset/sub',
        tier: baseTier,
      });

      expect(matDialogOpen).toHaveBeenCalledWith(ChangeTierDialogComponent, {
        data: {
          datasetName: 'pool1/dataset/sub',
          currentTier: DatasetTier.Regular,
          poolName: 'pool1',
        },
      });
      expect(spectator.inject(ErrorHandlerService).showErrorModal).not.toHaveBeenCalled();
    });

    it('surfaces an error and does not open the dialog when path is not under /mnt/', () => {
      spectator.service.openChangeTierDialog({
        path: '/var/lib/notmounted',
        tier: baseTier,
      });

      expect(matDialogOpen).not.toHaveBeenCalled();
      expect(spectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalled();
    });

    it('surfaces an error when a malformed double-slash path yields an empty pool name', () => {
      spectator.service.openChangeTierDialog({
        path: '/mnt//pool',
        tier: baseTier,
      });

      expect(matDialogOpen).not.toHaveBeenCalled();
      expect(spectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalled();
    });

    it('surfaces an error when the path contains interior empty segments', () => {
      spectator.service.openChangeTierDialog({
        path: '/mnt/pool//ds',
        tier: baseTier,
      });

      expect(matDialogOpen).not.toHaveBeenCalled();
      expect(spectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalled();
    });

    it('surfaces an error when the path has a trailing slash', () => {
      spectator.service.openChangeTierDialog({
        path: '/mnt/pool/',
        tier: baseTier,
      });

      expect(matDialogOpen).not.toHaveBeenCalled();
      expect(spectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalled();
    });

    it('emits nothing without surfacing an error when row has no tier info', () => {
      spectator.service.openChangeTierDialog({
        path: '/mnt/pool1',
        tier: null,
      });

      expect(matDialogOpen).not.toHaveBeenCalled();
      expect(spectator.inject(ErrorHandlerService).showErrorModal).not.toHaveBeenCalled();
    });
  });

  describe('openChangeTierDialogForDataset', () => {
    it('opens the dialog with the provided normalized payload', () => {
      spectator.service.openChangeTierDialogForDataset({
        datasetName: 'pool1/ds',
        currentTier: DatasetTier.Performance,
        poolName: 'pool1',
      });

      expect(matDialogOpen).toHaveBeenCalledWith(ChangeTierDialogComponent, {
        data: {
          datasetName: 'pool1/ds',
          currentTier: DatasetTier.Performance,
          poolName: 'pool1',
        },
      });
    });

    it('surfaces an error and does not open the dialog when currentTier is not a known DatasetTier', () => {
      spectator.service.openChangeTierDialogForDataset({
        datasetName: 'pool1/ds',
        currentTier: 'BOGUS' as DatasetTier,
        poolName: 'pool1',
      });

      expect(matDialogOpen).not.toHaveBeenCalled();
      expect(spectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalled();
    });
  });

  describe('createChangeDatasetTierAction', () => {
    const destroyRef = { onDestroy: jest.fn() } as unknown as DestroyRef;

    it('opens the dialog for the row dataset without parsing a mount path, then reloads', () => {
      const reload = jest.fn();
      const action = spectator.service.createChangeDatasetTierAction({ destroyRef, reload });

      action.onClick({
        dataset: 'tank/buckets/photos',
        tier: { tier_type: DatasetTier.Performance, tier_job: null },
      });

      expect(matDialogOpen).toHaveBeenCalledWith(ChangeTierDialogComponent, {
        data: {
          datasetName: 'tank/buckets/photos',
          currentTier: DatasetTier.Performance,
          poolName: 'tank',
        },
      });
      expect(reload).toHaveBeenCalled();
    });

    it('does not open the dialog when the row has no tier info', () => {
      const action = spectator.service.createChangeDatasetTierAction({ destroyRef, reload: jest.fn() });

      action.onClick({ dataset: 'tank/buckets/photos', tier: null });

      expect(matDialogOpen).not.toHaveBeenCalled();
    });

    it('hides the action for a row the dialog could not act on', async () => {
      const api = spectator.inject(MockApiService);
      api.mockCall('zfs.tier.config', { enabled: true } as ZfsTierConfig);
      await firstValueFrom(spectator.service.getTierConfig());
      const action = spectator.service.createChangeDatasetTierAction({ destroyRef, reload: jest.fn() });
      const tier = { tier_type: DatasetTier.Regular, tier_job: null };

      expect(await firstValueFrom(action.hidden({ dataset: 'tank/buckets/photos', tier }))).toBe(false);
      expect(await firstValueFrom(action.hidden({ dataset: '', tier }))).toBe(true);
      expect(await firstValueFrom(action.hidden({ dataset: 'tank/x', tier, locked: true }))).toBe(true);
      expect(await firstValueFrom(action.hidden({ dataset: 'tank/x', tier: null }))).toBe(true);
    });
  });

  describe('job wiring', () => {
    const destroyRef = { onDestroy: jest.fn() } as unknown as DestroyRef;
    let jobUpdates$: Subject<{ fields: unknown }>;

    beforeEach(() => {
      jobUpdates$ = new Subject();
      const api = spectator.inject(ApiService);
      jest.spyOn(api, 'subscribe').mockReturnValue(jobUpdates$);
    });

    describe('wireTierJobRefresh', () => {
      beforeEach(() => jest.useFakeTimers());
      afterEach(() => jest.useRealTimers());

      it('calls reload when a tier job event arrives', () => {
        const reload = jest.fn();
        spectator.service.wireTierJobRefresh({ destroyRef, reload });

        // tierJobRefreshes$ pipes through auditTime(500); event becomes a reload after the window.
        jobUpdates$.next({ fields: {} });
        jest.advanceTimersByTime(600);

        expect(reload).toHaveBeenCalledTimes(1);
      });
    });
  });
});
