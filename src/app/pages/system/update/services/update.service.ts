import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject, Observable } from 'rxjs';
import { SystemUpdateStatus } from 'app/enums/system-update.enum';
import { UpdateConfig, UpdateProfileChoices, UpdateStatus } from 'app/interfaces/system-update.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { Package } from 'app/pages/system/update/interfaces/package.interface';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class UpdateService {
  updatesAvailable$ = new BehaviorSubject<boolean>(false);
  updateDownloaded$ = new BehaviorSubject<boolean>(false);
  isLoading$ = new BehaviorSubject<boolean>(true);
  error$ = new BehaviorSubject<boolean>(false);
  generalUpdateError$ = new BehaviorSubject<string | undefined>(undefined);
  packages$ = new BehaviorSubject<Package[]>([]);
  status$ = new BehaviorSubject<SystemUpdateStatus | undefined>(undefined);
  releaseNotesUrl$ = new BehaviorSubject<string>('');
  changeLog$ = new BehaviorSubject<string>('');

  constructor(
    private api: ApiService,
  ) {}

  checkStatus(): Observable<UpdateStatus> {
    return this.api.call('update.status');
  }

  pendingUpdates(): void {
    this.checkStatus().pipe(untilDestroyed(this)).subscribe((status) => {
      if (
        status.code === SystemUpdateStatus.RebootRequired
        || (status.status?.new_version && status.update_download_progress)
      ) {
        this.updateDownloaded$.next(true);
      }
    });
  }

  getConfig(): Observable<UpdateConfig> {
    return this.api.call('update.config');
  }

  updateConfig(update: Partial<UpdateConfig>): Observable<UpdateConfig> {
    return this.api.call('update.update', [update]);
  }

  getProfileChoices(): Observable<UpdateProfileChoices> {
    return this.api.call('update.profile_choices');
  }
}
