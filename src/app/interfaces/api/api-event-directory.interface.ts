import { DockerStatusResponse } from 'app/enums/docker-config.interface';
import { FailoverStatus } from 'app/enums/failover-status.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { App, ChartStatisticsUpdate } from 'app/interfaces/chart-release.interface';
import { ContainerImage } from 'app/interfaces/container-image.interface';
import { DirectoryServicesState } from 'app/interfaces/directory-services-state.interface';
import { Disk } from 'app/interfaces/disk.interface';
import { FailoverDisabledReasonEvent } from 'app/interfaces/failover-disabled-reasons.interface';
import { Group } from 'app/interfaces/group.interface';
import { Job } from 'app/interfaces/job.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { ReportingRealtimeUpdate } from 'app/interfaces/reporting.interface';
import { PoolScan } from 'app/interfaces/resilver-job.interface';
import { Service } from 'app/interfaces/service.interface';
import { SmartTestProgressUpdate } from 'app/interfaces/smart-test-progress.interface';
import { TrueCommandConfig } from 'app/interfaces/true-command-config.interface';
import { User } from 'app/interfaces/user.interface';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';

export interface ApiEventDirectory {
  'alert.list': { response: Alert };
  'chart.release.query': { response: App };
  'app.query': { response: App };
  'chart.release.statistics': { response: ChartStatisticsUpdate[] };
  'core.get_jobs': { response: Job };
  'directoryservices.status': { response: DirectoryServicesState };
  'failover.status': { response: { status: FailoverStatus } };
  'failover.disabled.reasons': { response: FailoverDisabledReasonEvent };
  'service.query': { response: Service };
  'truecommand.config': { response: TrueCommandConfig };
  'vm.query': { response: VirtualMachine };
  'zfs.snapshot.query': { response: ZfsSnapshot };
  'zfs.pool.scan': { response: PoolScan };
  'user.query': { response: User };
  'disk.query': { response: Disk };
  'pool.query': { response: Pool };
  'group.query': { response: Group };
  'app.image.query': { response: ContainerImage };
  'reporting.realtime': { response: ReportingRealtimeUpdate };
  'smart.test.progress': { response: SmartTestProgressUpdate };
  'docker.state': { response: DockerStatusResponse };
}
