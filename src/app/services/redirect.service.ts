import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { RedirectDialogData } from 'app/modules/common/dialog/redirect-dialog/redirect-dialog-data.interface';
import { RedirectDialogComponent } from 'app/modules/common/dialog/redirect-dialog/redirect-dialog.component';
import { AppState } from 'app/store';
import { waitForGeneralConfig } from 'app/store/system-config/system-config.selectors';
import { WebSocketService } from './ws.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class RedirectService {
  constructor(
    protected ws: WebSocketService,
    private translate: TranslateService,
    private matDialog: MatDialog,
    private store$: Store<AppState>,
  ) {}

  openWindow(url: string, target?: string): Window {
    if (!url.includes('http://')) {
      return window.open(url, target);
    }
    this.store$.pipe(waitForGeneralConfig, untilDestroyed(this)).subscribe((config) => {
      if (!config.ui_httpsredirect) {
        return window.open(url, target);
      }
      this.matDialog.open(RedirectDialogComponent, {
        data: {
          title: this.translate.instant('Enabled HTTPS Redirect'),
          message: this.translate.instant(`You are trying to open:<br>
{url}<br><br>
Because HTTP to HTTPS redirect is enabled in settings your browser will force HTTPS connection for this URL.<br>
This may create issues if app does not support secure connections.<br>
<br>
You can try opening app url in an incognito mode.<br>
Alternatively you can disable redirect in Settings, clear browser cache and try again.`, { url }),
          url,
        } as RedirectDialogData,
      }).afterClosed().pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
        return window.open(url, target);
      });
    });
  }
}
