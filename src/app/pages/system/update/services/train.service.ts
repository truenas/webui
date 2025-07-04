import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject, Observable, combineLatest, map,
} from 'rxjs';
import { SystemUpdateStatus } from 'app/enums/system-update.enum';
import { extractApiErrorDetails } from 'app/helpers/api.helper';
import { SystemUpdateTrain, SystemUpdateTrains } from 'app/interfaces/system-update.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { UpdateService } from 'app/pages/system/update/services/update.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class TrainService {
  selectedTrain$ = new BehaviorSubject<string | undefined>(undefined);
  releaseTrain$ = new BehaviorSubject<boolean | undefined>(undefined);
  preReleaseTrain$ = new BehaviorSubject<boolean | undefined>(undefined);
  nightlyTrain$ = new BehaviorSubject<boolean | undefined>(undefined);
  currentTrainDescription$ = new BehaviorSubject<string>('');
  trainDescriptionOnPageLoad$ = new BehaviorSubject<string>('');
  fullTrainList$ = new BehaviorSubject<Record<string, SystemUpdateTrain> | undefined>(undefined);
  trainVersion$ = new BehaviorSubject<string | null>(null);

  trainValue$ = new BehaviorSubject<string | null>(null);

  constructor(
    private updateService: UpdateService,
    private api: ApiService,
    private translate: TranslateService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
  ) {}

  // TODO: Investigate where to use it, it's currently not used anywhere
  getAutoDownload(): Observable<boolean> {
    return this.updateService.getConfig().pipe(map((config) => config.autocheck));
  }

  getTrains(): Observable<SystemUpdateTrains> {
    return this.api.call('update.get_trains');
  }

  // TODO: Investigate where to use it, it's currently not used anywhere
  onTrainChanged(newTrain: string, prevTrain: string): void {
    combineLatest([this.fullTrainList$, this.selectedTrain$, this.trainDescriptionOnPageLoad$])
      .pipe(untilDestroyed(this)).subscribe(([fullTrainList, selectedTrain, trainDescriptionOnPageLoad]) => {
        // For the case when the user switches away, then BACK to the train of the current OS
        if (newTrain === selectedTrain) {
          this.currentTrainDescription$.next(trainDescriptionOnPageLoad);
          this.setTrainAndCheck(newTrain, prevTrain);
          return;
        }

        let warning = '';
        if (fullTrainList?.[newTrain]?.description?.includes('[nightly]')) {
          warning = this.translate.instant('Changing to a nightly train is one-way. Changing back to a stable train is not supported! ');
        }

        this.dialogService.confirm({
          title: this.translate.instant('Switch Train'),
          message: warning + this.translate.instant('Switch update trains?') as TranslatedString,
        }).pipe(untilDestroyed(this)).subscribe((confirmSwitch: boolean) => {
          if (confirmSwitch) {
            this.setTrainDescription();
            this.setTrainAndCheck(newTrain, prevTrain);
          } else {
            this.trainValue$.next(prevTrain);
            this.setTrainDescription();
          }
        });
      });
  }

  // TODO: Investigate where to use it, it's currently not used anywhere
  toggleAutoCheck(autoCheck: boolean): void {
    this.updateService.updateConfig({ autocheck: autoCheck })
      .pipe(
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.check();
      });
  }

  setTrainAndCheck(newTrain: string, prevTrain: string): void {
    this.updateService.isLoading$.next(true);
    this.api.call('update.set_train', [newTrain]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.check();
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
        this.trainValue$.next(prevTrain);
        this.updateService.isLoading$.next(false);
      },
      complete: () => {
        this.updateService.isLoading$.next(false);
      },
    });
  }

  check(): void {
    // Reset the template
    this.updateService.updatesAvailable$.next(false);
    this.updateService.releaseNotesUrl$.next('');

    this.updateService.isLoading$.next(true);
    this.updateService.pendingUpdates();
    this.updateService.error$.next(false);
    sessionStorage.updateLastChecked = Date.now();

    combineLatest([
      this.updateService.checkStatus(),
      this.currentTrainDescription$,
    ]).pipe(untilDestroyed(this)).subscribe({
      next: ([update, currentTrainDescription]) => {
        const status = update.code || SystemUpdateStatus.Unavailable;

        if (update.status?.new_version) {
          this.trainVersion$.next(update.status.new_version.version);
        }

        this.updateService.status$.next(status);

        if (status === SystemUpdateStatus.Available && update.status?.new_version) {
          sessionStorage.updateAvailable = 'true';
          this.updateService.updatesAvailable$.next(true);

          if (update.status.new_version.manifest.changelog) {
            this.updateService.changeLog$.next(update.status.new_version.manifest.changelog.replace(/\n/g, '<br>'));
          }

          if (update.status.new_version.release_notes_url) {
            this.updateService.releaseNotesUrl$.next(update.status.new_version.release_notes_url);
          }
        }
        if (currentTrainDescription?.includes('[release]')) {
          this.releaseTrain$.next(true);
          this.preReleaseTrain$.next(false);
          this.nightlyTrain$.next(false);
        } else if (currentTrainDescription.includes('[prerelease]')) {
          this.releaseTrain$.next(false);
          this.preReleaseTrain$.next(true);
          this.nightlyTrain$.next(false);
        } else {
          this.releaseTrain$.next(false);
          this.preReleaseTrain$.next(false);
          this.nightlyTrain$.next(true);
        }
        this.updateService.isLoading$.next(false);
      },
      error: (err: unknown) => {
        const apiError = extractApiErrorDetails(err);
        this.updateService.generalUpdateError$.next(
          `${apiError?.reason?.replace('>', '')?.replace('<', '')}: ${this.translate.instant('Automatic update check failed. Please check system network settings.')}`,
        );
        this.updateService.isLoading$.next(false);
      },
      complete: () => {
        this.updateService.isLoading$.next(false);
      },
    });
  }

  private setTrainDescription(): void {
    combineLatest([this.fullTrainList$, this.trainValue$])
      .pipe(untilDestroyed(this)).subscribe(([fullTrainList, trainValue]) => {
        if (fullTrainList?.[trainValue]) {
          this.currentTrainDescription$.next(fullTrainList?.[trainValue]?.description?.toLowerCase());
        } else {
          this.currentTrainDescription$.next('');
        }
      });
  }
}
