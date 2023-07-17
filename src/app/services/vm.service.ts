import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { VmNicType } from 'app/enums/vm.enum';
import { VirtualizationDetails } from 'app/interfaces/virtual-machine.interface';
import { WebSocketService } from 'app/services/ws.service';

@Injectable({ providedIn: 'root' })
export class VmService {
  constructor(protected ws: WebSocketService) {}

  getNicTypes(): string[][] {
    return [
      [VmNicType.E1000, 'Intel e82585 (e1000)'],
      [VmNicType.Virtio, 'VirtIO'],
    ];
  }

  getVirtualizationDetails(): Observable<VirtualizationDetails> {
    return this.ws.call('vm.virtualization_details');
  }
}
