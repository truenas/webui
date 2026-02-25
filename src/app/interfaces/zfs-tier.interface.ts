import { DatasetTier } from 'app/enums/dataset-tier.enum';
import { TierRewriteJobStatus } from 'app/enums/tier-rewrite-job-status.enum';

export interface ZfsTierConfig {
  enabled: boolean;
  max_concurrent_jobs: number;
  min_available_space: number;
}

export interface ZfsTierRewriteJobStats {
  count_items: number;
  count_bytes: number;
  total_items: number;
  total_bytes: number;
  failures: number;
  success: number;
}

export interface ZfsTierRewriteJobEntry {
  tier_job_id: number;
  dataset_name: string;
  job_uuid: string;
  status: TierRewriteJobStatus;
  stats?: ZfsTierRewriteJobStats;
}

export interface SharingTierInfo {
  tier_type: DatasetTier;
  tier_job: ZfsTierRewriteJobEntry | null;
}
