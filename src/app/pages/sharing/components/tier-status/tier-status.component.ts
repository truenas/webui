import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, inject, input,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnDialog, TnIconComponent, TnTooltipDirective, TnTestIdDirective } from '@truenas/ui-components';
import { catchError, of, switchMap } from 'rxjs';
import { SharingTierInfo } from 'app/interfaces/zfs-tier.interface';
import {
  DataMigrationStatusDialogComponent,
} from 'app/pages/sharing/components/data-migration-status-dialog/data-migration-status-dialog.component';
import { SharingTierService } from 'app/pages/sharing/components/sharing-tier.service';
import {
  getTierJobIcon, getTierJobStatusClass, getTierJobStatusLabelKey, getTierLabelKey, isTierJobRunning,
} from 'app/pages/sharing/components/tier-status.utils';

@Component({
  selector: 'ix-tier-status',
  templateUrl: './tier-status.component.html',
  styleUrls: ['./tier-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    TnIconComponent,
    TnTooltipDirective,
    NgClass,
    TnTestIdDirective,
  ],
})
export class TierStatusComponent {
  private translate = inject(TranslateService);
  private tnDialog = inject(TnDialog);
  private tierService = inject(SharingTierService);

  readonly tier = input<SharingTierInfo | null | undefined>();

  /**
   * The badge renders once per row in the share lists and cards, so a constant id would resolve to
   * every row at once. Scoped to the row's tag there; left empty on the single-instance call site
   * (dataset details), where an empty leading segment is dropped and the id stays
   * `button-migration-status`.
   */
  readonly uniqueRowTag = input('');

  protected tierLabel = computed(() => {
    const key = getTierLabelKey(this.tier()?.tier_type);
    return key ? this.translate.instant(key) : '-';
  });

  /**
   * Only a job that can still change is watched; this badge renders on every share row, so watching
   * settled jobs would open a subscription per row. Derived from the input, not `tierJob()`, to avoid
   * a circular dependency.
   */
  private watchedJobId = computed(() => {
    const job = this.tier()?.tier_job ?? null;
    return job && isTierJobRunning(job) ? job.tier_job_id : null;
  });

  /**
   * The `tier` input isn't refetched during a migration, so the job's own status topic is followed
   * instead. `catchError` is per job because `toSignal` rethrows a stored error on every read, and a
   * template read would break change detection for the whole host; a failed stream falls back to the input.
   */
  private liveJob = toSignal(
    toObservable(this.watchedJobId).pipe(
      switchMap((jobId) => (jobId
        ? this.tierService.subscribeTierJobStatus(jobId).pipe(catchError(() => of(null)))
        : of(null))),
    ),
    { initialValue: null },
  );

  /**
   * Falls back to the input's snapshot until a live event arrives, and ignores
   * live events for a different job — table cells are reused across rows via
   * trackBy, so the previous row's job must never leak into this badge.
   */
  protected tierJob = computed(() => {
    const job = this.tier()?.tier_job ?? null;
    const liveJob = this.liveJob();
    if (job && liveJob && liveJob.tier_job_id === job.tier_job_id) {
      return liveJob;
    }
    return job;
  });

  protected jobIcon = computed(() => getTierJobIcon(this.tierJob()));
  protected jobStatusLabel = computed(() => {
    const key = getTierJobStatusLabelKey(this.tierJob());
    return key ? this.translate.instant(key) : '';
  });

  protected jobStatusClass = computed(() => getTierJobStatusClass(this.tierJob()));

  protected onActivate(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.openMigrationDialog();
  }

  private openMigrationDialog(): void {
    const tier = this.tier();
    const tierJob = this.tierJob();
    if (!tier || !tierJob) return;

    this.tnDialog.open(DataMigrationStatusDialogComponent, {
      data: {
        tierJob,
        targetTier: tier.tier_type,
      },
    });
  }
}
