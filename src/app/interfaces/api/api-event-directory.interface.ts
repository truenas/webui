import { DockerStatusData } from 'app/enums/docker-config.interface';
import { FailoverStatus } from 'app/enums/failover-status.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { App, AppStats } from 'app/interfaces/app.interface';
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
import { VirtualizationGlobalConfig, VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';

export interface ApiEventDirectory {
  'alert.list': { response: Alert };
  'app.image.query': { response: ContainerImage };
  'app.query': { response: App };
  'app.stats': { response: AppStats[] };
  'core.get_jobs': { response: Job };
  'directoryservices.status': { response: DirectoryServicesState };
  'disk.query': { response: Disk };
  'docker.state': { response: DockerStatusData };
  'failover.disabled.reasons': { response: FailoverDisabledReasonEvent };
  'failover.status': { response: { status: FailoverStatus } };
  'group.query': { response: Group };
  'pool.query': { response: Pool };
  'virt.global.config': { response: VirtualizationGlobalConfig };
  'reporting.realtime': { response: ReportingRealtimeUpdate };
  'service.query': { response: Service };
  'smart.test.progress': { response: SmartTestProgressUpdate };
  'truecommand.config': { response: TrueCommandConfig };
  'user.query': { response: User };
  'virt.instance.query': { response: VirtualizationInstance };
  'virt.instance.agent_running': { response: unknown }; // TODO: Fix type
  'vm.query': { response: VirtualMachine };
  'zfs.pool.scan': { response: PoolScan };
  'zfs.snapshot.query': { response: ZfsSnapshot };
}
