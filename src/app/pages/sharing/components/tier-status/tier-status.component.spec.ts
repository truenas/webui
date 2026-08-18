import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnDialog } from '@truenas/ui-components';
import { Subject, of } from 'rxjs';
import { DatasetTier } from 'app/enums/dataset-tier.enum';
import { TierRewriteJobStatus } from 'app/enums/tier-rewrite-job-status.enum';
import { SharingTierInfo, ZfsTierRewriteJobEntry } from 'app/interfaces/zfs-tier.interface';
import {
  DataMigrationStatusDialogComponent,
} from 'app/pages/sharing/components/data-migration-status-dialog/data-migration-status-dialog.component';
import { SharingTierService } from 'app/pages/sharing/components/sharing-tier.service';
import { TierStatusComponent } from 'app/pages/sharing/components/tier-status/tier-status.component';

const runningJob = {
  tier_job_id: 'job-1',
  status: TierRewriteJobStatus.Running,
} as ZfsTierRewriteJobEntry;

describe('TierStatusComponent', () => {
  let spectator: Spectator<TierStatusComponent>;
  let jobStatus$: Subject<ZfsTierRewriteJobEntry>;

  const createComponent = createComponentFactory({
    component: TierStatusComponent,
    providers: [
      mockProvider(TnDialog, { open: jest.fn() }),
    ],
  });

  function setup(tier: SharingTierInfo): void {
    jobStatus$ = new Subject<ZfsTierRewriteJobEntry>();
    spectator = createComponent({
      props: { tier },
      providers: [
        mockProvider(SharingTierService, {
          subscribeTierJobStatus: () => jobStatus$,
        }),
      ],
    });
  }

  it('shows the tier label', () => {
    setup({ tier_type: DatasetTier.Regular, tier_job: null });

    expect(spectator.query('.tier-label')).toHaveText('Regular');
  });

  it('shows the spinning icon while the job supplied by the input is running', () => {
    setup({ tier_type: DatasetTier.Performance, tier_job: runningJob });

    const icon = spectator.query('tn-icon.job-status-icon')!;
    expect(icon).toHaveClass('spinning');
    expect(icon).toHaveAttribute('aria-label', 'Migration: Running');
  });

  it('switches the badge to the complete icon when the job status stream reports completion', () => {
    setup({ tier_type: DatasetTier.Performance, tier_job: runningJob });

    jobStatus$.next({ ...runningJob, status: TierRewriteJobStatus.Complete });
    spectator.detectChanges();

    const icon = spectator.query('tn-icon.job-status-icon')!;
    expect(icon).not.toHaveClass('spinning');
    expect(icon).toHaveAttribute('aria-label', 'Migration: Complete');
  });

  it('ignores live updates that belong to a different job', () => {
    setup({ tier_type: DatasetTier.Performance, tier_job: runningJob });

    jobStatus$.next({ tier_job_id: 'other-job', status: TierRewriteJobStatus.Complete } as ZfsTierRewriteJobEntry);
    spectator.detectChanges();

    expect(spectator.query('tn-icon.job-status-icon')).toHaveClass('spinning');
  });

  it('opens the migration dialog with the latest job seen', () => {
    setup({ tier_type: DatasetTier.Performance, tier_job: runningJob });
    const completedJob = { ...runningJob, status: TierRewriteJobStatus.Complete };
    jobStatus$.next(completedJob);
    spectator.detectChanges();

    spectator.click('tn-icon.job-status-icon');

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(DataMigrationStatusDialogComponent, {
      data: {
        tierJob: completedJob,
        targetTier: DatasetTier.Performance,
      },
    });
  });

  it('does not subscribe to a job status stream when there is no job', () => {
    const subscribeTierJobStatus = jest.fn(() => of(runningJob));
    spectator = createComponent({
      props: { tier: { tier_type: DatasetTier.Regular, tier_job: null } },
      providers: [
        mockProvider(SharingTierService, { subscribeTierJobStatus }),
      ],
    });

    expect(subscribeTierJobStatus).not.toHaveBeenCalled();
    expect(spectator.query('tn-icon.job-status-icon')).toBeNull();
  });
});
