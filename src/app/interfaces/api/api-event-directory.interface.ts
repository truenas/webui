import { FailoverStatus } from 'app/enums/failover-status.enum';
import { AppStats } from 'app/interfaces/app.interface';
import { ContainerMetrics } from 'app/interfaces/container.interface';
import { Disk } from 'app/interfaces/disk.interface';
import { Job } from 'app/interfaces/job.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { ReportingRealtimeUpdate } from 'app/interfaces/reporting.interface';
import { PoolScan } from 'app/interfaces/resilver-job.interface';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';

export interface ApiEventDirectory {
  'app.stats': { response: AppStats[] };
  'core.get_jobs': { response: Job };
  'disk.query': { response: Disk };
  'failover.status': { response: { status: FailoverStatus } };
  'pool.query': { response: Pool };
  'reporting.realtime': { response: ReportingRealtimeUpdate };
  'tn_connect.config': { response: TruenasConnectConfig };

  'container.metrics': { response: ContainerMetrics };

  'pool.scan': { response: PoolScan };
}
