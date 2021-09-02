import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { DirectoryServicesState } from 'app/interfaces/directory-services-state.interface';
import { Job } from 'app/interfaces/job.interface';
import { Service } from 'app/interfaces/service.interface';
import { TrueCommandConfig } from 'app/interfaces/true-command-config.interface';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';

export type ApiEventDirectory = {
  'alert.list': { response: any };
  'chart.release.query': { response: ChartRelease };
  'core.get_jobs': { response: Job };
  'directoryservices.status': { response: DirectoryServicesState };
  'failover.disabled_reasons': { response: any };
  'service.query': { response: Service };
  'truecommand.config': { response: TrueCommandConfig };
  'vm.query': { response: VirtualMachine };
  'zfs.pool.scan': { response: any };
};
