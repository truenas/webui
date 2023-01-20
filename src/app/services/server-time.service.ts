import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService2 } from 'app/services/ws2.service';

@Injectable({
  providedIn: 'root',
})
export class ServerTimeService {
  constructor(
    protected ws: WebSocketService2,
    protected dialogService: DialogService,
    protected translate: TranslateService,
  ) {}

  confirmSetSystemTime(): Observable<boolean> {
    return this.dialogService.confirm({
      title: this.translate.instant('Synchronize time'),
      message: this.translate.instant('It may impact currently running services and should be done during planned downtime.'),
      buttonMsg: this.translate.instant('Synchronize'),
      cancelMsg: this.translate.instant('Cancel'),
    });
  }

  setSystemTime(currentTime: number): Observable<unknown> {
    return this.ws.call('system.set_time', [Math.ceil(currentTime / 1000)]);
  }
}
