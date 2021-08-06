import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { CoreEvent } from './core.service';
import { WebSocketService } from 'app/services/ws.service';

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
  constructor(protected ws: WebSocketService) {
    super();
  }

  protected onAuthenticated(evt: CoreEvent) {
    this.authenticated = true;

    // Check for Disk Presence
    this.ws.sub('disk.query').subscribe((res) => {
      // A couple of notes about what to expect in the response.
      // Cleared:boolean is a property in the response that seems to indicate removal
      // If a device has been added, there will be a fields property containing disk details

      this.core.emit({ name: 'DisksChanged', data: res, sender: this });

      if (res && res.cleared) {
        this.core.emit({ name: 'DiskRemoved', data: res, sender: this });
      }
    });

    // Check for Pool Status
    this.ws.subscribe('zfs.pool.scan').subscribe((res) => {
      if (res.fields.scan.function == 'RESILVER') {
        this.core.emit({ name: 'Resilvering', data: res.fields, sender: this });
      }
    });
  }
}
