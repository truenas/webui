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
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import {
  ChangeTierDialogComponent, ChangeTierDialogData,
} from 'app/pages/sharing/components/change-tier-dialog/change-tier-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';


interface TierRow {
  path: string;
  locked?: boolean | null;
  tier?: SharingTierInfo | null;
}

/** A row that names its dataset directly (e.g. an S3 bucket) rather than a share path under /mnt. */
interface DatasetTierRow {
  dataset: string;
  locked?: boolean | null;
  tier?: SharingTierInfo | null;
}

interface ChangeTierActionOptions {
  destroyRef: DestroyRef;
  reload: () => void;
  requiredRoles?: Role[];
}

/**
 * The rewrite job carried by a `zfs.tier.rewrite_job_status` update. The generated event model wraps
 * the entry in `fields` twice and declares only `added`, while middleware sends it under `fields` once
 * and as `changed` (gap 16 in docs/devs/typed-api-client.md), so the wire shape is read here.
 */
function tierJobFromEvent(event: object): ZfsTierRewriteJobEntry | null {
  return (event as { fields?: ZfsTierRewriteJobEntry }).fields ?? null;
}

@Injectable({
  providedIn: 'root',
})
export class SharingTierService {
  private api = inject(TypedApiService);
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
      // future subscribers until `invalidate()` (after the tiering config form
      // saves) or `refresh()` (as a page that shows it opens).
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

  /**
   * Makes the next `getTierConfig()` fetch again, keeping the current values until the answer
   * arrives so a column does not blink out and back. For a page to call as it opens, since tiering
   * can be changed outside this tab.
   */
  refresh(): void {
    this.tierConfig$ = null;
  }

  invalidate(): void {
    this.tierConfig$ = null;
    this.tierEnabledSignal.set(false);
    this.metadataReservePctSignal.set(0);
  }

  /** Every rewrite job change, removals included: a job that goes away changes the rows that showed it. */
  tierJobRefreshes$(): Observable<unknown> {
    return this.api.subscribe('zfs.tier.rewrite_job_query').pipe(auditTime(500));
  }

  /**
   * Live updates for a single rewrite job. Unlike the collection subscription
   * above, this topic replays the job's current state on subscribe and keeps
   * emitting until it reaches a terminal status, so consumers can track a
   * migration they were handed a stale snapshot of.
   *
   * Errors when middleware rejects the id and completes when middleware ends the topic.
   */
  subscribeTierJobStatus(tierJobId: string): Observable<ZfsTierRewriteJobEntry> {
    return this.api.subscribe('zfs.tier.rewrite_job_status', { tier_job_id: tierJobId }).pipe(
      map(tierJobFromEvent),
      filter((job) => job !== null),
    );
  }

  /**
   * Subscribes to tier rewrite job ticks and invokes `reload` whenever a job
   * progresses. Useful for share/dataset lists that show tier job progress.
   *
   * A tn-table list shows its tier column by putting `'tier'` in `displayedColumns` while
   * `tierEnabled()` is set — see the share cards and lists — so there is no column array to mutate
   * here; prime the config with `getTierConfig()` and the membership follows.
   */
  wireTierJobRefresh(opts: { destroyRef: DestroyRef; reload: () => void }): void {
    this.tierJobRefreshes$().pipe(takeUntilDestroyed(opts.destroyRef)).subscribe(() => opts.reload());
  }

  /**
   * Factory for the "Change Storage Tier" menu action used in share list/card components.
   * The action is hidden when tiering is off, the row has no tier info, or the row is locked.
   */
  createChangeTierAction<T extends TierRow>(opts: ChangeTierActionOptions): IconActionConfig<T> {
    return this.buildChangeTierAction<T>(opts, (row) => this.openChangeTierDialog(row));
  }

  /**
   * Same as `createChangeTierAction`, for rows that carry their dataset name instead of a
   * share path, so there is no mount path to parse.
   */
  createChangeDatasetTierAction<T extends DatasetTierRow>(opts: ChangeTierActionOptions): IconActionConfig<T> {
    return this.buildChangeTierAction<T>(opts, (row) => {
      if (!row.tier || !row.dataset) {
        return EMPTY;
      }
      return this.openChangeTierDialogForDataset({
        datasetName: row.dataset,
        currentTier: row.tier.tier_type,
        poolName: row.dataset.split('/')[0],
      });
    }, (row) => !row.dataset);
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

  /**
   * `alsoHidden` lets a caller hide the action for rows its dialog could not act on, so the menu
   * never offers an item that would do nothing.
   */
  private buildChangeTierAction<T extends { locked?: boolean | null; tier?: SharingTierInfo | null }>(
    opts: ChangeTierActionOptions,
    openDialog: (row: T) => Observable<unknown>,
    alsoHidden: (row: T) => boolean = () => false,
  ): IconActionConfig<T> {
    return {
      iconName: tnIconMarker('swap-horizontal', 'mdi'),
      tooltip: this.translate.instant(T('Change Storage Tier')),
      requiredRoles: opts.requiredRoles,
      hidden: (row) => of(!this.tierEnabled() || !row.tier || Boolean(row.locked) || alsoHidden(row)),
      onClick: (row) => {
        openDialog(row).pipe(
          takeUntilDestroyed(opts.destroyRef),
        ).subscribe(() => opts.reload());
      },
    };
  }

  private datasetFromMountPath(path: string): string[] {
    return path.replace(`${mntPath}/`, '').split('/');
  }
}
