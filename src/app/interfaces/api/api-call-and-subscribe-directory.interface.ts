import { App } from 'app/interfaces/app.interface';
import { ContainerImage } from 'app/interfaces/container-image.interface';
import { Group } from 'app/interfaces/group.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { User } from 'app/interfaces/user.interface';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';

/**
 * Directory of compatible API call and subscribe methods.
 */
export interface ApiCallAndSubscribeEventDirectory {
  'vm.query': { response: VirtualMachine };
  'user.query': { response: User };
  'pool.query': { response: Pool };
  'group.query': { response: Group };
  'app.image.query': { response: ContainerImage };
  'app.query': { response: App };
  'virt.instance.query': { response: VirtualizationInstance };
}

export type ApiCallAndSubscribeMethod = keyof ApiCallAndSubscribeEventDirectory;
export type ApiCallAndSubscribeResponse<T extends ApiCallAndSubscribeMethod> = ApiCallAndSubscribeEventDirectory[T]['response'];
