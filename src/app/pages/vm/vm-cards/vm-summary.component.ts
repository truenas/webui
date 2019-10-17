import { Component, OnInit, OnDestroy } from '@angular/core';
import { WebSocketService, StorageService } from 'app/services/';
import helptext from '../../../helptext/vm/vm-wizard/vm-wizard';
import { CoreService, CoreEvent } from 'app/core/services/core.service';

@Component({
  selector: 'vm-summary',
  templateUrl: './vm-summary.component.html',
  styleUrls: ['./vm-summary.component.css']
})
export class VmSummaryComponent implements OnInit, OnDestroy {
  public availMem: string;
  public memTitle = helptext.vm_mem_title;
  public memWarning = helptext.memory_warning;
  public interval: any;

  constructor(private ws: WebSocketService, protected storageService: StorageService, private core: CoreService) {}

  ngOnInit() {
    this.checkMemory();

    this.core.register({observerClass:this, eventName: 'VmStart'}).subscribe((evt:CoreEvent) => {
      this.checkMemory();
    });

    this.core.register({observerClass:this, eventName: 'VmStop'}).subscribe((evt:CoreEvent) => {
      this.checkMemory();
    });

    this.core.register({observerClass:this, eventName: 'VmRestart'}).subscribe((evt:CoreEvent) => {
      this.checkMemory();
    });

    this.core.register({observerClass:this, eventName: 'VmPowerOff'}).subscribe((evt:CoreEvent) => {
      this.checkMemory();
    });

    this.core.register({observerClass:this, eventName: 'VmDelete'}).subscribe((evt:CoreEvent) => {
      this.checkMemory();
    });
  }

  checkMemory() {
    this.ws.call('vm.get_available_memory').subscribe((res) => {
      this.availMem = this.storageService.convertBytestoHumanReadable(res);
    
      let counter = 1;
      this.interval = setInterval(() => {
        this.ws.call('vm.get_available_memory').subscribe((res) => {
          this.availMem = this.storageService.convertBytestoHumanReadable(res);
          if (++counter > 2) {
            window.clearInterval(this.interval);
          }
        });      
      }, 5000)
    });
  }

  ngOnDestroy() {
    clearInterval(this.interval);
    this.core.unregister({observerClass:this});
  }
}
