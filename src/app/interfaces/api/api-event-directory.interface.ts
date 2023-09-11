import { FailoverStatus } from 'app/enums/failover-status.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { ChartRelease, ChartReleaseStats } from 'app/interfaces/chart-release.interface';
import { PullContainerImageResponse, PullContainerImageParams, ContainerImage } from 'app/interfaces/container-image.interface';
import { DirectoryServicesState } from 'app/interfaces/directory-services-state.interface';
import { FailoverDisabledReasonEvent } from 'app/interfaces/failover-disabled-reasons.interface';
import { Group } from 'app/interfaces/group.interface';
import { Job } from 'app/interfaces/job.interface';
import { KubernetesStatusData } from 'app/interfaces/kubernetes-status-data.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { ReportingRealtimeUpdate } from 'app/interfaces/reporting.interface';
import { PoolScan } from 'app/interfaces/resilver-job.interface';
import { Service } from 'app/interfaces/service.interface';
import { SmartTestProgressUpdate } from 'app/interfaces/smart-test-progress.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { TrueCommandConfig } from 'app/interfaces/true-command-config.interface';
import { User } from 'app/interfaces/user.interface';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';

export interface ApiEventDirectory {
  'alert.list': { response: Alert };
  'chart.release.query': { response: ChartRelease };
  'chart.release.statistics': { response: { id: string; stats: ChartReleaseStats } }; // KARPOV
  'core.get_jobs': { response: Job };
  'directoryservices.status': { response: DirectoryServicesState };
  'failover.status': { response: FailoverStatus };
  'failover.disabled.reasons': { response: FailoverDisabledReasonEvent };
  'service.query': { response: Service };
  'truecommand.config': { response: TrueCommandConfig };
  'vm.query': { response: VirtualMachine };
  'zfs.snapshot.query': { response: ZfsSnapshot };
  'zfs.pool.scan': { response: PoolScan };
  'user.query': { response: User };
  'container.image.pull': { response: Job<PullContainerImageResponse, PullContainerImageParams> };
  'disk.query': { response: Disk };
  'pool.query': { response: Pool };
  'group.query': { response: Group };
  'container.image.query': { response: ContainerImage };
  'reporting.realtime': { response: ReportingRealtimeUpdate };
  'smart.test.progress': { response: SmartTestProgressUpdate };
  'kubernetes.state': { response: KubernetesStatusData };
}
