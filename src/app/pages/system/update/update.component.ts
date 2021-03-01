import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { WebSocketService, SystemGeneralService, StorageService } from '../../../services/';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { MatDialog } from '@angular/material/dialog';
import { DialogService } from '../../../services/dialog.service';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { TranslateService } from '@ngx-translate/core';
import { T } from '../../../translate-marker';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { EntityUtils } from '../../../pages/common/entity/utils';
import { CoreService, CoreEvent } from 'app/core/services/core.service';

import { DialogFormConfiguration } from '../../common/entity/entity-dialog/dialog-form-configuration.interface';
import { helptext_system_update as helptext } from 'app/helptext/system/update';

@Component({
  selector: 'app-update',
  styleUrls: ['update.component.css'],
  templateUrl: './update.component.html',
})
export class UpdateComponent implements OnInit, OnDestroy {

  public packages: any[] = [];
  public status: string;
  public releaseNotes: any = '';
  public changeLog: any = '';
  public updating = false;
  public updated = false;
  public progress: Object = {};
  public job: any = {};
  public error: string;
  public autoCheck = false;
  public train: string;
  public trains: any[]=[];
  public selectedTrain;
  public general_update_error;
  public update_downloaded=false;
  public release_train: boolean;
  public pre_release_train: boolean;
  public nightly_train: boolean;
  public updates_available = false;
  public currentTrainDescription: string;
  public trainDescriptionOnPageLoad: string;
  public fullTrainList: any[];
  public isUpdateRunning = false;
  public updateMethod: string = 'update.update';
  public is_ha = false;
  public product_type: string;
  public ds: any;
  public failover_upgrade_pending = false;
  public busy: Subscription;
  public busy2: Subscription;
  private checkChangesSubscription: Subscription;
  public showSpinner: boolean = false;
  public singleDescription: string;
  public updateType: string;
  public sysInfo: any;
  public isHA: boolean;
  sysUpdateMessage = T('A system update is in progress. ');
  public sysUpdateMsgPt2 = helptext.sysUpdateMessage;
  public updatecheck_tooltip = T('Check the update server daily for \
                                  any updates on the chosen train. \
                                  Automatically download an update if \
                                  one is available. Click \
                                  <i>APPLY PENDING UPDATE</i> to install \
                                  the downloaded update.');
  public train_version = null;

  protected saveConfigFieldConf: FieldConfig[] = [
    {
      type: 'checkbox',
      name: 'secretseed',
      placeholder: T('Include Password Secret Seed')
    },
  ];
  public saveConfigFormConf: DialogFormConfiguration = {
    title: T("Save configuration settings from this machine before updating?"),
    message: T("<b>WARNING:</b> This configuration file contains system\
              passwords and other sensitive data.<br>"),
    fieldConfig: this.saveConfigFieldConf,
    warning: T("Including the Password Secret Seed allows using this\
              configuration file with a new boot device. It also\
              decrypts all passwords used on this system.\
              <b>Keep the configuration file safe and protect it from unauthorized access!</b>"),
    method_ws: 'core.download',
    saveButtonText: T('SAVE CONFIGURATION'),
    cancelButtonText: T('NO'),
    customSubmit: this.saveConfigSubmit,
    parent: this
  };

  protected dialogRef: any;
  constructor(protected router: Router, protected route: ActivatedRoute,
    protected ws: WebSocketService, protected dialog: MatDialog, public sysGenService: SystemGeneralService,
    protected loader: AppLoaderService, protected dialogService: DialogService, public translate: TranslateService,
    protected storage: StorageService, protected http: HttpClient, public core: CoreService) {
      this.sysGenService.updateRunning.subscribe((res) => { 
        res === 'true' ? this.isUpdateRunning = true : this.isUpdateRunning = false });
  }

  parseTrainName(name) {
    const version = []
    let sw_version = "";
    let branch = "";
    let split = ""
    let sdk = ""
    if (name.match(/-SDK$/)){
      split = name.split('-');
      sw_version = split[1];
      branch = split[2];
      sdk = split[3];
      version.push(sw_version);
      version.push(branch);
      version.push(sdk);
    }
    else {
      split = name.split('-');
      sw_version = split[1];
      branch = split[2];
      version.push(sw_version);
      version.push(branch);
    }
    return version;
  }

  ngOnInit() {
    this.product_type = window.localStorage.getItem('product_type');

    // Get system info from global cache
    this.core.register({ observerClass: this, eventName: "SysInfo"}).subscribe((evt: CoreEvent) => {
      this.sysInfo = evt.data;
      this.isHA = evt.data.license && evt.data.license.system_serial_ha.length > 0 ? true : false;
    });
    this.core.emit({ name: "SysInfoRequest", sender: this });;

    this.busy = this.ws.call('update.get_auto_download').subscribe((res) => {
      this.autoCheck = res;

      this.busy2 = this.ws.call('update.get_trains').subscribe((res) => {
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

    if (this.product_type.includes('ENTERPRISE')) {
      setTimeout(() => { // To get around too many concurrent calls???
        this.ws.call('failover.licensed').subscribe((res) => {
          if (res) {
            this.updateMethod = 'failover.upgrade';
            this.is_ha = true;
          };
          this.checkForUpdateRunning();
        });        
      })

    } else {
      this.checkForUpdateRunning();
    }
  }

  checkForUpdateRunning() {
    this.ws.call('core.get_jobs', [[["method", "=", this.updateMethod], ["state", "=", "RUNNING"]]]).subscribe(
      (res) => {
        if (res && res.length > 0) {
          this.isUpdateRunning = true;
          this.showRunningUpdate(res[0].id);
        }
      },
      (err) => {
        console.error(err);
      });
  }

  checkUpgradePending() {
    this.ws.call('failover.upgrade_pending').subscribe((res) => {
      this.failover_upgrade_pending = res;
    })
  }

  applyFailoverUpgrade() {
    this.dialogService.confirm(T("Finish Upgrade?"), T(""), true, T("Continue")).subscribe((res) => {
      if (res) {
        this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": T("Update") }, disableClose: false });
        this.dialogRef.componentInstance.setCall('failover.upgrade_finish');
        this.dialogRef.componentInstance.submit();
        this.dialogRef.componentInstance.success.subscribe((success) => {
          console.info('success', success)
          this.failover_upgrade_pending = false;
          this.dialogRef.close(false);
        });
        this.dialogRef.componentInstance.failure.subscribe((failure) => {
          this.dialogService.errorReport(failure.error, failure.reason, failure.trace.formatted);
        });
      }
    })
  }

  onTrainChanged(event) {
    // For the case when the user switches away, then BACK to the train of the current OS
    if (event === this.selectedTrain) {
      this.currentTrainDescription = this.trainDescriptionOnPageLoad;
      this.setTrainAndCheck();
      return;
    }

    let warning = '';
    if (this.fullTrainList[event].description.includes('[nightly]')) {
      warning = T("Changing to a nightly train is one-way. Changing back to a stable train is not supported! ");
    }

    this.dialogService.confirm(T("Switch Train"), warning + T("Switch update trains?")).subscribe((train_res)=>{
      if(train_res){
        this.train = event;
        this.setTrainDescription();
        this.setTrainAndCheck();
      } else {
        this.train = this.selectedTrain;
        this.setTrainDescription();
      }
    });
  }

  setTrainDescription() {
    if (this.fullTrainList[this.train]) {
      this.currentTrainDescription = this.fullTrainList[this.train].description.toLowerCase();
    } else {
      this.currentTrainDescription = '';
    }
  }

  toggleAutoCheck() {
    this.autoCheck === !this.autoCheck;
      this.ws.call('update.set_auto_download', [this.autoCheck]).subscribe(() => {
        if (this.autoCheck) {
          this.check();
        }
      })
  }

  pendingupdates() {
    this.ws.call('update.get_pending').subscribe((pending)=>{
      if(pending.length !== 0){
        this.update_downloaded = true;
      }
    });
  }

  setTrainAndCheck() {
    this.showSpinner = true;
    this.ws.call('update.set_train', [this.train]).subscribe(() => { 
      this.check();
    },(err) => {
      new EntityUtils().handleWSError(this, err, this.dialogService);
      this.showSpinner = false;
    },
    () => {
      this.showSpinner = false;
    });
  }

  check() {
    // Reset the template
    this.updates_available = false; 
    this.releaseNotes = '';

    this.showSpinner = true;
    this.pendingupdates();
    this.error = null;
    this.ws.call('update.check_available')
      .subscribe(
        (res) => {
          if (res.version) {
            this.train_version = res.version;
          }
          this.status = res.status;
          if (res.status === 'AVAILABLE') {
            this.updates_available = true;
            this.packages = [];
            res.changes.forEach((item) => {
              if (item.operation === 'upgrade') {
                this.packages.push({
                  operation: 'Upgrade',
                  name: item.old.name + '-' + item.old.version +
                    ' -> ' + item.new.name + '-' +
                    item.new.version,
                });
              } else if (item.operation === 'install') {
                this.packages.push({
                  operation: 'Install',
                  name: item.new.name + '-' + item.new.version,
                });
              } else if (item.operation === 'delete') {
                if (item.old) {
                  this.packages.push({
                    operation: 'Delete',
                    name: item.old.name + '-' + item.old.version,
                  });
                } else if (item.new) {
                  this.packages.push({
                    operation: 'Delete',
                    name: item.new.name + '-' + item.new.version,
                  });
                }
              } else {
                console.error("Unknown operation:", item.operation)
              }
            });

            if (res.changelog) {
              this.changeLog = res.changelog.replace(/\n/g, '<br>');
            }
            if (res.notes) {
              this.releaseNotes = res.notes.ReleaseNotes;
            }
          }
          if (this.currentTrainDescription && this.currentTrainDescription.includes('[release]')) {
            this.release_train = true;
            this.pre_release_train = false;
            this.nightly_train = false;
          } else if(this.currentTrainDescription.includes('[prerelease]')) {
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
          this.general_update_error =  err.reason.replace('>', '').replace('<','') + T(": Automatic update check failed. Please check system network settings.");
          this.showSpinner = false;
        },
        () => {
          this.showSpinner = false;
        });
  }

  // Shows an update in progress as a job dialog on the update page
  showRunningUpdate(jobId) {
    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": "Update" }, disableClose: true });
    if (this.is_ha) {
      this.dialogRef.componentInstance.disableProgressValue(true);
    };
    this.dialogRef.componentInstance.jobId = jobId;
    this.dialogRef.componentInstance.wsshow();
    this.dialogRef.componentInstance.success.subscribe((res) => {
      this.router.navigate(['/others/reboot']);
    });
    this.dialogRef.componentInstance.failure.subscribe((err) => {
      new EntityUtils().handleWSError(this, err, this.dialogService);
    });
  }

  // Functions for carrying out the update begin here /////////////////////

  // Buttons in the template activate these three functions
  downloadUpdate() {
    this.ws.call('core.get_jobs', [[["method", "=", this.updateMethod], ["state", "=", "RUNNING"]]]).subscribe(
      (res) => {
        if (res[0]) {
          this.showRunningUpdate(res[0].id);
        } else {
          this.startUpdate();
        }
      },
      (err) => {
        new EntityUtils().handleWSError(this, err, this.dialogService);
      });
  }

  ApplyPendingUpdate() {
    this.updateType = 'applyPending';
    // Calls the 'Save Config' dialog - Returns here if user declines
    this.dialogService.dialogForm(this.saveConfigFormConf).subscribe((res)=>{
      if (res === false) {
        this.continueUpdate()
      }
    });
  };

  ManualUpdate() {
    this.updateType = 'manual';
    // Calls the 'Save Config' dialog - Returns here if user declines
    this.dialogService.dialogForm(this.saveConfigFormConf).subscribe((res)=>{
      if (res === false) {
        this.continueUpdate()
      }
    });
  };
  // End button section

  startUpdate() {
    this.error = null;
    this.loader.open();
    this.ws.call('update.check_available')
      .subscribe(
        (res) => {
          this.loader.close();
          this.status = res.status;
          if (res.status === 'AVAILABLE') {
            this.packages = [];
            res.changes.forEach((item) => {
              if (item.operation === 'upgrade') {
                this.packages.push({
                  operation: 'Upgrade',
                  name: item.old.name + '-' + item.old.version +
                    ' -> ' + item.new.name + '-' +
                    item.new.version,
                });
              } else if (item.operation === 'install') {
                this.packages.push({
                  operation: 'Install',
                  name: item.new.name + '-' + item.new.version,
                });
              } else if (item.operation === 'delete') {
                // FIXME: For some reason new is populated instead of
                // old?
                if (item.old) {
                  this.packages.push({
                    operation: 'Delete',
                    name: item.old.name + '-' + item.old.version,
                  });
                } else if (item.new) {
                  this.packages.push({
                    operation: 'Delete',
                    name: item.new.name + '-' + item.new.version,
                  });
                }
              } else {
                console.error("Unknown operation:", item.operation)
              }
            });
            if (res.changelog) {
              this.changeLog = res.changelog.replace(/\n/g, '<br>');
            }
            if (res.notes) {
              this.releaseNotes = res.notes.ReleaseNotes;
            }
            this.updateType = 'standard';
            // Calls the 'Save Config' dialog - Returns here if user declines
            this.dialogService.dialogForm(this.saveConfigFormConf).subscribe((res)=>{
              if (res === false) {
                this.confirmAndUpdate()
              };
            });
          } else if (res.status === 'UNAVAILABLE'){
            this.dialogService.Info(T('Check Now'), T('No updates available.'))
          }
        },
        (err) => {
          this.loader.close();
          new EntityUtils().handleWSError(this, err, this.dialogService);
          this.dialogService.errorReport(T("Error checking for updates."), err.reason, err.trace.formatted);
        },
        () => {
          this.loader.close();
        });
  };

  // Continues the update process began in startUpdate(), after passing through the Save Config dialog
  confirmAndUpdate() {
    let downloadMsg;
    let confirmMsg;

    if (!this.is_ha) {
      downloadMsg = helptext.non_ha_download_msg;
      confirmMsg = helptext.non_ha_confirm_msg;
    } else {
      downloadMsg = helptext.ha_download_msg;
      confirmMsg = helptext.ha_confirm_msg;
    }

    this.ds  = this.dialogService.confirm(
      T("Download Update"), downloadMsg,true,T("Download"),true,
      confirmMsg,
      this.updateMethod,[{ reboot: false }]
    )

    this.ds.componentInstance.isSubmitEnabled = true;
    this.ds.afterClosed().subscribe((status)=>{
      if(status){
        if (!this.ds.componentInstance.data[0].reboot){
          this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": T("Update") }, disableClose: false });
          this.dialogRef.componentInstance.setCall('update.download');
          this.dialogRef.componentInstance.submit();
          this.dialogRef.componentInstance.success.subscribe((succ) => {
            this.dialogRef.close(false);
            this.dialogService.Info(T("Updates successfully downloaded"),'', '450px', 'info', true);
            this.pendingupdates();

          });
          this.dialogRef.componentInstance.failure.subscribe((err) => {
            new EntityUtils().handleWSError(this, err, this.dialogService);
          });
        }
        else{
          this.update();
        }
      }
    });
  }

  update() {
    this.sysGenService.updateRunningNoticeSent.emit();
    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": "Update" }, disableClose: true });
    if (!this.is_ha) {
      this.dialogRef.componentInstance.setCall('update.update', [{ reboot: true }]);
      this.dialogRef.componentInstance.submit();

      this.dialogRef.componentInstance.failure.subscribe((res) => {
        this.dialogService.errorReport(res.error, res.reason, res.trace.formatted);
      });
    } else {
      this.ws.call('update.set_train', [this.train]).subscribe(() => { 
        this.dialogRef.componentInstance.setCall('failover.upgrade');
        this.dialogRef.componentInstance.disableProgressValue(true);
        this.dialogRef.componentInstance.submit();
        this.dialogRef.componentInstance.success.subscribe((res) => {
          this.dialogService.closeAllDialogs();
          this.isUpdateRunning = false;
          this.sysGenService.updateDone(); // Send 'finished' signal to topbar
          this.router.navigate(['/']); 
          this.dialogService.confirm(helptext.ha_update.complete_title, 
            helptext.ha_update.complete_msg, true, 
            helptext.ha_update.complete_action,false, '','','','', true).subscribe(() => {
            });
        });
        this.dialogRef.componentInstance.failure.subscribe((err) => {
          new EntityUtils().handleWSError(this, err, this.dialogService);
        })
      })
    };
  }

    // Save Config dialog
    saveConfigSubmit(entityDialog) {
      parent = entityDialog.parent;
        let fileName = "";
        let mimetype;
        if (entityDialog.parent.sysInfo) {
          const hostname = entityDialog.parent.sysInfo.hostname.split('.')[0];
          const date = entityDialog.datePipe.transform(new Date(),"yyyyMMddHHmmss");
          fileName = hostname + '-' + date;
          if (entityDialog.formValue['secretseed']) {
            fileName += '.tar';
            mimetype = 'application/x-tar';
          } else {
            fileName += '.db';
            mimetype = 'application/x-sqlite3';
          }
        }
  
        entityDialog.ws.call('core.download', ['config.save', [{ 'secretseed': entityDialog.formValue['secretseed'] }], fileName])
          .subscribe(
            (succ) => {
              const url = succ[1];
              entityDialog.parent.storage.streamDownloadFile(entityDialog.parent.http, url, fileName, mimetype)
              .subscribe(file => {
                entityDialog.dialogRef.close();
                entityDialog.parent.storage.downloadBlob(file, fileName);
                  entityDialog.parent.continueUpdate();
              }, err => {
                entityDialog.dialogRef.close();
                entityDialog.parent.dialogService.confirm(helptext.save_config_err.title, helptext.save_config_err.message,
                  false, helptext.save_config_err.button_text).subscribe((res) => {
                     if (res) {
                      entityDialog.parent.continueUpdate();
                    }
                  })
              })
              entityDialog.dialogRef.close();
            },
            (err) => {
              entityDialog.parent.dialogService.confirm(helptext.save_config_err.title, helptext.save_config_err.message,
                false, helptext.save_config_err.button_text).subscribe((res) => {
                  if (res) {
                    entityDialog.parent.continueUpdate();
                  }
                })
            }
          );
    }
  
    // Continutes the update (based on its type) after the Save Config dialog is closed
    continueUpdate() {
      switch (this.updateType) {
        case 'manual':
          this.router.navigate([this.router.url +'/manualupdate']);
          break;
        case 'applyPending':
          let message = this.isHA ? "The standby controller will be automatically restarted to finalize the update. Apply updates and restart the standby controller?" : "The system will reboot and be briefly unavailable while applying updates. Apply updates and reboot?";
          this.dialogService.confirm(
            T("Apply Pending Updates"), T(message)
          ).subscribe((res)=>{
            if(res){
              this.update();
            };
          });
          break;
        case 'standard':
          this.confirmAndUpdate();
      }
    }

  ngOnDestroy() {
    if (this.checkChangesSubscription) {
      this.checkChangesSubscription.unsubscribe();
    }
  }
}
