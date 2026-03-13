import { DatasetTier } from 'app/enums/dataset-tier.enum';
import { TierRewriteJobStatus } from 'app/enums/tier-rewrite-job-status.enum';

export interface ZfsTierConfig {
  enabled: boolean;
  max_concurrent_jobs: number;
  min_available_space: number;
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
