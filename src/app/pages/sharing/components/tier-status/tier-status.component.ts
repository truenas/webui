import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, inject, input,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnDialog, TnIconComponent, TnTooltipDirective } from '@truenas/ui-components';
import { of, switchMap } from 'rxjs';
import { SharingTierInfo } from 'app/interfaces/zfs-tier.interface';
import {
  DataMigrationStatusDialogComponent,
} from 'app/pages/sharing/components/data-migration-status-dialog/data-migration-status-dialog.component';
import { SharingTierService } from 'app/pages/sharing/components/sharing-tier.service';
import {
  getTierJobIcon, getTierJobStatusClass, getTierJobStatusLabelKey, getTierLabelKey,
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
  ],
})
export class TierStatusComponent {
  private translate = inject(TranslateService);
  private tnDialog = inject(TnDialog);
  private tierService = inject(SharingTierService);

  readonly tier = input<SharingTierInfo | null | undefined>();

  protected tierLabel = computed(() => {
    const key = getTierLabelKey(this.tier()?.tier_type);
    return key ? this.translate.instant(key) : '-';
  });

  private jobId = computed(() => this.tier()?.tier_job?.tier_job_id ?? null);

  /**
   * The `tier` input comes from a list/details payload that isn't refetched
   * while a migration runs, so a job that started as RUNNING would keep
   * spinning until the user reloaded the page. Track the job's own status topic
   * instead — it replays current state on subscribe and emits every transition.
   */
  private liveJob = toSignal(
    toObservable(this.jobId).pipe(
      switchMap((jobId) => (jobId ? this.tierService.subscribeTierJobStatus(jobId) : of(null))),
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
