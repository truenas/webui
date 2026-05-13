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

interface TierJobStatusDescriptor {
  icon: TierJobIconInfo | null;
  themeClass: string;
  labelKey: string;
}

/**
 * Single source of truth for per-status display: icon, theme class, and label
 * extraction key. Adding a new TierRewriteJobStatus value here automatically
 * covers all three consumer helpers below.
 */
const tierJobStatusTable: Record<TierRewriteJobStatus, TierJobStatusDescriptor> = {
  [TierRewriteJobStatus.Complete]: {
    icon: {
      name: 'check-circle', library: 'mdi', color: 'green', spinning: false,
    },
    themeClass: 'fn-theme-green',
    labelKey: T('Complete'),
  },
  [TierRewriteJobStatus.Running]: {
    icon: {
      name: 'sync', library: 'mdi', color: 'orange', spinning: true,
    },
    themeClass: 'fn-theme-orange',
    labelKey: T('Running'),
  },
  [TierRewriteJobStatus.Queued]: {
    icon: null,
    themeClass: 'fn-theme-primary',
    labelKey: T('Queued'),
  },
  [TierRewriteJobStatus.Error]: {
    icon: {
      name: 'alert-circle', library: 'mdi', color: 'red', spinning: false,
    },
    themeClass: 'fn-theme-red',
    labelKey: T('Error'),
  },
  [TierRewriteJobStatus.Cancelled]: {
    icon: {
      name: 'cancel', library: 'mdi', color: 'grey', spinning: false,
    },
    themeClass: 'fn-theme-grey',
    labelKey: T('Cancelled'),
  },
  [TierRewriteJobStatus.Stopped]: {
    icon: {
      name: 'stop-circle', library: 'mdi', color: 'grey', spinning: false,
    },
    themeClass: 'fn-theme-grey',
    labelKey: T('Stopped'),
  },
};

export function getTierJobIcon(
  job: ZfsTierRewriteJobEntry | null,
): TierJobIconInfo | null {
  return job ? tierJobStatusTable[job.status]?.icon ?? null : null;
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
  return job ? tierJobStatusTable[job.status]?.labelKey ?? '' : '';
}

export function getTierJobStatusClass(
  job: ZfsTierRewriteJobEntry | null,
): string {
  return job ? tierJobStatusTable[job.status]?.themeClass ?? '' : '';
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
