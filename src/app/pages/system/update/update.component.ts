import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog/dialog-ref';
import { ActivatedRoute, Router } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { CoreService } from 'app/core/services/core-service/core.service';
import { JobState } from 'app/enums/job-state.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { SystemUpdateOperationType, SystemUpdateStatus } from 'app/enums/system-update.enum';
import globalHelptext from 'app/helptext/global-helptext';
import { helptext_system_update as helptext } from 'app/helptext/system/update';
import { ApiMethod } from 'app/interfaces/api-directory.interface';
import { SysInfoEvent, SystemInfoWithFeatures } from 'app/interfaces/events/sys-info-event.interface';
import { SystemUpdateTrain } from 'app/interfaces/system-update.interface';
import { ConfirmDialogComponent } from 'app/pages/common/confirm-dialog/confirm-dialog.component';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { StorageService, SystemGeneralService, WebSocketService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';

@UntilDestroy()
@Component({
  selector: 'app-update',
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
  autoCheck = false;
  train: string;
  trains: { name: string; description: string }[] = [];
  selectedTrain: string;
  general_update_error: string;
  update_downloaded = false;
  release_train: boolean;
  pre_release_train: boolean;
  nightly_train: boolean;
  updates_available = false;
  currentTrainDescription: string;
  trainDescriptionOnPageLoad: string;
  fullTrainList: { [name: string]: SystemUpdateTrain };
  isUpdateRunning = false;
  updateMethod: ApiMethod = 'update.update';
  is_ha = false;
  product_type: ProductType;
  ds: MatDialogRef<ConfirmDialogComponent, boolean>;
  failover_upgrade_pending = false;
  showSpinner = false;
  singleDescription: string;
  updateType: string;
  sysInfo: SystemInfoWithFeatures;
  isHA: boolean;
  sysUpdateMessage = globalHelptext.sysUpdateMessage;
  sysUpdateMsgPt2 = globalHelptext.sysUpdateMessagePt2;
  updatecheck_tooltip = T('Check the update server daily for \
                                  any updates on the chosen train. \
                                  Automatically download an update if \
                                  one is available. Click \
                                  <i>APPLY PENDING UPDATE</i> to install \
                                  the downloaded update.');
  train_version: string = null;
  updateTitle = this.translate.instant(T('Update'));

  protected saveConfigFieldConf: FieldConfig[] = [
    {
      type: 'checkbox',
      name: 'secretseed',
      placeholder: T('Include Password Secret Seed'),
    },
  ];
  saveConfigFormConf: DialogFormConfiguration = {
    title: T('Save configuration settings from this machine before updating?'),
    message: T('<b>WARNING:</b> This configuration file contains system\
              passwords and other sensitive data.<br>'),
    fieldConfig: this.saveConfigFieldConf,
    warning: T('Including the Password Secret Seed allows using this\
              configuration file with a new boot device. It also\
              decrypts all passwords used on this system.\
              <b>Keep the configuration file safe and protect it from unauthorized access!</b>'),
    method_ws: 'core.download',
    saveButtonText: T('SAVE CONFIGURATION'),
    cancelButtonText: T('NO'),
    customSubmit: (entityDialog) => this.saveConfigSubmit(entityDialog),
    parent: this,
  };

  protected dialogRef: MatDialogRef<EntityJobComponent>;

  readonly ProductType = ProductType;
  readonly SystemUpdateStatus = SystemUpdateStatus;

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected ws: WebSocketService,
    protected dialog: MatDialog,
    public sysGenService: SystemGeneralService,
    protected loader: AppLoaderService,
    protected dialogService: DialogService,
    public translate: TranslateService,
    protected storage: StorageService,
    protected http: HttpClient,
    public core: CoreService,
  ) {
    this.sysGenService.updateRunning.pipe(untilDestroyed(this)).subscribe((isUpdating: string) => {
      this.isUpdateRunning = isUpdating === 'true';
    });
  }

  parseTrainName(name: string): string[] {
    const version = [];
    let sw_version = '';
    let branch = '';
    let split: string[] = [];
    let sdk = '';
    if (name.match(/-SDK$/)) {
      split = name.split('-');
      sw_version = split[1];
      branch = split[2];
      sdk = split[3];
      version.push(sw_version);
      version.push(branch);
      version.push(sdk);
    } else {
      split = name.split('-');
      sw_version = split[1];
      branch = split[2];
      version.push(sw_version);
      version.push(branch);
    }
    return version;
  }

  ngOnInit(): void {
    this.product_type = window.localStorage.getItem('product_type') as ProductType;

    // Get system info from global cache
    this.core.register({ observerClass: this, eventName: 'SysInfo' }).pipe(untilDestroyed(this)).subscribe((evt: SysInfoEvent) => {
      this.sysInfo = evt.data;
      this.isHA = !!(evt.data.license && evt.data.license.system_serial_ha.length > 0);
    });
    this.core.emit({ name: 'SysInfoRequest', sender: this });

    this.ws.call('update.get_auto_download').pipe(untilDestroyed(this)).subscribe((isAutoDownloadOn) => {
      this.autoCheck = isAutoDownloadOn;

      this.ws.call('update.get_trains').pipe(untilDestroyed(this)).subscribe((res) => {
        this.fullTrainList = res.trains;

        // On page load, make sure we are working with train of the current OS
        this.train = res.current;
        this.selectedTrain = res.current;

        if (this.autoCheck) {
          this.check();
        }

        this.trains = [];
        for (const i in res.trains) {
          this.trains.push({ name: i, description: res.trains[i].description });
        }
        if (this.trains.length > 0) {
          this.singleDescription = this.trains[0].description;
        }

        if (this.fullTrainList[res.current]) {
          if (this.fullTrainList[res.current].description.toLowerCase().includes('[nightly]')) {
            this.currentTrainDescription = '[nightly]';
          } else if (this.fullTrainList[res.current].description.toLowerCase().includes('[release]')) {
            this.currentTrainDescription = '[release]';
          } else if (this.fullTrainList[res.current].description.toLowerCase().includes('[prerelease]')) {
            this.currentTrainDescription = '[prerelease]';
          } else {
            this.currentTrainDescription = res.trains[this.selectedTrain].description.toLowerCase();
          }
        } else {
          this.currentTrainDescription = '';
        }
        // To remember train descrip if user switches away and then switches back
        this.trainDescriptionOnPageLoad = this.currentTrainDescription;
      });
    });

    if (this.product_type.includes(ProductType.Enterprise)) {
      setTimeout(() => { // To get around too many concurrent calls???
        this.ws.call('failover.licensed').pipe(untilDestroyed(this)).subscribe((res) => {
          if (res) {
            this.updateMethod = 'failover.upgrade';
            this.is_ha = true;
          }
          this.checkForUpdateRunning();
        });
      });
    } else {
      this.checkForUpdateRunning();
    }
  }

  checkForUpdateRunning(): void {
    this.ws.call('core.get_jobs', [[['method', '=', this.updateMethod], ['state', '=', JobState.Running]]]).pipe(untilDestroyed(this)).subscribe(
      (jobs) => {
        if (jobs && jobs.length > 0) {
          this.isUpdateRunning = true;
          this.showRunningUpdate(jobs[0].id);
        }
      },
      (err) => {
        console.error(err);
      },
    );
  }

  checkUpgradePending(): void {
    this.ws.call('failover.upgrade_pending').pipe(untilDestroyed(this)).subscribe((res) => {
      this.failover_upgrade_pending = res;
    });
  }

  applyFailoverUpgrade(): void {
    this.dialogService.confirm({
      title: this.translate.instant(T('Finish Upgrade?')),
      message: '',
      hideCheckBox: true,
      buttonMsg: T('Continue'),
    }).pipe(untilDestroyed(this)).subscribe((res: boolean) => {
      if (res) {
        this.dialogRef = this.dialog.open(EntityJobComponent, { data: { title: this.updateTitle } });
        this.dialogRef.componentInstance.setCall('failover.upgrade_finish');
        this.dialogRef.componentInstance.submit();
        this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
          this.failover_upgrade_pending = false;
          this.dialogRef.close(false);
        });
        this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((failure: any) => {
          this.dialogService.errorReport(failure.error, failure.reason, failure.trace.formatted);
        });
      }
    });
  }

  onTrainChanged(event: string): void {
    // For the case when the user switches away, then BACK to the train of the current OS
    if (event === this.selectedTrain) {
      this.currentTrainDescription = this.trainDescriptionOnPageLoad;
      this.setTrainAndCheck();
      return;
    }

    let warning = '';
    if (this.fullTrainList[event].description.includes('[nightly]')) {
      warning = T('Changing to a nightly train is one-way. Changing back to a stable train is not supported! ');
    }

    this.dialogService.confirm({
      title: this.translate.instant('Switch Train'),
      message: warning + T('Switch update trains?'),
    }).pipe(untilDestroyed(this)).subscribe((train_res: boolean) => {
      if (train_res) {
        this.train = event;
        this.setTrainDescription();
        this.setTrainAndCheck();
      } else {
        this.train = this.selectedTrain;
        this.setTrainDescription();
      }
    });
  }

  setTrainDescription(): void {
    if (this.fullTrainList[this.train]) {
      this.currentTrainDescription = this.fullTrainList[this.train].description.toLowerCase();
    } else {
      this.currentTrainDescription = '';
    }
  }

  toggleAutoCheck(): void {
    this.ws.call('update.set_auto_download', [this.autoCheck]).pipe(untilDestroyed(this)).subscribe(() => {
      if (this.autoCheck) {
        this.check();
      }
    });
  }

  pendingupdates(): void {
    this.ws.call('update.get_pending').pipe(untilDestroyed(this)).subscribe((pending) => {
      if (pending.length !== 0) {
        this.update_downloaded = true;
      }
    });
  }

  setTrainAndCheck(): void {
    this.showSpinner = true;
    this.ws.call('update.set_train', [this.train]).pipe(untilDestroyed(this)).subscribe(() => {
      this.check();
    }, (err) => {
      new EntityUtils().handleWSError(this, err, this.dialogService);
      this.showSpinner = false;
    },
    () => {
      this.showSpinner = false;
    });
  }

  check(): void {
    // Reset the template
    this.updates_available = false;
    this.releaseNotes = '';

    this.showSpinner = true;
    this.pendingupdates();
    this.error = null;
    this.ws.call('update.check_available').pipe(untilDestroyed(this)).subscribe(
      (update) => {
        if (update.version) {
          this.train_version = update.version;
        }
        this.status = update.status;
        if (update.status === SystemUpdateStatus.Available) {
          this.updates_available = true;
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
          this.release_train = true;
          this.pre_release_train = false;
          this.nightly_train = false;
        } else if (this.currentTrainDescription.includes('[prerelease]')) {
          this.release_train = false;
          this.pre_release_train = true;
          this.nightly_train = false;
        } else {
          this.release_train = false;
          this.pre_release_train = false;
          this.nightly_train = true;
        }
        this.showSpinner = false;
      },
      (err) => {
        this.general_update_error = `${err.reason.replace('>', '').replace('<', '')}: ${T('Automatic update check failed. Please check system network settings.')}`;
        this.showSpinner = false;
      },
      () => {
        this.showSpinner = false;
      },
    );
  }

  // Shows an update in progress as a job dialog on the update page
  showRunningUpdate(jobId: number): void {
    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { title: this.updateTitle } });
    if (this.is_ha) {
      this.dialogRef.componentInstance.disableProgressValue(true);
    }
    this.dialogRef.componentInstance.jobId = jobId;
    this.dialogRef.componentInstance.wsshow();
    this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.router.navigate(['/others/reboot']);
    });
    this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err) => {
      new EntityUtils().handleWSError(this, err, this.dialogService);
    });
  }

  // Functions for carrying out the update begin here /////////////////////

  // Buttons in the template activate these three functions
  downloadUpdate(): void {
    this.ws.call('core.get_jobs', [[['method', '=', this.updateMethod], ['state', '=', JobState.Running]]]).pipe(untilDestroyed(this)).subscribe(
      (jobs) => {
        if (jobs[0]) {
          this.showRunningUpdate(jobs[0].id);
        } else {
          this.startUpdate();
        }
      },
      (err) => {
        new EntityUtils().handleWSError(this, err, this.dialogService);
      },
    );
  }

  applyPendingUpdate(): void {
    this.updateType = 'applyPending';
    // Calls the 'Save Config' dialog - Returns here if user declines
    this.dialogService.dialogForm(this.saveConfigFormConf).pipe(untilDestroyed(this)).subscribe((res) => {
      if (!res) {
        this.continueUpdate();
      }
    });
  }

  manualUpdate(): void {
    this.updateType = 'manual';
    // Calls the 'Save Config' dialog - Returns here if user declines
    this.dialogService.dialogForm(this.saveConfigFormConf).pipe(untilDestroyed(this)).subscribe((res) => {
      if (!res) {
        this.continueUpdate();
      }
    });
  }
  // End button section

  startUpdate(): void {
    this.error = null;
    this.loader.open();
    this.ws.call('update.check_available').pipe(untilDestroyed(this)).subscribe(
      (update) => {
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
              // FIXME: For some reason new is populated instead of
              // old?
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
          // Calls the 'Save Config' dialog - Returns here if user declines
          this.dialogService.dialogForm(this.saveConfigFormConf).pipe(untilDestroyed(this)).subscribe((res) => {
            if (!res) {
              this.confirmAndUpdate();
            }
          });
        } else if (update.status === SystemUpdateStatus.Unavailable) {
          this.dialogService.info(T('Check Now'), T('No updates available.'));
        }
      },
      (err) => {
        this.loader.close();
        new EntityUtils().handleWSError(this, err, this.dialogService);
        this.dialogService.errorReport(T('Error checking for updates.'), err.reason, err.trace.formatted);
      },
      () => {
        this.loader.close();
      },
    );
  }

  // Continues the update process began in startUpdate(), after passing through the Save Config dialog
  confirmAndUpdate(): void {
    let downloadMsg;
    let confirmMsg;

    if (!this.is_ha) {
      downloadMsg = helptext.non_ha_download_msg;
      confirmMsg = helptext.non_ha_confirm_msg;
    } else {
      downloadMsg = helptext.ha_download_msg;
      confirmMsg = helptext.ha_confirm_msg;
    }

    this.ds = this.dialogService.confirm({
      title: this.translate.instant(T('Download Update')),
      message: this.translate.instant(downloadMsg),
      hideCheckBox: true,
      buttonMsg: this.translate.instant(T('Download')),
      secondaryCheckBox: true,
      secondaryCheckBoxMsg: this.translate.instant(confirmMsg),
      method: this.updateMethod,
      data: [{ reboot: false }],
    }) as MatDialogRef<ConfirmDialogComponent, boolean>;

    this.ds.componentInstance.isSubmitEnabled = true;
    this.ds.afterClosed().pipe(untilDestroyed(this)).subscribe((status) => {
      if (status) {
        if (!(this.ds.componentInstance.data[0] as any).reboot) {
          this.dialogRef = this.dialog.open(EntityJobComponent, { data: { title: this.updateTitle } });
          this.dialogRef.componentInstance.setCall('update.download');
          this.dialogRef.componentInstance.submit();
          this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
            this.dialogRef.close(false);
            this.dialogService.info(T('Updates successfully downloaded'), '', '450px', 'info', true);
            this.pendingupdates();
          });
          this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err) => {
            new EntityUtils().handleWSError(this, err, this.dialogService);
          });
        } else {
          this.update();
        }
      }
    });
  }

  update(): void {
    this.sysGenService.updateRunningNoticeSent.emit();
    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { title: this.updateTitle } });
    if (!this.is_ha) {
      this.dialogRef.componentInstance.setCall('update.update', [{ reboot: true }]);
      this.dialogRef.componentInstance.submit();

      this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res: any) => {
        this.dialogService.errorReport(res.error, res.reason, res.trace.formatted);
      });
    } else {
      this.ws.call('update.set_train', [this.train]).pipe(untilDestroyed(this)).subscribe(() => {
        this.dialogRef.componentInstance.setCall('failover.upgrade');
        this.dialogRef.componentInstance.disableProgressValue(true);
        this.dialogRef.componentInstance.submit();
        this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
          this.dialogService.closeAllDialogs();
          this.isUpdateRunning = false;
          this.sysGenService.updateDone(); // Send 'finished' signal to topbar
          this.router.navigate(['/']);
          this.dialogService.confirm({
            title: helptext.ha_update.complete_title,
            message: helptext.ha_update.complete_msg,
            hideCheckBox: true,
            buttonMsg: helptext.ha_update.complete_action,
            hideCancel: true,
          }).pipe(untilDestroyed(this)).subscribe();
        });
        this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err) => {
          new EntityUtils().handleWSError(this, err, this.dialogService);
        });
      });
    }
  }

  // Save Config dialog
  saveConfigSubmit(entityDialog: EntityDialogComponent<this>): void {
    let fileName = '';
    let mimetype: string;
    if (this.sysInfo) {
      const hostname = this.sysInfo.hostname.split('.')[0];
      const date = entityDialog.datePipe.transform(new Date(), 'yyyyMMddHHmmss');
      fileName = hostname + '-' + date;
      if (entityDialog.formValue['secretseed']) {
        fileName += '.tar';
        mimetype = 'application/x-tar';
      } else {
        fileName += '.db';
        mimetype = 'application/x-sqlite3';
      }
    }

    entityDialog.ws.call('core.download', ['config.save', [{ secretseed: entityDialog.formValue['secretseed'] }], fileName])
      .pipe(untilDestroyed(this)).subscribe(
        (succ) => {
          const url = succ[1];
          this.storage.streamDownloadFile(this.http, url, fileName, mimetype)
            .pipe(untilDestroyed(this)).subscribe((file: Blob) => {
              entityDialog.dialogRef.close();
              this.storage.downloadBlob(file, fileName);
              this.continueUpdate();
            }, () => {
              entityDialog.dialogRef.close();
              this.dialogService.confirm({
                title: this.translate.instant(helptext.save_config_err.title),
                message: this.translate.instant(helptext.save_config_err.message),
                buttonMsg: this.translate.instant(helptext.save_config_err.button_text),
              }).pipe(
                filter(Boolean),
                untilDestroyed(this),
              ).subscribe(() => {
                this.continueUpdate();
              });
            });
          entityDialog.dialogRef.close();
        },
        () => {
          this.dialogService.confirm({
            title: this.translate.instant(helptext.save_config_err.title),
            message: this.translate.instant(helptext.save_config_err.message),
            hideCheckBox: false,
            buttonMsg: this.translate.instant(helptext.save_config_err.button_text),
          }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
            this.continueUpdate();
          });
        },
      );
  }

  // Continutes the update (based on its type) after the Save Config dialog is closed
  continueUpdate(): void {
    switch (this.updateType) {
      case 'manual':
        this.router.navigate([this.router.url + '/manualupdate']);
        break;
      case 'applyPending':
        const message = this.isHA
          ? this.translate.instant('The standby controller will be automatically restarted to finalize the update. Apply updates and restart the standby controller?')
          : this.translate.instant('The system will reboot and be briefly unavailable while applying updates. Apply updates and reboot?');
        this.dialogService.confirm({
          title: this.translate.instant(T('Apply Pending Updates')),
          message: this.translate.instant(T(message)),
        }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
          this.update();
        });
        break;
      case 'standard':
        this.confirmAndUpdate();
    }
  }
}
