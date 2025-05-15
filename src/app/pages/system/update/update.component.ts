import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  OnInit,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  combineLatest, filter, forkJoin, map, Observable, of, shareReplay, switchMap, take, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { SystemUpdateOperationType, SystemUpdateStatus } from 'app/enums/system-update.enum';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { helptextSystemUpdate as helptext } from 'app/helptext/system/update';
import { ApiJobMethod } from 'app/interfaces/api/api-job-directory.interface';
import { Job } from 'app/interfaces/job.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { selectJob } from 'app/modules/jobs/store/job.selectors';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { getSystemVersion } from 'app/pages/dashboard/widgets/system/common/widget-sys-info.utils';
import { SaveConfigDialog, SaveConfigDialogMessages } from 'app/pages/system/advanced/manage-configuration-menu/save-config-dialog/save-config-dialog.component';
import { UpdateProfileCard } from 'app/pages/system/update/components/update-profile-card/update-profile-card.component';
import { UpdateType } from 'app/pages/system/update/enums/update-type.enum';
import { Package } from 'app/pages/system/update/interfaces/package.interface';
import { TrainService } from 'app/pages/system/update/services/train.service';
import { UpdateService } from 'app/pages/system/update/services/update.service';
import { systemUpdateElements } from 'app/pages/system/update/update.elements';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-update',
  styleUrls: ['update.component.scss'],
  templateUrl: './update.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    UiSearchDirective,
    TestDirective,
    TranslateModule,
    AsyncPipe,
    RequiresRolesDirective,
    UiSearchDirective,
    TestDirective,
    TranslateModule,
    AsyncPipe,
    NgxSkeletonLoaderModule,
    MatButton,
    IxIconComponent,
    ReactiveFormsModule,
    FakeProgressBarComponent,
    UpdateProfileCard,
  ],
})
export class UpdateComponent implements OnInit {
  readonly SystemUpdateStatus = SystemUpdateStatus;
  protected readonly searchableElements = systemUpdateElements;
  protected readonly requiredRoles = [Role.SystemUpdateWrite];
  protected updateType: UpdateType;
  protected isUpdateRunning = false;
  protected singleDescription: string;
  private trains: Option[] = [];
  private wasConfigurationSaved = false;

  protected readonly isHaLicensed = toSignal(this.store$.select(selectIsHaLicensed));

  protected readonly showApplyPendingButton = toSignal(
    combineLatest([
      this.updateService.updateDownloaded$,
      this.updateService.status$,
    ]).pipe(
      map(([updateDownloaded, status]) => updateDownloaded && status !== SystemUpdateStatus.Unavailable),
    ),
  );

  protected readonly showDownloadUpdateButton = toSignal(this.updateService.updatesAvailable$);

  protected readonly isDownloadUpdatesButtonDisabled = toSignal(
    this.updateService.status$.pipe(
      map((status) => status === SystemUpdateStatus.RebootRequired),
    ),
  );

  protected readonly showInfoForTesting = toSignal(
    combineLatest([
      this.updateService.updatesAvailable$,
      this.trainService.nightlyTrain$,
      this.trainService.preReleaseTrain$,
      this.sysGenService.isEnterprise$,
    ]).pipe(
      map(([updatesAvailable, nightlyTrain, preReleaseTrain, isEnterprise]) => {
        return updatesAvailable && (nightlyTrain || (preReleaseTrain && !isEnterprise));
      }),
    ),
  );

  private readonly systemInfo$ = this.api.call('webui.main.dashboard.sys_info').pipe(
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  protected readonly systemVersion = toSignal(this.systemInfo$.pipe(
    map((info) => getSystemVersion(info.version)),
  ));

  protected readonly updateVersion = toSignal(this.trainService.trainVersion$.pipe(
    map((info) => getSystemVersion(info)),
  ));

  protected readonly standbySystemVersion = toSignal(this.systemInfo$.pipe(
    filter((info) => Boolean(info?.remote_info?.version)),
    map((info) => getSystemVersion(info.remote_info.version)),
  ));

  constructor(
    protected trainService: TrainService,
    protected updateService: UpdateService,
    private router: Router,
    private translate: TranslateService,
    private matDialog: MatDialog,
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private sysGenService: SystemGeneralService,
    private snackbar: SnackbarService,
    private store$: Store<AppState>,
    private loader: LoaderService,
  ) {
    this.sysGenService.updateRunning.pipe(untilDestroyed(this)).subscribe((isUpdating: string) => {
      this.isUpdateRunning = isUpdating === 'true';
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    forkJoin([
      this.trainService.getAutoDownload(),
      this.trainService.getTrains(),
    ]).pipe(untilDestroyed(this)).subscribe({
      next: ([isAutoDownloadOn, trains]) => {
        this.cdr.markForCheck();
        this.trainService.fullTrainList$.next(trains.trains);

        this.trainService.trainValue$.next(trains.selected || '');
        this.trainService.selectedTrain$.next(trains.selected);

        if (isAutoDownloadOn) {
          this.trainService.check();
        }

        this.trains = Object.entries(trains.trains).map(([name, train]) => ({
          label: train.description,
          value: name,
        }));
        if (this.trains.length > 0) {
          this.singleDescription = Object.values(trains.trains)[0]?.description;
        }

        let currentTrainDescription = '';

        if (trains.trains[trains.current]) {
          if (trains.trains[trains.current].description.toLowerCase().includes('[nightly]')) {
            currentTrainDescription = '[nightly]';
          } else if (trains.trains[trains.current].description.toLowerCase().includes('[release]')) {
            currentTrainDescription = '[release]';
          } else if (trains.trains[trains.current].description.toLowerCase().includes('[prerelease]')) {
            currentTrainDescription = '[prerelease]';
          } else {
            currentTrainDescription = trains.trains[trains.selected].description.toLowerCase();
          }
        }
        this.trainService.currentTrainDescription$.next(currentTrainDescription);
        this.trainService.trainDescriptionOnPageLoad$.next(currentTrainDescription);

        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
      },
    });

    this.trainService.toggleAutoCheck(true);
  }

  manualUpdate(): void {
    this.updateType = UpdateType.Manual;
    this.saveConfigurationIfNecessary()
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.router.navigate(['/system/update/manualupdate']);
      });
  }

  applyPendingUpdate(): void {
    this.updateType = UpdateType.ApplyPending;
    this.saveConfigurationIfNecessary()
      .pipe(untilDestroyed(this))
      .subscribe(() => this.continueUpdate());
  }

  continueUpdate(): void {
    switch (this.updateType) {
      case UpdateType.ApplyPending: {
        const message = this.isHaLicensed()
          ? this.translate.instant('The standby controller will be automatically restarted to finalize the update. Apply updates and restart the standby controller?')
          : this.translate.instant('The system will restart and be briefly unavailable while applying updates. Apply updates and restart?');
        this.dialogService.confirm({
          title: this.translate.instant('Apply Pending Updates'),
          message: this.translate.instant(message),
        }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
          this.update();
        });
        break;
      }
      case UpdateType.Standard:
        this.confirmAndUpdate();
        break;
      default:
        console.warn('Unhandled updateType in continueUpdate:', this.updateType);
    }
  }

  showRunningUpdate(jobId: number): void {
    const job$ = this.store$.pipe(
      select(selectJob(jobId)),
      observeJob(),
    ) as Observable<Job<ApiJobMethod>>;

    this.dialogService.jobDialog(
      job$,
      {
        title: this.translate.instant('Update'),
        canMinimize: true,
      },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.router.navigate(['/system-tasks/restart'], { skipLocationChange: true });
      });
  }

  startUpdate(): void {
    this.updateService.error$.next(false);
    this.api.call('update.check_available').pipe(this.loader.withLoader(), untilDestroyed(this)).subscribe({
      next: (update) => {
        this.updateService.status$.next(update.status);
        if (update.status === SystemUpdateStatus.Available) {
          const packages: Package[] = [];
          update.changes.forEach((change) => {
            if (change.operation === SystemUpdateOperationType.Upgrade) {
              packages.push({
                operation: 'Upgrade',
                name: change.old.name + '-' + change.old.version
                  + ' -> ' + change.new.name + '-'
                  + change.new.version,
              });
            } else if (change.operation === SystemUpdateOperationType.Install) {
              packages.push({
                operation: 'Install',
                name: change.new.name + '-' + change.new.version,
              });
            } else if (change.operation === SystemUpdateOperationType.Delete) {
              if (change.old) {
                packages.push({
                  operation: 'Delete',
                  name: change.old.name + '-' + change.old.version,
                });
              } else if (change.new) {
                packages.push({
                  operation: 'Delete',
                  name: change.new.name + '-' + change.new.version,
                });
              }
            } else {
              console.error('Unknown operation:', change.operation);
            }
          });
          this.updateService.packages$.next(packages);

          if (update.changelog) {
            this.updateService.changeLog$.next(update.changelog.replace(/\n/g, '<br>'));
          }
          if (update.release_notes_url) {
            this.updateService.releaseNotesUrl$.next(update.release_notes_url);
          }
          this.updateType = UpdateType.Standard;
          this.saveConfigurationIfNecessary()
            .pipe(untilDestroyed(this))
            .subscribe(() => this.confirmAndUpdate());
        } else if (update.status === SystemUpdateStatus.Unavailable) {
          this.snackbar.success(this.translate.instant('No updates available.'));
        }
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
      },
      complete: () => {
        this.loader.close();
        this.cdr.markForCheck();
      },
    });
  }

  downloadUpdate(): void {
    this.api.call('core.get_jobs', [[['method', '=', 'update.update'], ['state', '=', JobState.Running]]])
      .pipe(this.errorHandler.withErrorHandler(), untilDestroyed(this))
      .subscribe((jobs) => {
        if (jobs[0]) {
          this.showRunningUpdate(jobs[0].id);
        } else {
          this.startUpdate();
        }
        this.cdr.markForCheck();
      });
  }

  confirmAndUpdate(): void {
    let downloadMsg;
    let confirmMsg;

    if (!this.isHaLicensed()) {
      downloadMsg = helptext.non_ha_download_msg;
      confirmMsg = helptext.non_ha_confirm_msg;
    } else {
      downloadMsg = helptext.ha_download_msg;
      confirmMsg = helptext.ha_confirm_msg;
    }

    this.dialogService.confirm({
      title: this.translate.instant('Download Update'),
      message: this.translate.instant(downloadMsg),
      hideCheckbox: true,
      buttonText: this.translate.instant('Download'),
      secondaryCheckbox: true,
      secondaryCheckboxText: this.translate.instant(confirmMsg),
    })
      .pipe(untilDestroyed(this))
      .subscribe((result) => {
        if (!result.confirmed) {
          return;
        }

        if (!result.secondaryCheckbox) {
          this.downloadUpdates();
        } else {
          this.update();
        }
      });
  }

  private saveConfigurationIfNecessary(): Observable<unknown> {
    if (this.wasConfigurationSaved) {
      return of(null);
    }

    return this.matDialog.open(SaveConfigDialog, {
      data: {
        title: this.translate.instant('Save configuration settings from this machine before updating?'),
        saveButton: this.translate.instant('Save Configuration'),
        cancelButton: this.translate.instant('Do not save'),
      } as Partial<SaveConfigDialogMessages>,
    })
      .afterClosed()
      .pipe(
        tap((wasSaved) => {
          if (wasSaved) {
            this.wasConfigurationSaved = true;
          }
        }),
      );
  }

  private update(resume = false): void {
    sessionStorage.removeItem('updateLastChecked');
    sessionStorage.removeItem('updateAvailable');
    this.sysGenService.updateRunningNoticeSent.emit();

    let job$: Observable<Job>;
    if (this.isHaLicensed()) {
      job$ = this.trainService.trainValue$.pipe(
        take(1),
        switchMap((trainValue) => this.api.call('update.set_train', [trainValue])),
        switchMap(() => this.api.job('failover.upgrade', [{ resume }])),
      );
    } else {
      job$ = this.api.job('update.update', [{ resume, reboot: true }]);
    }

    this.dialogService
      .jobDialog(job$, { title: this.translate.instant(this.translate.instant('Update')) })
      .afterClosed()
      .pipe(
        switchMap(() => {
          this.dialogService.closeAllDialogs();
          this.isUpdateRunning = false;
          this.sysGenService.updateDone();
          this.cdr.markForCheck();
          return this.isHaLicensed() ? this.finishHaUpdate() : this.finishNonHaUpdate();
        }),
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe();
  }

  private downloadUpdates(): void {
    this.dialogService.jobDialog(
      this.api.job('update.download'),
      { title: this.translate.instant('Update') },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Updates successfully downloaded'));
        this.updateService.pendingUpdates();
      });
  }

  private finishHaUpdate(): Observable<boolean> {
    return this.dialogService.confirm({
      title: this.translate.instant(helptext.ha_update.complete_title),
      message: this.translate.instant(helptext.ha_update.complete_msg),
      buttonText: this.translate.instant(helptext.ha_update.complete_action),
      hideCheckbox: true,
      hideCancel: true,
    });
  }

  private finishNonHaUpdate(): Observable<boolean> {
    return this.dialogService.confirm({
      title: this.translate.instant(helptext.ha_update.complete_title),
      message: this.translate.instant('Update completed successfully. The system will restart shortly'),
      buttonText: this.translate.instant(helptext.ha_update.complete_action),
      hideCheckbox: true,
      hideCancel: true,
    });
  }
}
