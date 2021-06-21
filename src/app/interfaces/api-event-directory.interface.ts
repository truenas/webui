import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { Job } from 'app/interfaces/job.interface';

export type ApiEventDirectory = {
  'alert.list': { response: any };
  'chart.release.query': { response: ChartRelease };
  'core.get_jobs': { response: Job };
  'directoryservices.status': { response: any };
  'failover.disabled_reasons': { response: any };
  'truecommand.config': { response: any };
  'vm.query': { response: any };
  'zfs.pool.scan': { response: any };
};
