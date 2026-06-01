import {
  ChangeDetectorRef, DestroyRef, Injectable, signal, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TnDialog, tnIconMarker } from '@truenas/ui-components';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import {
  EMPTY, Observable, auditTime, catchError, filter, map, of, retry, shareReplay, tap, timer,
} from 'rxjs';
import { DatasetTier } from 'app/enums/dataset-tier.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { Role } from 'app/enums/role.enum';
import { SharingTierInfo, ZfsTierConfig, ZfsTierRewriteJobEntry } from 'app/interfaces/zfs-tier.interface';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ChangeTierDialogComponent, ChangeTierDialogData,
} from 'app/pages/sharing/components/change-tier-dialog/change-tier-dialog.component';
import { tierColumnCssClass } from 'app/pages/sharing/components/storage-tier-cell/storage-tier-cell.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';


interface TierRow {
  path: string;
  locked?: boolean;
  tier?: SharingTierInfo | null;
}

@Injectable({
  providedIn: 'root',
})
export class SharingTierService {
  private api = inject(ApiService);
  private tnDialog = inject(TnDialog);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);

  private tierConfig$: Observable<ZfsTierConfig> | null = null;
  private tierEnabledSignal = signal(false);
  readonly tierEnabled = this.tierEnabledSignal.asReadonly();

  private metadataReservePctSignal = signal(0);
  /**
   * Percentage of special-vdev usable capacity reserved for metadata. Defaults to
   * 0 and is only populated once `getTierConfig()` has been subscribed somewhere
   * in the component tree (the pools dashboard primes it for the cards). Read it
   * directly only from components that live under such a subscriber.
   */
  readonly metadataReservePct = this.metadataReservePctSignal.asReadonly();

  getTierConfig(): Observable<ZfsTierConfig> {
    if (!this.tierConfig$) {
      // Auto-retry transient failures (websocket reconnect at boot, slow
      // middleware) with backoff before caching the "tiering off" fallback.
      // After retries are exhausted the fallback is cached and replayed to
      // future subscribers — `invalidate()` (called after the tiering config
      // form saves) is the only way to force another live fetch.
      this.tierConfig$ = this.api.call('zfs.tier.config').pipe(
        // 1s, 2s, 4s exponential backoff before giving up.
        retry({ count: 3, delay: (_err, attempt) => timer(2 ** (attempt - 1) * 1000) }),
        catchError(() => of({ enabled: false } as ZfsTierConfig)),
        tap((config) => {
          this.tierEnabledSignal.set(config.enabled);
          this.metadataReservePctSignal.set(config.special_class_metadata_reserve_pct ?? 0);
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.tierConfig$;
  }

  invalidate(): void {
    this.tierConfig$ = null;
    this.tierEnabledSignal.set(false);
    this.metadataReservePctSignal.set(0);
  }

  subscribeTierJobUpdates(): Observable<ZfsTierRewriteJobEntry> {
    return this.api.subscribe('zfs.tier.rewrite_job_query').pipe(
      map((event) => event.fields),
    );
  }

  tierJobRefreshes$(): Observable<ZfsTierRewriteJobEntry> {
    return this.subscribeTierJobUpdates().pipe(auditTime(500));
  }

  /**
   * Subscribes to the tier config and unhides the `StorageTierCellComponent`
   * column when tiering is enabled.
   *
   * Contract for `getColumns`/`setColumns`:
   *   The caller owns the `columns` array (typically `this.columns` returned from
   *   `createTable(...)`). When tiering is enabled, this method builds a new array
   *   (via `Array.map` with a fresh column object for the tier column) and hands
   *   it back through `setColumns`. The caller MUST persist the returned array
   *   (e.g. `setColumns: (cols) => { this.columns = cols; }`) so subsequent reads
   *   via `getColumns` and the ix-table input both observe the unhidden column.
   *
   *   A plain getter/setter is used instead of a reactive `hidden` field because
   *   `ix-table-columns-selector` writes to `column.hidden` directly to support
   *   user-controlled column visibility — making it reactive would break that
   *   flow. The shape also mirrors the existing `(columnsChange)` event on
   *   `ix-table-columns-selector`, which is the codebase's convention for
   *   external mutators of a table's columns array.
   */
  enableTierColumn<T>(opts: {
    destroyRef: DestroyRef;
    cdr: ChangeDetectorRef;
    getColumns: () => Column<T, ColumnComponent<T>>[];
    setColumns: (columns: Column<T, ColumnComponent<T>>[]) => void;
  }): void {
    this.getTierConfig().pipe(takeUntilDestroyed(opts.destroyRef)).subscribe((config) => {
      this.tierEnabledSignal.set(config.enabled);
      if (!config.enabled) return;

      const columns = opts.getColumns();
      const updatedColumns = columns.map((col) => (
        col.cssClass === tierColumnCssClass ? { ...col, hidden: false } : col
      ));
      opts.setColumns(updatedColumns);
      opts.cdr.markForCheck();
    });
  }

  /**
   * Subscribes to tier rewrite job ticks and invokes `reload` whenever a job
   * progresses. Useful for share/dataset lists that show tier job progress.
   */
  wireTierJobRefresh(opts: { destroyRef: DestroyRef; reload: () => void }): void {
    this.tierJobRefreshes$().pipe(takeUntilDestroyed(opts.destroyRef)).subscribe(() => opts.reload());
  }

  /**
   * Side-effect wiring for share list/card components: enables the tier column
   * (via `enableTierColumn`) and reloads on tier job ticks (via
   * `wireTierJobRefresh`). Returns nothing — use `createChangeTierAction`
   * separately for the row action so it can be created at field-init time and
   * referenced from the `columns = createTable([...])` initializer.
   *
   * Call this from `ngOnInit`, NOT a field initializer: it reads the columns
   * array via the `getColumns` callback once the tier config arrives, and the
   * columns array won't exist yet at field-init time if the action is in it.
   */
  attachTierToShareList<T>(opts: {
    destroyRef: DestroyRef;
    cdr: ChangeDetectorRef;
    getColumns: () => Column<T, ColumnComponent<T>>[];
    setColumns: (columns: Column<T, ColumnComponent<T>>[]) => void;
    reload: () => void;
  }): void {
    this.enableTierColumn(opts);
    this.wireTierJobRefresh(opts);
  }

  /**
   * Factory for the "Change Storage Tier" menu action used in share list/card components.
   * The action is hidden when tiering is off, the row has no tier info, or the row is locked.
   */
  createChangeTierAction<T extends TierRow>(opts: {
    destroyRef: DestroyRef;
    reload: () => void;
    requiredRoles?: Role[];
  }): IconActionConfig<T> {
    return {
      iconName: tnIconMarker('swap-horizontal', 'mdi'),
      tooltip: this.translate.instant(T('Change Storage Tier')),
      requiredRoles: opts.requiredRoles,
      hidden: (row) => of(!this.tierEnabled() || !row.tier || Boolean(row.locked)),
      onClick: (row) => {
        this.openChangeTierDialog(row).pipe(
          takeUntilDestroyed(opts.destroyRef),
        ).subscribe(() => opts.reload());
      },
    };
  }

  /**
   * Opens the Change Tier dialog for a share-like row. Returns an Observable
   * that emits once with the truthy dialog result (i.e. the change was confirmed)
   * and completes. Emits nothing if the row is missing tier info; surfaces an
   * error modal if the mount path cannot be parsed.
   */
  openChangeTierDialog(row: TierRow): Observable<unknown> {
    if (!row?.tier || !row.path) {
      return EMPTY;
    }

    if (!row.path.startsWith(`${mntPath}/`)) {
      this.errorHandler.showErrorModal(
        new Error(this.translate.instant(
          T('Cannot change storage tier: share path "{path}" is not under {mntPath}.'),
          { path: row.path, mntPath },
        )),
      );
      return EMPTY;
    }

    const segments = this.datasetFromMountPath(row.path);
    if (!segments.length || segments.some((seg) => !seg)) {
      this.errorHandler.showErrorModal(
        new Error(this.translate.instant(
          T('Cannot change storage tier: dataset path could not be determined from "{path}".'),
          { path: row.path },
        )),
      );
      return EMPTY;
    }
    const [poolName, ...rest] = segments;
    const datasetName = [poolName, ...rest].join('/');

    return this.openChangeTierDialogForDataset({
      datasetName,
      currentTier: row.tier.tier_type,
      poolName,
    });
  }

  /**
   * Opens the Change Tier dialog for a dataset (bypassing share path parsing).
   * Returns an Observable that emits once with the truthy dialog result and completes.
   * Surfaces an error modal and emits nothing if `currentTier` is not a known
   * DatasetTier value, so callers can't open an unusable dialog.
   */
  openChangeTierDialogForDataset(data: ChangeTierDialogData): Observable<unknown> {
    if (data.currentTier !== DatasetTier.Performance && data.currentTier !== DatasetTier.Regular) {
      this.errorHandler.showErrorModal(
        new Error(this.translate.instant(
          T('Cannot change storage tier: current tier "{tier}" is not recognized.'),
          { tier: String(data.currentTier) },
        )),
      );
      return EMPTY;
    }

    return this.tnDialog.open(ChangeTierDialogComponent, {
      data,
    }).closed.pipe(filter(Boolean));
  }

  private datasetFromMountPath(path: string): string[] {
    return path.replace(`${mntPath}/`, '').split('/');
  }
}
