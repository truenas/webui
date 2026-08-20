import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, inject, input,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
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
    MatTooltip,
    NgClass,
  ],
})
export class TierStatusComponent {
  private translate = inject(TranslateService);
  private matDialog = inject(MatDialog);
  private tierService = inject(SharingTierService);

  readonly tier = input<SharingTierInfo | null | undefined>();

  protected tierLabel = computed(() => {
    const key = getTierLabelKey(this.tier()?.tier_type);
    return key ? this.translate.instant(key) : '-';
  });

  /**
   * Only a job that can still change is worth a subscription. A job the payload
   * already reports as settled will never emit again, and `ix-tier-status`
   * renders once per row across the share lists and cards — subscribing for
   * every historical job would open a websocket subscription per row for no
   * gain. Derived from the input snapshot rather than `tierJob()` to avoid a
   * circular signal dependency; the subscription then lives until the row's
   * payload is refetched, which is the same lifetime as the badge itself.
   */
  private watchedJobId = computed(() => {
    const job = this.tier()?.tier_job ?? null;
    return job && isTierJobRunning(job) ? job.tier_job_id : null;
  });

  /**
   * The `tier` input comes from a list/details payload that isn't refetched
   * while a migration runs, so a job that started as RUNNING would keep
   * spinning until the user reloaded the page. Track the job's own status topic
   * instead — it replays current state on subscribe and emits every transition.
   *
   * `catchError` is per-job and deliberate: `toSignal` stores a stream error and
   * re-throws it on every read, and `tierJob()` is read from the template during
   * change detection of whatever hosts the badge. A pruned job id or a rejected
   * subscription would therefore poison CD for the whole host component, so a
   * failed stream degrades to the input snapshot — the pre-fix behaviour.
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

    this.matDialog.open(DataMigrationStatusDialogComponent, {
      data: {
        tierJob,
        targetTier: tier.tier_type,
      },
    });
  }
}
