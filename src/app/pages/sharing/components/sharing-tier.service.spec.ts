import { ChangeDetectorRef, DestroyRef } from '@angular/core';
import { TnDialog } from '@truenas/ui-components';
import {
  createServiceFactory, mockProvider, SpectatorService,
} from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { Subject, of } from 'rxjs';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { DatasetTier } from 'app/enums/dataset-tier.enum';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ChangeTierDialogComponent,
} from 'app/pages/sharing/components/change-tier-dialog/change-tier-dialog.component';
import { SharingTierService } from 'app/pages/sharing/components/sharing-tier.service';
import {
  StorageTierCellComponent, tierColumnCssClass,
} from 'app/pages/sharing/components/storage-tier-cell/storage-tier-cell.component';
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

  describe('column / job wiring', () => {
    interface TierRow { tier?: unknown; locked?: boolean }
    const destroyRef = { onDestroy: jest.fn() } as unknown as DestroyRef;
    let cdr: ChangeDetectorRef;
    let jobUpdates$: Subject<{ fields: unknown }>;

    function makeColumns(): Column<TierRow, ColumnComponent<TierRow>>[] {
      return [
        { title: 'Name', cssClass: 'name-cell' },
        { type: StorageTierCellComponent, cssClass: tierColumnCssClass, hidden: true },
      ] as Column<TierRow, ColumnComponent<TierRow>>[];
    }

    beforeEach(() => {
      cdr = { markForCheck: jest.fn() } as unknown as ChangeDetectorRef;
      jobUpdates$ = new Subject();
      const api = spectator.inject(ApiService);
      jest.spyOn(api, 'subscribe').mockReturnValue(jobUpdates$);
    });

    function mockTierConfig(enabled: boolean): void {
      const api = spectator.inject(ApiService);
      jest.spyOn(api, 'call').mockImplementation((method) => {
        if (method === 'zfs.tier.config') {
          return of({ enabled }) as ReturnType<ApiService['call']>;
        }
        return of(null) as ReturnType<ApiService['call']>;
      });
    }

    describe('enableTierColumn', () => {
      it('unhides the tier column when getTierConfig emits enabled=true', () => {
        mockTierConfig(true);
        let columns = makeColumns();
        spectator.service.enableTierColumn<TierRow>({
          destroyRef,
          cdr,
          getColumns: () => columns,
          setColumns: (cols) => { columns = cols; },
        });

        const tierColumn = columns.find((col) => col.cssClass === tierColumnCssClass);
        expect(tierColumn?.hidden).toBe(false);
        expect(cdr.markForCheck).toHaveBeenCalled();
        expect(spectator.service.tierEnabled()).toBe(true);
      });

      it('does not touch the columns array when tiering is disabled', () => {
        mockTierConfig(false);
        const original = makeColumns();
        let columns = original;
        const setColumns = jest.fn((cols: typeof columns) => {
          columns = cols;
        });
        spectator.service.enableTierColumn<TierRow>({
          destroyRef,
          cdr,
          getColumns: () => columns,
          setColumns,
        });

        expect(setColumns).not.toHaveBeenCalled();
        expect(columns).toBe(original);
        const tierColumn = columns.find((col) => col.cssClass === tierColumnCssClass);
        expect(tierColumn?.hidden).toBe(true);
      });
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

    describe('attachTierToShareList', () => {
      beforeEach(() => jest.useFakeTimers());
      afterEach(() => jest.useRealTimers());

      it('bundles enableTierColumn + wireTierJobRefresh', () => {
        mockTierConfig(true);
        const reload = jest.fn();
        let columns = makeColumns();

        spectator.service.attachTierToShareList<TierRow>({
          destroyRef,
          cdr,
          getColumns: () => columns,
          setColumns: (cols) => { columns = cols; },
          reload,
        });

        const tierColumn = columns.find((col) => col.cssClass === tierColumnCssClass);
        expect(tierColumn?.hidden).toBe(false);

        jobUpdates$.next({ fields: {} });
        jest.advanceTimersByTime(600);
        expect(reload).toHaveBeenCalledTimes(1);
      });
    });
  });
});
