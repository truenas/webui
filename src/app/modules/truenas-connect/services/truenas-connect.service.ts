import { Injectable, signal } from '@angular/core';
import { untilDestroyed } from '@ngneat/until-destroy';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { BehaviorSubject, interval, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TruenasConnectService {
  // config = new BehaviorSubject<TruenasConnectConfig>(null)
  config = signal<TruenasConnectConfig>(null)
  constructor(private api: ApiService) { 
    // setInterval(() => {
    interval(5000)
      .pipe(
        switchMap(() => {
          return this.api.call('tn_connect.config')
        })
      )
      .subscribe(config => {
        console.log('config', config)
        // this.config.next(config)
        // if (config) {
        //   this.api.call('tn_connect.ip_choices')
        //     .subscribe(ips => console.log('ipss', ips))
        // }
        this.config.set(config)
      })
    // }, 5000)
  }
}
