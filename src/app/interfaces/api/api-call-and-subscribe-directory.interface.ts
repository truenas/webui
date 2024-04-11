import { ContainerImage } from 'app/interfaces/container-image.interface';
import { Group } from 'app/interfaces/group.interface';
import { Job } from 'app/interfaces/job.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { User } from 'app/interfaces/user.interface';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';

/**
 * Directory of compatible API call and subscribe methods.
 */
export interface ApiCallAndSubscribeEventDirectory {
  'core.get_jobs': { response: Job };
  'vm.query': { response: VirtualMachine };
  'user.query': { response: User };
  'pool.query': { response: Pool };
  'group.query': { response: Group };
  'container.image.query': { response: ContainerImage };
}

export type ApiCallAndSubscribeMethod = keyof ApiCallAndSubscribeEventDirectory;
export type ApiCallAndSubscribeResponse<T extends ApiCallAndSubscribeMethod> = ApiCallAndSubscribeEventDirectory[T]['response'];
