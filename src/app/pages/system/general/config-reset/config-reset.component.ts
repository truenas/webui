import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { MatSnackBar, MatDialog } from '@angular/material';
import { WebSocketService, DialogService } from '../../../../services/';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'config-reset',
  templateUrl: './config-reset.component.html'
})
export class ConfigResetComponent {
  private dialogRef: any;

  public route_success: string[] = ['system', 'general'];
  constructor(protected router: Router, protected ws: WebSocketService, 
    private _location: Location, public snackBar: MatSnackBar, private dialogService: DialogService,
    public dialog: MatDialog) {}

  _displayTime() {

  }
  doSubmit(form: NgForm) {
    let rebootValue;
    if (form.value.restart) {
      console.log('Here I will reset and restart when config.reset is fixed');
      rebootValue = true; 

    } else {
      console.log('Here I will reset w/o restart when config.reset is fixed');
      rebootValue = false;
    }

    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": "Reset Config" }, disableClose: true });
    this.dialogRef.componentInstance.setCall('config.reset', [{ reboot: rebootValue}]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe((res) => {
      if (rebootValue) {
        this.ws.call('system.reboot', [{ delay: 5 }]).subscribe((res) => {
          // this.countDown = setInterval( () => {if(this.count>0){this.count -= 1}}, 1000);
          this.openSnackBar("System will reboot in 5 seconds", "Rebooting");
        });
      } else {
        this.router.navigate(new Array('').concat(this.route_success));
      }
    });
    this.dialogRef.componentInstance.failure.subscribe((res) => {
      this.dialogService.errorReport(res.error, res.reason, res.trace.formatted);
    });
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 5000
    });
  }

  goBack() {
    this.router.navigate(new Array('').concat(this.route_success));
  }
}
