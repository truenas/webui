import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { CoreEvent } from './core.service';

@Injectable({
  providedIn: 'root',
})
export class StatsService extends BaseService {
  protected disks: any[] = [];
  protected broadcast;
  protected subscribers = 0;

  constructor() {
    super();
  }

  protected onAuthenticated(evt: CoreEvent) {
    this.authenticated = true;
   
    const queryOptions = { "select": ["name", "type"] };

    this.websocket.sub('reporting.realtime').subscribe((res) => {
      this.core.emit({ name: 'RealtimeStats', data: res, sender: this });
    });
  }
}
