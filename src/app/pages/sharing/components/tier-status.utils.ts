import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { tnIconMarker } from '@truenas/ui-components';
import { DatasetTier } from 'app/enums/dataset-tier.enum';
import { TierRewriteJobStatus } from 'app/enums/tier-rewrite-job-status.enum';
import { ZfsTierRewriteJobEntry } from 'app/interfaces/zfs-tier.interface';

export interface TierJobIconInfo {
  /**
   * Library-prefixed icon name produced by `tnIconMarker`. The marker is what
   * gets these icons into the generated sprite — a plain `{ name, library }`
   * pair is invisible to the build-time scanner, which is how `mdi-cancel`
   * ended up missing while the other four survived only because unrelated
   * files happened to mark them.
   */
  name: string;
  color: string;
  spinning: boolean;
}

interface TierJobStatusDescriptor {
  icon: TierJobIconInfo | null;
  themeClass: string;
  labelKey: string;
  /**
   * Label for the timestamp a job stopped updating, or `null` for statuses that
   * have no end yet. Worded per status so a cancelled job reads "Cancelled: ..."
   * rather than borrowing "Finished", which implies the migration ran to the end.
   */
  endTimeLabelKey: string | null;
}

/**
 * Single source of truth for per-status display: icon, theme class, and label
 * extraction key. Adding a new TierRewriteJobStatus value here automatically
 * covers all three consumer helpers below.
 */
const tierJobStatusTable: Record<TierRewriteJobStatus, TierJobStatusDescriptor> = {
  [TierRewriteJobStatus.Complete]: {
    icon: {
      name: tnIconMarker('check-circle', 'mdi'), color: 'green', spinning: false,
    },
    themeClass: 'fn-theme-green',
    labelKey: T('Complete'),
    endTimeLabelKey: T('Finished'),
  },
  [TierRewriteJobStatus.Running]: {
    icon: {
      name: tnIconMarker('sync', 'mdi'), color: 'orange', spinning: true,
    },
    themeClass: 'fn-theme-orange',
    labelKey: T('Running'),
    endTimeLabelKey: null,
  },
  [TierRewriteJobStatus.Queued]: {
    icon: null,
    themeClass: 'fn-theme-primary',
    labelKey: T('Queued'),
    endTimeLabelKey: null,
  },
  [TierRewriteJobStatus.Error]: {
    icon: {
      name: tnIconMarker('alert-circle', 'mdi'), color: 'red', spinning: false,
    },
    themeClass: 'fn-theme-red',
    labelKey: T('Error'),
    endTimeLabelKey: T('Failed'),
  },
  [TierRewriteJobStatus.Cancelled]: {
    icon: {
      name: tnIconMarker('cancel', 'mdi'), color: 'grey', spinning: false,
    },
    themeClass: 'fn-theme-grey',
    labelKey: T('Cancelled'),
    endTimeLabelKey: T('Cancelled'),
  },
  [TierRewriteJobStatus.Stopped]: {
    icon: {
      name: tnIconMarker('stop-circle', 'mdi'), color: 'grey', spinning: false,
    },
    themeClass: 'fn-theme-grey',
    labelKey: T('Stopped'),
    endTimeLabelKey: T('Stopped'),
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

/**
 * Returns the i18n extraction key labelling when a job stopped, or `null` while
 * it is still running or queued. Callers must run the result through
 * TranslateService to display it.
 */
export function getTierJobEndTimeLabelKey(
  job: ZfsTierRewriteJobEntry | null,
): string | null {
  return job ? tierJobStatusTable[job.status]?.endTimeLabelKey ?? null : null;
}

export function getTierJobStatusClass(
  job: ZfsTierRewriteJobEntry | null,
): string {
  return job ? tierJobStatusTable[job.status]?.themeClass ?? '' : '';
}

/**
 * Returns the i18n extraction key for a DatasetTier label, or `null` if the
 * tier value is unknown (e.g. a new DatasetTier enum value was added without
 * updating this helper). Callers must run the key through TranslateService
 * and handle the `null` case explicitly.
 */
export function getTierLabelKey(tier: DatasetTier | null | undefined): string | null {
  switch (tier) {
    case DatasetTier.Performance: return T('Performance');
    case DatasetTier.Regular: return T('Regular');
    default: return null;
  }
}
