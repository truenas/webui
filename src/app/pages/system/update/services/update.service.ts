import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject, Observable,
} from 'rxjs';
import { SystemUpdateStatus } from 'app/enums/system-update.enum';
import { UpdateConfig, UpdateProfileChoices, UpdateStatus } from 'app/interfaces/system-update.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class UpdateService {
  updatesAvailable$ = new BehaviorSubject<boolean>(false);
  updateDownloaded$ = new BehaviorSubject<boolean>(false);
  isLoading$ = new BehaviorSubject<boolean>(true);
  status$ = new BehaviorSubject<SystemUpdateStatus | undefined>(undefined);
  releaseNotesUrl$ = new BehaviorSubject<string>('');
  changeLog$ = new BehaviorSubject<string>('');

  currentTrainDescription$ = new BehaviorSubject<string>('');
  updateVersion$ = new BehaviorSubject<string | null>(null);

  constructor(
    private api: ApiService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
  ) {}

  checkIfUpdateIsDownloaded(): void {
    this.getUpdateStatus().pipe(untilDestroyed(this)).subscribe((status) => {
      if (
        status.code === SystemUpdateStatus.RebootRequired
        || (status.status?.new_version && !status.update_download_progress)
      ) {
        this.updateDownloaded$.next(true);
      }
    });
  }

  getUpdateStatus(): Observable<UpdateStatus> {
    return this.api.call('update.status');
  }

  getUpdateConfig(): Observable<UpdateConfig> {
    return this.api.call('update.config');
  }

  updateConfig(update: Partial<UpdateConfig>): Observable<UpdateConfig> {
    return this.api.call('update.update', [update]);
  }

  getProfileChoices(): Observable<UpdateProfileChoices> {
    return this.api.call('update.profile_choices');
  }

  checkForUpdates(): void {
    this.updatesAvailable$.next(false);
    this.releaseNotesUrl$.next('');

    this.isLoading$.next(true);
    this.checkIfUpdateIsDownloaded();
    sessionStorage.updateLastChecked = Date.now();

    this.getUpdateStatus().pipe(untilDestroyed(this)).subscribe({
      next: (update) => {
        const status = update.code || SystemUpdateStatus.Unavailable;

        if (update.status?.new_version) {
          this.updateVersion$.next(update.status.new_version.version);
        }

        this.status$.next(status);

        if (update.status?.new_version) {
          sessionStorage.updateAvailable = 'true';
          this.updatesAvailable$.next(true);

          if (update.status.new_version.manifest.changelog) {
            this.changeLog$.next(update.status.new_version.manifest.changelog.replace(/\n/g, '<br>'));
          }

          if (update.status.new_version.release_notes_url) {
            this.releaseNotesUrl$.next(update.status.new_version.release_notes_url);
          }
        }

        this.isLoading$.next(false);
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
        this.isLoading$.next(false);
      },
      complete: () => {
        this.isLoading$.next(false);
      },
    });
  }
}
