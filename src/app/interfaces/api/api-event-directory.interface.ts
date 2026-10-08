import { FailoverStatus } from 'app/enums/failover-status.enum';
import { AppContainerLog, AppStats } from 'app/interfaces/app.interface';
import { BootEnvironment } from 'app/interfaces/boot-environment.interface';
import { ContainerMetrics } from 'app/interfaces/container.interface';
import { Disk } from 'app/interfaces/disk.interface';
import { Job } from 'app/interfaces/job.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { ReportingRealtimeUpdate } from 'app/interfaces/reporting.interface';
import { PoolScan } from 'app/interfaces/resilver-job.interface';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { ZfsTierRewriteJobEntry } from 'app/interfaces/zfs-tier.interface';

export interface ApiEventDirectory {
  'app.container_log_follow': { response: AppContainerLog };
  'app.stats': { response: AppStats[] };
  'boot.environment.query': { response: BootEnvironment };
  'core.get_jobs': { response: Job };
  'disk.query': { response: Disk };
  'failover.status': { response: { status: FailoverStatus } };
  'filesystem.file_tail_follow': { response: { data: string } };
  'pool.query': { response: Pool };
  'reporting.realtime': { response: ReportingRealtimeUpdate };
  'tn_connect.config': { response: TruenasConnectConfig };

  'container.metrics': { response: ContainerMetrics };

  'pool.scan': { response: PoolScan };
  'zfs.tier.rewrite_job_query': { response: ZfsTierRewriteJobEntry };
  'zfs.tier.rewrite_job_status': { response: ZfsTierRewriteJobEntry };
}
