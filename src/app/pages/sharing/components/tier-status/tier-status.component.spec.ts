import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnIconHarness } from '@truenas/ui-components';
import { Subject, throwError } from 'rxjs';
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
  let loader: HarnessLoader;
  let jobStatus$: Subject<ZfsTierRewriteJobEntry>;

  const createComponent = createComponentFactory({
    component: TierStatusComponent,
    providers: [
      mockProvider(MatDialog, { open: jest.fn() }),
    ],
  });

  function setup(tier: SharingTierInfo): void {
    jobStatus$ = new Subject<ZfsTierRewriteJobEntry>();
    spectator = createComponent({
      props: { tier },
      providers: [
        mockProvider(SharingTierService, {
          subscribeTierJobStatus: jest.fn(() => jobStatus$),
        }),
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  it('shows the tier label', () => {
    setup({ tier_type: DatasetTier.Regular, tier_job: null });

    expect(spectator.query('.tier-label')).toHaveText('Regular');
  });

  it('shows the running icon for the job supplied by the input', async () => {
    setup({ tier_type: DatasetTier.Performance, tier_job: runningJob });

    const icon = await loader.getHarness(TnIconHarness);
    expect(await icon.getName()).toBe('sync');
    expect(spectator.query('tn-icon.job-status-icon')).toHaveAttribute('aria-label', 'Migration: Running');
  });

  it('switches the badge to the complete icon when the job status stream reports completion', async () => {
    setup({ tier_type: DatasetTier.Performance, tier_job: runningJob });

    jobStatus$.next({ ...runningJob, status: TierRewriteJobStatus.Complete });
    spectator.detectChanges();

    const icon = await loader.getHarness(TnIconHarness.with({ name: 'check-circle' }));
    expect(await icon.getColor()).toBe('green');
    expect(spectator.query('tn-icon.job-status-icon')).toHaveAttribute('aria-label', 'Migration: Complete');
  });

  it('ignores live updates that belong to a different job', async () => {
    setup({ tier_type: DatasetTier.Performance, tier_job: runningJob });

    jobStatus$.next({ tier_job_id: 'other-job', status: TierRewriteJobStatus.Complete } as ZfsTierRewriteJobEntry);
    spectator.detectChanges();

    const icon = await loader.getHarness(TnIconHarness);
    expect(await icon.getName()).toBe('sync');
  });

  it('subscribes only for a job that can still change', () => {
    setup({
      tier_type: DatasetTier.Performance,
      tier_job: { ...runningJob, status: TierRewriteJobStatus.Complete },
    });

    expect(spectator.inject(SharingTierService).subscribeTierJobStatus).not.toHaveBeenCalled();
  });

  it('subscribes with the id of the job it renders', () => {
    setup({ tier_type: DatasetTier.Performance, tier_job: runningJob });

    expect(spectator.inject(SharingTierService).subscribeTierJobStatus).toHaveBeenCalledWith('job-1');
  });

  it('keeps showing the input snapshot when the job status stream errors', async () => {
    spectator = createComponent({
      props: { tier: { tier_type: DatasetTier.Performance, tier_job: runningJob } },
      providers: [
        mockProvider(SharingTierService, {
          subscribeTierJobStatus: jest.fn(() => throwError(() => new Error('subscription rejected'))),
        }),
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    expect(() => spectator.detectChanges()).not.toThrow();
    const icon = await loader.getHarness(TnIconHarness);
    expect(await icon.getName()).toBe('sync');
  });

  it('opens the migration dialog with the latest job seen', async () => {
    setup({ tier_type: DatasetTier.Performance, tier_job: runningJob });
    const completedJob = { ...runningJob, status: TierRewriteJobStatus.Complete };
    jobStatus$.next(completedJob);
    spectator.detectChanges();

    await (await loader.getHarness(TnIconHarness)).click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(DataMigrationStatusDialogComponent, {
      data: {
        tierJob: completedJob,
        targetTier: DatasetTier.Performance,
      },
    });
  });

  it('renders no job badge when the tier has no job', async () => {
    setup({ tier_type: DatasetTier.Regular, tier_job: null });

    expect(await loader.getAllHarnesses(TnIconHarness)).toHaveLength(0);
  });
});
