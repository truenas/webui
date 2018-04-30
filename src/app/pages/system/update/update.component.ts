import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, NavigationStart } from '@angular/router';
import { Subscription } from 'rxjs';

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
  public updating: boolean = false;
  public updated: boolean = false;
  public progress: Object = {};
  public job: any = {};
  public error: string;
  public autoCheck = false;
  public train: string;
  public trains: any[];
  public selectedTrain;

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
    });
    this.busy2 = this.ws.call('update.get_trains').subscribe((res) => {
      this.trains = [];
      for (let i in res.trains) {
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
      if (oriTrain == newTrain) {
        return true;
      } else if ((oriTrain == 'STABLE') && (newTrain == 'Nightlies')) {
        return true;
      } else {
        return false
      }
    } else if((!isNaN(oriVer) && isNaN(newVer)) && (newVer >= oriVer) && (oriTrain == newTrain)){
      return true;
    } else {
      return false;
    }
  }

  onTrainChanged(event){
    var isValid = this.validUpdate(this.selectedTrain, event.value);
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
        // verify auto check
      });
  }

  check() {
    this.error = null;
    this.loader.open();
    this.busy =
      this.ws.call('update.check_available', [{ train: this.train }])
      .subscribe(
        (res) => {
          console.log('this is the res', res);
          this.status = res.status;
          if (res.status == 'AVAILABLE') {
            this.packages = [];
            res.changes.forEach((item) => {
              if (item.operation == 'upgrade') {
                this.packages.push({
                  operation: 'Upgrade',
                  name: item.old.name + '-' + item.old.version +
                    ' -> ' + item.new.name + '-' +
                    item.new.version,
                });
              } else if (item.operation == 'install') {
                this.packages.push({
                  operation: 'Install',
                  name: item.new.name + '-' + item.new.version,
                });
              } else if (item.operation == 'delete') {
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
            // if(res.notes.ChangeLog) {
            //   this.rest.get(res.notes.ChangeLog.toString(), {}, false).subscribe(logs => this.changeLog = logs.data, err => this.snackBar.open(err.message.toString(), 'OKAY', {duration: 5000}));
            // }
            if (res.changelog) {
              this.changeLog = res.changelog;
            }
            if (res.notes.ReleaseNotes) {
              this.releaseNotes = res.notes.ReleaseNotes;
            }
          }
        },
        (err) => { this.error = err.error; },
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
}
