import { Inject, Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { format } from 'date-fns';
import { filter } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { Timeout } from 'app/interfaces/timeout.interface';
import { JobSlice, selectJobsPanelSlice } from 'app/modules/jobs/store/job.selectors';
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
  private startBound;
  private jobsCount = 0;

  constructor(
    private dialogService: DialogService,
    private translate: TranslateService,
    private ws: WebSocketService,
    private appStore$: Store<AppState>,
    private jobStore$: Store<JobSlice>,
    @Inject(WINDOW) private window: Window,
  ) {
    this.startBound = this.start.bind(this);

    this.jobStore$.select(selectJobsPanelSlice).pipe(untilDestroyed(this)).subscribe((jobs) => {
      if (jobs.length) {
        this.stop(true);
      } else if (this.jobsCount) {
        this.start(true);
      }
      this.jobsCount = jobs.length;
    });
  }

  start(addListeners = false): void {
    if (addListeners) {
      this.addListeners();
    }

    this.appStore$.select(selectPreferences).pipe(filter(Boolean), untilDestroyed(this)).subscribe((preferences) => {
      this.stop();
      this.actionWaitTimeout = setTimeout(() => {
        this.stop(true);
        const showConfirmTime = 30000;
        this.terminateCancelTimeout = setTimeout(() => this.ws.logout(), showConfirmTime);
        this.dialogService.confirm({
          title: this.translate.instant('Logout'),
          message: this.translate.instant(`
            It looks like your session has been inactive for more than {lifetime} seconds.<br>
            For security reasons we will log you out at {time}.
          `, { time: format(new Date(new Date().getTime() + showConfirmTime), 'HH:mm:ss'), lifetime: preferences.lifetime }),
          buttonMsg: this.translate.instant('Extend session'),
          hideCancel: true,
          hideCheckBox: true,
          disableClose: true,
        }).pipe(untilDestroyed(this)).subscribe((isExtend) => {
          clearTimeout(this.terminateCancelTimeout);
          if (isExtend) {
            this.start(true);
          }
        });
      }, preferences.lifetime * 1000);
    });
  }

  stop(removeListeners = false): void {
    if (removeListeners) {
      this.removeListeners();
    }
    if (this.actionWaitTimeout) {
      clearTimeout(this.actionWaitTimeout);
    }
  }

  addListeners(): void {
    this.window.addEventListener('mouseover', this.startBound, false);
    this.window.addEventListener('keypress', this.startBound, false);
  }

  removeListeners(): void {
    this.window.removeEventListener('mouseover', this.startBound, false);
    this.window.removeEventListener('keypress', this.startBound, false);
  }
}
