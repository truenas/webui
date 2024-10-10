import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable, of, filter, tap, combineLatest, map,
} from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { SystemUpdateOperationType, SystemUpdateStatus } from 'app/enums/system-update.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextGlobal } from 'app/helptext/global-helptext';
import { helptextSystemUpdate as helptext } from 'app/helptext/system/update';
import { ApiJobMethod } from 'app/interfaces/api/api-job-directory.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  SaveConfigDialogComponent, SaveConfigDialogMessages,
} from 'app/pages/system/general-settings/save-config-dialog/save-config-dialog.component';
import { UpdateType } from 'app/pages/system/update/enums/update-type.enum';
import { Package } from 'app/pages/system/update/interfaces/package.interface';
import { TrainService } from 'app/pages/system/update/services/train.service';
import { UpdateService } from 'app/pages/system/update/services/update.service';
import { updateAgainCode } from 'app/pages/system/update/utils/update-again-code.constant';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-update-actions-card',
  styleUrls: ['update-actions-card.component.scss'],
  templateUrl: './update-actions-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateActionsCardComponent implements OnInit {
  isUpdateRunning = false;
  updateMethod: ApiJobMethod = 'update.update';
  isHaLicensed = false;
  updateType: UpdateType;
  sysUpdateMessage = helptextGlobal.sysUpdateMessage;
  sysUpdateMsgPt2 = helptextGlobal.sysUpdateMessagePt2;
  updateTitle = this.translate.instant('Update');

  showApplyPendingButton$ = combineLatest([
    this.updateService.updateDownloaded$,
    this.updateService.status$,
  ]).pipe(map(([updateDownloaded, status]) => updateDownloaded && status !== SystemUpdateStatus.Unavailable));

  showDownloadUpdateButton$ = this.updateService.updatesAvailable$;

  isDownloadUpdatesButtonDisabled$ = this.updateService.status$.pipe(
    map((status) => status === SystemUpdateStatus.RebootRequired),
  );

  protected readonly requiredRoles = [Role.FullAdmin];

  private wasConfigurationSaved = false;

  constructor(
    private router: Router,
    private ws: WebSocketService,
    private matDialog: MatDialog,
    private sysGenService: SystemGeneralService,
    private errorHandler: ErrorHandlerService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private store$: Store<AppState>,
    private snackbar: SnackbarService,
    protected trainService: TrainService,
    protected updateService: UpdateService,
    private cdr: ChangeDetectorRef,
    @Inject(WINDOW) private window: Window,
  ) {
    this.sysGenService.updateRunning.pipe(untilDestroyed(this)).subscribe((isUpdating: string) => {
      this.isUpdateRunning = isUpdating === 'true';
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    this.store$.select(selectIsHaLicensed).pipe(untilDestroyed(this)).subscribe((isLicensed) => {
      this.isHaLicensed = isLicensed;
      if (isLicensed) {
        this.updateMethod = 'failover.upgrade';
      }
      this.cdr.markForCheck();
      this.checkForUpdateRunning();
    });
  }

  checkForUpdateRunning(): void {
    this.ws.call('core.get_jobs', [[['method', '=', this.updateMethod], ['state', '=', JobState.Running]]])
      .pipe(untilDestroyed(this)).subscribe({
        next: (jobs) => {
          if (jobs && jobs.length > 0) {
            this.isUpdateRunning = true;
            this.showRunningUpdate(jobs[0].id);
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error(err);
        },
      });
  }

  // Shows an update in progress as a job dialog on the update page
  showRunningUpdate(jobId: number): void {
    const dialogRef = this.matDialog.open(EntityJobComponent, { data: { title: this.updateTitle } });
    if (this.isHaLicensed) {
      dialogRef.componentInstance.disableProgressValue(true);
    }
    dialogRef.componentInstance.jobId = jobId;
    dialogRef.componentInstance.wsshow();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.router.navigate(['/others/reboot'], { skipLocationChange: true });
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err) => {
      this.dialogService.error(this.errorHandler.parseError(err));
    });
  }

  downloadUpdate(): void {
    this.ws.call('core.get_jobs', [[['method', '=', this.updateMethod], ['state', '=', JobState.Running]]])
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe((jobs) => {
        if (jobs[0]) {
          this.showRunningUpdate(jobs[0].id);
        } else {
          this.startUpdate();
        }
        this.cdr.markForCheck();
      });
  }

  applyPendingUpdate(): void {
    this.updateType = UpdateType.ApplyPending;
    this.saveConfigurationIfNecessary()
      .pipe(untilDestroyed(this))
      .subscribe(() => this.continueUpdate());
  }

  manualUpdate(): void {
    this.updateType = UpdateType.Manual;
    this.saveConfigurationIfNecessary()
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.router.navigate(['/system/update/manualupdate']);
      });
  }

  startUpdate(): void {
    this.updateService.error$.next(null);
    this.ws.call('update.check_available').pipe(this.loader.withLoader(), untilDestroyed(this)).subscribe({
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
          this.dialogService.info(this.translate.instant('Check Now'), this.translate.instant('No updates available.'));
        }
      },
      error: (error: WebSocketError) => {
        this.dialogService.error({
          title: this.translate.instant('Error checking for updates.'),
          message: error.reason,
          backtrace: error.trace?.formatted,
        });
      },
      complete: () => {
        this.loader.close();
        this.cdr.markForCheck();
      },
    });
  }

  // Continues the update process began in startUpdate(), after passing through the Save Config dialog
  confirmAndUpdate(): void {
    let downloadMsg;
    let confirmMsg;

    if (!this.isHaLicensed) {
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

  private update(resume = false): void {
    this.window.sessionStorage.removeItem('updateLastChecked');
    this.window.sessionStorage.removeItem('updateAvailable');
    this.sysGenService.updateRunningNoticeSent.emit();
    const dialogRef = this.matDialog.open(EntityJobComponent, { data: { title: this.updateTitle } });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((error) => {
      dialogRef.close();
      this.handleUpdateError(error);
    });
    if (!this.isHaLicensed) {
      dialogRef.componentInstance.setCall('update.update', [{ resume, reboot: true }]);
      dialogRef.componentInstance.submit();
    } else {
      this.trainService.trainValue$.pipe(
        tap((trainValue) => this.ws.call('update.set_train', [trainValue])),
        untilDestroyed(this),
      ).subscribe(() => {
        dialogRef.componentInstance.setCall('failover.upgrade', [{ resume }]);
        dialogRef.componentInstance.disableProgressValue(true);
        dialogRef.componentInstance.submit();
        dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
          this.dialogService.closeAllDialogs();
          this.isUpdateRunning = false;
          this.sysGenService.updateDone(); // Send 'finished' signal to topbar
          this.cdr.markForCheck();
          this.router.navigate(['/']);
          this.dialogService.confirm({
            title: helptext.ha_update.complete_title,
            message: helptext.ha_update.complete_msg,
            hideCheckbox: true,
            buttonText: helptext.ha_update.complete_action,
            hideCancel: true,
          }).pipe(untilDestroyed(this)).subscribe();
        });
      });
    }
  }

  // Continues the update (based on its type) after the Save Config dialog is closed
  continueUpdate(): void {
    switch (this.updateType) {
      case UpdateType.ApplyPending: {
        const message = this.isHaLicensed
          ? this.translate.instant('The standby controller will be automatically restarted to finalize the update. Apply updates and restart the standby controller?')
          : this.translate.instant('The system will reboot and be briefly unavailable while applying updates. Apply updates and reboot?');
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
    }
  }

  private saveConfigurationIfNecessary(): Observable<void> {
    if (this.wasConfigurationSaved) {
      return of(null);
    }

    return this.matDialog.open(SaveConfigDialogComponent, {
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

  private handleUpdateError(error: Job): void {
    if (error.error.includes(updateAgainCode)) {
      this.dialogService.confirm({
        title: helptext.continueDialogTitle,
        message: error.error.replace(updateAgainCode, ''),
        buttonText: helptext.continueDialogAction,
      }).pipe(
        filter(Boolean),
        untilDestroyed(this),
      ).subscribe(() => {
        this.update(true);
      });
      return;
    }
    this.dialogService.error(this.errorHandler.parseError(error));
  }

  private downloadUpdates(): void {
    this.dialogService.jobDialog(
      this.ws.job('update.download'),
      { title: this.updateTitle },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Updates successfully downloaded'));
        this.updateService.pendingUpdates();
      });
  }
}
