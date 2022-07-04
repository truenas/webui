import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { PullContainerImageResponse, PullContainerImageParams } from 'app/interfaces/container-image.interface';
import { DirectoryServicesState } from 'app/interfaces/directory-services-state.interface';
import { Job } from 'app/interfaces/job.interface';
import { PoolScan } from 'app/interfaces/resilver-job.interface';
import { Service } from 'app/interfaces/service.interface';
import { TrueCommandConfig } from 'app/interfaces/true-command-config.interface';
import { User } from 'app/interfaces/user.interface';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';

export type ApiEventDirectory = {
  'alert.list': { response: Alert };
  'chart.release.query': { response: ChartRelease };
  'core.get_jobs': { response: Job };
  'directoryservices.status': { response: DirectoryServicesState };
  'failover.disabled.reasons': { response: FailoverDisabledReason[] };
  'service.query': { response: Service };
  'truecommand.config': { response: TrueCommandConfig };
  'vm.query': { response: VirtualMachine };
  'zfs.snapshot.query': { response: ZfsSnapshot };
  'zfs.pool.scan': { response: PoolScan };
  'user.query': { response: User };
  'container.image.pull': { response: Job<PullContainerImageResponse, PullContainerImageParams> };
};
