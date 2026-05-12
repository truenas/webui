import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { IconLibraryType } from '@truenas/ui-components';
import { DatasetTier } from 'app/enums/dataset-tier.enum';
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
    case TierRewriteJobStatus.Cancelled:
      return {
        name: 'cancel', library: 'mdi', color: 'grey', spinning: false,
      };
    case TierRewriteJobStatus.Stopped:
      return {
        name: 'stop-circle', library: 'mdi', color: 'grey', spinning: false,
      };
    default:
      return null;
  }
}

export function isTierJobRunning(
  job: ZfsTierRewriteJobEntry | null,
): boolean {
  if (!job) return false;
  return job.status === TierRewriteJobStatus.Running
    || job.status === TierRewriteJobStatus.Queued;
}

/**
 * Returns the i18n extraction key for a tier job status. Callers must run
 * the result through TranslateService to display it.
 */
export function getTierJobStatusLabelKey(
  job: ZfsTierRewriteJobEntry | null,
): string {
  if (!job) return '';
  switch (job.status) {
    case TierRewriteJobStatus.Complete: return T('Complete');
    case TierRewriteJobStatus.Running: return T('Running');
    case TierRewriteJobStatus.Queued: return T('Queued');
    case TierRewriteJobStatus.Error: return T('Error');
    case TierRewriteJobStatus.Cancelled: return T('Cancelled');
    case TierRewriteJobStatus.Stopped: return T('Stopped');
    default: return '';
  }
}

/**
 * Returns the i18n extraction key for a DatasetTier label. Callers must run
 * the result through TranslateService to display it.
 */
export function getTierLabelKey(tier: DatasetTier | null | undefined): string {
  switch (tier) {
    case DatasetTier.Performance: return T('Performance');
    case DatasetTier.Regular: return T('Regular');
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
