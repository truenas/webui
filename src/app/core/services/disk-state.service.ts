import { Injectable } from '@angular/core';
import { CoreEvent } from 'app/interfaces/events';
import { BaseService } from './base.service';
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

  protected onAuthenticated(evt: CoreEvent): void {
    this.authenticated = true;
    this.ws.sub('disk.query').subscribe((res: any) => {
      this.core.emit({ name: 'DisksChanged', data: res, sender: this });
    });
  }
}
