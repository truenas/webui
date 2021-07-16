import { Injectable } from '@angular/core';
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
    this.ws.sub('disk.query').subscribe((res: any) => {
      this.core.emit({ name: 'DisksChanged', data: res, sender: this });
    });
  }
}
