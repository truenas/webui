import { Inject, Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { format } from 'date-fns';
import { filter } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { Timeout } from 'app/interfaces/timeout.interface';
import { WebSocketService } from 'app/services';
import { DialogService } from 'app/services/dialog.service';
import { AppState } from 'app/store';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class TokenLifetimeService {
  protected actionWaitTimeout: Timeout;
  protected terminateCancelTimeout: Timeout;
  private resumeBound;

  constructor(
    private dialogService: DialogService,
    private translate: TranslateService,
    private ws: WebSocketService,
    private appStore$: Store<AppState>,
    @Inject(WINDOW) private window: Window,
  ) {
    this.resumeBound = this.resume.bind(this);
  }

  start(): void {
    this.addListeners();
    this.resume();
  }

  resume(): void {
    this.appStore$.select(selectPreferences).pipe(filter(Boolean), untilDestroyed(this)).subscribe((preferences) => {
      this.pause();
      const lifetime = preferences.lifetime || 300;
      this.actionWaitTimeout = setTimeout(() => {
        this.stop();
        const showConfirmTime = 30000;
        this.terminateCancelTimeout = setTimeout(() => this.ws.logout(), showConfirmTime);
        this.dialogService.confirm({
          title: this.translate.instant('Logout'),
          message: this.translate.instant(`
            It looks like your session has been inactive for more than {lifetime} seconds.<br>
            For security reasons we will log you out at {time}.
          `, { time: format(new Date(new Date().getTime() + showConfirmTime), 'HH:mm:ss'), lifetime }),
          buttonMsg: this.translate.instant('Extend session'),
          hideCancel: true,
          hideCheckBox: true,
          disableClose: true,
        }).pipe(untilDestroyed(this)).subscribe((isExtend) => {
          clearTimeout(this.terminateCancelTimeout);
          if (isExtend) {
            this.start();
          }
        });
      }, lifetime * 1000);
    });
  }

  pause(): void {
    if (this.actionWaitTimeout) {
      clearTimeout(this.actionWaitTimeout);
    }
  }

  stop(): void {
    this.removeListeners();
    this.pause();
  }

  addListeners(): void {
    this.window.addEventListener('mouseover', this.resumeBound, false);
    this.window.addEventListener('keypress', this.resumeBound, false);
  }

  removeListeners(): void {
    this.window.removeEventListener('mouseover', this.resumeBound, false);
    this.window.removeEventListener('keypress', this.resumeBound, false);
  }
}
