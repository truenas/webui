import { Injectable } from '@angular/core';
import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { ResilverJob } from 'app/interfaces/resilver-job.interface';
import { WebSocketService } from 'app/services/ws.service';
import { BaseService } from '../base.service';
import { CoreService } from '../core-service/core.service';

export interface Temperature {
  keys: string[];
  values: any;
  unit: string;
  symbolText: string;
}

@Injectable({
  providedIn: 'root',
})
export class DiskStateService extends BaseService {
  constructor(protected core: CoreService, protected ws: WebSocketService) {
    super(core, ws);
  }

  protected onAuthenticated(): void {
    this.authenticated = true;

    // Check for Disk Presence
    this.ws.sub('disk.query').subscribe((res: any) => {
      this.core.emit({ name: 'DisksChanged', data: res, sender: this });
    });

    // Check for Pool Status
    this.ws.subscribe('zfs.pool.scan').subscribe((res: ResilverJob) => {
      if (res.fields.scan.function == PoolScanFunction.Resilver) {
        this.core.emit({ name: 'Resilvering', data: res.fields, sender: this });
      }
    });
  }
}
