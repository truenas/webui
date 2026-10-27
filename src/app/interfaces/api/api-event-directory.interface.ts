import { FailoverStatus } from 'app/enums/failover-status.enum';
import { AppStats } from 'app/interfaces/app.interface';
import { ContainerMetrics } from 'app/interfaces/container.interface';
import { Disk } from 'app/interfaces/disk.interface';
import { Job } from 'app/interfaces/job.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { ReportingRealtimeUpdate } from 'app/interfaces/reporting.interface';
import { PoolScan } from 'app/interfaces/resilver-job.interface';

export interface ApiEventDirectory {
  'app.stats': { response: AppStats[] };
  'core.get_jobs': { response: Job };
  'disk.query': { response: Disk };
  'failover.status': { response: { status: FailoverStatus } };
  'pool.query': { response: Pool };
  'reporting.realtime': { response: ReportingRealtimeUpdate };

  'container.metrics': { response: ContainerMetrics };

  'pool.scan': { response: PoolScan };
}
