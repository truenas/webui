import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  BehaviorSubject,
} from 'rxjs';
import { SystemUpdateStatus } from 'app/enums/system-update.enum';
import { Package } from 'app/pages/system/update/interfaces/package.interface';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class UpdateService {
  updatesAvailable$ = new BehaviorSubject<boolean>(false);
  updateDownloaded$ = new BehaviorSubject<boolean>(false);
  isLoading$ = new BehaviorSubject<boolean>(false);
  error$ = new BehaviorSubject<boolean>(false);
  generalUpdateError$ = new BehaviorSubject<string>(undefined);
  packages$ = new BehaviorSubject<Package[]>([]);
  status$ = new BehaviorSubject<SystemUpdateStatus>(undefined);
  releaseNotesUrl$ = new BehaviorSubject<string>('');
  changeLog$ = new BehaviorSubject<string>('');

  constructor(
    private ws: WebSocketService,
  ) {}

  pendingUpdates(): void {
    this.ws.call('update.get_pending').pipe(untilDestroyed(this)).subscribe((pending) => {
      if (pending.length !== 0) {
        this.updateDownloaded$.next(true);
      }
    });
  }
}
