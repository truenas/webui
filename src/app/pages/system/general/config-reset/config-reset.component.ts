import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { MatSnackBar, MatDialog } from '@angular/material';
import { WebSocketService, DialogService } from '../../../../services/';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';
import { T } from '../../../../translate-marker';
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
      rebootValue = true; 

    } else {
      rebootValue = false;
    }

    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": T("Reset Configuration") }, disableClose: true });
    this.dialogRef.componentInstance.setCall('config.reset', [{ reboot: rebootValue}]);
    this.dialogRef.componentInstance.setDescription(T('Resetting configuration to default settings'));
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe(() => {
      this.dialogRef.close();
      if (!rebootValue) {
        this.ws.logout();
      } else {
        this.openSnackBar("System will reboot in 10 seconds", "Rebooting");
      }
    });
    this.dialogRef.componentInstance.failure.subscribe((res) => {
      this.dialogService.errorReport(res.error, res.reason, res.trace.formatted);
    });
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 11000
    });
  }

  goBack() {
    this.router.navigate(new Array('').concat(this.route_success));
  }
}
