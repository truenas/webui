import { IconLibraryType } from '@truenas/ui-components';
import { TierRewriteJobStatus } from 'app/enums/tier-rewrite-job-status.enum';
import { ZfsTierRewriteJobEntry } from 'app/interfaces/zfs-tier.interface';

export interface TierJobIconInfo {
  name: string;
  library: IconLibraryType;
  color: string;
  spinning: boolean;
}

export function getTierJobIcon(
  job: ZfsTierRewriteJobEntry | null,
): TierJobIconInfo | null {
  if (!job) return null;
  switch (job.status) {
    case TierRewriteJobStatus.Complete:
      return {
        name: 'check-circle', library: 'mdi', color: 'green', spinning: false,
      };
    case TierRewriteJobStatus.Running:
      return {
        name: 'sync', library: 'mdi', color: 'orange', spinning: true,
      };
    case TierRewriteJobStatus.Error:
      return {
        name: 'alert-circle', library: 'mdi', color: 'red', spinning: false,
      };
    case TierRewriteJobStatus.Stopped:
      return {
        name: 'stop-circle', library: 'mdi', color: 'grey', spinning: false,
      };
    default:
      return null;
  }
}

export function getTierJobStatusLabel(
  job: ZfsTierRewriteJobEntry | null,
): string {
  if (!job) return '';
  switch (job.status) {
    case TierRewriteJobStatus.Complete: return 'Complete';
    case TierRewriteJobStatus.Running: return 'Running';
    case TierRewriteJobStatus.Queued: return 'Queued';
    case TierRewriteJobStatus.Error: return 'Error';
    case TierRewriteJobStatus.Cancelled: return 'Cancelled';
    case TierRewriteJobStatus.Stopped: return 'Stopped';
    default: return '';
  }
}

export function getTierJobStatusClass(
  job: ZfsTierRewriteJobEntry | null,
): string {
  if (!job) return '';
  switch (job.status) {
    case TierRewriteJobStatus.Complete: return 'fn-theme-green';
    case TierRewriteJobStatus.Running: return 'fn-theme-orange';
    case TierRewriteJobStatus.Queued: return 'fn-theme-primary';
    case TierRewriteJobStatus.Error: return 'fn-theme-red';
    case TierRewriteJobStatus.Cancelled:
    case TierRewriteJobStatus.Stopped: return 'fn-theme-grey';
    default: return '';
  }
}
