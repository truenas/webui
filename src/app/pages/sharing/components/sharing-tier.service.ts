import {
  DestroyRef, Injectable, signal, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { TnDialog, tnIconMarker } from '@truenas/ui-components';
import {
  EMPTY, Observable, auditTime, catchError, filter, map, of, retry, shareReplay, tap, timer,
} from 'rxjs';
import { DatasetTier } from 'app/enums/dataset-tier.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { Role } from 'app/enums/role.enum';
import { SharingTierInfo, ZfsTierConfig, ZfsTierRewriteJobEntry } from 'app/interfaces/zfs-tier.interface';
import { IconActionConfig } from 'app/modules/tn-table/interfaces/icon-action-config.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ChangeTierDialogComponent, ChangeTierDialogData,
} from 'app/pages/sharing/components/change-tier-dialog/change-tier-dialog.component';
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
   * Live updates for a single rewrite job. Unlike the collection subscription
   * above, this topic replays the job's current state on subscribe and keeps
   * emitting until it reaches a terminal status, so consumers can track a
   * migration they were handed a stale snapshot of.
   *
   * Topic format is contract'd with middleware: `zfs.tier.rewrite_job_status:<json-args>`,
   * where <json-args> is the JSON-stringified call args. tier_job_id is server-generated
   * and safe to embed without further escaping.
   */
  subscribeTierJobStatus(tierJobId: string): Observable<ZfsTierRewriteJobEntry> {
    return this.api.subscribe(`zfs.tier.rewrite_job_status:${JSON.stringify({ tier_job_id: tierJobId })}`).pipe(
      map((event) => event.fields),
    );
  }

  /**
   * Subscribes to tier rewrite job ticks and invokes `reload` whenever a job
   * progresses. Useful for share/dataset lists that show tier job progress.
   *
   * A tn-table list shows its tier column by putting `'tier'` in `displayedColumns` while
   * `tierEnabled()` is set — see the NFS and SMB cards — so there is no column array to mutate
   * here; prime the config with `getTierConfig()` and the membership follows.
   */
  wireTierJobRefresh(opts: { destroyRef: DestroyRef; reload: () => void }): void {
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
