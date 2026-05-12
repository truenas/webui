import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  EMPTY, Observable, auditTime, filter, map, shareReplay,
} from 'rxjs';
import { SharingTierInfo, ZfsTierConfig, ZfsTierRewriteJobEntry } from 'app/interfaces/zfs-tier.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ChangeTierDialogComponent, ChangeTierDialogData,
} from 'app/pages/sharing/components/change-tier-dialog/change-tier-dialog.component';

interface TierRow {
  path: string;
  tier?: SharingTierInfo | null;
}

@Injectable({
  providedIn: 'root',
})
export class SharingTierService {
  private api = inject(ApiService);
  private matDialog = inject(MatDialog);

  private tierConfig$: Observable<ZfsTierConfig>;

  getTierConfig(): Observable<ZfsTierConfig> {
    if (!this.tierConfig$) {
      this.tierConfig$ = this.api.call('zfs.tier.config').pipe(
        shareReplay({ bufferSize: 1, refCount: true }),
      );
    }
    return this.tierConfig$;
  }

  invalidate(): void {
    this.tierConfig$ = null;
  }

  subscribeTierJobUpdates(): Observable<ZfsTierRewriteJobEntry> {
    return this.api.subscribe('zfs.tier.rewrite_job_query').pipe(
      map((event) => event.fields),
    );
  }

  /**
   * Throttled stream of tier job updates intended to drive list/card refreshes.
   * Callers should `pipe(takeUntilDestroyed(destroyRef))` and call their refresh.
   */
  tierJobRefreshes$(): Observable<ZfsTierRewriteJobEntry> {
    return this.subscribeTierJobUpdates().pipe(auditTime(500));
  }

  /**
   * Opens the Change Tier dialog for a share-like row. Returns an Observable
   * that emits once with the truthy dialog result (i.e. the change was confirmed)
   * and completes. Emits nothing if the row is missing tier info or has an
   * unusable mount path.
   */
  openChangeTierDialog(row: TierRow): Observable<unknown> {
    if (!row?.tier || !row.path) {
      return EMPTY;
    }

    const [poolName, ...rest] = this.datasetFromMountPath(row.path);
    if (!poolName) {
      return EMPTY;
    }
    const datasetName = [poolName, ...rest].join('/');

    return this.matDialog.open(ChangeTierDialogComponent, {
      data: {
        datasetName,
        currentTier: row.tier.tier_type,
        poolName,
      } as ChangeTierDialogData,
    }).afterClosed().pipe(filter(Boolean));
  }

  private datasetFromMountPath(path: string): string[] {
    return path.replace(/^\/mnt\//, '').split('/');
  }
}
