import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, NavigationStart } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { RestService, WebSocketService } from '../../../services/';
import { MarkdownModule } from 'angular2-markdown';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { MatDialog, MatDialogRef, MatSnackBar } from '@angular/material';
import { DialogService } from '../../../services/dialog.service';
import * as _ from 'lodash';
import { environment } from '../../../../environments/environment';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { TranslateService } from '@ngx-translate/core';
import { T } from '../../../translate-marker';
import { DialogFormConfiguration } from '../../common/entity/entity-dialog/dialog-form-configuration.interface';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector: 'app-update',
  styleUrls: ['update.component.css'],
  templateUrl: './update.component.html',
})
export class UpdateComponent implements OnInit {

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
  public trains: any[];
  public selectedTrain;
  public general_update_error;
  public update_downloaded=false;
 
  public busy: Subscription;
  public busy2: Subscription;

  protected dialogRef: any;
  constructor(protected router: Router, protected route: ActivatedRoute, protected snackBar: MatSnackBar,
    protected rest: RestService, protected ws: WebSocketService, protected dialog: MatDialog, 
    protected loader: AppLoaderService, protected dialogService: DialogService, public translate: TranslateService) {
  }

  ngOnInit() {
    this.busy = this.rest.get('system/update', {}).subscribe((res) => {
      this.autoCheck = res.data.upd_autocheck;
      this.train = res.data.upd_train;
      if (this.autoCheck){
        this.autocheck();
      }
    });
    this.busy2 = this.ws.call('update.get_trains').subscribe((res) => {
      this.trains = [];
      for (const i in res.trains) {
        this.trains.push({ name: i });
      }
      this.train = res.selected;
      this.selectedTrain = res.selected;
    });
  }

  validUpdate(originalVersion, newVersion) {
    const oriVer = originalVersion.split('-')[1];
    const oriTrain = originalVersion.split('-')[2];
    const newVer = newVersion.split('-')[1];
    const newTrain = newVersion.split('-')[2];
    if ((!isNaN(oriVer) && !isNaN(newVer)) && (newVer >= oriVer)) {
      if (oriTrain === newTrain) {
        return true;
      } else if ((oriTrain === 'STABLE') && (newTrain === 'Nightlies')) {
        return true;
      } else {
        return false
      }
    } else if((!isNaN(oriVer) && isNaN(newVer)) && (newVer >= oriVer) && (oriTrain === newTrain)){
      return true;
    } else {
      return false;
    }
  }

  onTrainChanged(event){
    const isValid = this.validUpdate(this.selectedTrain, event.value);
    if (isValid) {
      this.dialogService.confirm("Switch Train", "Are you sure you want to switch trains?").subscribe((res)=>{
        if (res) {
          this.train = event.value;
        }else {
          this.train = this.selectedTrain;
        }
      });
    } else {
      this.dialogService.Info("Confirm", "Changing away from the train is not permitted, it is considered a downgrade. If you have an existing boot environment that uses that train, boot into it in order to upgrade that train").subscribe(res => {
        this.train = this.selectedTrain;
      });
    }
  }

  toggleAutoCheck() {
    this.busy =
      this.rest
      .put('system/update', { body: JSON.stringify({ upd_autocheck: this.autoCheck }) })
      .subscribe((res) => {
      });
  }

  check() {
    this.error = null;
    this.loader.open();
    this.ws.call('update.check_available', [{ train: this.train }])
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
              this.changeLog = res.changelog;
            }
            if (res.notes) {
              this.releaseNotes = res.notes.ReleaseNotes;
            }
            const ds  = this.dialogService.confirm(
              "Download Update", "Do you want to continue?",true,"",true,"Apply updates after downloading (The system will reboot)","update.update",[{ train: this.train, reboot: false }]
            )
            ds.afterClosed().subscribe((status)=>{
              if(status){
                if (!ds.componentInstance.data[0].reboot){
                  this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": "Update" }, disableClose: false });
                  this.dialogRef.componentInstance.setCall('update.download');
                  this.dialogRef.componentInstance.setDescription("Downloading Updates");
                  this.dialogRef.componentInstance.submit();
                  this.dialogRef.componentInstance.success.subscribe((succ) => {
                    this.dialogRef.close(false);
                    this.snackBar.open("Updates are successfully Downloaded",'close', { duration: 5000 });
                    this.pendingupdates();
                    
                  });
                  this.dialogRef.componentInstance.failure.subscribe((failure) => {
                    this.dialogService.errorReport(failure.error, failure.reason, failure.trace.formatted);
                  });
  
                }
                else{
                  this.update();
                }
  
              }
              
            })
          } else if (res.status === 'UNAVAILABLE'){
            this.dialogService.Info('Check Now', 'No updates available')
          }
        },
        (err) => {
          this.loader.close();
          this.dialogService.errorReport(T("Error checking for updates"), err.reason, err.trace.formatted);
        }, 
        () => {
          this.loader.close();
        });
  }

  update() {
    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": "Update" }, disableClose: true });
    this.dialogRef.componentInstance.setCall('update.update', [{ train: this.train, reboot: false }]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe((res) => {
      this.router.navigate(['/others/reboot']);
    });
    this.dialogRef.componentInstance.failure.subscribe((res) => {
      this.dialogService.errorReport(res.error, res.reason, res.trace.formatted);
    });
  }
  ApplyPendingUpdate() {
    const apply_pending_update_ds  = this.dialogService.confirm(
      "Apply Pending Updates", "Are you sure you want to continue? The system will be rebooted after updates are applied."
    ).subscribe((res)=>{
      if(res){
       this.update();
      }
    });
  }
  ManualUpdate(){
    this.router.navigate([this.router.url +'/manualupdate']);
  }

  pendingupdates(){
    this.ws.call('update.get_pending').subscribe((pending)=>{
      if(pending.length !== 0){
        this.update_downloaded = true;
      }
    });
}

  autocheck() {
    this.pendingupdates();
    this.error = null;
    this.ws.call('update.check_available', [{ train: this.train }])
      .subscribe(
        (res) => {
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
              this.changeLog = res.changelog;
            }
            if (res.notes) {
              this.releaseNotes = res.notes.ReleaseNotes;
            }
          }
        },
        (err) => {
          this.general_update_error =  err.reason.replace('>', '').replace('<','') + ":  Automatic update check failed, please check your network setting."
        }, 
        () => {
        });
  }
}
