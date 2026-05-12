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
      this.tierConfig$ = this.api.call('zfs.tier.config').pipe(
        tap((config) => this.tierEnabledSignal.set(config.enabled)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.tierConfig$.pipe(
      catchError(() => {
        this.tierConfig$ = null;
        this.tierEnabledSignal.set(false);
        return of({ enabled: false } as ZfsTierConfig);
      }),
    );
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
   * Wires a share list/card to react to tier config + live job updates:
   *   - mirrors the latest tier config to the shared `tierEnabled` signal
   *   - unhides the `StorageTierCellComponent` column when tiering is enabled
   *   - reloads the data provider whenever a tier job ticks
   */
  wireTierColumnUpdates<T>(opts: {
    destroyRef: DestroyRef;
    cdr: ChangeDetectorRef;
    getColumns: () => Column<T, ColumnComponent<T>>[];
    setColumns: (columns: Column<T, ColumnComponent<T>>[]) => void;
    reload: () => void;
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

    this.tierJobRefreshes$().pipe(takeUntilDestroyed(opts.destroyRef)).subscribe(() => opts.reload());
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

    const [poolName, ...rest] = this.datasetFromMountPath(row.path);
    if (!poolName) {
      this.errorHandler.showErrorModal(
        new Error(this.translate.instant(
          T('Cannot change storage tier: pool name could not be determined from path "{path}".'),
          { path: row.path },
        )),
      );
      return EMPTY;
    }
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
   */
  openChangeTierDialogForDataset(data: ChangeTierDialogData): Observable<unknown> {
    return this.matDialog.open(ChangeTierDialogComponent, {
      data,
    }).afterClosed().pipe(filter(Boolean));
  }

  private datasetFromMountPath(path: string): string[] {
    return path.replace(`${mntPath}/`, '').split('/');
  }
}
