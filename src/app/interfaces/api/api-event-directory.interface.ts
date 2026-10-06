import { FailoverStatus } from 'app/enums/failover-status.enum';
import { AppContainerLog, AppStats } from 'app/interfaces/app.interface';
import { BootEnvironment } from 'app/interfaces/boot-environment.interface';
import { ContainerMetrics } from 'app/interfaces/container.interface';
import { DirectoryServicesStatus } from 'app/interfaces/directoryservices-status.interface';
import { Disk } from 'app/interfaces/disk.interface';
import { Group } from 'app/interfaces/group.interface';
import { Job } from 'app/interfaces/job.interface';
import { PeriodicSnapshotTask } from 'app/interfaces/periodic-snapshot-task.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { ReportingRealtimeUpdate } from 'app/interfaces/reporting.interface';
import { PoolScan } from 'app/interfaces/resilver-job.interface';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { User } from 'app/interfaces/user.interface';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { ZfsTierRewriteJobEntry } from 'app/interfaces/zfs-tier.interface';

export interface ApiEventDirectory {
  'app.container_log_follow': { response: AppContainerLog };
  'app.stats': { response: AppStats[] };
  'boot.environment.query': { response: BootEnvironment };
  'core.get_jobs': { response: Job };
  'disk.query': { response: Disk };
  'failover.status': { response: { status: FailoverStatus } };
  'filesystem.file_tail_follow': { response: { data: string } };
  'group.query': { response: Group };
  'pool.query': { response: Pool };
  'reporting.realtime': { response: ReportingRealtimeUpdate };
  'tn_connect.config': { response: TruenasConnectConfig };
  'user.query': { response: User };

  'container.metrics': { response: ContainerMetrics };

  'pool.scan': { response: PoolScan };
  'pool.snapshot.query': { response: ZfsSnapshot };
  'pool.snapshottask.query': { response: PeriodicSnapshotTask };
  'directoryservices.status': { response: DirectoryServicesStatus };
  'zfs.tier.rewrite_job_query': { response: ZfsTierRewriteJobEntry };
  'zfs.tier.rewrite_job_status': { response: ZfsTierRewriteJobEntry };
}
