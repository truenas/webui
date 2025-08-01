import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { filter, take } from 'rxjs/operators';
import { WINDOW } from 'app/helpers/window.helper';
import { RedirectDialogData } from 'app/modules/dialog/components/redirect-dialog/redirect-dialog-data.interface';
import { RedirectDialog } from 'app/modules/dialog/components/redirect-dialog/redirect-dialog.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppState } from 'app/store';
import { waitForGeneralConfig } from 'app/store/system-config/system-config.selectors';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class RedirectService {
  protected api = inject(ApiService);
  private translate = inject(TranslateService);
  private matDialog = inject(MatDialog);
  private store$ = inject<Store<AppState>>(Store);
  private window = inject<Window>(WINDOW);


  openWindow(url: string, target?: string): void {
    if (!url.includes('http://')) {
      this.window.open(url, target);
      return;
    }
    this.store$.pipe(waitForGeneralConfig, take(1), untilDestroyed(this)).subscribe((config) => {
      if (!config.ui_httpsredirect) {
        this.window.open(url, target);
        return;
      }
      this.matDialog.open(RedirectDialog, {
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
        this.window.open(url, target);
      });
    });
  }
}
