import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { RestService, WebSocketService } from '../../../services/';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { MatDialog, MatSnackBar } from '@angular/material';
import { DialogService } from '../../../services/dialog.service';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { TranslateService } from '@ngx-translate/core';
import { T } from '../../../translate-marker';

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
  public train_msg = {
    "NIGHTLY_DOWNGRADE": T("Changing away from the nightly train is considered a downgrade and not a supported operation. Activate an existing boot environment that uses the desired train and boot into it to switch to that train."),
    "MINOR_DOWNGRADE": T("Changing the minor version is considered a downgrade and is not a supported operation. Activate an existing boot environment that uses the desired train and boot into it to switch to that train."),
    "MAJOR_DOWNGRADE": T("Changing the major version is considered a downgrade and is not a supported operation. Activate an existing boot environment that uses the desired train and boot into it to switch to that train."),
    "SDK": T("Changing SDK version is not a supported operation. Activate an existing boot environment that uses the desired train and boot into it to switch to that train."),
    "NIGHTLY_UPGRADE": T("Changing to a nightly train is one-way. Changing back to a stable train is not supported!")
  }
 
  public busy: Subscription;
  public busy2: Subscription;

  protected dialogRef: any;
  constructor(protected router: Router, protected route: ActivatedRoute, protected snackBar: MatSnackBar,
    protected rest: RestService, protected ws: WebSocketService, protected dialog: MatDialog, 
    protected loader: AppLoaderService, protected dialogService: DialogService, public translate: TranslateService) {
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

  compareTrains(t1, t2) {
    const v1 = this.parseTrainName(t1)
    const v2 = this.parseTrainName(t2);
    
    try {
      if(v1[0] !== v2[0] ) {

        const version1 = v1[0].split('.'); 
        const version2 = v2[0].split('.');
        const branch1 = v1[1].toLowerCase();
        const branch2 = v2[1].toLowerCase();
        


        if(branch1 !== branch2) {

          if(branch2 === "nightlies") {
            return "NIGHTLY_UPGRADE";
          } else if(branch1 === "nightlies") {
            return "NIGHTLY_DOWNGRADE";
          }
        } else {
          if(version2[0] ==="HEAD"){
            return "ALLOWED"
          }
        }

        if (version1[0] === version2[0]){
          // comparing '11' .1 with '11' .2
          if(version1[1] && version2[1]){
            //comparing '.1' with '.2'
            return version1[1] > version2[1] ? "MINOR_UPGRADE":"MINOR_DOWNGRADE";
          }
          if(version1[1]){
            //handling a case where '.1' is compared with 'undefined'
            return "MINOR_DOWNGRADE"
          }
          if(version2[1]){
            //comparing '.1' with '.2'
            return "MINOR_UPGRADE"
          }

        } else {
          // comparing '9' .10 with '11' .2
          return version1[0] > version2[0] ? "MAJOR_UPGRADE":"MAJOR_DOWNGRADE";
        }


      } else {
        if(v1[0] === v2[0]&&v1[1] !== v2[1]){
          const branch1 = v1[1].toLowerCase();
          const branch2 = v2[1].toLowerCase();
          if(branch1 !== branch2) {

            if(branch2 === "nightlies") {
              return "NIGHTLY_UPGRADE";
            } else if(branch1 === "nightlies") {
              return "NIGHTLY_DOWNGRADE";
            }
          } else {
            if(branch2 === "nightlies" && branch1 === "nightlies") {
  
            }
  
          }
          
        }
        else {
          if(v2[2]||v1[2]){
            return "SDK"
          }
        }


      }
    } catch (e) {
      console.error("Failed to compare trains", e);
    }
  }

  ngOnInit() {
    this.busy = this.rest.get('system/update', {}).subscribe((res) => {
      this.autoCheck = res.data.upd_autocheck;
      this.train = res.data.upd_train;
      if (this.autoCheck){
        this.check();
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


  onTrainChanged(event){
    const compare = this.compareTrains(this.selectedTrain, event.value);
    if(compare === "NIGHTLY_DOWNGRADE" || compare === "MINOR_DOWNGRADE" || compare === "MAJOR_DOWNGRADE" || compare ==="SDK") {
      this.dialogService.Info("Error", this.train_msg[compare]).subscribe((res)=>{
        this.train = this.selectedTrain;
      })
    } else if(compare === "NIGHTLY_UPGRADE"){
        this.dialogService.confirm(T("Warning"), this.train_msg[compare]).subscribe((res)=>{
          if (res){
            this.check();
            this.train = event.value;
          } else {
            this.train = this.selectedTrain;
          }
        })
    } else if (compare === "ALLOWED") {
      this.dialogService.confirm(T("Switch Train"), T("Switch update trains?")).subscribe((train_res)=>{
        if(train_res){
          this.check();
          this.train = event.value;

        }

      })

    }
  }

  toggleAutoCheck() {
    this.busy =
      this.rest
      .put('system/update', { body: JSON.stringify({ upd_autocheck: this.autoCheck }) })
      .subscribe((res) => {
      });
  }

  downloadUpdate() {
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
              "Download Update", "Continue with download?",true,"",true,"Apply updates and reboot system after downloading.","update.update",[{ train: this.train, reboot: false }]
            )
            ds.afterClosed().subscribe((status)=>{
              if(status){
                if (!ds.componentInstance.data[0].reboot){
                  this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": T("Update") }, disableClose: false });
                  this.dialogRef.componentInstance.setCall('update.download');
                  this.dialogRef.componentInstance.submit();
                  this.dialogRef.componentInstance.success.subscribe((succ) => {
                    this.dialogRef.close(false);
                    this.snackBar.open(T("Updates successfully downloaded"),'close', { duration: 5000 });
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
            this.dialogService.Info(T('Check Now'), T('No updates available'))
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
      T("Apply Pending Updates"), T("The system will be rebooted after updates are applied. Do you want to continue?")
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

  check() {
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
          this.general_update_error =  err.reason.replace('>', '').replace('<','') + T(":  Automatic update check failed. Please check system network settings.")
        }, 
        () => {
        });
  }
}
