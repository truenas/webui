import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Choices } from 'app/interfaces/choices.interface';
import { VirtualizationDetails } from 'app/interfaces/virtual-machine.interface';
import { WebSocketService } from './ws.service';

@Injectable()
export class VmService {
  constructor(protected ws: WebSocketService) {}

  getBootloaderOptions(): Observable<Choices> {
    return this.ws.call('vm.bootloader_options');
  }

  getNicTypes(): string[][] {
    return [
      ['E1000', 'Intel e82585 (e1000)'],
      ['VIRTIO', 'VirtIO'],
    ];
  }

  getCpuModels(): Observable<Choices> {
    return this.ws.call('vm.cpu_model_choices');
  }

  getVirtualizationDetails(): Observable<VirtualizationDetails> {
    return this.ws.call('vm.virtualization_details');
  }
}
