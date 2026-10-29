import { v28_0_0 } from '@truenas/api-client';
import { DatasetTier } from 'app/enums/dataset-tier.enum';
import { TierRewriteJobStatus } from 'app/enums/tier-rewrite-job-status.enum';

/**
 * `special_class_metadata_reserve_pct` is surfaced on the pool Usage card as a reserve zone behind the
 * Performance tier bar.
 */
export type ZfsTierConfig = v28_0_0.ZfsTierEntry;

export type ZfsTierRewriteJobStats = v28_0_0.ZfsTierRewriteJobStats;

export interface ZfsTierRewriteJobEntry {
  tier_job_id: string;
  dataset_name: string;
  job_uuid: string;
  status: TierRewriteJobStatus;
  stats?: ZfsTierRewriteJobStats;
  error: string | null;
}

export interface SharingTierInfo {
  tier_type: DatasetTier;
  tier_job: ZfsTierRewriteJobEntry | null;
}
