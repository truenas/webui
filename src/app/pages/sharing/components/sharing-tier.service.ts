import {
  ChangeDetectorRef, DestroyRef, Injectable, signal, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { tnIconMarker } from '@truenas/ui-components';
import {
  EMPTY, Observable, auditTime, catchError, filter, map, of, shareReplay, tap,
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
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

const tierColumnClass = 'tier-cell';

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
  private matDialog = inject(MatDialog);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);

  private tierConfig$: Observable<ZfsTierConfig> | null = null;
  private tierEnabledSignal = signal(false);
  readonly tierEnabled = this.tierEnabledSignal.asReadonly();

  getTierConfig(): Observable<ZfsTierConfig> {
    if (!this.tierConfig$) {
      // catchError is inside the shareReplay boundary so the fallback is what
      // gets cached and replayed to future subscribers. Transient failures (e.g.
      // a websocket reconnect at boot) will surface as "tiering off" until
      // invalidate() runs — which happens after the tiering config form saves.
      this.tierConfig$ = this.api.call('zfs.tier.config').pipe(
        catchError(() => of({ enabled: false } as ZfsTierConfig)),
        tap((config) => this.tierEnabledSignal.set(config.enabled)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.tierConfig$;
  }

  invalidate(): void {
    this.tierConfig$ = null;
    this.tierEnabledSignal.set(false);
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
   *   A plain getter/setter is used instead of a reactive `hidden` field because
   *   `ix-table-columns-selector` writes to `column.hidden` directly to support
   *   user-controlled column visibility — making it reactive would break that flow.
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
        col.cssClass === tierColumnClass ? { ...col, hidden: false } : col
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
   * Convenience wiring for share list/card components: enables the tier column,
   * subscribes to job refreshes, and returns the "Change Storage Tier" action
   * to drop into the row's action menu. Replaces the three-step boilerplate
   * (`storageTierColumn` + `createChangeTierAction` + `wireTierColumnUpdates`)
   * that previously had to be repeated by every share consumer.
   */
  attachTierToShareList<T extends TierRow>(opts: {
    destroyRef: DestroyRef;
    cdr: ChangeDetectorRef;
    getColumns: () => Column<T, ColumnComponent<T>>[];
    setColumns: (columns: Column<T, ColumnComponent<T>>[]) => void;
    reload: () => void;
    requiredRoles?: Role[];
  }): IconActionConfig<T> {
    this.enableTierColumn(opts);
    this.wireTierJobRefresh(opts);
    return this.createChangeTierAction(opts);
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

    return this.matDialog.open(ChangeTierDialogComponent, {
      data,
    }).afterClosed().pipe(filter(Boolean));
  }

  private datasetFromMountPath(path: string): string[] {
    return path.replace(`${mntPath}/`, '').split('/');
  }
}
