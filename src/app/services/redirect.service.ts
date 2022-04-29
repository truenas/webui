import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { DialogService } from './dialog.service';
import { WebSocketService } from './ws.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class RedirectService {
  constructor(
    protected ws: WebSocketService,
    private dialogService: DialogService,
    private translate: TranslateService,
  ) {}

  open(url: string, target?: string): void {
    if (url.includes('http://')) {
      this.ws.call('system.general.config')
        .pipe(untilDestroyed(this))
        .subscribe((config) => {
          if (config.ui_httpsredirect) {
            this.dialogService.confirm({
              title: this.translate.instant('Enabled HTTPS Redirect'),
              message: this.translate.instant(`You are trying to open:<br>
{url}<br><br>
Because HTTP to HTTPS redirect is enabled in settings your browser will force HTTPS connection for this URL.<br>
This may create issues if app does not support secure connections.<br>
<br>
You can try opening app url in a fresh browser or incognito mode.<br>
Alternatively you can disable redirect in Settings, clear browser cache and try again.`, { url }),
              hideCheckBox: true,
              textToCopy: url,
            }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
              window.open(url, target);
            });
          } else {
            window.open(url, target);
          }
        });
    } else {
      window.open(url, target);
    }
  }
}
