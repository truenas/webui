import { DatasetTier } from 'app/enums/dataset-tier.enum';
import { TierRewriteJobStatus } from 'app/enums/tier-rewrite-job-status.enum';

export interface ZfsTierConfig {
  enabled: boolean;
  max_concurrent_jobs: number;
  max_used_percentage: number;
  /**
   * Percentage of special-vdev usable capacity reserved for metadata. Once usage
   * crosses the resulting threshold, ZFS stops placing new data on the special
   * vdevs and writes metadata only. Surfaced on the pool Usage card as a reserve
   * zone behind the Performance tier bar.
   */
  special_class_metadata_reserve_pct: number;
}

export interface ZfsTierRewriteJobStats {
  start_time: number;
  initial_time: number;
  update_time: number;
  count_items: number;
  count_bytes: number;
  total_items: number;
  total_bytes: number;
  failures: number;
  success: number;
  parent: string;
  name: string;
}

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
