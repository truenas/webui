import { DockerStatusData } from 'app/enums/docker-config.interface';
import { FailoverStatus } from 'app/enums/failover-status.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { App, AppContainerLog, AppStats } from 'app/interfaces/app.interface';
import { BootEnvironment } from 'app/interfaces/boot-environment.interface';
import { ContainerImage } from 'app/interfaces/container-image.interface';
import { DirectoryServicesState } from 'app/interfaces/directory-services-state.interface';
import { Disk } from 'app/interfaces/disk.interface';
import { FailoverDisabledReasonEvent } from 'app/interfaces/failover-disabled-reasons.interface';
import { Group } from 'app/interfaces/group.interface';
import { Job } from 'app/interfaces/job.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { FailoverRebootInfo, SystemRebootInfo } from 'app/interfaces/reboot-info.interface';
import { ReportingRealtimeUpdate } from 'app/interfaces/reporting.interface';
import { PoolScan } from 'app/interfaces/resilver-job.interface';
import { Service } from 'app/interfaces/service.interface';
import { SmartTestProgressUpdate } from 'app/interfaces/smart-test-progress.interface';
import { TrueCommandConfig } from 'app/interfaces/true-command-config.interface';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { User } from 'app/interfaces/user.interface';
import { VirtualizationGlobalConfig, VirtualizationInstance, VirtualizationInstanceMetrics } from 'app/interfaces/virtualization.interface';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';

export interface ApiEventDirectory {
  'alert.list': { response: Alert };
  'app.container_log_follow': { response: AppContainerLog };
  'app.image.query': { response: ContainerImage };
  'app.query': { response: App };
  'app.stats': { response: AppStats[] };
  'boot.environment.query': { response: BootEnvironment };
  'core.get_jobs': { response: Job };
  'directoryservices.status': { response: DirectoryServicesState };
  'disk.query': { response: Disk };
  'docker.state': { response: DockerStatusData };
  'failover.disabled.reasons': { response: FailoverDisabledReasonEvent };
  'failover.reboot.info': { response: FailoverRebootInfo };
  'failover.status': { response: { status: FailoverStatus } };
  'filesystem.file_tail_follow': { response: { data: string } };
  'group.query': { response: Group };
  'pool.query': { response: Pool };
  'reporting.realtime': { response: ReportingRealtimeUpdate };
  'service.query': { response: Service };
  'smart.test.progress': { response: SmartTestProgressUpdate };
  'system.reboot.info': { response: SystemRebootInfo };
  'tn_connect.config': { response: TruenasConnectConfig };
  'truecommand.config': { response: TrueCommandConfig };
  'user.query': { response: User };
  'virt.global.config': { response: VirtualizationGlobalConfig };
  'virt.instance.metrics': { response: VirtualizationInstanceMetrics };
  'virt.instance.query': { response: VirtualizationInstance };
  'zfs.pool.scan': { response: PoolScan };
  'zfs.snapshot.query': { response: ZfsSnapshot };
}
