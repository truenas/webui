import { Injectable, signal } from '@angular/core';
import { untilDestroyed } from '@ngneat/until-destroy';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TruenasConnectService {
  config = new BehaviorSubject<TruenasConnectConfig>(null)
  constructor(private api: ApiService) { 
    setInterval(() => {
      this.api.call('tn_connect.config')
      .subscribe((config) => {
        console.log('config', config)
        this.config.next(config)
      });
    }, 5000)
  }
}
