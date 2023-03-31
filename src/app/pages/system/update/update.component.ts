import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { filter, pairwise, tap } from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { SystemUpdateOperationType, SystemUpdateStatus } from 'app/enums/system-update.enum';
import { WINDOW } from 'app/helpers/window.helper';
import globalHelptext from 'app/helptext/global-helptext';
import { helptextSystemUpdate as helptext } from 'app/helptext/system/update';
import { ApiMethod } from 'app/interfaces/api-directory.interface';
import { Option } from 'app/interfaces/option.interface';
import { SystemUpdateTrain } from 'app/interfaces/system-update.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  SaveConfigDialogComponent, SaveConfigDialogMessages,
} from 'app/pages/system/general-settings/save-config-dialog/save-config-dialog.component';
import { StorageService, SystemGeneralService, WebSocketService } from 'app/services';
import { DialogService } from 'app/services/dialog.service';
import { UpdateService } from 'app/services/update.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-update',
  styleUrls: ['update.component.scss'],
  templateUrl: './update.component.html',
})
export class UpdateComponent implements OnInit {
  packages: { operation: string; name: string }[] = [];
  status: SystemUpdateStatus;
  releaseNotes = '';
  changeLog = '';
  updating = false;
  updated = false;
  progress: Record<string, unknown> = {};
  error: string;
  checkable = false;
  trains: Option[] = [];
  selectedTrain: string;
  generalUpdateError: string;
  updateDownloaded = false;
  releaseTrain: boolean;
  preReleaseTrain: boolean;
  nightlyTrain: boolean;
  updatesAvailable = false;
  currentTrainDescription: string;
  trainDescriptionOnPageLoad: string;
  fullTrainList: { [name: string]: SystemUpdateTrain };
  isUpdateRunning = false;
  updateMethod: ApiMethod = 'update.update';
  isHa = false;
  productType: ProductType;
  failoverUpgradePending = false;
  showSpinner = false;
  singleDescription: string;
  updateType: string;
  isHaLicensed: boolean;
  sysUpdateMessage = globalHelptext.sysUpdateMessage;
  sysUpdateMsgPt2 = globalHelptext.sysUpdateMessagePt2;
  updatecheckTooltip = this.translate.instant('Check the update server daily for \
                                  any updates on the chosen train. \
                                  Automatically download an update if \
                                  one is available. Click \
                                  <i>APPLY PENDING UPDATE</i> to install \
                                  the downloaded update.');
  trainVersion: string = null;
  updateTitle = this.translate.instant('Update');

  form = this.fb.group({
    auto_check: [false],
    train: ['', Validators.required],
  });

  private wasConfigurationSaved = false;

  readonly clickForInformationLink = helptext.clickForInformationLink;

  readonly ProductType = ProductType;
  readonly SystemUpdateStatus = SystemUpdateStatus;

  constructor(
    protected router: Router,
    protected ws: WebSocketService,
    protected matDialog: MatDialog,
    public sysGenService: SystemGeneralService,
    protected loader: AppLoaderService,
    protected dialogService: DialogService,
    public translate: TranslateService,
    protected storage: StorageService,
    private store$: Store<AppState>,
    private fb: FormBuilder,
    private snackbar: SnackbarService,
    private updateService: UpdateService,
    @Inject(WINDOW) private window: Window,
  ) {
    this.sysGenService.updateRunning.pipe(untilDestroyed(this)).subscribe((isUpdating: string) => {
      this.isUpdateRunning = isUpdating === 'true';
    });
  }

  get trains$(): Observable<Option[]> {
    return of(this.trains);
  }

  get trainValue(): string {
    return this.form.controls.train.value;
  }

  set trainValue(value) {
    this.form.controls.train.patchValue(value);
  }

  get autoCheckValue(): boolean {
    return this.form.controls.auto_check.value;
  }

  set autoCheckValue(value) {
    this.form.controls.auto_check.patchValue(value);
  }

  ngOnInit(): void {
    this.productType = this.sysGenService.getProductType();

    this.store$.pipe(waitForSystemInfo)
      .pipe(untilDestroyed(this))
      .subscribe((sysInfo) => {
        this.isHaLicensed = !!(sysInfo.license && sysInfo.license.system_serial_ha.length > 0);
      });

    this.ws.call('update.get_auto_download').pipe(untilDestroyed(this)).subscribe((isAutoDownloadOn) => {
      this.autoCheckValue = isAutoDownloadOn;

      this.ws.call('update.get_trains').pipe(untilDestroyed(this)).subscribe({
        next: (trains) => {
          this.checkable = true;
          this.fullTrainList = trains.trains;

          this.trainValue = trains.selected || '';
          this.selectedTrain = trains.selected;

          if (this.autoCheckValue) {
            this.check();
          }

          this.trains = Object.entries(trains.trains).map(([name, train]) => ({
            label: `${name} - ${train.description}`,
            value: name,
          }));
          if (this.trains.length > 0) {
            this.singleDescription = Object.values(trains.trains)[0]?.description;
          }

          if (this.fullTrainList[trains.current]) {
            if (this.fullTrainList[trains.current].description.toLowerCase().includes('[nightly]')) {
              this.currentTrainDescription = '[nightly]';
            } else if (this.fullTrainList[trains.current].description.toLowerCase().includes('[release]')) {
              this.currentTrainDescription = '[release]';
            } else if (this.fullTrainList[trains.current].description.toLowerCase().includes('[prerelease]')) {
              this.currentTrainDescription = '[prerelease]';
            } else {
              this.currentTrainDescription = trains.trains[this.selectedTrain].description.toLowerCase();
            }
          } else {
            this.currentTrainDescription = '';
          }
          // To remember train description if user switches away and then switches back
          this.trainDescriptionOnPageLoad = this.currentTrainDescription;
        },
        error: (error: WebsocketError) => {
          this.dialogService.warn(
            error.trace.class,
            this.translate.instant('TrueNAS was unable to reach update servers.'),
          );
        },
      });
    });

    if (this.productType === ProductType.ScaleEnterprise) {
      setTimeout(() => { // To get around too many concurrent calls???
        this.store$.select(selectIsHaLicensed).pipe(untilDestroyed(this)).subscribe((isLicensed) => {
          if (isLicensed) {
            this.updateMethod = 'failover.upgrade';
            this.isHa = true;
          }
          this.checkForUpdateRunning();
        });
      });
    } else {
      this.checkForUpdateRunning();
    }

    this.form.controls.train.valueChanges.pipe(pairwise(), untilDestroyed(this)).subscribe(([prevTrain, newTrain]) => {
      this.onTrainChanged(newTrain, prevTrain);
    });

    this.form.controls.auto_check.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.toggleAutoCheck();
    });
  }

  checkForUpdateRunning(): void {
    this.ws.call('core.get_jobs', [[['method', '=', this.updateMethod], ['state', '=', JobState.Running]]]).pipe(untilDestroyed(this)).subscribe({
      next: (jobs) => {
        if (jobs && jobs.length > 0) {
          this.isUpdateRunning = true;
          this.showRunningUpdate(jobs[0].id);
        }
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  onTrainChanged(newTrain: string, prevTrain: string): void {
    // For the case when the user switches away, then BACK to the train of the current OS
    if (newTrain === this.selectedTrain) {
      this.currentTrainDescription = this.trainDescriptionOnPageLoad;
      this.setTrainAndCheck(newTrain, prevTrain);
      return;
    }

    let warning = '';
    if (this.fullTrainList[newTrain] && this.fullTrainList[newTrain].description.includes('[nightly]')) {
      warning = this.translate.instant('Changing to a nightly train is one-way. Changing back to a stable train is not supported! ');
    }

    this.dialogService.confirm({
      title: this.translate.instant('Switch Train'),
      message: warning + this.translate.instant('Switch update trains?'),
    }).pipe(untilDestroyed(this)).subscribe((confirmSwitch: boolean) => {
      if (confirmSwitch) {
        this.setTrainDescription();
        this.setTrainAndCheck(newTrain, prevTrain);
      } else {
        this.trainValue = prevTrain;
        this.setTrainDescription();
      }
    });
  }

  setTrainDescription(): void {
    if (this.fullTrainList[this.trainValue]) {
      this.currentTrainDescription = this.fullTrainList[this.trainValue].description.toLowerCase();
    } else {
      this.currentTrainDescription = '';
    }
  }

  toggleAutoCheck(): void {
    this.ws.call('update.set_auto_download', [this.autoCheckValue]).pipe(untilDestroyed(this)).subscribe(() => {
      if (this.autoCheckValue) {
        this.check();
      }
    });
  }

  pendingUpdates(): void {
    this.ws.call('update.get_pending').pipe(untilDestroyed(this)).subscribe((pending) => {
      if (pending.length !== 0) {
        this.updateDownloaded = true;
      }
    });
  }

  setTrainAndCheck(newTrain: string, prevTrain: string): void {
    this.showSpinner = true;
    this.ws.call('update.set_train', [newTrain]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.check();
      },
      error: (err) => {
        new EntityUtils().handleWsError(this, err, this.dialogService);
        this.trainValue = prevTrain;
        this.showSpinner = false;
      },
      complete: () => {
        this.showSpinner = false;
      },
    });
  }

  check(): void {
    // Reset the template
    this.updatesAvailable = false;
    this.releaseNotes = '';

    this.showSpinner = true;
    this.pendingUpdates();
    this.error = null;
    sessionStorage.updateLastChecked = Date.now();
    this.ws.call('update.check_available').pipe(untilDestroyed(this)).subscribe({
      next: (update) => {
        if (update.version) {
          this.trainVersion = update.version;
        }
        this.status = update.status;
        if (update.status === SystemUpdateStatus.Available) {
          sessionStorage.updateAvailable = 'true';
          this.updatesAvailable = true;
          this.packages = [];
          update.changes.forEach((change) => {
            if (change.operation === SystemUpdateOperationType.Upgrade) {
              this.packages.push({
                operation: 'Upgrade',
                name: change.old.name + '-' + change.old.version
                + ' -> ' + change.new.name + '-'
                + change.new.version,
              });
            } else if (change.operation === SystemUpdateOperationType.Install) {
              this.packages.push({
                operation: 'Install',
                name: change.new.name + '-' + change.new.version,
              });
            } else if (change.operation === SystemUpdateOperationType.Delete) {
              if (change.old) {
                this.packages.push({
                  operation: 'Delete',
                  name: change.old.name + '-' + change.old.version,
                });
              } else if (change.new) {
                this.packages.push({
                  operation: 'Delete',
                  name: change.new.name + '-' + change.new.version,
                });
              }
            } else {
              console.error('Unknown operation:', change.operation);
            }
          });

          if (update.changelog) {
            this.changeLog = update.changelog.replace(/\n/g, '<br>');
          }
          if (update.notes) {
            this.releaseNotes = update.notes.ReleaseNotes;
          }
        }
        if (this.currentTrainDescription && this.currentTrainDescription.includes('[release]')) {
          this.releaseTrain = true;
          this.preReleaseTrain = false;
          this.nightlyTrain = false;
        } else if (this.currentTrainDescription.includes('[prerelease]')) {
          this.releaseTrain = false;
          this.preReleaseTrain = true;
          this.nightlyTrain = false;
        } else {
          this.releaseTrain = false;
          this.preReleaseTrain = false;
          this.nightlyTrain = true;
        }
        this.showSpinner = false;
      },
      error: (err: WebsocketError) => {
        this.generalUpdateError = `${err.reason.replace('>', '').replace('<', '')}: ${this.translate.instant('Automatic update check failed. Please check system network settings.')}`;
        this.showSpinner = false;
      },
      complete: () => {
        this.showSpinner = false;
      },
    });
  }

  // Shows an update in progress as a job dialog on the update page
  showRunningUpdate(jobId: number): void {
    const dialogRef = this.matDialog.open(EntityJobComponent, { data: { title: this.updateTitle } });
    if (this.isHa) {
      dialogRef.componentInstance.disableProgressValue(true);
    }
    dialogRef.componentInstance.jobId = jobId;
    dialogRef.componentInstance.wsshow();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.updateService.setForHardRefresh();
      this.router.navigate(['/others/reboot']);
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err) => {
      new EntityUtils().handleWsError(this, err, this.dialogService);
    });
  }

  downloadUpdate(): void {
    this.ws.call('core.get_jobs', [[['method', '=', this.updateMethod], ['state', '=', JobState.Running]]]).pipe(untilDestroyed(this)).subscribe({
      next: (jobs) => {
        if (jobs[0]) {
          this.showRunningUpdate(jobs[0].id);
        } else {
          this.startUpdate();
        }
      },
      error: (err) => {
        new EntityUtils().handleWsError(this, err, this.dialogService);
      },
    });
  }

  applyPendingUpdate(): void {
    this.updateType = 'applyPending';
    this.saveConfigurationIfNecessary()
      .pipe(untilDestroyed(this))
      .subscribe(() => this.continueUpdate());
  }

  manualUpdate(): void {
    this.updateType = 'manual';
    this.saveConfigurationIfNecessary()
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.router.navigate(['/system/update/manualupdate']);
      });
  }

  startUpdate(): void {
    this.error = null;
    this.loader.open();
    this.ws.call('update.check_available').pipe(untilDestroyed(this)).subscribe({
      next: (update) => {
        this.loader.close();
        this.status = update.status;
        if (update.status === SystemUpdateStatus.Available) {
          this.packages = [];
          update.changes.forEach((change) => {
            if (change.operation === SystemUpdateOperationType.Upgrade) {
              this.packages.push({
                operation: 'Upgrade',
                name: change.old.name + '-' + change.old.version
                + ' -> ' + change.new.name + '-'
                + change.new.version,
              });
            } else if (change.operation === SystemUpdateOperationType.Install) {
              this.packages.push({
                operation: 'Install',
                name: change.new.name + '-' + change.new.version,
              });
            } else if (change.operation === SystemUpdateOperationType.Delete) {
            // FIXME: For some reason new is populated instead of old?
              if (change.old) {
                this.packages.push({
                  operation: 'Delete',
                  name: change.old.name + '-' + change.old.version,
                });
              } else if (change.new) {
                this.packages.push({
                  operation: 'Delete',
                  name: change.new.name + '-' + change.new.version,
                });
              }
            } else {
              console.error('Unknown operation:', change.operation);
            }
          });
          if (update.changelog) {
            this.changeLog = update.changelog.replace(/\n/g, '<br>');
          }
          if (update.notes) {
            this.releaseNotes = update.notes.ReleaseNotes;
          }
          this.updateType = 'standard';
          this.saveConfigurationIfNecessary()
            .pipe(untilDestroyed(this))
            .subscribe(() => this.confirmAndUpdate());
        } else if (update.status === SystemUpdateStatus.Unavailable) {
          this.dialogService.info(this.translate.instant('Check Now'), this.translate.instant('No updates available.'));
        }
      },
      error: (error: WebsocketError) => {
        this.loader.close();
        new EntityUtils().handleWsError(this, error, this.dialogService);
        this.dialogService.errorReport(this.translate.instant('Error checking for updates.'), error.reason, error.trace.formatted);
      },
      complete: () => {
        this.loader.close();
      },
    });
  }

  // Continues the update process began in startUpdate(), after passing through the Save Config dialog
  confirmAndUpdate(): void {
    let downloadMsg;
    let confirmMsg;

    if (!this.isHa) {
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
          const dialogRef = this.matDialog.open(EntityJobComponent, { data: { title: this.updateTitle } });
          dialogRef.componentInstance.setCall('update.download');
          dialogRef.componentInstance.submit();
          dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
            dialogRef.close(false);
            this.snackbar.success(this.translate.instant('Updates successfully downloaded'));
            this.pendingUpdates();
          });
          dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err) => {
            new EntityUtils().handleWsError(this, err, this.dialogService);
          });
        } else {
          this.update();
        }
      });
  }

  update(): void {
    this.window.sessionStorage.removeItem('updateLastChecked');
    this.window.sessionStorage.removeItem('updateAvailable');
    this.sysGenService.updateRunningNoticeSent.emit();
    const dialogRef = this.matDialog.open(EntityJobComponent, { data: { title: this.updateTitle } });
    if (!this.isHa) {
      dialogRef.componentInstance.setCall('update.update', [{ reboot: true }]);
      dialogRef.componentInstance.submit();
    } else {
      this.ws.call('update.set_train', [this.trainValue]).pipe(untilDestroyed(this)).subscribe(() => {
        dialogRef.componentInstance.setCall('failover.upgrade');
        dialogRef.componentInstance.disableProgressValue(true);
        dialogRef.componentInstance.submit();
        dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
          this.dialogService.closeAllDialogs();
          this.isUpdateRunning = false;
          this.sysGenService.updateDone(); // Send 'finished' signal to topbar
          this.router.navigate(['/']);
          this.dialogService.confirm({
            title: helptext.ha_update.complete_title,
            message: helptext.ha_update.complete_msg,
            hideCheckbox: true,
            buttonText: helptext.ha_update.complete_action,
            hideCancel: true,
          }).pipe(untilDestroyed(this)).subscribe();
        });
        dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err) => {
          new EntityUtils().handleWsError(this, err, this.dialogService);
        });
      });
    }
  }

  // Continues the update (based on its type) after the Save Config dialog is closed
  continueUpdate(): void {
    switch (this.updateType) {
      case 'applyPending': {
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
      case 'standard':
        this.confirmAndUpdate();
    }
  }

  private saveConfigurationIfNecessary(): Observable<void> {
    if (this.wasConfigurationSaved) {
      return of(undefined);
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
          if (!wasSaved) {
            return;
          }

          this.wasConfigurationSaved = true;
        }),
      );
  }
}
