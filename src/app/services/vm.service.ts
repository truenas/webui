import { Injectable } from '@angular/core';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { Observable } from 'rxjs';

import { RestService } from './rest.service';
import { WebSocketService } from './ws.service';

@Injectable()
export class VmService {
  protected volume_resource_name = 'storage/volume';

  constructor(protected rest: RestService, protected ws: WebSocketService) {}

  getStorageVolumes(): void {
    return this.rest.get(this.volume_resource_name, {});
  }

  getVM(vm: string): Observable<VirtualMachine[]> {
    return this.ws.call('vm.query', [[['name', '=', vm]], { get: true }]);
  }

  getBootloaderOptions(): Observable<any> {
    return this.ws.call('vm.bootloader_options');
  }

  getNICTypes(): string[][] {
    return [
      ['E1000', 'Intel e82585 (e1000)'],
      ['VIRTIO', 'VirtIO'],
    ];
  }

  getCPUModels(): Observable<any> {
    return this.ws.call('vm.cpu_model_choices');
  }
}
