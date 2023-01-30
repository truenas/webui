import { Inject, Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { WINDOW } from 'app/helpers/window.helper';
import { Timeout } from 'app/interfaces/timeout.interface';
import { WebSocketService } from 'app/services';
import { DialogService } from 'app/services/dialog.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class TokenLifetimeService {
  protected timeoutToken: Timeout;
  protected timeoutLogout: Timeout;

  constructor(
    private dialogService: DialogService,
    private translate: TranslateService,
    private ws: WebSocketService,
    @Inject(WINDOW) private window: Window,
  ) {}

  start(addListeners = false): void {
    if (addListeners) {
      this.addListeners();
    }

    this.stop();
    const lifetime = Number(this.window.localStorage.getItem('lifetime'));
    this.timeoutToken = setTimeout(() => {
      this.timeoutLogout = setTimeout(() => this.ws.logout(), 5000);
      this.dialogService.confirm({
        title: this.translate.instant('Logout'),
        message: this.translate.instant('Are you sure you want to logout?'),
        buttonMsg: this.translate.instant('Logout'),
        cancelMsg: this.translate.instant('Cancel'),
        hideCheckBox: true,
        disableClose: true,
      }).pipe(untilDestroyed(this)).subscribe((isLogout) => {
        clearTimeout(this.timeoutLogout);
        if (isLogout) {
          this.ws.logout();
        } else {
          this.start();
        }
      });
    }, lifetime * 1000);
  }

  stop(removeListeners = false): void {
    if (removeListeners) {
      this.removeListeners();
    }
    if (this.timeoutToken) {
      clearTimeout(this.timeoutToken);
    }
  }

  addListeners(): void {
    this.window.addEventListener('mouseover', (() => this.start()));
    this.window.addEventListener('keypress', (() => this.start()));
  }

  removeListeners(): void {
    this.window.removeEventListener('mouseover', (() => this.start()));
    this.window.removeEventListener('keypress', (() => this.start()));
  }
}
