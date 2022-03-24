import { Alert } from 'app/interfaces/alert.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { DirectoryServicesState } from 'app/interfaces/directory-services-state.interface';
import { Job } from 'app/interfaces/job.interface';
import { ResilverData } from 'app/interfaces/resilver-job.interface';
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
  'failover.disabled_reasons': { response: any };
  'service.query': { response: Service };
  'truecommand.config': { response: TrueCommandConfig };
  'vm.query': { response: VirtualMachine };
  'zfs.snapshot.query': { response: ZfsSnapshot };
  'zfs.pool.scan': { response: ResilverData };
  'user.query': { response: User };
};
