import { Component } from '@angular/core';
import { WebSocketService, StorageService } from 'app/services/';
import helptext from '../../../helptext/vm/vm-wizard/vm-wizard';

@Component({
  selector: 'vm-summary',
  templateUrl: './vm-summary.component.html',
  styleUrls: ['./vm-summary.component.css']
})
export class VmSummaryComponent {
  public availMem: string;
  public memTitle = helptext.vm_mem_title;
  public memWarning = helptext.memory_warning;

  constructor(private ws: WebSocketService, protected storageService: StorageService) {
    this.ws.call('vm.get_available_memory').subscribe((res) => {
      this.availMem = this.storageService.convertBytestoHumanReadable(res);
    })
  }
}
