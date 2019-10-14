import { Component, OnInit, OnDestroy } from '@angular/core';
import { WebSocketService, StorageService } from 'app/services/';
import helptext from '../../../helptext/vm/vm-wizard/vm-wizard';

@Component({
  selector: 'vm-summary',
  templateUrl: './vm-summary.component.html',
  styleUrls: ['./vm-summary.component.css']
})
export class VmSummaryComponent implements OnInit, OnDestroy {
  public availMem: string;
  public memTitle = helptext.vm_mem_title;
  public memWarning = helptext.memory_warning;
  public interval = setInterval(() => {
    this.ws.call('vm.get_available_memory').subscribe((res) => {
      this.availMem = this.storageService.convertBytestoHumanReadable(res);
    })      
  }, 10000)

  constructor(private ws: WebSocketService, protected storageService: StorageService) {}

  ngOnInit() {
    this.ws.call('vm.get_available_memory').subscribe((res) => {
      this.availMem = this.storageService.convertBytestoHumanReadable(res);
    }) 
    this.interval;
  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }
}
